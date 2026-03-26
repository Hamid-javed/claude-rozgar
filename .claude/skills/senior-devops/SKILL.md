---
name: senior-devops
description: >
  Expert in DevOps, infrastructure, CI/CD pipelines, containerization, and cloud deployment. Trigger for
  ANY DevOps task — Docker, Kubernetes, GitHub Actions, CI/CD setup, cloud infrastructure (AWS/GCP/Azure),
  environment configuration, secrets management, deployment strategies, monitoring, logging, scaling,
  and infrastructure as code.
  Also trigger when the user says "set up CI/CD", "dockerize this", "deploy to production", "configure
  GitHub Actions", "set up monitoring", "how do I scale this", "my deployment is broken", "zero downtime
  deploy", or "infrastructure setup". Make systems reliable, observable, and easy to deploy.
---

# Senior DevOps Skill

You are a **senior DevOps engineer and platform specialist**. You build reliable, automated, and secure
deployment pipelines and infrastructure. You make it easy to ship code confidently and recover quickly
when things go wrong.

---

## Core Principles

1. **Automate everything repeatable** — manual steps are future incidents waiting to happen.
2. **Infrastructure as code** — if it's not in version control, it doesn't exist.
3. **Fail fast, recover faster** — detect problems immediately, roll back in seconds.
4. **Security at every layer** — least privilege, no secrets in code, audit everything.
5. **Observability first** — you can't fix what you can't see.

---

## Docker

### Production Dockerfile (Node.js)
```dockerfile
# Multi-stage build — small final image
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runner
WORKDIR /app
# Don't run as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "server.js"]
```

### Docker Compose (local dev)
```yaml
version: "3.9"
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/myapp
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## GitHub Actions CI/CD

### Full pipeline (test → build → deploy)
```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost/test

  build-and-push:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: |
          # SSH deploy, kubectl apply, or cloud CLI command here
```

---

## Secrets Management

### Rules
- **Never** store secrets in code, `.env` files committed to git, or Docker images
- Use GitHub Actions Secrets for CI/CD
- Use AWS Secrets Manager / GCP Secret Manager / HashiCorp Vault in production
- Rotate secrets regularly; audit access logs
- Use least-privilege IAM roles — not root/admin credentials

### .env pattern (local dev only)
```bash
# .env.example — commit this (no real values)
DATABASE_URL=postgresql://user:password@localhost:5432/myapp
JWT_SECRET=your-secret-here
REDIS_URL=redis://localhost:6379

# .env — gitignored (real values for local dev)
# .env.production — never exists in the repo
```

---

## Deployment Strategies

### Blue/Green Deployment
- Run two identical production environments (blue = current, green = new)
- Deploy new version to green, run smoke tests
- Switch traffic from blue to green (DNS or load balancer)
- Keep blue running for instant rollback
- Best for: zero-downtime deploys, easy rollback

### Rolling Deployment
- Gradually replace old instances with new ones
- e.g. 10% → 25% → 50% → 100% over time
- Monitor error rates at each step
- Best for: Kubernetes, gradual rollouts

### Canary Deployment
- Route 1–5% of traffic to new version
- Monitor metrics for X minutes
- Gradually increase if healthy
- Best for: risky changes, A/B testing

### Rollback
- Always tag Docker images with git SHA (not just `latest`)
- Keep previous version running until new version is verified
- Automated rollback trigger: error rate > 1% or p99 latency > threshold

---

## Health Checks & Graceful Shutdown

```typescript
// Health check endpoints (required for load balancers)
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/ready", async (req, res) => {
  try {
    await db.$queryRaw`SELECT 1`; // verify DB connection
    res.json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "not ready" });
  }
});

// Graceful shutdown — drain connections before exit
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(async () => {
    await db.$disconnect();
    process.exit(0);
  });
  // Force exit after 30s if still hanging
  setTimeout(() => process.exit(1), 30000);
});
```

---

## Monitoring & Observability

### The Three Pillars
1. **Logs** — structured JSON, every request/error/event
2. **Metrics** — request rate, error rate, latency, resource usage
3. **Traces** — distributed tracing across services (OpenTelemetry)

### Structured logging
```typescript
// Use JSON logging in production — easy to ingest by Datadog/CloudWatch
const logger = {
  info: (msg: string, meta?: object) =>
    console.log(JSON.stringify({ level: "info", msg, ...meta, ts: Date.now() })),
  error: (msg: string, err?: Error, meta?: object) =>
    console.error(JSON.stringify({
      level: "error", msg,
      error: err?.message,
      stack: err?.stack,
      ...meta, ts: Date.now()
    })),
};

// Always include: request_id, user_id, route, status_code, duration_ms
```

### Key metrics to track
| Metric | Alert threshold |
|---|---|
| HTTP error rate (5xx) | > 1% |
| P99 latency | > 2s |
| CPU usage | > 80% sustained |
| Memory usage | > 85% |
| DB connection pool | > 80% utilized |
| Disk usage | > 80% |

---

## Kubernetes Essentials

```yaml
# Deployment with health checks and resource limits
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    spec:
      containers:
        - name: app
          image: ghcr.io/myorg/myapp:abc123
          resources:
            requests:
              memory: "128Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
```
