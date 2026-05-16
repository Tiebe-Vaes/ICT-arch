import crypto from "node:crypto";

const invitations = [];

export function inviteMember({ tripId, invitedUserId, invitedByUserId }) {
  if (!tripId) {
    throw new Error("tripId is required");
  }

  if (!invitedUserId) {
    throw new Error("invitedUserId is required");
  }

  if (!invitedByUserId) {
    throw new Error("invitedByUserId is required");
  }

  const now = new Date().toISOString();

  const invitation = {
    id: crypto.randomUUID(),
    tripId,
    invitedUserId,
    invitedByUserId,
    status: "PENDING",
    createdAt: now,
  };

  // In een echte modulaire monoliet zou dit naar PostgreSQL geschreven worden.
  invitations.push(invitation);

  const event = {
    eventId: crypto.randomUUID(),
    eventType: "TripMemberInvited",
    occurredAt: now,
    tripId,
    invitedUserId,
    invitedByUserId,
    invitationId: invitation.id,
    correlationId: `req-${crypto.randomUUID()}`,
  };

  return { invitation, event };
}

export function listInvitations() {
  return invitations;
}
