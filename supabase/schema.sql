create table if not exists public.scratch_plays (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 played_at timestamptz not null default now(),
 prize_key text not null,
 prize_title text not null,
 claim_code text not null unique
);
create index if not exists scratch_plays_user_date_idx on public.scratch_plays(user_id,played_at desc);
alter table public.scratch_plays enable row level security;
revoke all on public.scratch_plays from public,anon,authenticated;
create or replace function public.arcanea_play_scratch(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,extensions as $$
declare last_play timestamptz; chosen integer; k text; title text; msg text; code text; played timestamptz;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 select played_at into last_play from public.scratch_plays where user_id=p_user_id order by played_at desc limit 1;
 if last_play is not null and last_play>now()-interval '7 days' then return jsonb_build_object('error','COOLDOWN','next_play_at',last_play+interval '7 days'); end if;
 chosen:=floor(random()*10)::integer+1;
 if chosen=1 then k:='free_question';title:='Una domanda gratuita';msg:='Hai vinto una domanda gratuita. Contatta Arcanea Italia per usare il premio.';
 elsif chosen=2 then k:='two_questions_5';title:='Due domande a soli 5 euro';msg:='Hai vinto due domande al prezzo speciale di 5 euro. Contatta Arcanea Italia.';
 else k:='try_next_week';title:='Ritenta tra una settimana';msg:='Questa volta non hai vinto. Potrai riprovare tra sette giorni.'; end if;
 code:=upper(substr(encode(extensions.gen_random_bytes(8),'hex'),1,12)); played:=now();
 insert into public.scratch_plays(user_id,played_at,prize_key,prize_title,claim_code) values(p_user_id,played,k,title,code);
 return jsonb_build_object('prize',jsonb_build_object('key',k,'title',title,'message',msg),'claim_code',code,'played_at',played,'next_play_at',played+interval '7 days');
end; $$;
revoke all on function public.arcanea_play_scratch(uuid) from public,anon,authenticated;
grant execute on function public.arcanea_play_scratch(uuid) to service_role;
