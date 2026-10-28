-- O painel público acompanha a fotografia vigente assim que ela é gravada.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'aggregate_snapshots'
     ) then
    alter publication supabase_realtime add table public.aggregate_snapshots;
  end if;
end $$;
