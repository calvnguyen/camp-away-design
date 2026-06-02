# Projects Workflow

Projects are **only** for custom design workflows. A project is created when no rental inventory matches the client's requirements, or when the client explicitly requests a custom concept.

Projects should feel like a **workflow/collaboration system** — not an inventory marketplace. The client, designer, and admin collaborate through intake, concept generation, floorplan review, and approval.

## When Projects Are Created

A project is created when:
- No rental match exists after inventory check
- Client explicitly requests a custom concept from the rental listing
- Admin converts a rental inquiry into a project

Projects are **never** created for standard rental bookings. See [rentals-workflow.md](rentals-workflow.md) for the inventory-first matching flow.

## Project Statuses

| Status | Meaning |
|---|---|
| `draft` | Brief started, not yet submitted |
| `intake_submitted` | Brief submitted, awaiting concept decision |
| `awaiting_concept` | Brief submitted, no concept generated yet |
| `concept_generated` | AI concept layout generated, awaiting architect review |
| `under_architect_review` | Assigned firm is actively designing |
| `floorplan_uploaded` | Designer uploaded a floorplan version |
| `client_review_pending` | Floorplan ready for client review |
| `revision_requested` | Client requested changes to current floorplan |
| `approved` | Client approved the current floorplan |
| `final_design_in_progress` | Production build underway |
| `completed` | Project fully completed |
| `cancelled` | Project cancelled at any stage |

## Project Lifecycle

```
[Client] Submit intake brief
  → draft → intake_submitted

[Admin] Assigns firm / triggers concept
  → awaiting_concept → concept_generated

[Admin] Assigns designer firm
  → under_architect_review

[Designer] Uploads floorplan
  → floorplan_uploaded → client_review_pending

[Client] Reviews floorplan
  → approved (done) OR revision_requested (loop back)

[Revision loop]
  revision_requested → under_architect_review → floorplan_uploaded → client_review_pending

[Admin] Confirms production build
  → final_design_in_progress → completed
```

## Role Capabilities

| Action | Client | Designer | Admin |
|---|---|---|---|
| Submit intake brief | ✅ | ❌ | ✅ |
| View project status | ✅ | ✅ | ✅ |
| Generate concept layout | ❌ | ❌ | ✅ |
| Upload floorplan | ❌ | ✅ | ✅ |
| Leave comments | ✅ | ✅ | ✅ |
| Approve floorplan | ✅ | ❌ | ❌ |
| Request revisions | ✅ | ❌ | ❌ |
| Assign designer firm | ❌ | ❌ | ✅ |
| Cancel project | ❌ | ❌ | ✅ |
| Mark completed | ❌ | ❌ | ✅ |

## AI Concept Generation

When a brief has no equivalent standard build, the system can generate a rough 2D concept layout as a starting point. The layout must be **approved** before the project proceeds to production — that approval is the gate.

See [concept-layout.md](concept-layout.md) for generator implementation details.

## Custom Concept Pricing

| Concept Type | Estimated Price |
|---|---|
| Basic AI Concept Layout | $199 |
| Advanced Concept Package | $499 |
| Premium Custom Concept Study | $999+ |

These are design consultation estimates, not full trailer production pricing.

## Custom Build Base Pricing

| Trailer Size | Estimated Base Build Price |
|---|---|
| Small | Starting at $35,000 |
| Medium | Starting at $50,000 |
| Large | Starting at $75,000 |

## Optional Upgrades (Custom Builds)

| Upgrade | Est. Price |
|---|---|
| Solar Package | +$4,000 |
| Off-Grid Battery System | +$6,000 |
| Premium Interior Finish | +$5,000 |
| Expanded Storage Package | +$2,500 |
| Roof-Top Tent | +$2,500 |
| Roof Rack / Outdoor Package | +$1,500 |
| Custom Exterior Wrap | +$3,000 |

**Pricing disclaimer (required on all pricing surfaces):**
> Pricing shown is estimate-only for demo purposes. Final pricing determined after admin or designer review.

## Floorplan Review

See [floorplan-review.md](floorplan-review.md) for upload formats, version history, and repository methods.

## Technical Notes

- Projects stored via `ProjectRepository` interface (`src/data/types.ts`)
- Status transitions validated in the repository layer, not components
- `src/lib/projectStatus.ts` is the single source of truth for status labels and badge styles
- Domain types in `src/types/index.ts`
- Concept layout geometry in `src/lib/conceptLayout.ts`
