# Floorplan Review

## Flow

1. Client submits a brief → project status: `intake_submitted`
2. Admin assigns a firm → status: `under_architect_review`
3. **Designer uploads a floorplan** (PDF or image) → new version created, status stays `under_architect_review`
4. Client reviews, comments, and either:
   - **Approves** → status: `approved` — project can go to production
   - **Requests revisions** → status: `revision_requested`
5. Designer uploads a revised version → loop back to step 4

## Roles

| Action | Designer | Client |
|---|---|---|
| Upload new floorplan version | ✅ | ❌ |
| View current floorplan | ✅ | ✅ |
| Leave comments | ✅ | ✅ |
| Approve floorplan | ❌ | ✅ |
| Request revisions | ❌ | ✅ |

## MVP role toggle

Auth is not implemented in the MVP. The FloorplanReview page has a **"View as: Designer / Client"** toggle in the page header to simulate both roles for demo purposes.

- Defaults to **Designer** view on load
- Toggle is labelled "MVP demo — replaces auth in production"
- When auth is added (Supabase Auth), replace the toggle with real role-based gating

## File upload

- **Accepted formats:** PDF, PNG, JPG
- **Max size:** 20 MB
- **In-memory storage:** `URL.createObjectURL(file)` — object URLs do not persist across page refresh
- **Production:** upload to Supabase Storage, store the path/URL on the `Floorplan` row
- Each upload creates a new version; previous `current` version is marked `superseded`
- The version label is editable before confirming upload

## Reusable component

`src/components/FloorplanUpload.tsx` — self-contained, accepts `onUpload(file, label)`. Can be moved to a dedicated designer/admin dashboard later without changes.

## Repository methods

- `uploadFloorplan(projectId, file, uploadedBy, label)` → creates new version, supersedes old current, advances status if still in intake
- `approveCurrentFloorplan(projectId)` → status → `approved`
- `requestRevision(projectId)` → status → `revision_requested`
