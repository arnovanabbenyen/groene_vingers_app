const HIDDEN_STATUSES = new Set(['ended', 'cancelled', 'declined']);

/**
 * Returns true when a conversation should appear in the overview.
 *
 * Conversations linked to a closed aanvraag (ended, cancelled, declined)
 * are hidden — no data is deleted from the database.
 */
export function isConversationVisible(conversation) {
  return !HIDDEN_STATUSES.has(conversation?.aanvragen?.status);
}
