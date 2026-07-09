# Hummingbird OS Adoption Provisioning Decisions

Date: 2026-07-09
Status: Active defaults for setup planning
Owner: Jamie
Source report: `_ops/planning/research/feasibility-reports/os-adoption/2026-07-09-hummingbird-workspace-provisioning-feasibility.md`

## Context

Hummingbird is the consumer product/workspace adoption of the working
Agent-Native/Jami Studio codebase. The owner clarified that this is not a
request to test whether upstream installs work. The codebase is treated as
working. Planning should follow official docs/source, install it to its full
extent, provision it, connect it, and verify the installed system during the
provisioning phase.

## Decisions

### Full Workspace Is The Primary Hummingbird Shape

Hummingbird will be planned as the full multi-app workspace/product repo, not a
per-app-only fleet and not a framework fork.

Default primary repo:

```text
C:\Users\james\orgs\oss\hummingbird
```

The primary workspace includes Dispatch as the control plane and every visible
first-party template.

### All First-Party Apps Are In Scope For Setup

Workspace setup includes these visible/core templates:

```text
analytics
assets
brain
calendar
chat
clips
content
design
dispatch
forms
mail
plan
slides
```

The hidden `macros` template is included explicitly through the official
`--template` path because hidden templates are still scaffoldable.

### Coding UI Is Included As An Existing Capability

The Agent-Native Code surface is included as an existing CLI/Desktop/shared UI
capability. The old hidden `code` template is not part of the install surface.
A browser-hosted Code UI requires mounting `@agent-native/code-agents-ui` inside
a normal app with a host implementation and is therefore future product
development unless the owner explicitly promotes it into setup.

### Standalone Installs Use Official Standalone Output

Each app/template will also be installed through the official standalone flow.
Because official standalone scaffolds initialize their target as a Git root, the
default topology is sibling standalone install directories cataloged from
Hummingbird, not nested standalone directories inside the Hummingbird Git repo.

Hummingbird will carry a manifest documenting each standalone path, template,
package version, and verification evidence.

### Setup Roadmap Excludes Additional Product Development

The provisioning roadmap must not include:

- Voice/video/avatar feature work.
- App renaming or branding redesign.
- Sidebar/category redesign.
- Provider replacement builds.
- Publishing namespace takeover.
- SaaS launch work.

Those are future product-development tracks after the full official product
surface is installed and used.

### Verification Is A Provisioning Exit Criterion, Not Skepticism

No install tests were run during planning. During provisioning, confirmed calls
and tests should verify that Hummingbird is connected and reachable. This proves
the installed Hummingbird environment, not whether upstream was valid.

### No-Cost Development Is Required

Use local/default behavior, approved subscriptions, partner credits, or BYOK
provider accounts. Any paid spend requires explicit owner approval.

### Secrets Stay Out Of Source

Secret values live only in gitignored env files, platform secret stores, or
Dispatch vault storage. Docs may reference env key names and provider labels but
must not include tokens, webhook URLs, private keys, or customer data.

### Source Sync Stays Manual Early

Source sync stays manual until the intake process and Hummingbird deviation
catalog are boring and reliable. Every intentional product deviation from
upstream must be recorded with impact and future upstream acceptance guidance.

## Deferred Creative Decisions

These do not block setup:

- Whether Hummingbird is public product name or internal codename.
- Whether Jami Studio remains the framework brand while Hummingbird becomes the
  commercial product.
- Final agent/personality/voice naming.
- Boardroom and persistent-agent visual identity.
- App renaming and workspace navigation taxonomy.
