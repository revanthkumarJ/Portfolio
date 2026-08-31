---
name: update-swipe-experience
description: "Fetch Revanth's merged PRs from the private swipe-YC21/swipe-android repo via the gh CLI and refresh the Swipe FULL-TIME (SDE 1) experience entry in src/data/content.js — updated PR count + themed highlights, scrubbed of internal/product-specific details. Trigger: /update-swipe-experience, or asks like 'update my swipe experience', 'refresh swipe full-time from my PRs'."
---

# /update-swipe-experience

Regenerate the **Swipe full-time (SDE 1) experience** on the portfolio from the real
merged-PR history. Fetch → split by date → theme the full-time PRs → rewrite the
highlights + PR count in `src/data/content.js` → build to verify.

By default only the **full-time** entry is updated. Update the internship entry too
only if the user explicitly asks.

## 1. Preconditions

- `gh` CLI must be authenticated as `revanthkumarJ` (`gh auth status`). If not, tell the
  user to run `gh auth login` and stop.
- Repo: `swipe-YC21/swipe-android` (private — access comes from the authenticated token).
- Target file: `src/data/content.js`, the experience entry with
  `company: "Swipe (YC S21)"` and `role: "SDE 1 — Android Developer"`.

## 2. Fetch the PRs

```bash
gh pr list --repo swipe-YC21/swipe-android --author revanthkumarJ \
  --state merged --limit 400 --json number,title,mergedAt > /tmp/swipe_prs.json
```

Titles are enough for theming. Only pull `body` for specific PRs if a title is unclear
(`gh pr view <n> --repo swipe-YC21/swipe-android --json title,body`).

## 3. Split by date (internship vs full-time)

The **full-time boundary is 2026-06-15** (internship = before; full-time = on/after).

```bash
python3 - <<'EOF'
import json, datetime
d = json.load(open('/tmp/swipe_prs.json'))
cut = datetime.datetime(2026,6,15, tzinfo=datetime.timezone.utc)
ft = [p for p in d if datetime.datetime.fromisoformat(p['mergedAt'].replace('Z','+00:00')) >= cut]
ft.sort(key=lambda p: p['mergedAt'])
print("FULL-TIME PRs:", len(ft))
for p in ft: print(p['mergedAt'][:10], f"#{p['number']}", p['title'])
EOF
```

Read every full-time title before writing anything.

## 4. Turn titles into themed highlights

Group the full-time PRs into **6–8 one-line highlights**, most impactful first. Suggested
themes (merge/reorder/drop to fit what the PRs actually show):

- **Architecture & build tooling** — convention plugins, centralized navigation, module
  boilerplate reduction, dependency cleanup.
- **Compose migration** — the legacy XML → Jetpack Compose wave, described at the *flow*
  level (settings, product, payment, profile), not an exhaustive screen list.
- **Legacy removal** — retiring old XML screens and stale feature flags after migrations.
- **Remote Config / performance** — fetch-volume optimization, realtime updates.
- **AI-assisted features** — described generically (expense capture, product descriptions,
  custom AI instructions).
- **Shipped user-facing features** — discounts, document filters, barcode scanning,
  paid-plan gating, etc.
- **Reliability & releases** — production crash fixes, Play Store releases.

Keep the voice consistent with the existing bullets: terse, past/'-ing' tense, one line.

## 5. Rules — DO NOT mention internal / product-specific implementation details

This is the most important constraint. **Never** put these in the highlights:

- Internal code identifiers — feature-flag names (`useNewDocumentDetails`,
  `useNewGeneralSettings`, …), service/class names, module paths.
- Internal API versioning — "migrated to v3", endpoint names, payload field names.
- Internal architecture specifics — "hub spanning six sections", table/DB version numbers
  ("Room DB version 10"), internal logging/telemetry details.
- Exhaustive proprietary screen enumerations — generalize to flow categories instead.

**Do** keep legitimate portfolio signal: engineering activities (tooling, migrations,
optimization, crash fixes, releases) and user-facing features (discounts, filters, barcode
scanning, AI-assisted features, paid-plan gating). When unsure whether something is
"internal", leave it out.

## 6. Update `src/data/content.js`

In the `SDE 1 — Android Developer` / `Swipe (YC S21)` entry:

1. **`highlights`** — replace with the new themed array from step 4.
2. **`summary`** — refresh the PR count to the full-time total, rounded **down** to the
   nearest ten with a `+` (e.g. 106 → `"100+ merged PRs"`, 121 → `"120+ merged PRs"`).
   Keep the rest of the summary sentence intact.
3. Leave `role`, `period`, `current`, `tech`, and `links` unchanged unless the user asks.
4. Do **not** touch the internship entry (`Android Developer Intern`) unless explicitly
   requested — if so, apply the same steps to PRs *before* 2026-06-15.

## 7. Verify

```bash
npm run build   # expect: ✓ built
```

Then report to the user: the new full-time PR count, a one-line summary of the themes, and
confirm the build passed. Do **not** commit or push unless the user asks.

## Notes

- The build imports image assets, so plain `node` can't run `content.js`; rely on
  `npm run build` (Vite) to validate.
- If the user's dev server is running (`http://localhost:5173`), the change hot-reloads —
  offer a screenshot of the expanded card for review.
