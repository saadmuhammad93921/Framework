# Transfer Module - What We Did With the QA Agents

We started from scratch: no test cases existed yet for the Transfer module, so the very first step
was writing them.

## What we asked for

We ran the Transfer module through the automated QA pipeline (TB_Agents) step by step:

1. **Generate test cases** - gave the agent the Transfer spec and asked it to write test cases.
2. **Review the test cases** - had a second agent critique them against the spec, three rounds of fixes.
3. **Run the tests by hand in a browser** - had an agent (with me driving the browser) actually click through the app and check each test case against the real QA site.
4. **Turn the passing tests into permanent automated tests** - asked an agent to write real Playwright code so these checks can be run again automatically in future, without a human clicking through by hand.

## What happened at each step

**Test case generation:** The agent read the Transfer spec and wrote 14 test cases covering create, ship, receive, and a few edge cases. It flagged 4 things it wasn't sure about (exact button names, error text, etc).

**Review (3 rounds):** A reviewer agent checked the cases line by line. It caught several real problems - tests that assumed data would still exist that had already been used up, a wrong assumption about whether empty transfers are allowed, and a couple of vague steps. After 3 rounds of fixes, we ended with 17 test cases, 15 of them approved as ready to run.

**Running them in the browser:** We signed into the real QA site and ran 11 of the 15 approved test cases by hand (stopped there on purpose, not all 15):
- **9 passed**
- **1 failed** - the app doesn't show a "received" timestamp on each item the way the spec said it should
- **1 blocked** - the test assumed two separate fields ("Carrier" and "Tracking Number") but the app only has one combined field

**Turning the 9 passing tests into real automated code:** This is where we are now. The agent:
- Captured a saved login session so automated tests don't need a human to type in a sign-in code every time
- Wrote the automated test code for all 9 passing test cases (`transfer.spec.ts`, plus supporting page files)
- Started running them to check they actually pass

**This step takes a long time and is not finished yet.** Each full run against the real QA site takes roughly 5-7 minutes on its own (this is a real browser clicking through a live app, not a quick check), and getting all 9 tests clean is turning out to need several rounds of running, looking at exactly what failed, fixing one small thing, and running again.

What we've learned so far from two real runs (each one takes 7-12 minutes, since it's a real browser clicking through the live QA site, not a quick simulated check):

- **Run 1** (4 tests at once, in parallel): 2 passed, 7 failed. Several failures happened at the exact same step across different tests - the "new transfer" form just never finished loading in time. That pointed at the tests overloading the app's local data-sync by all hitting the same saved login at once (ToolBerry is built "offline-first" and syncs data in the background; several tabs doing that together seems to choke it).
- **Run 2** (same 9 tests, one at a time instead of all at once): **6 passed, 3 failed** - confirms the theory above. Running one at a time fixed 4 of the 7 original failures. The 3 still failing are two different, smaller issues:
  - One test expects a specific error message in a popup that didn't show up where expected - needs the code to look in the right spot.
  - Two tests can't find a specific Site ("Site For Transit") in a dropdown when setting a destination - needs checking whether that record still exists under that exact name, or whether the dropdown works slightly differently than the code assumes.

This back-and-forth (run, read exactly what broke, fix one thing, run again) is expected and normal for getting new automated tests stable - it just takes real wall-clock time, and we're not done with it yet.

## What's left

- Fix the remaining 3 failures (1 wrong popup-text locator, 2 "Site For Transit" dropdown issues)
- Keep tests running one at a time (not in parallel) going forward, since parallel runs overload this app's sync
- Once all 9 pass reliably running one at a time, run the whole set 3 times in a row to make sure none of them are flaky (pass sometimes, fail other times) before we call this done
