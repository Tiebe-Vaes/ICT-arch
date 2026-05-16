import {
  connectRabbitMQ,
  setupRabbitMQ,
  AUDIT_QUEUE,
} from "../messaging/rabbitmq.js";

const processedEventIds = new Set();

const { channel } = await connectRabbitMQ();
await setupRabbitMQ(channel);
await channel.prefetch(10);

console.log(`[audit-worker] waiting for events on queue ${AUDIT_QUEUE}`);

channel.consume(AUDIT_QUEUE, (message) => {
  if (!message) return;

  const event = JSON.parse(message.content.toString());

  if (processedEventIds.has(event.eventId)) {
    console.log(`[audit-worker] duplicate event ignored: ${event.eventId}`);
    channel.ack(message);
    return;
  }

  console.log(
    `[audit-worker] audit log: ${event.eventType} happened at ${event.occurredAt} ` +
      `(eventId=${event.eventId}, correlationId=${event.correlationId})`,
  );

  processedEventIds.add(event.eventId);
  channel.ack(message);
});
