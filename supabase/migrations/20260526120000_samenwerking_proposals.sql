-- Add proposal columns to aanvragen
ALTER TABLE public.aanvragen
  ADD COLUMN IF NOT EXISTS samenwerking_proposed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS samenwerking_proposed_by UUID REFERENCES auth.users(id);

-- Add type column to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'user'
    CHECK (type IN (
      'user',
      'system_samenwerking_proposed',
      'system_samenwerking_confirmed',
      'system_samenwerking_cancelled'
    ));

-- Sparse index — only system messages
CREATE INDEX IF NOT EXISTS idx_messages_type
  ON public.messages(type)
  WHERE type != 'user';

-- Notification function for samenwerking proposals
CREATE OR REPLACE FUNCTION public.notify_samenwerking_proposed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id        UUID;
  v_owner_first_name TEXT;
  v_settings         JSONB;
  v_should_notify    BOOLEAN;
BEGIN
  -- Only fire when samenwerking_proposed_at transitions NULL → value
  IF OLD.samenwerking_proposed_at IS NOT NULL OR NEW.samenwerking_proposed_at IS NULL THEN
    RETURN NEW;
  END IF;

  v_sender_id := NEW.sender_id;

  SELECT notification_settings INTO v_settings
  FROM profiles WHERE id = v_sender_id;

  SELECT first_name INTO v_owner_first_name
  FROM profiles WHERE id = NEW.samenwerking_proposed_by;

  v_should_notify := COALESCE((v_settings->>'samenwerkingen')::BOOLEAN, TRUE);

  IF NOT v_should_notify THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (
    user_id, type, title, body, related_id, related_type, actor_id
  ) VALUES (
    v_sender_id,
    'samenwerking_proposed',
    'Samenwerking voorgesteld',
    COALESCE(v_owner_first_name, 'De eigenaar') || ' stelt voor om de samenwerking officieel te starten.',
    NEW.id,
    'aanvraag',
    NEW.samenwerking_proposed_by
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_samenwerking_proposed ON public.aanvragen;
CREATE TRIGGER trg_notify_samenwerking_proposed
  AFTER UPDATE ON public.aanvragen
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_samenwerking_proposed();
