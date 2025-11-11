# ADR-0002: Use Drizzle ORM Instead of Prisma

## Status

Accepted

## Context

We need an ORM to interact with our PostgreSQL database that:
- Provides type safety
- Has good TypeScript integration
- Works well with Next.js
- Supports migrations
- Has minimal overhead
- Allows direct SQL when needed

The two primary contenders were Prisma and Drizzle ORM.

## Decision

Use **Drizzle ORM** with the postgres.js driver for database access.

## Consequences

### Positive

- **Lightweight**: Smaller bundle size than Prisma
- **SQL-like Syntax**: Easier to write complex queries, closer to actual SQL
- **No Code Generation Step**: No need to run `prisma generate` after schema changes
- **Direct SQL Support**: Can drop down to raw SQL when needed
- **Better Performance**: Less overhead than Prisma's query engine
- **TypeScript-first**: Schema defined in TypeScript, not a DSL
- **Flexible**: More control over queries and relationships
- **Fast Development**: `db:push` allows rapid iteration without migration files

### Negative

- **Smaller Community**: Fewer examples and community resources than Prisma
- **Learning Curve**: Different paradigm from Prisma for those familiar with it
- **Studio Tool**: Drizzle Studio is newer, less feature-rich than Prisma Studio
- **Documentation**: Good but not as extensive as Prisma's

### Neutral

- **Migration System**: Both have migration capabilities (Drizzle Kit vs Prisma Migrate)
- **Type Safety**: Both provide excellent TypeScript integration

## Alternatives Considered

- **Prisma**: More mature, larger community, excellent tooling (Prisma Studio), but heavier, requires code generation, less SQL-like syntax
- **TypeORM**: Mature, decorator-based, but more verbose and less modern TypeScript support
- **Raw postgres.js**: Maximum performance and control, but no type safety or migration system
- **Kysely**: Excellent type safety and SQL-like syntax, but less beginner-friendly

## References

- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Drizzle vs Prisma Comparison](https://orm.drizzle.team/docs/prisma-comparison)
- Configured in `src/lib/db.ts` and `src/lib/schema.ts`
- See `drizzle.config.ts` for Drizzle Kit configuration
