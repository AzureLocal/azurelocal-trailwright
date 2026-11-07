# Changelog

All notable changes to Azure Local Trailwright are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Schema 5.1 questions: how each machine's management port gets its address before deployment (`networking.management.ip_assignment`: static, recommended, DHCP with a reservation, or already configured), and, with simplified provisioning, each machine's Arc machine name (`nodes[].arc_machine_name`, default the host name, checked against the Arc naming rule and for duplicates). The vendored schema, its generated types and the example fixtures follow the toolkit's 5.1 schema.
- Landing page: the app now opens on a page that says what Trailwright is and who it is for, how it works, the exports (listed from the export registry), where it fits between Surveyor and the build automation, the release it plans against (from `CURRENT_RELEASE`) and links to the documentation. From it you start a new design, open a saved project or a Surveyor plan, or explore the example; a design in progress gets a **Continue** link back to the step you last had open, and replacing it asks first and offers to save a copy.

### Changed
- Azure Local family branding: the Azure Local Trailwright icon (SVG, favicon.ico, PNG 32, 180, 192 and 512, web manifest) is the favicon and the logo in the landing page header and the application sidebar, the page carries a description and Open Graph tags, the landing footer reads "Copyright © Hybrid Cloud Solutions & AzureLocal", and the README has the family banner and badges.
- The site address is now https://azurelocal.cloud/azurelocal-trailwright/ (the old labs.hybridsolutions.cloud address is gone); the published schema `$id` moves with it.
- The project steps sit behind the landing page: `/` is the landing page, each step keeps its own path (`#/project`, `#/storage` and so on), and an unknown path goes to the landing page. The sidebar title links back to the landing page.
- The management MAC question says it is the management port that provisioning targets, and reports a MAC used by two machines. The `use_dhcp` question now says it is the deployment's ARM `useDhcp`, not how the port gets its address.
- Integrated the pending dependency updates, including React 19 with matching DOM and type packages, Tailwind CSS 4 with its PostCSS plugin and explicit configuration, ESLint 10 with compatible hooks tooling, jsdom 30, Node type definitions and the pinned setup-node action.
- Updated the React element type annotation for React 19 and regenerated the npm lockfile after reconciling the dependency branches.

## [1.0.0] - 2026-10-15

First complete release. Plans against Azure Local 12.2609 (latest).

### Added
- Published JSON Schema (2020-12) for `infrastructure.yml` at `/schema/infrastructure.schema.json`, a field reference (`docs/INFRASTRUCTURE-YML.md`) and a contract test that fails the build when the exporter and the schema drift apart.
- Environment file (deploy automation) export: the cluster-facts subset of the deploy automation's `environment.yml`, with `CHANGE-ME` placeholders and TODO comments for what a design cannot know. Contract-tested against a vendored copy of that schema (`docs/ENVIRONMENT-FILE.md`).
- Terraform variables export (`terraform.tfvars.json`) for the deploy automation's cluster-deploy Terraform root.
- As-built compare: load an `as-built-snapshot.v1` file (for example from Azure Local Ranger) and see match, drift, missing and not-captured rows, with CSV and Markdown export (`docs/AS-BUILT.md`).
- Nested two-way mirror volumes for two-server clusters, including the Surveyor import mapping.
- Optional release build field; exports never guess the full build.
- Rules AZ-005 (deployment prefix, 1 to 8 characters), REL-001, and a stricter AZ-002 (machine name character set). `docs/RULES.md` is generated from the rule registry and a test keeps it current.
- Notes warning (do not type secrets) on the Project step and a notice in the project JSON export.
- LICENSE, CHANGELOG, CONTRIBUTING, AGENTS.md, repo-intent.md, Dependabot configuration and `npm run lint`.

### Changed
- Excel schedules are written by a small built-in writer (fflate) instead of the SheetJS `xlsx` package, which has known vulnerabilities and no fix on npm. Cell values are unchanged (golden-file test).
- Dependencies updated (jsPDF 4, jspdf-autotable 5, Vite, Vitest).
- Heavy libraries (PDF export) load on demand, which splits the large bundle chunk.
- The Playwright web server timeout is 180 seconds.
- `docs/REBUILD.md` replaced by `docs/HISTORY.md`.

### Removed
- The unused screen placeholder component.
