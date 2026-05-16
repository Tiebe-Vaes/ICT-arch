import amqp from "amqplib";

export const EVENTS_EXCHANGE = "travelapp.events";
export const RETRY_EXCHANGE = "travelapp.retry";
export const DEAD_LETTER_EXCHANGE = "travelapp.dead-letter";

export const TRIP_MEMBER_INVITED_ROUTING_KEY = "trip.member.invited";
export const NOTIFICATION_QUEUE = "notification.trip-events";
export const NOTIFICATION_RETRY_QUEUE = "notification.retry";
export const NOTIFICATION_DEAD_LETTER_QUEUE = "notification.dead-letter";
export const AUDIT_QUEUE = "audit.events";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function connectRabbitMQ() {
  const url = process.env.RABBITMQ_URL || "amqp://localhost:5672";
  let lastError;

  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const connection = await amqp.connect(url);
      const channel = await connection.createChannel();
      console.log(`[rabbitmq] connected to ${url}`);
      return { connection, channel };
    } catch (error) {
      lastError = error;
      console.log(`[rabbitmq] waiting for broker... attempt ${attempt}/30`);
      await sleep(2000);
    }
  }

  throw lastError;
}

export async function setupRabbitMQ(channel) {
  await channel.assertExchange(EVENTS_EXCHANGE, "topic", { durable: true });
  await channel.assertExchange(RETRY_EXCHANGE, "direct", { durable: true });
  await channel.assertExchange(DEAD_LETTER_EXCHANGE, "topic", { durable: true });

  await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });
  await channel.bindQueue(
    NOTIFICATION_QUEUE,
    EVENTS_EXCHANGE,
    TRIP_MEMBER_INVITED_ROUTING_KEY,
  );

  await channel.assertQueue(NOTIFICATION_RETRY_QUEUE, {
    durable: true,
    arguments: {
      "x-message-ttl": 5000,
      "x-dead-letter-exchange": EVENTS_EXCHANGE,
      "x-dead-letter-routing-key": TRIP_MEMBER_INVITED_ROUTING_KEY,
    },
  });
  await channel.bindQueue(
    NOTIFICATION_RETRY_QUEUE,
    RETRY_EXCHANGE,
    "notification.retry",
  );

  await channel.assertQueue(NOTIFICATION_DEAD_LETTER_QUEUE, { durable: true });
  await channel.bindQueue(
    NOTIFICATION_DEAD_LETTER_QUEUE,
    DEAD_LETTER_EXCHANGE,
    "notification.failed",
  );

  await channel.assertQueue(AUDIT_QUEUE, { durable: true });
  await channel.bindQueue(AUDIT_QUEUE, EVENTS_EXCHANGE, "#");
}

export function publishEvent(channel, routingKey, event, extraHeaders = {}) {
  const body = Buffer.from(JSON.stringify(event));

  return channel.publish(EVENTS_EXCHANGE, routingKey, body, {
    contentType: "application/json",
    persistent: true,
    messageId: event.eventId,
    timestamp: Math.floor(Date.now() / 1000),
    headers: {
      eventType: event.eventType,
      correlationId: event.correlationId,
      ...extraHeaders,
    },
  });
}
