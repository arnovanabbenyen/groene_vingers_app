/**
 * Aanvraag status state machine:
 *
 *   pending -> accepted -> confirmed
 *      |          |
 *   declined   cancelled
 *   cancelled
 *
 * - pending: awaiting owner response after sender submitted
 * - accepted: owner showed interest; both parties can chat.
 *             NOT yet an official samenwerking.
 * - confirmed: both parties committed via chat-based "start samenwerking" flow.
 *              This is an active samenwerking.
 * - declined: owner rejected the aanvraag
 * - cancelled: sender withdrew, or system cancelled
 *
 * The transition accepted -> confirmed requires both parties to agree
 * via the in-chat "samenwerking starten" flow.
 * confirmed -> ended: either party ends the active samenwerking.
 */
export const AANVRAAG_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  CONFIRMED: 'confirmed',
  DECLINED: 'declined',
  CANCELLED: 'cancelled',
  ENDED: 'ended',
};
