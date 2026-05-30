-- Dashboard Realtime: anon may read sanitized tips only

alter table tips enable row level security;
alter table linq_events enable row level security;
alter table source_channels enable row level security;
alter table outbound_messages enable row level security;

create policy "anon_read_tips" on tips
  for select
  to anon, authenticated
  using (true);

create policy "deny_anon_linq_events" on linq_events
  for all
  to anon, authenticated
  using (false);

create policy "deny_anon_source_channels" on source_channels
  for all
  to anon, authenticated
  using (false);

create policy "deny_anon_outbound_messages" on outbound_messages
  for all
  to anon, authenticated
  using (false);
