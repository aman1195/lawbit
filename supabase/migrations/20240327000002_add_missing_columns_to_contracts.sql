-- Add missing columns to contracts table
ALTER TABLE public.contracts
ADD COLUMN description TEXT,
ADD COLUMN intensity TEXT,
ADD COLUMN risk_level TEXT,
ADD COLUMN risk_score INTEGER;

-- Update existing rows with default values
UPDATE public.contracts
SET 
  description = 'No description provided',
  intensity = '50',
  risk_level = 'medium',
  risk_score = 50
WHERE description IS NULL; 