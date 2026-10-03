# Chohan Release Gates

This runbook separates reversible verification from production actions. Do not run the production steps until the target environment, database backup policy and deployment owner are confirmed.

## 1. Preflight

- Confirm the ToplineShop backend and the corporate Site use the same tenant slug: `chohan-industries`.
- Confirm `NEXT_PUBLIC_API_URL` points to the deployed ToplineShop API for the admin and public content reads.
- Confirm the backend has `STORAGE_ADAPTER` set to `local` for a single-host pilot or `s3` for production object storage.
- For S3-compatible storage, confirm bucket, region/endpoint and credentials are present in the deployment secret store. Never commit them to `.env` or source control.
- Obtain a database backup and identify the rollback owner before applying the migration.

## 2. Verification already available

- Frontend production build: `NEXT_DIST_DIR=.next-verify npm run build`.
- Frontend tests: `npm test -- --run`.
- Backend typecheck: `npx tsc --noEmit --incremental false` from `backend`.
- Chohan governance tests: `npm test -- --runInBand src/chohan-content/chohan-content.spec.ts` from `backend`.
- Prisma validation: `npm run prisma:validate` from `backend`.

## 3. Production database gate

After backup and approval, deploy the reviewed migration:

```text
cd backend
npx prisma migrate deploy
npx prisma generate
```

The migration adds only Chohan corporate content tables. It does not import, copy or query the Pakistan trade-data records.

## 4. Smoke tests

1. `GET /chohan-content/public/chohan-industries` returns published config, gallery and events only.
2. `GET /chohan-content/media/:tenantId/:id` serves an active approved image with its stored MIME type and tenant scope.
3. An authenticated editor can save a draft but cannot publish it.
4. A reviewer can publish a submitted revision and publish approved gallery/event records.
5. An unauthenticated request cannot write content or media.
6. The public Site loads without an API response containing raw trade records.

## 5. Release order

1. Deploy backend and verify health/authentication.
2. Apply the Chohan migration.
3. Configure object storage and verify one non-sensitive image upload/read cycle.
4. Deploy the frontend with `NEXT_PUBLIC_API_URL` set.
5. Publish the reviewed static corporate pages, including Gallery and Events.
6. Perform desktop/mobile/accessibility smoke checks.

## 6. Rollback boundaries

- Content rollback uses the revision endpoint and does not rewrite immutable history.
- A failed frontend release can be reverted to the previous static artifact.
- A failed backend release should be rolled back through the deployment system after preserving logs.
- Do not roll back the database by deleting Chohan tables. Use the migration system and database backup owner.
