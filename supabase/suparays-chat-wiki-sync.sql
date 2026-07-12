-- Track chat → wiki/COLLAB-CHAT.md GitHub sync (optional but recommended).

alter table public.suparays_messages
  add column if not exists wiki_synced_at timestamptz;

alter table public.suparays_messages
  add column if not exists wiki_sync_error text;
