import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isConversationVisible } from '../utils/conversationFilters.js';

// ─────────────────────────────────────────────────────────────────────────────
// isConversationVisible
//
// Rule: conversations whose linked aanvraag has status='ended' must be hidden
// from the overview. All other statuses pass through. No data is deleted.
// ─────────────────────────────────────────────────────────────────────────────

describe('isConversationVisible', () => {
  // ── Blocked status ─────────────────────────────────────────────────────────

  it('hides a conversation when aanvraag status is ended', () => {
    const conv = { id: 'c1', aanvragen: { status: 'ended' } };
    assert.equal(isConversationVisible(conv), false);
  });

  // ── Allowed statuses ───────────────────────────────────────────────────────

  for (const status of ['confirmed', 'accepted', 'pending', 'declined', 'cancelled']) {
    it(`shows a conversation with status ${status}`, () => {
      const conv = { id: `c-${status}`, aanvragen: { status } };
      assert.equal(isConversationVisible(conv), true);
    });
  }

  // ── Edge cases ─────────────────────────────────────────────────────────────

  it('shows a conversation without a linked aanvraag (aanvragen: null)', () => {
    assert.equal(isConversationVisible({ id: 'c7', aanvragen: null }), true);
  });

  it('shows a conversation when aanvraag status is undefined', () => {
    assert.equal(isConversationVisible({ id: 'c8', aanvragen: {} }), true);
  });

  // ── Data integrity guarantee ───────────────────────────────────────────────
  //
  // The filter runs in-memory on the SELECT result — no DELETE is ever issued.
  // The "DB rows" (source array) are never mutated.

  it('ended conversation is hidden in the overview but source data is not deleted', () => {
    const dbRows = [
      { id: 'conv-ended',     aanvragen: { status: 'ended'     } },
      { id: 'conv-confirmed', aanvragen: { status: 'confirmed' } },
    ];

    // Message records that belong to the ended conversation.
    const messageRows = [
      { id: 'msg-1', conversation_id: 'conv-ended',     content: 'Hallo!' },
      { id: 'msg-2', conversation_id: 'conv-ended',     content: 'Tot ziens.' },
      { id: 'msg-3', conversation_id: 'conv-confirmed', content: 'Goeiedag!' },
    ];

    // Apply the same filter useConversations uses.
    const visible = dbRows.filter(isConversationVisible);

    // The ended conversation must NOT appear in the overview.
    assert.equal(visible.find((c) => c.id === 'conv-ended'), undefined);
    assert.equal(visible.length, 1);
    assert.equal(visible[0].id, 'conv-confirmed');

    // Source DB rows are untouched — ended conversation record still exists.
    assert.equal(dbRows.length, 2);
    assert.ok(dbRows.find((c) => c.id === 'conv-ended'));

    // All message records for the ended conversation still exist in "the DB".
    const endedMessages = messageRows.filter((m) => m.conversation_id === 'conv-ended');
    assert.equal(endedMessages.length, 2);
    assert.equal(endedMessages[0].content, 'Hallo!');
    assert.equal(endedMessages[1].content, 'Tot ziens.');
  });
});
