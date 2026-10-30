# STAR RUN v0.1 QA

Refs #6. Base: `claude/polish-mobile` (`07c7529`). Separate prototype: `/star-run.html`.

Run `python -m http.server 8000 --bind 0.0.0.0`, then open `http://localhost:8000/star-run.html`.
Android on the same Wi-Fi can use `http://<PC LAN IPv4>:8000/star-run.html` (subject to the PC firewall).
No APK, backend, audio, random terrain or new dependencies. Existing campaign files are unchanged.

## Rules and reference input

SLOW 105 px/s; FAST 270 px/s; fixed 0.78 s auto-jump. Mint surfaces are safe; striped pink gaps are hazards. NEXT predicts landing if current input continues. Stars require swept horizontal overlap while airborne (phase 0.20–0.58 s); they never affect survival.
14 distinct gaps, credited once and only on a successful landing beyond the gap. Broad-platform hops award nothing. BEST compares gates first, then stars, and is saved at death/completion. Blocked storage keeps an in-memory best for the current page.

Reference route lasts 18.72 s / 24 hops. Start released. Exact elapsed simulation-time transitions:

| Time (s) | Input |
|---|---|
| 0 | RELEASE / SLOW |
| 2.340 | HOLD / FAST |
| 6.240 | RELEASE / SLOW |
| 9.360 | HOLD / FAST |
| 13.260 | RELEASE / SLOW |
| 15.600 | HOLD / FAST through completion |

Safe introductory runway permits either input for the first hop. The first gap checks deliberate timing; subsequent islands are wider to keep the 19-second prototype forgiving. This is a fixed rhythm experiment, not an endless difficulty ramp. Initial all-FAST completion was caught by the tests; the first island was narrowed while preserving >=18 px jittered clearance. Whether this rhythm is enjoyable remains a human playtest question.

Margins below are measured INSIDE the core's safe interval (platform edges already inset 8 px). GATES/STARS are cumulative; each increase in GATES identifies the next distinct left-to-right gap. Generate the trace with `node tests/star-run.test.mjs --trace`.

| Hop | Time (s) | Landing X | Safe margin | Gates | Stars |
|---|---|---|---|---|---|
| 1 | 0.78 | 156.9 | 148.9 | 0 | 0 |
| 2 | 1.56 | 238.8 | 143.9 | 0 | 1 |
| 3 | 2.34 | 320.7 | 62 | 0 | 1 |
| 4 | 3.12 | 531.3 | 27 | 1 | 2 |
| 5 | 3.9 | 741.9 | 62 | 2 | 2 |
| 6 | 4.68 | 952.5 | 62 | 3 | 3 |
| 7 | 5.46 | 1163.1 | 62 | 4 | 3 |
| 8 | 6.24 | 1373.7 | 62 | 5 | 4 |
| 9 | 7.02 | 1455.6 | 143.9 | 5 | 4 |
| 10 | 7.8 | 1537.5 | 225.8 | 5 | 5 |
| 11 | 8.58 | 1619.4 | 143.9 | 5 | 5 |
| 12 | 9.36 | 1701.3 | 62 | 5 | 6 |
| 13 | 10.14 | 1911.9 | 62 | 6 | 6 |
| 14 | 10.92 | 2122.5 | 62 | 7 | 7 |
| 15 | 11.7 | 2333.1 | 62 | 8 | 7 |
| 16 | 12.48 | 2543.7 | 62 | 9 | 8 |
| 17 | 13.26 | 2754.3 | 62 | 10 | 8 |
| 18 | 14.04 | 2836.2 | 143.9 | 10 | 9 |
| 19 | 14.82 | 2918.1 | 143.9 | 10 | 9 |
| 20 | 15.6 | 3000 | 62 | 10 | 10 |
| 21 | 16.38 | 3210.6 | 62 | 11 | 10 |
| 22 | 17.16 | 3421.2 | 62 | 12 | 11 |
| 23 | 17.94 | 3631.8 | 62 | 13 | 11 |
| 24 | 18.72 | 3842.4 | 62 | 14 | 12 |

## Verification

- `node --test tests/core.test.mjs tests/star-run.test.mjs`: existing six stages and new route pass.
- 30/60/120/144 Hz × all 32 independent +/-50 ms transition endpoint combinations: all complete in 24 hops, 14 gates, minimum safe clearance 18.75 px. Reference minimum 27 px. Endpoint combinations bound cumulative position error for this piecewise-constant-speed route; stars can vary with input timing.
- Actual advance/collision simulation, no teleport. All FAST and all SLOW fail. Every intended landing is safe; platforms are ordered and disjoint. Midair crossing and failed landing do not award gates; repeated hops on the same platform cannot farm them. Stars are not required.
- Fresh run/input reset, corrupt/blocked storage, best reload and lexicographic tie-break tests pass.
- `python scripts/build.py`: existing campaign single-file build passes (does not bundle this separate prototype).
- `node tests/star-run-browser.mjs`: local HTTP in desktop Chrome with mobile emulation, 360x640 / 720x1280 / 320x700; no horizontal overflow, visible hold button, actual CDP touch/cancel, Space, blur/resume, death and one-tap retry; no page errors.
- `node tests/star-run-browser-route.mjs`: real page with Playwright virtual clock, timed keyboard events through the normal UI and animation loop; COURSE COMPLETE / 14 gates / 12 stars, reload persistence and fresh input. No game-state injection.
- Tab visibility/pagehide handlers share the tested blur suspension path. Explicit RESUME avoids background time advancing or stale FAST. Long foreground frame stalls are capped at 50 ms to avoid skipping unreadable gameplay.

Screenshots: [360x640](star-run-screenshots/360x640.png), [720x1280](star-run-screenshots/720x1280.png), [320x700](star-run-screenshots/320x700.png), [result](star-run-screenshots/result-320.png), [complete](star-run-screenshots/complete.png).

## Still needs human testing

No actual Android device, LAN connectivity, mobile Chrome lifecycle, comfort, or fun/replay-intent testing was performed. On Android, try touch release/cancel, app switching/resume, deliberate fall/retry, complete the route, and reload BEST. No itch upload, deployment or merge was performed.

## Documentation precedence

`docs/HANDOFF_JA.md` (Codex/merge instructions), `docs/CODEX_TASK.md` (ownership/branch), and `docs/INTEGRATION.md` (integration order) describe earlier campaign work. Issue #6 and the current user request supersede them for this task: separate STAR RUN files, branch `codex/star-run-score-attack`, Draft PR targeting `claude/polish-mobile`, no merge/publication. No campaign specification was silently rewritten.
