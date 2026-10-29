# Payable Control

A payable management web app: track supplier invoices, approvals and payment status in one
place. Invoices are stored in SQL Server and shared by everyone who opens the app.

## Features

- Overview of invoice counts, approvals and payments
- Invoice list with search and approval filters
- Add, edit and delete invoice records
- Approve pending invoices
- Track payment status independently from approval status
- Responsive layout for desktop and mobile

## Stack

| Layer     | Technology                                                                    |
| --------- | ----------------------------------------------------------------------------- |
| Framework | TanStack Start — React 19 with server-side rendering and **server functions** |
| UI        | TypeScript, plain CSS (`src/styles.css`, carried over from the original app)  |
| Data (UI) | TanStack Router (file-based routes, loaders), TanStack Query                  |
| Database  | Microsoft SQL Server via the `mssql` driver                                   |
| Build     | Vite 8; Nitro packages the production build as a standalone Node.js server    |

The architecture follows `leads_dashboard_lovable`.

## How it works

Frontend and backend live in **one project and run as one Node.js process** — there is no
separate API server. TanStack Start splits the code at build time:

```
Browser (React page)                          Node.js server
────────────────────                          ──────────────────────────────────────────
src/routes/index.tsx ── calls ──►  src/lib/invoices.functions.ts ──►  src/server/db.server.ts ──► SQL Server
                                   (server functions: run on the       (DB pool, auto-create
                                    server; the browser gets only       database, apply schema)
                                    a tiny fetch stub)
```

- **Page (`/`)**: its loader calls `listInvoices()`, so the first load is rendered on the
  server with the data already in it. The four screens (Overview, Invoices, Approvals,
  Payments) are switched in the page, as before.
- **Changes**: `saveInvoice`, `approveInvoice`, `advancePaymentStatus` and `deleteInvoice` write
  to `dbo.invoices`; the page then reloads the list from the database. Every input is
  validated on the server, and all SQL uses parameters.
- **Payment status** steps Scheduled → Processing → Paid → On hold → Scheduled. The next value is
  computed in SQL, so two people clicking at the same time can't overwrite each other.
- **Database setup is automatic:** on the first request, the server connects to the database in
  `DATABASE_URL`, creates the database if it does not exist, and applies `database/schema.sql`
  (the `dbo.invoices` table plus the four sample invoices from the source workbook). The
  script is idempotent, so it is safe on every start.

## Database: `dbo.invoices`

| Column                         | Notes                                            |
| ------------------------------ | ------------------------------------------------ |
| `id`                           | `UNIQUEIDENTIFIER` primary key                   |
| `row_no`                       | Identity; the order invoices were added          |
| `invoice_number`, `supplier`   | Required                                         |
| `invoice_date`                 | `DATE`                                           |
| `description`, `remark`        | Free text                                        |
| `currency`                     | `SGD` or `INR`                                   |
| `amount`, `gst`                | `DECIMAL(18,2)`, 0 or more                       |
| `total`                        | Computed: `amount + gst`                         |
| `payment_terms`, `invoice_owner`, `department` | Free text (`department` is `—` when empty) |
| `entered_in_quickbooks`        | `BIT` (shown as Yes / No)                        |
| `approval_status`              | `Pending`, `Approved`, `Rejected`                |
| `payment_status`               | `Scheduled`, `Processing`, `Paid`, `On hold`     |
| `created_at`, `updated_at`     | UTC timestamps                                   |

## Files

### Root

| File                                                 | Purpose                                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `.env`                                               | Your config (DB connection). Never commit it.                              |
| `.env.example`                                       | Template for `.env`                                                        |
| `package.json` / `package-lock.json`                 | Dependencies and npm scripts                                               |
| `vite.config.ts`                                     | Build/dev config: TanStack Start, React, Nitro (Node server output)        |
| `tsconfig.json`                                      | TypeScript settings and the `@/` → `src/` import alias                     |
| `eslint.config.js`, `.prettierrc`, `.prettierignore` | Lint and code-format rules (`npm run lint`, `npm run format`)              |
| `vitest.config.ts`                                   | Test runner config (`npm test`)                                            |
| `database/schema.sql`                                | SQL Server table and sample invoices; applied automatically at startup     |
| `.output/`                                           | **Generated** by `npm run build` — the deployable server. Not source code. |
| `node_modules/`                                      | **Generated** by `npm install`                                             |

### Backend (runs only on the server)

| File                                                | Purpose                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/server/db.server.ts`                           | Parses `DATABASE_URL`, connection pool, auto-creates the DB and applies schema |
| `src/lib/invoices.functions.ts`                     | Invoice server functions: list, save, approve, advance payment, delete         |
| `src/server.ts`                                     | Server entry: wraps every request and shows a friendly page on crashes         |
| `src/start.ts`                                      | Global middleware: error handling and CSRF protection for server functions     |
| `src/lib/error-capture.ts`, `src/lib/error-page.ts` | Helpers for the crash page and error logging                                   |

### Frontend (React, runs in the browser)

| File                                            | Purpose                                                 |
| ----------------------------------------------- | ------------------------------------------------------- |
| `src/routes/__root.tsx`                         | HTML shell, 404 and error pages                         |
| `src/routes/index.tsx`                          | `/` — the whole Payable Control screen and its actions  |
| `src/components/payables/invoice-table.tsx`     | The invoice table used on every screen                  |
| `src/components/payables/invoice-form-modal.tsx`| Add / edit invoice form and the delete confirmation     |
| `src/components/payables/icons.tsx`             | Inline SVG icons                                        |
| `src/lib/invoice-format.ts`                     | Date, money and status formatting; search filter        |
| `src/router.tsx`                                | Creates the router and the shared query cache           |
| `src/routeTree.gen.ts`                          | **Generated** route list — do not edit                  |
| `src/styles.css`                                | All styles                                              |

## Configuration (`.env`)

| Variable          | Purpose                                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`    | `sqlserver://HOST[\INSTANCE][:PORT];database=NAME;user=...;password=...;encrypt=true;trustServerCertificate=true` |
| `PORT` (optional) | Port to listen on (default 3000)                                                                                  |

**Switching database:** change `DATABASE_URL` and restart. If the database does not exist it
is created (the SQL login needs `CREATE DATABASE` permission for that; `sa` has it) with the
sample invoices. Data is not copied between databases.

## Run locally

Requires Node.js 22.9 or newer (`npm start` uses `--env-file-if-exists`). On Node 20.12+ run
the server with `node --env-file=.env .output/server/index.mjs` instead.

```sh
copy .env.example .env   # then edit DATABASE_URL
npm install              # once, or after package.json changes
npm run dev              # http://localhost:3000, reloads on code changes
```

## Build and host

```sh
npm run build      # creates .output/ (the complete server)
npm start          # runs .output/server/index.mjs with .env, on PORT (default 3000)
```

To deploy, copy **`.output/`, `.env` and `package.json`** to the server (it needs Node.js but
not `node_modules` or the source) and run `npm start` there — or directly
`node --env-file=.env .output/server/index.mjs`.

Keep it running with pm2 (`pm2 start npm --name payable-control -- start`) or as a Windows
service (e.g. NSSM), and put IIS (URL Rewrite + ARR) or nginx in front for HTTPS.

## Other scripts

| Command          | What it does                       |
| ---------------- | ---------------------------------- |
| `npm test`       | Run the tests with Vitest          |
| `npm run lint`   | Check code with ESLint             |
| `npm run format` | Auto-format all code with Prettier |
