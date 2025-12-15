# Plura Talks Admin Panel - AI Agent Guide

## Architecture Overview

This is a React + Vite admin panel for managing live chat sessions, instructors, and users. The app is **migrating from REST APIs to Supabase Edge Functions** – always prefer `invokeFunction` over `api` (Axios) for new code.

**Tech Stack:**

- React 19 + Vite + TypeScript
- React Router (client-side routing via `src/app.tsx`)
- Tailwind CSS v4 (PostCSS) with shadcn/ui components
- Supabase client (`@supabase/supabase-js`) for Edge Functions
- Jest + ts-jest for testing

## Critical Developer Workflows

### Development Commands

```bash
npm run dev      # Vite dev server on http://localhost:5173
npm run build    # Production build → dist/
npm test         # Run Jest tests
```

### Environment Variables

Required in `.env.local` (never commit):

```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
VITE_API_URL=https://...  # Legacy, still used by some endpoints
```

All env vars **must** be prefixed with `VITE_` to be accessible in the frontend.

## Service Layer Architecture

### API Client (`src/services/api.ts`)

**Two API methods exist:**

1. **`invokeFunction(functionName, options)`** ← **PREFER THIS**

   - Calls Supabase Edge Functions
   - Auto-injects `Authorization: Bearer <token>` from `localStorage.getItem("token")`
   - Handles JSON serialization (but passes `FormData`/`Blob` directly)
   - Example: `invokeFunction("users-users", { method: "GET" })`

2. **`api`** (Axios client) ← **LEGACY, avoid for new code**
   - Used only where Edge Functions don't exist yet
   - Same auto-auth behavior
   - Redirects to `/` and clears token on 401

### Service Module Pattern

Every domain has a service in `src/services/`:

- `users.ts` → user management (fetch, ban/unban, followers)
- `tutor.ts` → instructor management (CRUD, sessions, followers)
- `network.ts` → live chat rooms

**Key principles:**

1. **Helpers normalize payloads** before returning to components (see "Normalization Pattern" below)
2. **Components never call `invokeFunction` directly** – always go through service helpers
3. **Query params in function names**: `invokeFunction("users-users?search=Ana&page=2")`
4. **Test every helper** in `src/services/__tests__/`

Example service function:

```typescript
export async function fetchUsers(params: UserListParams) {
  const path = buildUsersFunctionPath(params); // Constructs query string
  const response = await invokeFunction<UserListResponse>(path, { method: "GET" });
  return normalizeListResponse(response); // Always normalize!
}
```

## Key Conventions & Patterns

### Normalization Pattern

**All backend responses flow through adapter/normalizer functions:**

```typescript
// Example from src/services/tutor.ts
function adaptInstructor(raw: unknown): InstructorCardData | null {
  // Defensive parsing with fallbacks
  const name = pickString(data.name, data.fullName, data.displayName);
  const status = normalizeStatus(data.status);
  // ... return typed object or null
}
```

**Why?** Backend payloads vary (snake_case, camelCase, missing fields). Normalizers ensure components receive consistent, typed data.

### Path Aliases

Import paths use `@/*` aliasing:

```typescript
import { invokeFunction } from "@/services/api";
import { Button } from "@/components/ui/button";
```

Configured in `vite.config.ts`, `tsconfig.json`, and `jest.config.ts`.

### Authentication Flow

1. Login → `invokeFunction("users-login", { method: "POST", body: { email, password } })`
2. Token saved → `localStorage.setItem("token", data.token)`
3. All subsequent requests auto-include `Authorization` header
4. 401 responses → token cleared, redirect to `/`

### Global Events for Cross-Component Communication

When mutations affect other screens, dispatch custom events:

```typescript
// After creating a tutor
window.dispatchEvent(new CustomEvent("tutor:created", { detail: newTutor }));

// In another component
useEffect(() => {
  const handler = () => refreshData();
  window.addEventListener("tutor:created", handler);
  return () => window.removeEventListener("tutor:created", handler);
}, []);
```

**Active events:**

- `session:created` (from `CreateSessionModal`)
- `tutor:created` (from `CreateInstructorModal`)

### Component Structure

**Routing:** `src/app.tsx` defines all `<Routes>`, then modules in `src/app/` contain:

- `pages/` → route components
- `components/` → domain-specific UI

**Layout:** `src/app/layout.tsx` wraps everything with `ThemeProvider`, `SidebarProvider`, `Toaster`

