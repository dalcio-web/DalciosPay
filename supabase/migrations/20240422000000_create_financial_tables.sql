
-- Create months table
CREATE TABLE IF NOT EXISTS public.months (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_id VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    salary DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, month_id)
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_id UUID NOT NULL REFERENCES public.months(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    category VARCHAR(20) CHECK (category IN ('Fixas', 'Variáveis')),
    paid BOOLEAN DEFAULT false,
    due_date DATE,
    installment_number INTEGER,
    total_installments INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create extra_incomes table
CREATE TABLE IF NOT EXISTS public.extra_incomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_id UUID NOT NULL REFERENCES public.months(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create piggy_bank table
CREATE TABLE IF NOT EXISTS public.piggy_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_id UUID NOT NULL REFERENCES public.months(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.months ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piggy_bank ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own months" ON public.months FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own months" ON public.months FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own months" ON public.months FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own expenses" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own incomes" ON public.extra_incomes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own incomes" ON public.extra_incomes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own incomes" ON public.extra_incomes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own incomes" ON public.extra_incomes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own piggy bank" ON public.piggy_bank FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own piggy bank" ON public.piggy_bank FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own piggy bank" ON public.piggy_bank FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own piggy bank" ON public.piggy_bank FOR DELETE USING (auth.uid() = user_id);
