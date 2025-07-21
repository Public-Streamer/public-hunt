-- Create host Stripe accounts table for Connect accounts
CREATE TABLE public.host_stripe_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  stripe_account_id TEXT UNIQUE NOT NULL,
  account_status TEXT DEFAULT 'pending',
  onboarding_completed BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.host_stripe_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own Stripe accounts" 
ON public.host_stripe_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Stripe accounts" 
ON public.host_stripe_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Stripe accounts" 
ON public.host_stripe_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create payment transactions tracking table
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount_total NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  host_revenue NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for payment transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their payment transactions
CREATE POLICY "Users can view their own payment transactions" 
ON public.payment_transactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM tickets 
  WHERE tickets.id = payment_transactions.ticket_id 
  AND tickets.user_id = auth.uid()
));

-- Add Stripe account reference to events
ALTER TABLE public.events ADD COLUMN stripe_account_id TEXT;
ALTER TABLE public.events ADD COLUMN payment_enabled BOOLEAN DEFAULT false;

-- Add additional fields to tickets table for better payment tracking
ALTER TABLE public.tickets ADD COLUMN stripe_payment_intent_id TEXT;
ALTER TABLE public.tickets ADD COLUMN qr_code TEXT;
ALTER TABLE public.tickets ADD COLUMN verification_status TEXT DEFAULT 'valid';

-- Add updated_at trigger for host_stripe_accounts
CREATE TRIGGER update_host_stripe_accounts_updated_at
BEFORE UPDATE ON public.host_stripe_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();