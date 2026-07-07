CREATE POLICY "Enable nurses to read their own profile" ON public.nurses FOR SELECT TO authenticated USING (true);
