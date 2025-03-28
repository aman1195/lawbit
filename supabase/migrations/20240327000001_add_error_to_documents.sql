-- Add error field to documents table
ALTER TABLE public.documents
ADD COLUMN error TEXT;

-- Update existing documents with error status to have a default error message
UPDATE public.documents
SET error = 'An unknown error occurred'
WHERE status = 'error' AND error IS NULL; 