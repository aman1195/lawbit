-- Drop existing table if it exists
DROP TABLE IF EXISTS public.contracts CASCADE;

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  contract_type TEXT NOT NULL,
  first_party_name TEXT NOT NULL,
  second_party_name TEXT NOT NULL,
  jurisdiction TEXT,
  key_terms TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Set up Row Level Security
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own contracts
CREATE POLICY "Users can view their own contracts"
ON public.contracts
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for users to update their own contracts
CREATE POLICY "Users can update their own contracts"
ON public.contracts
FOR UPDATE
USING (auth.uid() = user_id);

-- Create policy for users to delete their own contracts
CREATE POLICY "Users can delete their own contracts"
ON public.contracts
FOR DELETE
USING (auth.uid() = user_id);

-- Create policy for users to insert their own contracts
CREATE POLICY "Users can create their own contracts"
ON public.contracts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 