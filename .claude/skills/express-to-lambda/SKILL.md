---
name: express-to-lambda
description: >
  Expert in migrating Express.js applications to AWS Lambda (serverless). Trigger this skill for ANY
  Express-to-Lambda conversion task — wrapping handlers, adapting middleware, fixing DB connections,
  handling cold starts, setting up API Gateway, managing environment variables, updating package.json,
  writing SAM/Serverless Framework config, local testing with SAM CLI, and deployment.
  Also trigger when the user says "convert to lambda", "migrate to serverless", "express to aws lambda",
  "serverless migration", "wrap express for lambda", "API Gateway + Lambda", or "remove express server".
  Preserve all existing business logic — only change the transport layer, nothing else.
---

# Express to AWS Lambda Migration Skill

You are a **senior serverless architect** specializing in migrating Express.js apps to AWS Lambda.
Your goal is to preserve 100% of existing business logic while replacing only the HTTP transport layer.
You do this surgically — minimum changes, maximum reliability.

---

## Migration Philosophy

1. **Touch only the transport layer** — routes, middleware, and `app.listen()` change. Services, models, utils do not.
2. **Preserve all business logic exactly** — no refactoring unrelated code during migration.
3. **One route at a time** — migrate incrementally if the app is large; verify each before moving on.
4. **Test locally before deploying** — use SAM CLI or `serverless-offline` to verify behavior.
5. **Environment parity** — Lambda env vars must match existing `.env` values exactly.

---

## The Two Migration Approaches

### Option A: `@vendia/serverless-express` (Recommended for full Express apps)

Wraps the entire Express app — minimal code changes, all middleware works as-is.

```typescript
// lambda.ts (new entry point)
import serverlessExpress from "@vendia/serverless-express";
import { app } from "./app"; // your existing Express app

export const handler = serverlessExpress({ app });
```

**Best for**: large apps with many routes, complex middleware chains, existing Express middleware you want to keep.

### Option B: Native Lambda handlers (Recommended for simple APIs)

Convert each route to a standalone Lambda handler — more granular, better cold start per function.

```typescript
// handlers/getUser.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { UserService } from "../services/userService"; // unchanged

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.id;
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing user ID" }),
      };
    }

    const user = await UserService.getById(userId);
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    return { statusCode: 200, body: JSON.stringify(user) };
  } catch (err) {
    console.error("getUser error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
```

---

## Step-by-Step Migration (Option A — Full App Wrap)

### Step 1: Install the adapter

```bash
npm install @vendia/serverless-express
npm install --save-dev @types/aws-lambda
```

### Step 2: Separate app from server

```typescript
// BEFORE: server.ts had everything
// app.listen(3000, ...)

// AFTER: split into two files

// app.ts — export the Express app (no listen)
import express from "express";
import { userRouter } from "./routes/users";
import { authRouter } from "./routes/auth";

export const app = express();
app.use(express.json());
app.use("/api/users", userRouter);
app.use("/api/auth", authRouter);
// all your middleware stays here — unchanged

// server.ts — only for local dev
import { app } from "./app";
app.listen(3000, () => console.log("Running on port 3000"));

// lambda.ts — Lambda entry point
import serverlessExpress from "@vendia/serverless-express";
import { app } from "./app";
export const handler = serverlessExpress({ app });
```

### Step 3: Fix database connections (CRITICAL)

Express keeps one persistent DB connection. Lambda reuses the execution context — but can't guarantee it.

```typescript
// ❌ WRONG for Lambda — creates new connection on every cold start with no pooling
const db = new Pool({ connectionString: process.env.DATABASE_URL });

// ✅ CORRECT — reuse connection across warm invocations, handle cold starts
import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1, // Lambda: keep pool small (1-2 max)
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}
```

**For Prisma:**

```typescript
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;
```

### Step 4: Fix middleware that doesn't work in Lambda

| Express middleware     | Lambda equivalent                                |
| ---------------------- | ------------------------------------------------ |
| `express.static()`     | Move static files to S3 + CloudFront             |
| `multer` (file upload) | Use S3 presigned URLs instead                    |
| `express-session`      | Use DynamoDB or ElastiCache (Redis) for sessions |
| `helmet()`             | Set headers in API Gateway or keep in Lambda     |
| `cors()`               | Works fine — keep as-is                          |
| `morgan` (logging)     | Replace with `console.log` structured JSON       |
| `express-rate-limit`   | Move to API Gateway Usage Plans                  |

### Step 5: Handle environment variables

```bash
# Lambda reads from environment — same names as your .env
# Set via: AWS Console > Lambda > Configuration > Environment variables
# Or in SAM/Serverless config:

# serverless.yml
provider:
  environment:
    DATABASE_URL: ${env:DATABASE_URL}
    JWT_SECRET: ${ssm:/myapp/jwt-secret}   # from SSM Parameter Store
    NODE_ENV: production
```

