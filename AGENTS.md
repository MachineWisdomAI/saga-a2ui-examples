# saga-a2ui-examples - AI Agent Instructions

## Project

Public repository of hosted saga a2ui example applications and the Claude plugin marketplace. It is not the SDK: SDK-owned code changes go to `MachineWisdomAI/saga-a2ui`. Read [README.md](README.md) first.

## Shared Operating Rules

- Read the repo-local `AGENTS.md` first. Tool-specific files are additive and must not contradict it.
- Follow explicit operator instructions. Treat AI reviewer findings as evidence: verify and classify them before acting. Do not expand scope because a reviewer suggested it.
- Inspect the exact repo, branch, worktrees, and dirty state before editing. Preserve unrelated changes.
- Make tracked edits only on a dedicated worktree or feature branch. Keep the default checkout clean. Never commit or push directly to the default branch; land tracked changes through a pull request.
- Never force-push or amend a pushed commit. Stage explicit paths only; do not use `git add -A` or `git add .`.
- Resolve exact targets before destructive work. Do not discard changes, delete material data, merge, deploy, publish, post externally, or alter access without authority for that action.
- Never expose secrets. Keep provider credentials and user data within their authorized boundary.
- Treat `~/git/vendor/` checkouts as read-only. Develop in an owned repository or worktree.
- Route ambiguous new builds through `skills-sage` before coding. Route non-trivial tracked review through `mw-review`; use repo-local validation and workflow instructions.
- Keep durable non-trivial specs, plans, decisions, status, and handoffs in FAVA Trails. Promote finalized truth and sync it.
- Do not build “shared-something” helper identities. Use shared-all or shared-none; give shared artifacts one owner and one documented repair path.

## Repo Notes

- This repository is public. Keep private planning, ticket links, customer material and credentials out of commits, PRs and comments; PRs must stand alone.
- This repository owns the game's rules, contract, view, local development and hosted deployment. Both entrypoints import `apps/tic-tac-toe/game`; the SDK owns reusable packages and the tutorial.
- Write saga a2ui and saga lowercase; use Machine Wisdom for company display names and MachineWisdomAI for the GitHub slug. Preserve code identifiers and explicitly marked historical observations.
- Keep deployment bindings and settings (`wrangler.jsonc`, `src/config.ts`) separate from SDK delivery code.
- Run `npm run check` before review. Source readiness, registry consumption, deployment and actual-host acceptance are separate claims; do not report one as another.
- The dragon icon files are the SDK's artwork, used unchanged; a replacement is a deliberate change to `scripts/icon-digests.mjs` and the SDK's record together. The card shows them inside the page (`apps/tic-tac-toe/view`); the browser test checks the embedded bytes against those digests.
- PNG and other media use Git LFS (`.gitattributes`). The pre-push guard does not run LFS: run `git lfs push origin BRANCH` before `git push origin BRANCH`, and check pointers with `python3 scripts/check-lfs.py`.
- This is an unversioned application: no release unit is enrolled.
