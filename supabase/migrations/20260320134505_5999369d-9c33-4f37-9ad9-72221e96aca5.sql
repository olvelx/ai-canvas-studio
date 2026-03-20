INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public upload to chat-attachments"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Allow public read from chat-attachments"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'chat-attachments');