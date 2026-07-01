# House Design Studio (Phase 1)

Turn a plain-language description — or a photo, sketch, or handwritten note — into
a parametric 3D BIM house model, run a **council of expert reviewers** in a
self-revising loop, and produce a **PE-review-ready** documentation package with
drawings, IFC/STEP exports, and a full audit trail.

> **This app cannot issue a Professional Engineer stamp.** No software can. It
> produces documentation formatted for a licensed PE (and, where required, a
> licensed Architect) to review and seal. A human professional must independently
> verify every assumption before anything is built. See the disclaimer in every
> generated report.

This is an independent app living under `house_design_studio/`. It shares no code
with the PeakHinge shelter workflow elsewhere in this repository.

## How it works

```
brief (text/images)
   │  translator (Claude)            → Design Intent (versioned JSON, the contract)
   ▼
 ┌──────────────── revision loop (max 5 iterations) ────────────────┐
 │  build (FreeCAD Arch/BIM)         → GeometryFacts                 │
 │  deterministic checks             → clashes, egress, spans, …     │
 │  council of 6 experts (Claude)    → structured findings           │
 │  synthesis (Claude)               → one prioritized action list   │
 │  stop if no high/medium items OR cap reached; else propose+apply  │
 │  a targeted patch and repeat (every revision saved to disk)       │
 └──────────────────────────────────────────────────────────────────┘
   ▼
 deliverables: TechDraw sheets (plan/elevations/section/roof), IFC + STEP,
 and the "Design Basis & PE-Review Package" (Markdown).
```

The six expert perspectives are **Architect**, **Structural / PE-perspective
Engineer**, **Designer / Artist** (which absorbs the "sculptor" viewpoint),
**Natural Building Expert**, **Permaculture / Homestead-Farm Expert**, and
**Project Manager** — condensed from the nine professions in the original brief
to keep Phase 1 tractable.

## Quick start

```bash
python -m venv .venv
. .venv/bin/activate           # Windows: .venv\Scripts\activate
pip install -r house_design_studio/requirements.txt
cp house_design_studio/.env.example house_design_studio/.env   # then edit it
./house_design_studio/run.sh   # Windows: house_design_studio\run.bat
```

Open <http://localhost:8000>, type a description (or click **Use built-in
sample**), and press **Run design**.

### Two things you need for a full run

1. **FreeCAD 1.0+** installed locally (for the real BIM model and drawings). If
   `FreeCADCmd` is not on your `PATH`, set `HDS_FREECAD_CMD` to its full path.
2. **`ANTHROPIC_API_KEY`** in your environment (for the translator and the
   expert council). Get one at <https://console.anthropic.com/>.

### Running without them (offline demo)

- `HDS_DEV_MODE_SKIP_FREECAD=1` — derive geometry in pure Python instead of
  FreeCAD. Drawings/IFC/STEP are marked "skipped" in the results.
- `HDS_DEV_MODE_MOCK_CLAUDE=1` — use scripted AI responses so the whole pipeline
  runs with **no API key**. The council raises no concerns, so the run converges
  on the automated checks alone. Good for demos and CI.

## Testing

```bash
cd house_design_studio && python -m pytest
```

The automated suite covers everything that does not need FreeCAD or an API key:
schema validation, all deterministic checks, patch application, the revision-loop
control flow (with mocked stages), synthesis, report generation (including that
the PE disclaimer is always present), the job store, image prep, and an offline
end-to-end run through the API. The parts that need a real FreeCAD + API key are
verified by hand — see [`tests/manual/FREECAD_MANUAL_TEST_PLAN.md`](tests/manual/FREECAD_MANUAL_TEST_PLAN.md).

## Phase 1 scope, and what's next

**Phase 1 (this):** a single-story house on a rectangular footprint; gable or
shed roof; slab-on-grade foundation; six-role council; heuristic (rule-of-thumb,
non-code) structural and habitability checks. The Design Intent schema can
*express* more than the builder implements (multi-story, L-shapes, hip roofs,
basements); those are accepted by the schema but rejected with a clear error by
the builder, keeping the contract forward-compatible.

**Phase 2+ roadmap:** multi-story; arbitrary footprints; jurisdiction-specific
code databases; real engineering load calculations; MEP design; cost estimating;
and optional photorealistic rendering / IFC-native authoring (e.g. Blender +
Bonsai) alongside FreeCAD.

## Layout

| Path | Responsibility |
| --- | --- |
| `design_intent/` | The Design Intent schema (the core contract), validator, versioning |
| `translator/` | Brief (text + images) → Design Intent, via Claude |
| `bim_builder/` | `geometry_facts.py` (FreeCAD-free contract), `runner.py` (host-side), and the FreeCAD-side `build_house.py` / `techdraw_sheets.py` / `exporters.py` |
| `checks/` | Deterministic geometry + heuristic checks over GeometryFacts |
| `council/` | Six expert personas, per-role critique, fan-out |
| `synthesis/` | Reconcile council findings into one prioritized list |
| `revision/` | Patch apply, proposer, the loop `orchestrator.py`, job storage |
| `reporting/` | The PE-review package, the disclaimer, the artifact manifest |
| `backend/` | FastAPI app, config, job manager, routes |
| `frontend/` | Single-page vanilla UI |
| `llm/` | Injectable Anthropic client + scripted test double |
