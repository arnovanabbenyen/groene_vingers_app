-- Backfill migration: documents the chat tables that already exist in the database.
-- conversations and messages were created manually; this file makes them reproducible.

-- ============================================================
-- TABLE: conversations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id             uuid        NOT NULL DEFAULT gen_random_uuid(),
  aanvraag_id    uuid        NOT NULL,
  owner_id       uuid        NOT NULL,
  sender_id      uuid        NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz,

  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_aanvraag_id_fkey
    FOREIGN KEY (aanvraag_id) REFERENCES public.aanvragen (id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL,
  sender_id       uuid        NOT NULL,
  content         text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  read_at         timestamptz,

  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey
    FOREIGN KEY (conversation_id) REFERENCES public.conversations (id) ON DELETE CASCADE
);

-- ============================================================
-- TRIGGER FUNCTION: update last_message_at on conversations
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGER: fire after each new message is inserted
-- ============================================================
CREATE OR REPLACE TRIGGER trg_update_conversation_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages      ENABLE ROW LEVEL SECURITY;

-- conversations: SELECT
CREATE POLICY "Participants can view their conversations"
  ON public.conversations
  FOR SELECT
  USING (
    auth.uid() = owner_id OR auth.uid() = sender_id
  );

-- conversations: INSERT
CREATE POLICY "Users can create conversations they're part of"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id OR auth.uid() = sender_id
  );

-- messages: SELECT
CREATE POLICY "Participants can view messages"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.owner_id = auth.uid() OR conversations.sender_id = auth.uid())
    )
  );

-- messages: INSERT
CREATE POLICY "Participants can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
        AND (conversations.owner_id = auth.uid() OR conversations.sender_id = auth.uid())
    )
  );

-- messages: UPDATE (only the recipient can mark messages as read)
CREATE POLICY "Recipients can mark messages as read"
  ON public.messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
        AND (
          (conversations.owner_id  = auth.uid() AND messages.sender_id = conversations.sender_id)
          OR
          (conversations.sender_id = auth.uid() AND messages.sender_id = conversations.owner_id)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
        AND (
          (conversations.owner_id  = auth.uid() AND messages.sender_id = conversations.sender_id)
          OR
          (conversations.sender_id = auth.uid() AND messages.sender_id = conversations.owner_id)
        )
    )
  );
