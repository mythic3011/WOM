# Venue Layout: Validation, Numbering, and UI Plan

## Scope

- Extend `Venue.layout` to support aisles, numbering, per-row override, and reserve `globalAisles`.
- Define strict Joi schema (structure) and semantic validation (business rules) with consistent error shapes.
- Specify `SeatNumberingSystem` interface for labeling/skip logic and preview.
- Outline desktop-first UI Tabs with Tailwind structure and progressive disclosure.

## Joi Schema: Fields and Rules

- `layout`: object
  - `sections`: array[min 1]
    - `name`: string[min 2, max 100, required]
    - `tier`: string[max 30]
    - `rows`: integer[min 1, max 200, required]
    - `seatsPerRow`: integer[min 1, max 200, required]
    - `startRow`: string[1–3 letters, uppercase normalized]
    - `seatNumbering`: object
      - `globalDirection`: enum['L_TO_R','R_TO_L'] (default 'L_TO_R')
      - `startNumber`: int[min 1, max 500] (default 1)
      - `prefix`: string[max 5]
      - `suffix`: string[max 5]
      - `skipNumbers`: array[int[min 1, max 500]] unique
      - `skipSeatIndices`: array[int[min 0]] each < `seatsPerRow`
    - `aisles`: array of
      - `type`: enum['vertical','horizontal']
      - `mode`: enum['afterSeat','afterRow'] (vertical→afterSeat, horizontal→afterRow)
      - `position`: int[min 0] (< `seatsPerRow` for afterSeat; < `rows` for afterRow)
      - `width`: number[min 0.5, max 10]
      - `label`: string[max 8]
      - Uniqueness: `mode+position` unique within section
    - `rowsConfig`: array of
      - `rowLabel`: string (must exist within derived labels; unique)
      - `direction`: enum['L_TO_R','R_TO_L']
      - `startNumber`: int[min 1, max 500]
      - `prefix`: string[max 5]
      - `suffix`: string[max 5]
      - `skipNumbers`: array[int[min 1, max 500]] unique
      - `skipSeatIndices`: array[int[min 0]] each < `seatsPerRow`
      - `paddingStart`: number[min 0, max 20] (default 0)
      - `paddingEnd`: number[min 0, max 20] (default 0)
      - `emptySeatIndices`: array[int[min 0]] each < `seatsPerRow`
      - Conflict: `skipSeatIndices` ∩ `emptySeatIndices` = ∅
  - `globalAisles`: array (reserved; same shape as `aisles`, default [])

Notes

- Use Joi `when` to bind `type`↔`mode`; `array().unique()` for duplicates.
- Use regex for `startRow` like `/^[A-Z]{1,3}$/i` then uppercase.
- Complex rules via service semantic validation, not Joi (see below).

## Semantic Validation Flow (Service Layer)

- Entry: `venueService.createVenue|updateVenue` → `validateLayoutSemantics(layout, capacity?)` before persistence.
- Steps
  - Normalize: default arrays, uppercase `startRow`, derive `rowLabels`.
  - Section checks: aisle `type/mode` match; `position` bounds; `mode+position` uniqueness; section name uniqueness.
  - Row checks: `rowLabel` in range and unique; index bounds for `skipSeatIndices`/`emptySeatIndices`; non-overlap; `skipNumbers` in range; forbid fully empty or fully skipped rows; detect duplicate labels under overrides.
  - Global: compute `derivedCapacity`; if `capacity` provided and `< derived` → error.
  - Output: `{ valid, errors[], warnings[], normalizedLayout, metrics: { derivedCapacity } }`.
  - If `!valid` throw `ValidationError` (status 422) with `errors[]`.

## Error Message Templates

- Envelope
  - `success: false`
  - `message: 'Validation failed' | 'Semantic validation failed'`
  - `code: 'VENUE_LAYOUT_INVALID'` (optional)
  - `errors: ErrorItem[]`
