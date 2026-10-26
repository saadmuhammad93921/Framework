# context/modules/

This folder holds one `.md` file per feature module in your application.

**You create these files** — they are project-specific and not provided by the framework.

## How to add a module file

Create a file named after your feature, e.g.:
- `login.md`
- `dashboard.md`
- `bookings.md`
- `reports.md`
- `settings.md`

## What to put in each file

Each module file should cover:

```markdown
# Module: <Feature Name>

## Overview
<!-- What does this feature do? Who uses it? -->

## Key Flows
<!-- Step-by-step description of the main user journeys -->

## Test Data Notes
<!-- What credentials, IDs, or values are needed to test this feature -->

## Edge Cases to Always Test
<!-- Known tricky scenarios or past bugs to regression-test -->

## Out of Scope
<!-- Anything that should NOT be tested in this module -->
```

## How agents use these files

All agents use `Glob` to discover every `.md` file in this folder dynamically.
They read whichever files are relevant to the feature being tested — no hardcoding.

You do not need to register a new module file anywhere.
Just create the file and the agents will pick it up automatically.
