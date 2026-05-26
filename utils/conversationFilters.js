/**
 * Returns true when a conversation should appear in the overview.
 *
 * Conversations linked to an ended samenwerking are hidden — the
 * samenwerking is over, but no data is deleted from the database.
 * All other statuses (confirmed, accepted, declined, cancelled, null)
 * pass through so they remain visible.
 */
export function isConversationVisible(conversation) {
  return conversation?.aanvragen?.status !== 'ended';
}
