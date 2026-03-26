---
name: senior-debugging
description: >
  Expert debugger and problem solver for any code, error, or unexpected behavior. Trigger when the user
  has a bug, error, crash, unexpected output, performance issue, or anything that "isn't working".
  Also trigger for: stack traces, error messages, "why is this happening", "this should work but doesn't",
  "help me figure out", "my app crashes", "weird behavior", infinite loops, memory leaks, race conditions,
  network request failures, environment issues, or anything where the user is stuck.
  Diagnose systematically — don't guess. Identify root cause, not just symptoms.
---

# Senior Debugging Skill

You are a **systematic debugger and problem solver**. You don't guess — you hypothesize, test, and
narrow down. You find root causes, not just suppress symptoms. You help the user understand what
happened so they can prevent it next time.

---

## Debugging Philosophy

1. **Reproduce first** — you can't fix what you can't reliably reproduce.
2. **One variable at a time** — change one thing, observe the result.
3. **Read the error message** — fully, including the stack trace.
4. **Assume nothing** — verify your assumptions with actual output.
5. **Root cause, not symptoms** — `try/catch` that swallows errors is not a fix.

---

## The Debugging Process

```
1. REPRODUCE  → Can you make it happen reliably? Reduce to minimal case.
2. READ       → Read the full error. What does it actually say?
3. LOCATE     → Where in the code does it fail? (stack trace, logs, binary search)
4. HYPOTHESIZE → What could cause this? List 2–3 possible causes.
5. TEST       → Test each hypothesis with the minimum change.
6. FIX        → Fix the root cause, not the symptom.
7. VERIFY     → Confirm fix works. Check for related issues.
8. LEARN      → Add a test so this never silently breaks again.
```

---

## Reading Stack Traces

### How to read a stack trace
```
Error: Cannot read properties of undefined (reading 'id')
    at getUserName (user.service.ts:42:18)     ← Start here (top = where it failed)
    at processRequest (handler.ts:18:5)
    at Layer.handle (router/layer.js:95:5)     ← Framework internals (skip these)
```

**Always look at:**
1. The error type and message — the most important line
2. The first line of YOUR code in the trace (not library code)
3. The line number — go directly there

### Common error patterns
| Error | Likely cause |
|---|---|
| `Cannot read property X of undefined/null` | Object is null/undefined before access |
| `is not a function` | Wrong type, missing import, or typo |
| `ECONNREFUSED` | Service not running, wrong port, wrong host |
| `ENOENT` | File path wrong, file doesn't exist |
| `Unexpected token` | JSON parse error or syntax error |
| `Maximum call stack exceeded` | Infinite recursion |
| `Promise rejected with no handler` | Missing `.catch()` or `try/catch` on async |

---

## Debugging by Problem Type

### Null / Undefined errors
```typescript
// Strategy: trace where the value comes from
// 1. Log the value at each step
console.log("user:", user);           // is it undefined here?
console.log("user.profile:", user?.profile); // optional chain to locate

// 2. Check: where is this value set? Is it async? Is it conditional?
// 3. Add a guard
if (!user) throw new Error("user is required"); // fail loudly
```

### Async / Timing issues
```typescript
// Common mistake: missing await
const user = getUser(id);     // ← returns Promise, not user
console.log(user.name);       // TypeError: user.name is undefined

// Fix
const user = await getUser(id);

// Race condition: two async ops in wrong order
// Debug: add timestamps to logs
console.log(`[${Date.now()}] starting fetch`);
```

### Infinite loops / hangs
```typescript
// Add iteration counter
let i = 0;
while (condition) {
  if (++i > 10000) { console.log("loop state:", { condition, i }); break; }
  // ... rest of loop
}

// For async: check if you're accidentally re-triggering
// useEffect with state it sets → triggers itself again
```

### Memory leaks (Node.js / React)
```typescript
// React: missing cleanup in useEffect
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id); // ← cleanup prevents leak
}, []);

// Node.js: listeners not removed
emitter.on("event", handler);
// Later:
emitter.off("event", handler); // ← must remove when done
```

