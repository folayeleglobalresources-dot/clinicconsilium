# Interactive Maps, Geolocation and Location-Based Healthcare Search

Status: PLANNED core feature (not built). Map provider NOT yet selected.
Note: a MapLibre/OpenFreeMap decision exists in a different project (Vintage Trade Global). It was not made for ClinicConsilium and must not be assumed here.

## Intended uses
1. Hospitals and clinics: interactive map with addresses and available services.
2. Healthcare professionals: locate verified doctors and specialists by location.
3. Pharmacies: registered, verified pharmacy locations.
4. Medicine availability: pharmacies reporting availability and where they are. FUTURE only; medicine sourcing is deferred in Phase 0.
5. Directions and navigation to a selected hospital, clinic, pharmacy or provider.
6. Location-based search: by city, state or distance, with filters.
7. International care: hospitals and treatment providers outside Nigeria (later phase).

## Requirements
- Integrated into the site and the relevant dashboards, not decorative.
- Only approved and verified facilities, professionals and pharmacies appear as verified listings (depends on Phase 1 verification).
- Location sharing is permission-based; no tracking without consent. Prefer typed city/state search over device location by default.
- Nigeria first; data model and provider must allow other African countries.
- Provider selection happens during technical planning, comparing cost, African/Nigerian coverage, reliability, privacy, scalability and terms of use.

## Data model hints (for later migrations)
Add latitude, longitude, address, state/region, country and a geocoding-status field to `facilities`, `professionals` (practice location only, never home address) and `pharmacies`. Store only what a listing needs.

## Phase fit
Phase 1 (verified directories) is the earliest point for hospital/professional/pharmacy maps; medicine-availability maps wait for Phase 3; international maps for Phase 4.
