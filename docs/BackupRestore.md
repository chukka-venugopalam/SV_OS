# SV-OS Backup and Restore

## Database Backups

### Automated Backup (Supabase)

Supabase provides automatic daily backups with 7-day retention on Pro plan.

### Manual Backup

```bash
# Using pg_dump
pg_dump "postgresql://svos:password@localhost:5432/svos" \
  --format=custom \
  --file=sv-os-backup-$(date +%Y%m%d).dump

# Using Docker
docker exec sv-os-db pg_dump -U svos -d svos \
  --format=custom \
  --file=/tmp/sv-os-backup-$(date +%Y%m%d).dump
docker cp sv-os-db:/tmp/sv-os-backup-*.dump .
```

### Backup Structure

A full backup includes:

- Schema (all 20 tables, 13 enums, indexes, constraints, triggers, views)
- Seed data (subjects, concepts, technologies, careers, projects, edges, resources, skills, tags)
- User data (users, progress, bookmarks, favorites, search history, recommendations)
- Activity logs
- AI-generated content (quiz history, chat sessions, AI history/memory)

## Restore

### Restore from Custom Format Dump

```bash
# Restore schema + data
pg_restore --dbname="postgresql://svos:password@localhost:5432/svos" \
  --clean --if-exists \
  sv-os-backup-20260101.dump
```

### Restore from SQL Dump

```bash
psql "postgresql://svos:password@localhost:5432/svos" < sv-os-backup.sql
```

### Restore to Supabase

```bash
# Requires connection string from Supabase dashboard
pg_restore --dbname="postgresql+asyncpg://postgres:password@aws-0-xxx:6543/postgres" \
  --clean --if-exists \
  sv-os-backup-20260101.dump
```

## Disaster Recovery

### Recovery Steps

1. Provision new PostgreSQL instance (Supabase or Docker)
2. Restore latest backup
3. Run Alembic migrations: `alembic upgrade head`
4. Verify data integrity with health endpoint
5. Update `DATABASE_URL` in backend environment
6. Restart backend service

### Point-in-Time Recovery

Supabase Pro plans support PITR. Use Supabase dashboard to restore to any point within the retention period.

## Migration Snapshots

Alembic migration versions serve as schema snapshots:

```
0001_create_extensions.py
0002_initial_schema.py
0003_add_password_hash.py
0004_create_ai_chat_tables.py
0005_add_password_reset_tokens.py
0006_convert_enums_to_varchar_with_check.py
```

To verify migration state:

```bash
cd apps/api
alembic current
alembic history
```
