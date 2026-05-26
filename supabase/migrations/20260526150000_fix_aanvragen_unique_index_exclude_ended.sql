-- The partial unique index previously only excluded 'declined' and 'cancelled',
-- which blocked a new aanvraag when a prior samenwerking had status='ended'.
-- Recreate it to also exclude 'ended' so the perceel becomes available again.
DROP INDEX IF EXISTS idx_aanvragen_one_active_per_perceel;

CREATE UNIQUE INDEX idx_aanvragen_one_active_per_perceel
  ON public.aanvragen USING btree (perceel_id, sender_id)
  WHERE status NOT IN ('declined', 'cancelled', 'ended');