### Step 6: Remove server-only packages

```json
// package.json — remove these (not needed in Lambda)
// "nodemon" — dev only, move to devDependencies
// Any package only used for app.listen()

// Lambda deployment tip: use webpack/esbuild to bundle
// keeps cold starts fast by reducing node_modules size
```

---

## SAM Template (API Gateway + Lambda)

```yaml
# template.yaml
AWSTemplateFormatVersion: "2010-09-09"
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Timeout: 30
    MemorySize: 512
    Runtime: nodejs20.x
    Environment:
      Variables:
        NODE_ENV: production
        DATABASE_URL: !Sub "{{resolve:ssm:/myapp/db-url}}"

Resources:
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: dist/lambda.handler
      Events:
        ApiProxy:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY
        ApiRoot:
          Type: Api
          Properties:
            Path: /
            Method: ANY
```

## Serverless Framework Alternative

```yaml
# serverless.yml
service: my-express-app
provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  environment:
    DATABASE_URL: ${ssm:/myapp/db-url}

functions:
  api:
    handler: dist/lambda.handler
    events:
      - http:
          path: /
          method: ANY
          cors: true
      - http:
          path: /{proxy+}
          method: ANY
          cors: true

plugins:
  - serverless-offline # local testing
  - serverless-esbuild # fast bundling
```

---

## Cold Start Optimization

```typescript
// 1. Bundle with esbuild — smaller = faster cold start
// esbuild.config.js
require("esbuild").build({
  entryPoints: ["src/lambda.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: "dist/lambda.js",
  external: ["@aws-sdk/*"], // already in Lambda runtime
  minify: true,
});

// 2. Move heavy imports outside the handler (module-level = cached across warm invocations)
import { UserService } from "./services/userService"; // ✅ outside handler

export const handler = async (event) => {
  // UserService already loaded from previous invocation if warm
};

// 3. Use Provisioned Concurrency for latency-critical endpoints
// (keeps N instances warm at all times — costs money but eliminates cold starts)
```

---

## Local Testing

```bash
# SAM CLI
sam build
sam local start-api --port 3000
# Test exactly like Express: http://localhost:3000/api/users

# Serverless offline
npx serverless offline
# Runs on http://localhost:3000

# Direct Lambda invocation test
sam local invoke ApiFunction --event events/test-event.json
```

### Test event file (`events/test-event.json`)

```json
{
  "httpMethod": "GET",
  "path": "/api/users/123",
  "pathParameters": { "proxy": "api/users/123", "id": "123" },
  "headers": {
    "Authorization": "Bearer test-token",
    "Content-Type": "application/json"
  },
  "queryStringParameters": null,
  "body": null
}
```

---

## Common Migration Gotchas

| Problem                       | Cause                                                       | Fix                                                                |
| ----------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `connect ECONNREFUSED`        | Lambda can't reach RDS                                      | Put Lambda in same VPC as RDS; configure security groups           |
| DB connections exhausted      | Lambda scales horizontally, each instance opens connections | Use RDS Proxy to pool connections                                  |
| `Task timed out`              | DB connection too slow                                      | Increase Lambda timeout; check VPC config                          |
| `502 Bad Gateway`             | Handler returned wrong shape                                | Must return `{ statusCode, headers, body }` where body is a string |
| Large response (>6MB)         | API Gateway limit                                           | Stream response or use S3 presigned URL                            |
| Binary files broken           | Body not base64 encoded                                     | Set `isBase64Encoded: true` for binary responses                   |
| Session lost between requests | In-memory sessions don't persist                            | Move sessions to Redis/DynamoDB                                    |
| `ENOTFOUND` for external APIs | Lambda DNS resolution                                       | Ensure Lambda has internet access (NAT Gateway if in VPC)          |

---

## Deployment Checklist

- [ ] `app.listen()` removed from Lambda entry point
- [ ] DB connection uses lazy initialization with small pool size
- [ ] Environment variables set in Lambda config (not hardcoded)
- [ ] Secrets in SSM Parameter Store or Secrets Manager
- [ ] Static file serving removed (moved to S3)
- [ ] Local test passes with SAM local / serverless-offline
- [ ] API Gateway routes cover all existing Express routes
- [ ] CORS configured in API Gateway or kept in Lambda
- [ ] Lambda timeout set appropriately (default 3s is often too low — set 30s)
- [ ] Memory size tuned (512MB is a good starting point)
- [ ] RDS Proxy configured if using relational DB
- [ ] CloudWatch logs verified after first deploy
