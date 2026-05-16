import {
  connectRabbitMQ,
  setupRabbitMQ,
  NOTIFICATION_QUEUE,
  RETRY_EXCHANGE,
  DEAD_LETTER_EXCHANGE,
} from "../messaging/rabbitmq.js";

const MAX_RETRIES = 3;
const processedEventIds = new Set();

const { channel } = await connectRabbitMQ();
await setupRabbitMQ(channel);
await channel.prefetch(1);

console.log(`[notification-worker] waiting for events on queue ${NOTIFICATION_QUEUE}`);

channel.consume(NOTIFICATION_QUEUE, async (message) => {
  if (!message) return;

  const retryCount = message.properties.headers?.["x-retry-count"] ?? 0;
  const event = JSON.parse(message.content.toString());

  try {
    if (processedEventIds.has(event.eventId)) {
      console.log(
        `[notification-worker] duplicate event ignored: ${event.eventId}`,
      );
      channel.ack(message);
      return;
    }

    // Demo failure: use invitedUserId "fail" to prove retries and dead-letter handling.
    if (event.invitedUserId === "fail") {
      throw new Error("Simulated notification provider failure");
    }

    console.log(
      `[notification-worker] notification sent to ${event.invitedUserId} for trip ${event.tripId} ` +
        `(invited by ${event.invitedByUserId}, correlationId=${event.correlationId})`,
    );

    processedEventIds.add(event.eventId);
    channel.ack(message);
  } catch (error) {
    if (retryCount >= MAX_RETRIES) {
      console.error(
        `[notification-worker] failed after ${MAX_RETRIES} retries. Moving event ${event.eventId} to DLQ. Reason: ${error.message}`,
      );

      channel.publish(DEAD_LETTER_EXCHANGE, "notification.failed", message.content, {
        contentType: "application/json",
        persistent: true,
        messageId: event.eventId,
        headers: {
          ...message.properties.headers,
          "x-error-message": error.message,
          "x-final-retry-count": retryCount,
        },
      });

      channel.ack(message);
      return;
    }

    console.warn(
      `[notification-worker] failed event ${event.eventId}. Retry ${retryCount + 1}/${MAX_RETRIES} in 5 seconds. Reason: ${error.message}`,
    );

    channel.publish(RETRY_EXCHANGE, "notification.retry", message.content, {
      contentType: "application/json",
      persistent: true,
      messageId: event.eventId,
      headers: {
        ...message.properties.headers,
        "x-retry-count": retryCount + 1,
      },
    });

    channel.ack(message);
  }
});
