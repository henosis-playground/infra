alter role postgres set pgrst.db_schemas = 'public';
revoke create on schema public from public;
grant usage on schema public to anon, authenticated, service_role;
