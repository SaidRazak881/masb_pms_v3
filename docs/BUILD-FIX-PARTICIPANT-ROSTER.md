# Build Fix: Participant Roster Week Field

The participant roster model uses `week_label` as the persisted field. Any edit UI must use `week_label`; do not introduce a separate `week` property.

## Required UI mapping

- Display: `row.week_label`
- Form field: `week_label`
- Save payload: `week_label`

## Verification

After applying this mapping to the participant roster edit page, run the normal CI/build pipeline and verify that no `ParticipantRoster` reference uses `row.week`.
