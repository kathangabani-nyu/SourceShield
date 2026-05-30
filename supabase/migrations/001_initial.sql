-- SourceShield initial schema

create table if not exists linq_events (
  event_id uuid primary key,
  event_type text not null,
  status text not null check (status in ('processing', 'done', 'failed')),
  chat_id uuid,
  message_id uuid,
  created_at timestamptz default now(),
  processed_at timestamptz
);

create table if not exists source_channels (
  id uuid primary key default gen_random_uuid(),
  linq_handle_hash text not null unique,
  krava_user_id text,
  created_at timestamptz default now()
);

create table if not exists tips (
  id uuid primary key default gen_random_uuid(),
  source_channel_id uuid references source_channels(id),
  linq_chat_id uuid not null,
  sanitized_summary text not null,
  duress_signal text not null check (duress_signal in ('low', 'medium', 'high')),
  claim_fingerprint text not null,
  claim_group_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists outbound_messages (
  idempotency_key text primary key,
  linq_chat_id uuid not null,
  direction text not null check (direction in ('bot', 'journalist')),
  created_at timestamptz default now()
);

create index if not exists tips_claim_fingerprint_idx on tips (claim_fingerprint);
create index if not exists tips_claim_group_id_idx on tips (claim_group_id);
create index if not exists tips_linq_chat_id_idx on tips (linq_chat_id);

-- Enable Realtime for live dashboard updates
alter publication supabase_realtime add table tips;
