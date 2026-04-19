# Domain Logic

The app is intentionally tailored to Kanyakumari / South Tamil Nadu gardening conditions. Preserve this regional logic unless a change is explicitly requested.

## Agro-Climatic Zone System

Season logic, watering multipliers, and pest alerts are parameterized by zone config rather than hardcoded.

- **Zone definitions**: `src/config/zones/` — each zone exports an `AgroClimaticZone` object.
- **Default zone**: `HIGH_RAINFALL_ZONE` (Kanyakumari). All existing functions default to this zone for backward compatibility.
- **Zone registry**: `src/config/zones/index.ts` — `getZoneById(id)`, `getZoneByDistrict(district)`, `DEFAULT_ZONE`.
- **Consumer pattern**: Functions in `seasonHelpers.ts` accept an optional `zone?: AgroClimaticZone` param. Pass explicitly when the user's zone is known; omit to use the default.
- **Adding a new zone**: Create a new file in `src/config/zones/`, register it in `src/config/zones/index.ts`.

### Season Model

`HIGH_RAINFALL_ZONE` (default) uses a four-season model: `summer`, `sw_monsoon`, `ne_monsoon`, `cool_dry`.

---

## Plant Helpers

`src/utils/plantHelpers.ts` contains important domain behavior for:
- Expected harvest dates
- Companion planting
- Pest and disease suggestions
- Coconut age-based care guidance
- Coconut nutrient deficiency guidance

`src/utils/plantCareDefaults.ts` provides:
- Plant care profiles
- Pruning techniques
- Static pruning defaults

---

## Season Helpers

`src/utils/seasonHelpers.ts` functions accept an optional `zone?: AgroClimaticZone` param. They default to `DEFAULT_ZONE` for backward compatibility.

Watering frequencies, seasonal pest alerts, and reminders are all zone-aware.
