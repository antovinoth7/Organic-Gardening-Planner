import { SeasonRegionProfile } from "../types/database.types";

export type ExpandedSeason =
  | "summer"
  | "southwest_monsoon"
  | "northeast_monsoon"
  | "cool_dry";

export type LegacySeason = "summer" | "monsoon" | "winter";

export type GardeningSeason = ExpandedSeason | LegacySeason;

type SeasonCalendar = Record<number, GardeningSeason>;

const TAMIL_NADU_CALENDAR: SeasonCalendar = {
  1: "cool_dry",
  2: "cool_dry",
  3: "summer",
  4: "summer",
  5: "summer",
  6: "southwest_monsoon",
  7: "southwest_monsoon",
  8: "southwest_monsoon",
  9: "southwest_monsoon",
  10: "northeast_monsoon",
  11: "northeast_monsoon",
  12: "northeast_monsoon",
};

const LEGACY_SOUTH_ASIA_CALENDAR: SeasonCalendar = {
  1: "winter",
  2: "winter",
  3: "summer",
  4: "summer",
  5: "summer",
  6: "monsoon",
  7: "monsoon",
  8: "monsoon",
  9: "monsoon",
  10: "winter",
  11: "winter",
  12: "winter",
};

const CALENDARS: Record<SeasonRegionProfile, SeasonCalendar> = {
  tamil_nadu: TAMIL_NADU_CALENDAR,
  legacy_south_asia: LEGACY_SOUTH_ASIA_CALENDAR,
};

interface CurrentSeasonOptions {
  date?: Date;
  profile?: SeasonRegionProfile;
}

/**
 * Get current season based on the selected regional profile.
 * Defaults to the legacy profile for backward compatibility.
 */
export function getCurrentSeason(
  options?: CurrentSeasonOptions
): GardeningSeason {
  const month = (options?.date ?? new Date()).getMonth() + 1;
  const profile = options?.profile ?? "legacy_south_asia";
  const calendar = CALENDARS[profile] ?? LEGACY_SOUTH_ASIA_CALENDAR;

  return calendar[month] ?? "winter";
}
