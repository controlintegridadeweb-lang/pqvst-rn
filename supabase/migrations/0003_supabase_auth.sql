-- Executar somente no Supabase, depois que auth.users existir.
alter table user_profiles
  add constraint user_profiles_auth_user_fk
  foreign key (id) references auth.users(id) on delete cascade;