**Sidebar:** Hides on auth paths (`/`, `/login`, `/register`, `/verify`, `/forgot-password`)

### UI Components (shadcn/ui)

- Located in `src/components/ui/`
- Configured via `components.json` (New York style)
- Use Tailwind CSS v4 utilities
- Icons from `lucide-react` + custom SVG masks

## Edge Functions Architecture

Supabase functions live in `supabase/functions/`. Each has:

- `index.ts` → Deno handler with `serve()`
- Shared utilities in `supabase/functions/_shared/` (e.g., `cors.ts`)

**Authentication in Edge Functions:**

```typescript
// Pattern used across functions
const token = req.headers.get("authorization")?.split(" ")[1];
const { data } = await supabaseAuth.auth.getUser(token);
const tutorId = data.user.id; // or user.user_metadata.profile_id
```

**CORS:** All functions use `withCors()` wrapper from `_shared/cors.ts`

## Testing Strategy

**Run:** `npm test` (Jest with ts-jest + ESM)

**Test files:** `src/services/__tests__/*.test.ts`

**What to test:**

1. **Query string construction** (e.g., filters, pagination)
2. **Normalization/adaptation** of payloads
3. **Error handling** (missing fields, null responses)

Example:

```typescript
import { fetchUsers } from "../users";
import { invokeFunction } from "@/services/api";

jest.mock("@/services/api");
const mockedInvoke = jest.mocked(invokeFunction);

it("envia os filtros relevantes ao chamar a função Edge", async () => {
  mockedInvoke.mockResolvedValue({ data: [], meta: {} });
  await fetchUsers({ search: "Ana", status: "active", page: 2 });

  expect(mockedInvoke).toHaveBeenCalledWith("users-users?search=Ana&status=active&page=2", {
    method: "GET",
  });
});
```

## Migration Status

**Check `docs/api-map.md` and `MIGRATION_MAP.md`** for endpoint migration status. When adding a new feature:

1. Check if the Edge Function exists in `supabase/functions/`
2. If yes → use `invokeFunction`
3. If no → use `api` (Axios) temporarily, document in `MIGRATION_MAP.md`
4. Never mix both for the same resource

## Common Tasks

### Adding a New Edge Function Consumer

1. Create helper in `src/services/{domain}.ts`:

   ```typescript
   export async function fetchNewData() {
     const response = await invokeFunction("new-function", { method: "GET" });
     return normalizeResponse(response);
   }
   ```

2. Add normalizer/adapter:

   ```typescript
   function normalizeResponse(raw: unknown): MyType[] {
     // Defensive parsing...
   }
   ```

3. Write test in `src/services/__tests__/{domain}.test.ts`

4. Call from component via `useEffect`:
   ```typescript
   useEffect(() => {
     fetchNewData().then(setData).catch(setError);
   }, [deps]);
   ```

### Handling File Uploads

For multipart uploads (e.g., instructor photos):

```typescript
const fd = new FormData();
fd.append("photo", file);
fd.append("tutorId", String(id));
await invokeFunction("tutor-photo", {
  method: "POST",
  body: fd, // Passed directly, not JSON.stringified
});
```

### Debugging API Calls

1. Check browser Network tab for actual request to `https://{project}.supabase.co/functions/v1/{name}`
2. Console logs in `src/services/api.ts` show errors
3. Edge function logs visible in Supabase Dashboard → Edge Functions

## Code Style Notes

- **Portuguese comments/docs** are common (this is a Brazilian project)
- **No semicolons** in most files (Prettier-like style)
- **Double quotes** for strings
- **Tailwind classes inline** (no CSS modules)
- **Export named functions** for services, default for page components

## Key Files Reference

| Path                              | Purpose                                                  |
| --------------------------------- | -------------------------------------------------------- |
| `src/services/api.ts`             | Supabase client init, `invokeFunction`, `api` (Axios)    |
| `src/app.tsx`                     | React Router setup, auth path detection                  |
| `src/app/layout.tsx`              | Global providers (theme, sidebar, toasts)                |
| `docs/api-map.md`                 | Detailed API flow documentation (MUST READ for API work) |
| `docs/edge-functions-playbook.md` | Migration checklist and best practices                   |
| `components.json`                 | shadcn/ui configuration                                  |
| `vite.config.ts`                  | Alias setup, build config                                |

---

**When in doubt:** Read `docs/api-map.md` for the authoritative API integration guide. Test changes with `npm test` before pushing.
