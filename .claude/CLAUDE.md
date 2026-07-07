# Project Instructions

Reusable **NestJS + Prisma backend starter** with a layered, type-safe architecture.
The folder structure and principles below are **non-negotiable**.

---

## Core Principles (Apply Everywhere)

**1. Single Responsibility: Each file has exactly one job.**

- `*.controller.ts` = extract + delegate only · `*.service.ts` = business logic only · `*.repo.ts` = data access only · `*.module.ts` = DI wiring only · `*.dto.ts` = validation only.

**2. One-Way Layers: Controller → Service → Repository → Database.**

- Controller may NOT call repo. Service may NOT touch `req`/`res`. Repo may NOT hold business logic. No shortcuts.

**3. Derive, Never Reconstruct.**

- **Derived artifacts rule:** If a library or framework generates a type, schema, validation result, or query shape, use that derived output directly. Examples include Prisma `GetPayload<>`, Zod `infer`, class-validator DTO output, React Query results, NestJS query result shapes, and third-party package typings.
- **No manual reconstruction:** Never replace a derived artifact with `any`, `Record<>`, `as { field?: type }`, or a hand-written parallel type just to satisfy the compiler.
- **Narrow by derivation:** If you need a smaller shape, derive it from the source artifact with the framework's own helpers or standard TypeScript utilities like `Pick` and `Omit`, not ad hoc object literals.
- **Validate at the boundary:** Decorators (`@IsEnum()`, etc.) in DTOs validate input once at the edge. Do not duplicate validation in services.
- **Auth in controllers only:** Use `@UseGuards()` + `@Roles()` at the controller. Never hand-roll auth checks in services.
- **Response shaping stays global:** The response interceptor owns success wrapping. Never build ad-hoc `{ status, data, message }` objects in controllers.
- **Generalize the rule:** Whenever a new tool emits a type, shape, or validation outcome, prefer its generated output over inventing a parallel abstraction.

**4. Define Once, Reference Everywhere.**

- Models live in `schema.prisma` → Prisma types → DTOs reference the model. No duplication. Errors live in `common/errors/`, auth in `auth/`, repos in `common/repos/`.

**5. Strict Types, Always.**

- No `any`. DTOs are the validation + type source at boundaries. Prisma generates the rest. Return domain objects from services, not raw Prisma models.

**6. No Dead Code, No Stubs, No Placeholders.**

- Delete unused code. Comments explain _why_, not _what_.

**7. Linting & Code Quality (Priority)**

- **Linting is non-negotiable.** Every change must pass the project's linter without warnings or errors.
- Before committing or reporting a task complete, verify `npm run lint` (or project's lint command) returns clean.
- If a linting error arises, fix it immediately—do not ship or defer.
- Type errors and linting failures block task completion; they are not "optional improvements."

---

## Execution Protocol (Every Task)

When you receive a prompt, follow this workflow **always**:

1. **Think:** Understand the request, identify what's being asked, constraints, and scope.
2. **Plan:** Determine the strategy—which files to touch, which layers involved, potential pitfalls, dependencies.
3. **Generate the Perfect Prompt:** Frame your internal approach as a clear, actionable plan before implementing.
4. **Execute:** Implement the plan, verify linting and type-safety, test the result end-to-end.

This discipline ensures thoughtful, correct solutions without backtracking.

---

## Folder Structure (Immutable)

```
src/
├── main.ts                     Bootstrap
├── app.module.ts               Root; imports every feature module
├── common/                     Infrastructure (no domain logic)
│   ├── database/               Prisma module + service
│   ├── enums/                  TimeFilter, SortOrder, etc.
│   ├── errors/                 RepoError, custom exceptions
│   ├── filters/                http-exception.filter.ts (global)
│   ├── interceptors/           response.interceptor.ts (global)
│   ├── interfaces/             Types + re-exports
│   ├── repos/                  [domain].repo.ts (query pattern only)
│   └── services/               Cross-domain services (stats, etc.)
├── lib/                        Pure utilities (no side effects)
├── modules/core/               Feature modules
│   ├── auth/                   JWT + guards (don't extend, use as-is)
│   ├── users/                  Reference module — copy for new domains
│   └── [domain]/               New feature modules here
```

Aliases: `@common/*`, `@lib/*` (tsconfig).

---

## Workflow: Add a New Domain

1. Add model to `schema.prisma` → `prisma migrate dev --name <name>`.
2. Create `common/repos/[domain].repo.ts` (Prisma queries only) → register in `repo.module.ts`.
3. Create `modules/core/[domain]/`: `dto/` (create + update), `[domain].service.ts`, `[domain].controller.ts`, `[domain].module.ts`.
4. Import the module in `app.module.ts`.

**Copy `modules/core/users/` as the reference.** The admin module already exposes generic CRUD over any repo, so new domains usually just add repo + service.

---

## Layer Shape

**Module** — import dependencies, declare controller + service, export service if shared.

**Controller** — extract route params + body, call service, return result. Add `@UseGuards(JwtAuthGuard)` + `@Roles()` for protected routes. No logic.

**Service** — accept DTOs, enforce rules, throw `HttpException`s, call repo methods, return domain objects (not raw Prisma models).

**Repository** — wrap Prisma calls in `try/catch`, rethrow as `RepoError`. No business logic. Use `Prisma.[Model]GetPayload<>` for typed query results.

**DTO** — class-validator decorators validate input at the boundary; `UpdateDto extends PartialType(CreateDto)`.

---

## Applying Principles: Framework Examples

**Principle 3 in action** — let frameworks infer, never hand-roll:

| Derived artifact        | Source → Use                                               | ✅ Do                                                            | ❌ Don't                                   |
| ----------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------ |
| **Prisma query result** | `.findUnique({ include: { plan: true } })` → typed payload | Use `Prisma.SubscriptionGetPayload<{ include: { plan: true } }>` | Cast to `any` or `Record<>`                |
| **Zod schema**          | `schema` → validated input + inferred type                 | Use `z.infer<typeof schema>`                                     | Duplicate the type by hand                 |
| **class-validator DTO** | Decorated DTO → validated request object                   | Accept the validated DTO in the service                          | Re-validate the same fields in the service |
| **NestJS guards**       | `@UseGuards(JwtAuthGuard)` → authenticated request         | Call the service after the guard passes                          | Hand-roll auth checks in the service       |
| **Global interceptor**  | `return data` from controller → wrapped response           | Return the domain object directly                                | Build `{ status, data, message }` manually |

**When you encounter a new framework tool:** First check whether it produces a derived type, schema, result shape, or validation outcome. If it does, use that output directly and avoid manual reconstruction with `any`, `Record<>`, `as` assertions, or parallel hand-written types.

---

## Error Handling & Responses

- Services throw Nest `HttpException`s; repos throw `RepoError`.
- Global filter (`common/filters/http-exception.filter.ts`) formats errors.
- Global interceptor (`common/interceptors/response.interceptor.ts`) wraps successes.
- Never swallow errors or build ad-hoc response wrappers.

---

## Tech Stack

NestJS · Prisma + PostgreSQL · class-validator · @nestjs/jwt + passport · @nestjs/swagger · Jest.

Auth in `modules/core/auth/` is production-ready — use as-is, don't extend.

---

**This is the only architecture.** Follow it precisely. If you're unsure where something goes, the design is broken—re-read this instead of inventing new locations.
