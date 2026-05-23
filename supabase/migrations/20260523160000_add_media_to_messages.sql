-- Add image attachment support to messages.
-- content becomes nullable so image-only messages are valid.
ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS media_url  TEXT,
  ADD COLUMN IF NOT EXISTS media_type TEXT;

-- At least one of content or media_url must be present.
ALTER TABLE messages
  ADD CONSTRAINT messages_has_content_or_media
  CHECK (content IS NOT NULL OR media_url IS NOT NULL);

-- Storage bucket: run in the Supabase dashboard or via CLI
-- (SQL runner does not create storage buckets).
--
-- 1. Create bucket:
--    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
--    VALUES (
--      'chat-media', 'chat-media', true, 10485760,
--      ARRAY['image/jpeg','image/png','image/webp','image/gif']
--    );
--
-- 2. RLS policy — allow conversation participants to upload:
--    CREATE POLICY "chat_media_insert" ON storage.objects FOR INSERT
--      WITH CHECK (bucket_id = 'chat-media' AND auth.uid() IS NOT NULL);
--
-- 3. RLS policy — allow public read (bucket is public):
--    CREATE POLICY "chat_media_select" ON storage.objects FOR SELECT
--      USING (bucket_id = 'chat-media');
