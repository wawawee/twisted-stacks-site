-- Track idébox → wiki/IDEAS.md GitHub sync (optional but recommended).

alter table public.suparays_ideas
  add column if not exists wiki_synced_at timestamptz;

alter table public.suparays_ideas
  add column if not exists wiki_sync_error text;
