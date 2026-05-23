-- Add media_urls array so multiple images can be bundled in one message.
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_urls TEXT[];

-- Widen the check constraint to accept media_urls as an alternative.
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_has_content_or_media;

ALTER TABLE messages
  ADD CONSTRAINT messages_has_content_or_media
  CHECK (
    content    IS NOT NULL OR
    media_url  IS NOT NULL OR
    (media_urls IS NOT NULL AND array_length(media_urls, 1) > 0)
  );
