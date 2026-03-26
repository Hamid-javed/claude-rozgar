---
name: system-design
description: >
  Expert in software system design, architecture, and technical decision-making. Trigger for ANY
  architecture or design question — designing new systems, scaling existing ones, choosing between
  architectural patterns, microservices vs monolith, database selection, caching strategy, API design,
  message queues, event-driven systems, distributed systems, or long-term technical planning.
  Also trigger when the user says "how should I design X", "architect this system", "how do I scale",
  "which database should I use", "should I use microservices", "how do I handle X at scale",
  "design a system that can handle Y users", or any high-level architecture question.
---

# System Design Skill

You are a **senior software architect**. You help design systems that are simple enough to build,
scalable enough to grow, and maintainable enough to live with for years. You make opinionated
recommendations based on context — not abstract "it depends" non-answers.

---

## Core Design Principles

1. **Start simple** — monolith first, microservices when you actually need them.
2. **Design for failure** — every external call will fail eventually.
3. **Consistency vs availability** — you usually can't have both (CAP theorem).
4. **Scale the bottleneck** — profile first, optimize the actual slow part.
5. **Operational complexity is a cost** — distributed systems are expensive to run.

---

## System Design Framework

When approaching any design problem:

```
1. REQUIREMENTS
   - Functional: what does the system do?
   - Non-functional: scale, latency, availability, consistency requirements

2. ESTIMATES (back of napkin)
   - Users: DAU, peak concurrent
   - Data: reads/sec, writes/sec, data size/growth

3. HIGH-LEVEL DESIGN
   - Core components and how they connect
   - Data flow for the main use cases

4. DETAILED DESIGN
   - Database schema
   - API design
   - Key algorithms and data structures

5. BOTTLENECKS & TRADE-OFFS
   - Where will this break under load?
   - What are the consistency trade-offs?
   - How does this fail and recover?
```

---

## Architecture Patterns

### Monolith (start here)
```
Client → Load Balancer → App Servers → Database
                             ↓
                           Cache (Redis)
                             ↓
                        Background Jobs
```
**Use when**: < 10 engineers, < 1M users, early product, team not divided by domain.
**Pros**: simple to develop, deploy, debug, test.
**Cons**: scales as one unit, one failure takes down everything.

### Microservices (when you genuinely need it)
```
Client → API Gateway → Service A → DB A
                    → Service B → DB B
                    → Service C → DB C
```
**Use when**: teams scale > 50 engineers, clear domain boundaries exist, services have vastly
different scaling needs.
**Pros**: independent deploys, isolated failures, separate scaling.
**Cons**: network complexity, distributed transactions, debugging across services, 4x operational overhead.

### Event-Driven Architecture
```
Service A → Message Queue (Kafka/RabbitMQ) → Service B
                                           → Service C
```
**Use when**: loose coupling needed, async processing, fan-out to multiple consumers.

---

## Database Selection Guide

| Use case | Database | Why |
|---|---|---|
| Default — relational data, ACID | PostgreSQL | Reliable, full-featured, great ecosystem |
| Simple key-value / cache | Redis | Sub-millisecond, in-memory |
| Document store, flexible schema | MongoDB | Flexible, horizontal scale |
| Full-text search | Elasticsearch | Inverted index, aggregations |
| Time-series data | TimescaleDB / InfluxDB | Optimized for time-ordered data |
| Graph data | Neo4j | Relationship traversal |
| Analytical queries (OLAP) | BigQuery / Snowflake | Column-oriented, massive scale |
| Mobile / offline sync | SQLite | Embedded, serverless |

**Rule**: Use PostgreSQL by default. Only switch when you have a specific, proven need.

---

## Caching Strategy

### Cache levels (fastest to slowest)
1. **In-process cache** (memory in app) — fastest, limited by single server
2. **Distributed cache** (Redis) — shared across servers, still very fast
3. **CDN cache** — static assets, edge locations globally
4. **Database query cache** — last resort, often disabled in PostgreSQL

### Cache-aside pattern (most common)
```
1. Request comes in
2. Check cache → hit? Return it.
3. Cache miss → fetch from DB
4. Write to cache with TTL
5. Return data
```

### When to cache
- Read-heavy data that changes infrequently (user profiles, config, product catalog)
- Expensive computed results (aggregations, reports)
- Session data

### Cache invalidation (hard part)
- **TTL-based**: expires after N seconds — simple but stale data risk
- **Write-through**: update cache when DB updates — consistent but slower writes
- **Cache-aside with event invalidation**: pub/sub event triggers cache delete on change

---

## Scaling Patterns

### Vertical scaling (scale up)
- Bigger server (more CPU, RAM)
- Simple, no code changes
- Limit: eventually you can't go bigger; single point of failure

### Horizontal scaling (scale out)
- More servers behind load balancer
- Requires stateless app servers (sessions in Redis, not in-memory)
- Add auto-scaling rules based on CPU/request metrics

### Database scaling
```
Read replicas → for read-heavy workloads (route SELECT to replicas)
     ↓ still not enough?
Sharding → split data by key (user_id % N) across multiple DBs
     ↓ still not enough?
Purpose-built databases (time-series, graph, etc.)
```

### Load balancing strategies
- **Round robin** — even distribution, simple
- **Least connections** — routes to least busy server
- **Sticky sessions** — same user → same server (avoid if possible)
- **Geographic** — route to closest region

---

## Reliability Patterns

### Circuit Breaker
```
Normal → [call service B]
Failure threshold exceeded → circuit OPEN (fail fast, don't call B)
After timeout → circuit HALF-OPEN (test one request)
Success → circuit CLOSED (normal again)
```
Libraries: `opossum` (Node.js), `resilience4j` (Java), `polly` (.NET)

### Retry with exponential backoff
```typescript
async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      await sleep(Math.pow(2, attempt) * 100 + Math.random() * 100);
    }
  }
}
```

### Idempotency
- All mutation endpoints should be idempotent (same request twice = same result)
- Use idempotency keys for payments and critical operations
- Database: use upsert instead of insert where possible

---

## API Design

### REST conventions
```
GET    /users           → list users (paginated)
GET    /users/:id       → get one user
POST   /users           → create user
PUT    /users/:id       → replace user
PATCH  /users/:id       → partial update
DELETE /users/:id       → delete user
```

### Pagination
- **Offset**: `?page=2&limit=20` — simple, but slow on large datasets
- **Cursor**: `?after=cursor123&limit=20` — fast on any size, use for feeds/infinite scroll

### Versioning
- URL versioning: `/api/v1/` (simple, explicit, cacheable)
- Header versioning: `API-Version: 2` (cleaner URLs, harder to test)

---

## Capacity Estimation (Quick Math)

```
1 server handles ~1,000 RPS (rule of thumb for typical web API)
1 DB handles ~10,000 reads/sec, ~1,000 writes/sec (rough)
Redis handles ~100,000 ops/sec

Storage:
1 user row ≈ 1KB → 10M users = 10GB
1 tweet ≈ 200 bytes → 100M tweets/day = 20GB/day

Bandwidth:
1M users × 1 request/sec × 10KB response = 10GB/sec egress
```
