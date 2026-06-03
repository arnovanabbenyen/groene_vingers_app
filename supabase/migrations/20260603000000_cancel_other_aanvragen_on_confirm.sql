CREATE OR REPLACE FUNCTION public.cancel_other_aanvragen_on_confirm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
    UPDATE public.aanvragen
    SET status = 'cancelled'
    WHERE sender_id = NEW.sender_id
      AND id <> NEW.id
      AND status IN ('pending', 'accepted');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cancel_other_aanvragen_on_confirm ON public.aanvragen;
CREATE TRIGGER trg_cancel_other_aanvragen_on_confirm
  AFTER UPDATE ON public.aanvragen
  FOR EACH ROW
  EXECUTE FUNCTION public.cancel_other_aanvragen_on_confirm();
