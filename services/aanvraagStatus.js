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

export const AANVRAAG_STATUS_META = {
  [AANVRAAG_STATUS.PENDING]: {
    label: 'In behandeling',
    tone: 'pending',
    accessibleLabel: 'Je hebt een aanvraag verstuurd',
  },
  [AANVRAAG_STATUS.ACCEPTED]: {
    label: 'Geaccepteerd',
    tone: 'accepted',
    accessibleLabel: 'Je aanvraag is geaccepteerd',
  },
  [AANVRAAG_STATUS.CONFIRMED]: {
    label: 'Bevestigd',
    tone: 'confirmed',
    accessibleLabel: 'De samenwerking is bevestigd',
  },
};

export function getAanvraagStatusMeta(status) {
  return AANVRAAG_STATUS_META[status] || null;
}

export function isActiveAanvraagStatus(status) {
  return Boolean(AANVRAAG_STATUS_META[status]);
}
