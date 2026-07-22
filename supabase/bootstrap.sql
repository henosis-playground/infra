\set pgpass `echo "$POSTGRES_PASSWORD"`

do $$ begin
  create role postgres superuser createdb createrole login replication bypassrls;
exception when duplicate_object then null;
end $$;
alter role postgres password :'pgpass';
