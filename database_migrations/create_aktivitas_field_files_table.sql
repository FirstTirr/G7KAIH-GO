-- Create table for storing file uploads from form fields
CREATE TABLE IF NOT EXISTS public.aktivitas_field_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    activityid UUID NOT NULL REFERENCES public.aktivitas(activityid) ON DELETE CASCADE,
    fieldid UUID NOT NULL REFERENCES public.category_fields(fieldid) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_bytes BYTEA NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_aktivitas_field_files_activityid ON public.aktivitas_field_files(activityid);
CREATE INDEX IF NOT EXISTS idx_aktivitas_field_files_fieldid ON public.aktivitas_field_files(fieldid);
CREATE INDEX IF NOT EXISTS idx_aktivitas_field_files_created_at ON public.aktivitas_field_files(created_at);

-- Add RLS policies if needed (following the pattern of other tables)
ALTER TABLE public.aktivitas_field_files ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read files
CREATE POLICY "Users can read aktivitas field files" ON public.aktivitas_field_files
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert files
CREATE POLICY "Users can insert aktivitas field files" ON public.aktivitas_field_files
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for users to update their own files (via activity ownership)
CREATE POLICY "Users can update aktivitas field files" ON public.aktivitas_field_files
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for users to delete their own files (via activity ownership)
CREATE POLICY "Users can delete aktivitas field files" ON public.aktivitas_field_files
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_aktivitas_field_files_updated_at 
    BEFORE UPDATE ON public.aktivitas_field_files 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
