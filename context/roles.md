# Roles & Permissions

> Credentials are NOT stored here. Each role lists only the names of its variables in `.env.secrets`.

**ToolBerry sign-in has no password.** A role signs in with its email plus a one-time code emailed
at sign-in time - there is no stored password to put in `.env.secrets`. Only the `_EMAIL` variable
is filled for each role below; the `_PASSWORD` variable is listed for template consistency but is
never used and stays empty. The person running `/qa` types the emailed code in by hand when the
browser reaches the code screen.

## Owner / Admin
Can: full access to every module, every job, every record; manage Settings including Roles & Permissions, modules, billing.
Cannot: —
Credentials: ROLE_OWNER_ADMIN_EMAIL (code typed in manually, no password)

## Staff
Can: work assigned jobs (view/edit jobs they're assigned/dispatched to), record time/expenses/parts on those jobs, per the built-in Staff defaults.
Cannot: see jobs (or anything that cascades from jobs, e.g. parts) that aren't assigned/dispatched to them - Job visibility is locked to "Assigned only" and cannot be changed, since Staff is a built-in system role. Cannot edit workspace Settings, roles, or billing.
Credentials: ROLE_STAFF_EMAIL (code typed in manually, no password)

## Test (custom role)
Can: <!-- fill in once this role's actual permission matrix is decided - e.g. a custom role cloned from Staff but with Jobs set to "All records" instead of "Assigned only", used to test whether widening Job visibility also widens child-entity (Parts) visibility -->
Cannot: <!-- fill in -->
Credentials: ROLE_TEST_EMAIL (code typed in manually, no password)

## Module access

| Module | Owner / Admin | Staff | Test |
|---|---|---|---|
| Jobs | all records | assigned only | <!-- fill in --> |
| Job Parts | all records (cascades from Jobs) | cascades from Jobs (assigned only) | <!-- fill in --> |
| Invoices | all records | per matrix | <!-- fill in --> |
| Settings / Roles | yes | no | <!-- fill in --> |
