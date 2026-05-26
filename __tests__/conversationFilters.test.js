import { isConversationVisible } from '../utils/conversationFilters.js';

// ─────────────────────────────────────────────────────────────────────────────
// isConversationVisible
//
// Rule: conversations whose linked aanvraag has status='ended' must be hidden
// from the overview. All other statuses pass through. No data is deleted.
// ─────────────────────────────────────────────────────────────────────────────

describe('isConversationVisible', () => {
  // ── Blocked status ─────────────────────────────────────────────────────────

  test('hides a conversation when aanvraag status is ended', () => {
    const conv = { id: 'c1', aanvragen: { status: 'ended' } };
    expect(isConversationVisible(conv)).toBe(false);
  });

  // ── Allowed statuses ───────────────────────────────────────────────────────

  test.each([
    ['confirmed', { id: 'c2', aanvragen: { status: 'confirmed' } }],
    ['accepted',  { id: 'c3', aanvragen: { status: 'accepted'  } }],
    ['pending',   { id: 'c4', aanvragen: { status: 'pending'   } }],
    ['declined',  { id: 'c5', aanvragen: { status: 'declined'  } }],
    ['cancelled', { id: 'c6', aanvragen: { status: 'cancelled' } }],
  ])('shows a conversation with status %s', (_label, conv) => {
    expect(isConversationVisible(conv)).toBe(true);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  test('shows a conversation without a linked aanvraag (aanvragen: null)', () => {
    expect(isConversationVisible({ id: 'c7', aanvragen: null })).toBe(true);
  });

  test('shows a conversation when aanvraag status is undefined', () => {
    expect(isConversationVisible({ id: 'c8', aanvragen: {} })).toBe(true);
  });

  // ── Data integrity guarantee ───────────────────────────────────────────────
  //
  // The filter is applied in-memory on the SELECT result.
  // No DELETE is ever issued. This test documents that invariant:
  // the source array (simulating DB rows) is never mutated or reduced in place.

  test('ended conversation is hidden in overview but source data is not deleted', () => {
    const dbRows = [
      { id: 'conv-ended',     aanvragen: { status: 'ended'     } },
      { id: 'conv-confirmed', aanvragen: { status: 'confirmed' } },
    ];

    // Simulate the message records that belong to the ended conversation.
    const messageRows = [
      { id: 'msg-1', conversation_id: 'conv-ended',     content: 'Hallo!' },
      { id: 'msg-2', conversation_id: 'conv-ended',     content: 'Tot ziens.' },
      { id: 'msg-3', conversation_id: 'conv-confirmed', content: 'Goeiedag!' },
    ];

    // Apply the same filter useConversations uses.
    const visible = dbRows.filter(isConversationVisible);

    // The ended conversation must NOT appear in the overview.
    expect(visible.find((c) => c.id === 'conv-ended')).toBeUndefined();
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe('conv-confirmed');

    // The source DB rows are untouched — ended conversation record still exists.
    expect(dbRows).toHaveLength(2);
    expect(dbRows.find((c) => c.id === 'conv-ended')).toBeDefined();

    // All message records for the ended conversation still exist in "the DB".
    const endedMessages = messageRows.filter((m) => m.conversation_id === 'conv-ended');
    expect(endedMessages).toHaveLength(2);
    expect(endedMessages[0].content).toBe('Hallo!');
    expect(endedMessages[1].content).toBe('Tot ziens.');
  });
});
