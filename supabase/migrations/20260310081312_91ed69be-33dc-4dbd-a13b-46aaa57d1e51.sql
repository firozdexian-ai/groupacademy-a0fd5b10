
INSERT INTO storage.buckets (id, name, public) VALUES ('talent-cvs', 'talent-cvs', true);

CREATE POLICY "Authenticated users can upload talent CVs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'talent-cvs');

CREATE POLICY "Public can read talent CVs"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'talent-cvs');
