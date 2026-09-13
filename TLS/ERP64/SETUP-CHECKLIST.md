# ERP64 Setup Checklist

Use this checklist in order. A checked item must have evidence in the named system; planning documents alone do not authorize implementation.

## 1. Preserve Stage A

- [x] Keep ToplineShop P0-P10 and Phase 8 governance unchanged.
- [x] Store ERP64 material as planning documentation under `TLS/ERP64/`.
- [ ] Complete the active ToplineShop foundation and record Foundation v1 freeze.

## 2. Owner Decisions

- [ ] Resolve `E:\ToplineShop` versus `F:\OpenCode\ToplineShop` as the canonical laptop path.
- [ ] Confirm ERP64 name, domain ownership, and trademark suitability before public use.
- [ ] Approve the ERP64 platform contract task `ERP64-PLATFORM-00`.
- [ ] Authorize GitHub publication when the current registry permits a push.

## 3. Laptop and Team

- [ ] Keep one canonical repository; do not create a second application repository yet.
- [ ] Give each developer an authorized clone or worktree and one assigned task ID.
- [ ] Keep datasets, credentials, logs, exports, and analytical storage outside Git.
- [ ] Give each team a module charter, allowed paths, prohibited paths, acceptance criteria, and WDR location.

## 4. ChatGPT App

- [x] Create one `ERP64` sidebar section for organization.
- [ ] Keep one main governance task as the decision authority.
- [ ] Create `ERP64 Platform Architecture` only when `ERP64-PLATFORM-00` is approved.
- [ ] Create a module task only when that module enters discovery or implementation.
- [ ] Link final WDR and decisions back to main governance, then archive completed execution tasks.

## 5. GitHub

- [x] Prepare the governance package on a local documentation branch.
- [x] Configure the verified Git identity `zamzamabiz@gmail.com` for this repository.
- [ ] Confirm stable branch policy and protection after Foundation v1 freeze.
- [ ] Add required reviews and checks before parallel development.
- [ ] Publish this planning branch only after registry and owner approval.
- [ ] Create implementation branches only from an approved baseline and task.

## 6. First Stage B Work

- [ ] Complete and approve `ERP64-PLATFORM-00`.
- [ ] Create the Trade Intelligence module charter from the template.
- [ ] Run `ERP64-DR-MP01` under #FDD and freeze its approved frontend.
- [ ] Run the bounded one-file pilot `ERP64-DR-MP02`.
- [ ] Measure, audit, and decide whether to proceed to multi-file scale.

## Feature Timing

Draft portfolio capability maps for every planned module now. Draft detailed workflows and MVP features only when a module enters discovery. Draft exact implementation tasks only after its frontend is visually approved and frozen.
