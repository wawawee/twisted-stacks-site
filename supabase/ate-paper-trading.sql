-- Supabase SQL schema for ATE Paper Trading & Multiplayer Leaderboard

CREATE TABLE IF NOT EXISTS public.ate_paper_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
  entry_price NUMERIC NOT NULL,
  notional_usd NUMERIC NOT NULL,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'VETOED')),
  unrealized_pnl NUMERIC DEFAULT 0.0,
  realized_pnl NUMERIC DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ate_paper_leaderboard (
  member_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  equity_usd NUMERIC NOT NULL DEFAULT 100000.0,
  realized_pnl_usd NUMERIC NOT NULL DEFAULT 0.0,
  pnl_pct NUMERIC NOT NULL DEFAULT 0.0,
  trades_count INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ate_paper_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ate_paper_leaderboard ENABLE ROW LEVEL SECURITY;

-- Permissive policies for investor room paper trading
CREATE POLICY "Allow public read paper positions" ON public.ate_paper_positions FOR SELECT USING (true);
CREATE POLICY "Allow public insert paper positions" ON public.ate_paper_positions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update paper positions" ON public.ate_paper_positions FOR UPDATE USING (true);

CREATE POLICY "Allow public read paper leaderboard" ON public.ate_paper_leaderboard FOR SELECT USING (true);
CREATE POLICY "Allow public update paper leaderboard" ON public.ate_paper_leaderboard FOR UPDATE USING (true);

-- Seed initial 4 members ($100,000 paper capital each)
INSERT INTO public.ate_paper_leaderboard (member_id, name, equity_usd, realized_pnl_usd, pnl_pct, trades_count)
VALUES
  ('joachim', 'Joachim', 100000.0, 0.0, 0.0, 0),
  ('per', 'Per', 100000.0, 0.0, 0.0, 0),
  ('kris', 'Kris', 100000.0, 0.0, 0.0, 0),
  ('baha', 'Baha', 100000.0, 0.0, 0.0, 0)
ON CONFLICT (member_id) DO NOTHING;
