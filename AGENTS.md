# azurelocal-trailwright: agent instructions

Canonical, cross-tool instructions for this repository. Keep this file short.

## What this repo is

A React and TypeScript web app (`apps/trailwright`) that captures an Azure Local design, validates it against the current release and exports files for automation. It does not deploy anything. See [repo-intent.md](repo-intent.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## Commands

```powershell
npm install
npm run check && npm run lint && npm test && npm run build
npm run test:browser
npm run docs:rules --workspace apps/trailwright   # after changing a rule
```

## Hard rules

1. **Public repository.** No customer, tenant, lab or company names, no private data. Example values only (documentation IP ranges, `example.com`, all-zero GUIDs).
2. **Release:** the tool always plans against the newest generally available Azure Local release, today 12.2610 (`CURRENT_RELEASE` in `src/model/release.ts`). When a new GA release ships, move to it: update `CURRENT_RELEASE`, the Learn `view=azloc-` links and the release lists of the rules, review every rule against the new Learn pages, and regenerate `docs/RULES.md`. Never name or imply a preview build.
3. **No secrets, ever.** Exports carry `keyvault://` references or `null`. Never add a field that stores a password, key or token. Free-text notes are exported as typed; the UI warns about that.
4. **Never invent a value.** What a design does not know is `CHANGE-ME` (environment file, Terraform) or left empty, and is listed.
5. **Every rule has a Microsoft Learn URL** and a test case; Learn wins over any other source. Regenerate `docs/RULES.md` after a rule change.
6. **Contracts are tested.** The ARM parameters are tested against Microsoft's templates, `infrastructure.yml` against its published schema, the environment file against a vendored copy of the deploy automation schema. Do not weaken a contract test to make a change pass.
7. Do not push, publish or deploy unless the owner asks.

## Layout

`src/model` project schema and store; `src/rules` validation; `src/exports` generated files; `src/imports` Surveyor and project import; `src/asbuilt` as-built compare; `src/screens` UI; `tests` unit, contract and browser tests; `docs` user and reference documentation.
