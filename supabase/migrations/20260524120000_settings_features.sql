-- =============================================================================
-- Settings features migration
-- Adds: plan, deleted_at, notification_settings columns to profiles
-- Updates: notification trigger functions to respect per-type preferences
-- Updates: RLS policy so soft-deleted profiles are hidden from others
-- =============================================================================

-- ────────────────────────────────────────────────────────────
-- 1. Add columns to profiles
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'pro')),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_settings JSONB NOT NULL DEFAULT
    '{"aanvragen": true, "messages": true, "samenwerkingen": true}'::jsonb;

-- Tuineigenaar accounts are on the paid plan by design
UPDATE public.profiles
SET plan = 'pro'
WHERE role = 'tuineigenaar';

-- ────────────────────────────────────────────────────────────
-- 2. RLS: hide soft-deleted profiles from other users
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view active profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL OR auth.uid() = id);

-- ────────────────────────────────────────────────────────────
-- 3. Notification trigger functions (CREATE OR REPLACE)
--    Each function checks the recipient's notification_settings
--    before inserting a notification row.
-- ────────────────────────────────────────────────────────────

-- 3a. Notify perceel owner when a new aanvraag is received
CREATE OR REPLACE FUNCTION public.trg_notify_aanvraag_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id   uuid;
  v_perceel_naam text;
BEGIN
  SELECT owner_id, naam
  INTO   v_owner_id, v_perceel_naam
  FROM   public.percelen
  WHERE  id = NEW.perceel_id;

  IF v_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Respect the owner's notification preference for aanvragen
  IF NOT (
    SELECT COALESCE((notification_settings->>'aanvragen')::boolean, true)
    FROM   public.profiles
    WHERE  id = v_owner_id
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications
    (user_id, type, title, body, related_id, related_type, actor_id)
  VALUES (
    v_owner_id,
    'aanvraag_received',
    'Nieuwe aanvraag ontvangen',
    'Iemand heeft interesse in je perceel ' || COALESCE(v_perceel_naam, ''),
    NEW.id,
    'aanvraag',
    NEW.sender_id
  );

  RETURN NEW;
END;
$$;

-- 3b. Notify aanvraag sender when status changes (accepted/declined/confirmed/cancelled)
CREATE OR REPLACE FUNCTION public.trg_notify_aanvraag_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title text;
  v_body  text;
  v_type  text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Respect the sender's notification preference for samenwerkingen
  IF NOT (
    SELECT COALESCE((notification_settings->>'samenwerkingen')::boolean, true)
    FROM   public.profiles
    WHERE  id = NEW.sender_id
  ) THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'accepted' THEN
    v_type  := 'aanvraag_accepted';
    v_title := 'Aanvraag geaccepteerd';
    v_body  := 'Je aanvraag is geaccepteerd! Je kan nu contact opnemen.';
  ELSIF NEW.status = 'declined' THEN
    v_type  := 'aanvraag_declined';
    v_title := 'Aanvraag afgewezen';
    v_body  := 'Je aanvraag is helaas afgewezen.';
  ELSIF NEW.status = 'confirmed' THEN
    v_type  := 'aanvraag_confirmed';
    v_title := 'Samenwerking bevestigd!';
    v_body  := 'De samenwerking is officieel gestart. Veel succes!';
  ELSIF NEW.status = 'cancelled' THEN
    v_type  := 'aanvraag_cancelled';
    v_title := 'Aanvraag geannuleerd';
    v_body  := 'De aanvraag is geannuleerd.';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications
    (user_id, type, title, body, related_id, related_type, actor_id)
  VALUES (
    NEW.sender_id,
    v_type,
    v_title,
    v_body,
    NEW.id,
    'aanvraag',
    NULL
  );

  RETURN NEW;
END;
$$;

-- 3c. Notify the other conversation participant when a message is sent
CREATE OR REPLACE FUNCTION public.trg_notify_message_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id     uuid;
  v_sender_id    uuid;
  v_recipient_id uuid;
BEGIN
  SELECT owner_id, sender_id
  INTO   v_owner_id, v_sender_id
  FROM   public.conversations
  WHERE  id = NEW.conversation_id;

  -- The recipient is whichever conversation participant is NOT the message author
  IF NEW.sender_id = v_owner_id THEN
    v_recipient_id := v_sender_id;
  ELSE
    v_recipient_id := v_owner_id;
  END IF;

  IF v_recipient_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Respect the recipient's notification preference for messages
  IF NOT (
    SELECT COALESCE((notification_settings->>'messages')::boolean, true)
    FROM   public.profiles
    WHERE  id = v_recipient_id
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications
    (user_id, type, title, body, related_id, related_type, actor_id)
  VALUES (
    v_recipient_id,
    'message_received',
    'Nieuw bericht',
    'Je hebt een nieuw bericht ontvangen.',
    NEW.conversation_id,
    'conversation',
    NEW.sender_id
  );

  RETURN NEW;
END;
$$;

-- TODO: implement a scheduled job (Supabase Edge Function or cron)
-- to hard-delete profiles where deleted_at < NOW() - INTERVAL '30 days'.
-- For MVP, soft-delete only.
