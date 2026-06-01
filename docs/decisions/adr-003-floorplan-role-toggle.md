# ADR-003: MVP Role Toggle on FloorplanReview

**Date:** 2026-05-31  
**Status:** Implemented

## Context

The FloorplanReview page serves two distinct roles — designer (uploads, responds to revisions) and client (views, comments, approves, requests revisions). Without auth, both sets of actions were visible on the same page, which was confusing.

Options considered:
1. **Role toggle** — single page, toggle between Designer / Client view
2. **Split routes** — `/review/designer` and `/review/client`
3. **Leave mixed** — accept all actions visible, document role-gating as future work

## Decision

Option 1 — role toggle on the FloorplanReview page, defaulting to Designer.

**Reasons:**
- No auth yet; keeps the flow easy to demo
- Avoids creating extra routes prematurely
- Makes the role distinction explicit and visible
- Simple to replace with real auth later — swap `useState` for a role derived from the auth session

## Consequences

- Toggle labelled "MVP demo — replaces auth in production" to make the temporary nature clear
- When Supabase Auth is added, the `role` state becomes `useAuthRole()` and the toggle is removed
- Designer view: upload panel, revision banner; no approve/reject
- Client view: approve + request revision; no upload
