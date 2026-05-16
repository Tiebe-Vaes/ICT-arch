import express from "express";
import {
  connectRabbitMQ,
  publishEvent,
  setupRabbitMQ,
  TRIP_MEMBER_INVITED_ROUTING_KEY,
} from "./messaging/rabbitmq.js";
import { inviteMember, listInvitations } from "./modules/trip/tripService.js";

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

const { channel } = await connectRabbitMQ();
await setupRabbitMQ(channel);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "trip-api" });
});

app.get("/invitations", (req, res) => {
  res.json(listInvitations());
});

app.post("/trips/:tripId/invitations", (req, res) => {
  try {
    const { tripId } = req.params;
    const { invitedUserId, invitedByUserId } = req.body;

    const { invitation, event } = inviteMember({
      tripId,
      invitedUserId,
      invitedByUserId,
    });

    publishEvent(channel, TRIP_MEMBER_INVITED_ROUTING_KEY, event);

    res.status(202).json({
      message:
        "Invitation saved. Side effects are queued through RabbitMQ and handled asynchronously.",
      invitation,
      publishedEvent: {
        eventType: event.eventType,
        eventId: event.eventId,
        routingKey: TRIP_MEMBER_INVITED_ROUTING_KEY,
        correlationId: event.correlationId,
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`[trip-api] listening on port ${port}`);
});
