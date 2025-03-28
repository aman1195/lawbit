-- Add party address columns to contracts table
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS first_party_address TEXT,
ADD COLUMN IF NOT EXISTS second_party_address TEXT;

-- Update existing rows with empty addresses
UPDATE public.contracts
SET 
  first_party_address = '',
  second_party_address = ''
WHERE first_party_address IS NULL;

-- Add RLS policies for the new columns
ALTER POLICY "Users can view their own contracts" ON public.contracts
USING (auth.uid() = user_id);

ALTER POLICY "Users can update their own contracts" ON public.contracts
USING (auth.uid() = user_id);

ALTER POLICY "Users can delete their own contracts" ON public.contracts
USING (auth.uid() = user_id);

ALTER POLICY "Users can create their own contracts" ON public.contracts
WITH CHECK (auth.uid() = user_id); 