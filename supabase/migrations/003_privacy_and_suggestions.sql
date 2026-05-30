-- Revoke anon read on tips (linq_chat_id was exposed to browser anon key)
drop policy if exists "anon_read_tips" on tips;

-- Journalist-visible suggested follow-up from intake LLM
alter table tips add column if not exists next_safe_question text;
