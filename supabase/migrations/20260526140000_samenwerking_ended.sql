-- 1. New columns on aanvragen
ALTER TABLE public.aanvragen
  ADD COLUMN IF NOT EXISTS samenwerking_ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS samenwerking_ended_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS samenwerking_ended_reason TEXT;

-- 2. Extend status CHECK (drop old, add new with 'ended')
ALTER TABLE public.aanvragen
  DROP CONSTRAINT IF EXISTS aanvragen_status_check;
ALTER TABLE public.aanvragen
  ADD CONSTRAINT aanvragen_status_check
  CHECK (status IN ('pending','accepted','confirmed','declined','cancelled','ended'));

-- 3. Extend messages type CHECK (add system_samenwerking_ended)
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_type_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_type_check
  CHECK (type IN (
    'user',
    'system_samenwerking_proposed',
    'system_samenwerking_confirmed',
    'system_samenwerking_cancelled',
    'system_samenwerking_ended'
  ));

-- 4. Ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
  id          UUID      NOT NULL DEFAULT gen_random_uuid(),
  aanvraag_id UUID      NOT NULL REFERENCES public.aanvragen(id) ON DELETE CASCADE,
  rater_id    UUID      NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_id    UUID      NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score       SMALLINT  NOT NULL CHECK (score >= 1 AND score <= 5),
  review_text TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ratings_pkey PRIMARY KEY (id),
  CONSTRAINT ratings_unique_per_aanvraag UNIQUE (aanvraag_id, rater_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_rated_id    ON public.ratings(rated_id);
CREATE INDEX IF NOT EXISTS idx_ratings_aanvraag_id ON public.ratings(aanvraag_id);

-- 5. RLS on ratings
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ratings_select_all" ON public.ratings;
DROP POLICY IF EXISTS "ratings_insert_own" ON public.ratings;
DROP POLICY IF EXISTS "ratings_update_own" ON public.ratings;

CREATE POLICY "ratings_select_all"
  ON public.ratings FOR SELECT USING (true);

CREATE POLICY "ratings_insert_own"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_id);

CREATE POLICY "ratings_update_own"
  ON public.ratings FOR UPDATE
  USING (auth.uid() = rater_id);

-- 6. Notification trigger: samenwerking ended
CREATE OR REPLACE FUNCTION public.notify_samenwerking_ended()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id         UUID;
  v_recipient_id     UUID;
  v_actor_first_name TEXT;
  v_settings         JSONB;
  v_should_notify    BOOLEAN;
BEGIN
  IF NEW.status != 'ended' OR OLD.status = 'ended' THEN
    RETURN NEW;
  END IF;

  SELECT owner_id INTO v_owner_id
  FROM public.percelen WHERE id = NEW.perceel_id;

  v_recipient_id := CASE
    WHEN NEW.samenwerking_ended_by = NEW.sender_id THEN v_owner_id
    ELSE NEW.sender_id
  END;

  SELECT first_name INTO v_actor_first_name
  FROM public.profiles WHERE id = NEW.samenwerking_ended_by;

  SELECT notification_settings INTO v_settings
  FROM public.profiles WHERE id = v_recipient_id;

  v_should_notify := COALESCE((v_settings->>'samenwerkingen')::BOOLEAN, TRUE);

  IF NOT v_should_notify THEN RETURN NEW; END IF;

  INSERT INTO public.notifications (user_id, type, title, body, related_id, related_type, actor_id)
  VALUES (
    v_recipient_id,
    'samenwerking_ended',
    'Samenwerking beëindigd',
    COALESCE(v_actor_first_name, 'Iemand') || ' heeft de samenwerking beëindigd.',
    NEW.id,
    'aanvraag',
    NEW.samenwerking_ended_by
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_samenwerking_ended ON public.aanvragen;
CREATE TRIGGER trg_notify_samenwerking_ended
  AFTER UPDATE ON public.aanvragen
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_samenwerking_ended();

-- 7. Helper: average rating for a user
CREATE OR REPLACE FUNCTION public.get_user_average_rating(p_user_id UUID)
RETURNS TABLE (average NUMERIC, count BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROUND(AVG(score)::NUMERIC, 1) AS average,
    COUNT(*)::BIGINT               AS count
  FROM public.ratings
  WHERE rated_id = p_user_id;
$$;