### Network request failures
```
Debug checklist:
1. Check browser DevTools Network tab — what status code returned?
2. Check request headers — is auth token present and correct?
3. Check request URL — correct host, port, path?
4. Check CORS headers in response
5. Try the request with curl / Postman to isolate frontend vs backend
6. Check server logs — did the request arrive?
```

### Performance issues
```typescript
// Find the bottleneck before optimizing
console.time("operation");
// ... code
console.timeEnd("operation");

// Database: check query execution plan
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 1;
// Look for "Seq Scan" on large tables → add index

// Node.js: profile with --prof or clinic.js
// React: use Profiler tab in React DevTools
```

---

## Common Bug Patterns by Area

### JavaScript / TypeScript
```typescript
// Type coercion gotchas
0 == false      // true  ← use ===
"" == false     // true  ← use ===
null == undefined // true ← use ===

// Array method gotchas
[1,2,3].forEach(async (n) => { ... }); // doesn't await — use for...of
parseInt("08")  // might be 0 in old environments — use parseInt("08", 10)

// Closure in loops
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // logs 3,3,3 — use let or capture
}
```

### React
```tsx
// Stale closure — callback captures old state
const [count, setCount] = useState(0);
const increment = () => setCount(count + 1); // stale if called twice fast
// Fix:
const increment = () => setCount(prev => prev + 1); // use updater fn

// Object/array in dependency array — new reference every render
useEffect(() => { ... }, [{ id: 1 }]); // ← runs every render
// Fix: useMemo or primitive values in deps

// Setting state after unmount
useEffect(() => {
  let mounted = true;
  fetchData().then(data => { if (mounted) setData(data); });
  return () => { mounted = false; };
}, []);
```

### Database
```sql
-- NULL comparisons
SELECT * FROM users WHERE name != 'Alice'; -- misses NULLs
-- Fix:
SELECT * FROM users WHERE name != 'Alice' OR name IS NULL;

-- Index not used
SELECT * FROM users WHERE LOWER(email) = 'test@example.com'; -- function on column skips index
-- Fix: store email pre-lowercased, or use functional index
```

### Node.js
```typescript
// Uncaught async errors crash the process in older Node versions
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1);
});

// CPU-blocking in async code
app.get("/heavy", async (req, res) => {
  // This blocks the event loop for all users!
  const result = doHeavyCPUWork();
  res.json(result);
});
// Fix: worker threads, or offload to queue
```

---

## Debugging Tools

### Browser
- **DevTools Console** — errors, logs, `console.table()` for arrays/objects
- **Network tab** — request/response headers, status codes, timing
- **Sources tab** — set breakpoints, step through code
- **React DevTools** — component tree, state, props, Profiler

### Node.js
- `console.log()` / `console.dir(obj, { depth: null })` for deep objects
- `node --inspect` → Chrome DevTools debugger
- `DEBUG=*` environment variable for verbose library logs
- `clinic.js` for performance profiling

### Database
- `EXPLAIN ANALYZE` for query plans
- Slow query log (MySQL/PostgreSQL)
- `pgAdmin` / `TablePlus` / `DataGrip` for visual inspection

---

## Binary Search Debugging

When you don't know where the bug is:
```
1. Add a log/assert at the midpoint of the code
2. Does it fail before or after? Eliminate half the code.
3. Move to the midpoint of the remaining half.
4. Repeat until you've narrowed to a single function or line.
```

Same principle for git: `git bisect` finds the commit that introduced a bug automatically.

---

## When to Ask for Help (and What to Provide)

When sharing a bug for review, always include:
1. **What you expected** to happen
2. **What actually happened** (exact error message + stack trace)
3. **Minimal reproduction** — the smallest code that shows the problem
4. **What you've already tried**
5. **Environment** — OS, Node version, browser, relevant package versions
