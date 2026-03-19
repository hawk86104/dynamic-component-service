---
name: tvt-dc-service
description: Build or modify a dynamic component in this dynamic-component-service repository. Use when working on a single component or component capability here and you need to follow the repo's OpenSpec workflow, tresjs/three implementation style, dcsConfig registration, shader file layout, preview-layer constraints, and validation conventions.
---

# tvtDCService

## Overview

Use this skill to add, evolve, or polish a component in this repository without re-discovering the project conventions each time.
Keep the work aligned with the repo constitution: component logic lives in `src/components`, shader sources live in `src/shader/<component-name>/`, public preview pages stay generic, and component registration happens through `src/dcsConfig.ts`.

## Workflow

### 1. Build context first

Read these files before making assumptions:

* `openspec/config.yaml`
* `src/dcsConfig.ts`
* the target component file if it already exists
* nearby components in `src/components/` that use similar tresjs / three patterns

If the request is more than a tiny tweak, use the local OpenSpec skills and workflow instead of jumping straight to code.

### 2. Keep implementation in the right layer

Default component implementation rules:

* Prefer tresjs / three semantics over DOM or CSS solutions for component visuals
* Put component code in `src/components/`
* Put shader code in `src/shader/<component-name>/`
* Split shader code into vertex and fragment files
* Keep `src/views/previewEntry.vue` and `src/views/templateComponet.vue` unchanged unless there is a real infrastructure-level reason

Do not add component-specific preview logic into the generic preview views when `src/dcsConfig.ts` can handle it.

### 3. Register the component properly

When a component is intended to be previewed and published through this service, sync all three layers:

* component props and defaults in the Vue component
* `default` values in `src/dcsConfig.ts`
* `config` panel schema in `src/dcsConfig.ts`

If you add a new prop but forget to expose it in `dcsConfig.ts`, the component is not really integrated into the service.

### 4. Treat OpenSpec as the change contract

For feature work, use OpenSpec as the source of truth:

* proposal: why this change exists
* design: architectural or implementation choices
* spec: behavior and requirements
* tasks: execution checklist

During implementation:

* read the OpenSpec context files first
* implement task by task
* mark completed tasks in the change's `tasks.md`
* if implementation teaches a reusable lesson, update the project rules as well as the current change

### 5. Validate at the right level

Use this validation order:

* build the project with `npm run build`
* lint the changed files directly when global lint debt is known
* run broader lint if practical
* test dev/serve only when sandbox or environment permits local ports

Be explicit when a failure is caused by repo-wide debt or sandbox limits rather than the current component change.

## Checklist

Before calling the task done, confirm all of the following:

* the component works with the repo's tresjs / three style
* shader files are externalized under `src/shader/<component-name>/`
* `src/dcsConfig.ts` contains usable defaults and config-panel controls
* generic preview view files were not modified unless truly necessary
* OpenSpec artifacts remain aligned with the final implementation
* validation status is clearly reported

## Typical Requests

Requests that should trigger this skill:

* "Help me add a new dynamic component to this repo"
* "Implement a new tresjs component with shader support here"
* "Adjust the default config for an existing component in dynamic-component-service"
* "Use OpenSpec to add a component feature in this repository"