- ErrorItem
  - `field: string` (e.g., `layout.sections[1].aisles[2].position`)
  - `code: string` (e.g., `AISLE_POSITION_OUT_OF_RANGE`)
  - `message: string`
  - `hint?: string`
  - `path?: (string|number)[]`
  - `value?: any`
  - `context?: object` (e.g., `{ limit: 18, mode: 'afterSeat' }`)
  - `severity?: 'error'|'warning'`
- Status Codes
  - 422: Joi or semantic validation (with `errors[]`)
  - 400: Business rules (non-field)
  - 404/409/429: As existing patterns

## SeatNumberingSystem Interface (No Implementation)

- `configure(sectionConfig): ConfigRef`
- `getSectionMeta(sectionIndex): { rows, seatsPerRow, startRow, seatNumbering }`
- `computeRowLabel(sectionIndex, rowIndex): string` (A..Z, AA..)
- `getRowOverride(sectionIndex, rowLabel): RowOverride|null`
- `computeSeatLabel(sectionIndex, rowIndex, seatIndex): string`
- `shouldSkipNumber(sectionIndex, rowIndex, seatNumber): boolean`
- `shouldSkipIndex(sectionIndex, rowIndex, seatIndex): boolean`
- `isSeatEmpty(sectionIndex, rowIndex, seatIndex): boolean`
- `enumerateRow(sectionIndex, rowIndex): Array<{ seatIndex, label, skipped, empty, effectiveIndex }>`
- `buildIndexMap(sectionIndex): IndexMap`
- `computeEffectiveCapacity(sectionIndex): number`
- `invertDirectionIfNeeded(rowMeta): IndexTransform`
- `exportDebugSnapshot(): { sections: [...], rows: [...snapshot] }`
- `validateInternal(): { valid: boolean, errors: string[] }`

## UI Tabs (Desktop-first, Tailwind)

- Aisles
  - Fields: type, mode(derived), position, width, label; add/remove; sorted by position.
  - Validations: duplicate slot highlight, bounds red border.
- Numbering (Global)
  - Fields: globalDirection, startNumber, prefix/suffix, skipNumbers (tag, supports ranges like `13-15`), skipSeatIndices.
  - Preview: first row labels with skip markers; invalid tags styled.
- Per-row Override
  - Left list: all `rowLabel` with override badges; select to edit.
  - Core: direction, startNumber, prefix/suffix.
  - Advanced: skipNumbers/skipSeatIndices, paddingStart/paddingEnd, emptySeatIndices.
  - UX: hover row highlights preview; immediate update and inline errors.
- Containers (classes)
  - Outer: `flex flex-col gap-6`
  - Card: `bg-white border rounded-lg p-4 space-y-4`
  - Tabs: `flex border-b`, tab: `px-4 py-2 text-sm font-medium hover:bg-gray-100 data-[active=true]:border-b-2 data-[active=true]:border-indigo-600`
  - Inputs: `border rounded-md px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500`
  - Tags: `flex flex-wrap gap-2 bg-gray-50 p-2 rounded-md`; tag: `inline-flex items-center bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded`
  - Preview: `relative bg-slate-50 border rounded-lg p-4 h-64 overflow-auto`; controls: `absolute top-3 right-3 flex flex-col gap-2`

## OpenAPI Alignment

- Add components
  - `ErrorBase`, `ErrorItem`, `ValidationError422`, `NotFound404`, `Conflict409`, `TooManyRequests429`.
- Update Venue endpoints to include 422 with `errors[]` examples for Joi and semantic failures.

## Implementation Notes

- Keep Joi for structure; service for semantics (`external()` optional but avoid over-coupling schema).
- Normalize defaults in service; never rely on frontend for derived values.
- Warnings are non-blocking; still return 200/201 but surface in response `meta` (optional follow-up).

## Next Steps

1. Add error classes at `backend/src/utils/errors.js` (`ValidationError`, `NotFoundError`, `ConflictError`).
2. Extend `venueSchemas.create|update` with nested `layout` schema (structure only).
3. Implement `validateLayoutSemantics` in `venueService` and call before create/update.
4. Update `errorHandler` to include `errors` when present and respect custom `statusCode`.
5. Add basic unit tests for semantic validator snapshots and edge cases.
