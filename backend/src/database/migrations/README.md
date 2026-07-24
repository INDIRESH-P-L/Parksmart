# Migrations

`schema.sql` (plus `triggers.sql` / `rls_policies.sql`) is the canonical
baseline snapshot. Any **future incremental change** goes here as a new file:

```
migrations/
  0001_add_<thing>.sql
  0002_alter_<thing>.sql
```

Rules:

- Number files sequentially; never edit an already-applied migration.
- Each migration must be runnable on top of the baseline in order.
- When a migration lands, fold its final shape into `schema.sql` **only** if
  you are resetting the project database from scratch — otherwise the snapshot
  and migration history drift apart.
