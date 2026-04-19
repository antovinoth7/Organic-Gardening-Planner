/**
 * Asset map for bundled pest & disease reference images.
 *
 * React Native requires static `require()` calls — every image must be
 * explicitly listed here. When adding a new WebP image:
 *
 * 1. Drop the file into `assets/reference/pests/` or `assets/reference/diseases/`
 *    (filename = entry ID, e.g. `aphids.webp`, `powdery_mildew.webp`)
 * 2. Uncomment (or add) the corresponding line in the map below.
 * 3. The detail screen picks it up automatically — no other changes needed.
 *
 * Recommended: ≤ 50 KB per image, 400×300 WebP, transparent or white background.
 */

import type { ImageSource } from "expo-image";

// ─── Pest images ─────────────────────────────────────────────────────────────

const PEST_IMAGES: Record<string, ImageSource> = {
  // Sap-Sucking
  // aphids: require("../../assets/reference/pests/aphids.webp"),
  // mealybugs: require("../../assets/reference/pests/mealybugs.webp"),
  // whiteflies: require("../../assets/reference/pests/whiteflies.webp"),
  // scale_insects: require("../../assets/reference/pests/scale_insects.webp"),
  // thrips: require("../../assets/reference/pests/thrips.webp"),
  // jassids: require("../../assets/reference/pests/jassids.webp"),
  // leafhoppers: require("../../assets/reference/pests/leafhoppers.webp"),
  // psylla: require("../../assets/reference/pests/psylla.webp"),
  // coconut_bug: require("../../assets/reference/pests/coconut_bug.webp"),
  // lace_bug: require("../../assets/reference/pests/lace_bug.webp"),
  // plant_hoppers: require("../../assets/reference/pests/plant_hoppers.webp"),

  // Mites
  // spider_mites: require("../../assets/reference/pests/spider_mites.webp"),
  // red_mites: require("../../assets/reference/pests/red_mites.webp"),
  // eriophyid_mites: require("../../assets/reference/pests/eriophyid_mites.webp"),
  // broad_mites: require("../../assets/reference/pests/broad_mites.webp"),

  // Borers & Larvae
  // fruit_borers: require("../../assets/reference/pests/fruit_borers.webp"),
  // stem_borers: require("../../assets/reference/pests/stem_borers.webp"),
  // shoot_borers: require("../../assets/reference/pests/shoot_borers.webp"),
  // pod_borers: require("../../assets/reference/pests/pod_borers.webp"),
  // leaf_miners: require("../../assets/reference/pests/leaf_miners.webp"),
  // leaf_rollers: require("../../assets/reference/pests/leaf_rollers.webp"),
  // budworms: require("../../assets/reference/pests/budworms.webp"),
  // caterpillars: require("../../assets/reference/pests/caterpillars.webp"),
  // cutworms: require("../../assets/reference/pests/cutworms.webp"),
  // rhinoceros_beetle_larva: require("../../assets/reference/pests/rhinoceros_beetle_larva.webp"),
  // red_palm_weevil_larva: require("../../assets/reference/pests/red_palm_weevil_larva.webp"),
  // coconut_black_headed_caterpillar: require("../../assets/reference/pests/coconut_black_headed_caterpillar.webp"),
  // root_grubs: require("../../assets/reference/pests/root_grubs.webp"),

  // Beetles & Weevils
  // flea_beetles: require("../../assets/reference/pests/flea_beetles.webp"),
  // rhinoceros_beetle: require("../../assets/reference/pests/rhinoceros_beetle.webp"),
  // red_palm_weevil: require("../../assets/reference/pests/red_palm_weevil.webp"),
  // bruchid_beetles: require("../../assets/reference/pests/bruchid_beetles.webp"),

  // Other
  // nematodes: require("../../assets/reference/pests/nematodes.webp"),
  // fruit_flies: require("../../assets/reference/pests/fruit_flies.webp"),
  // snails_slugs: require("../../assets/reference/pests/snails_slugs.webp"),
  // termites: require("../../assets/reference/pests/termites.webp"),
};

// ─── Disease images ──────────────────────────────────────────────────────────

const DISEASE_IMAGES: Record<string, ImageSource> = {
  // Fungal
  // powdery_mildew: require("../../assets/reference/diseases/powdery_mildew.webp"),
  // anthracnose: require("../../assets/reference/diseases/anthracnose.webp"),
  // leaf_spot: require("../../assets/reference/diseases/leaf_spot.webp"),
  // cercospora_leaf_spot: require("../../assets/reference/diseases/cercospora_leaf_spot.webp"),
  // sigatoka_leaf_spot: require("../../assets/reference/diseases/sigatoka_leaf_spot.webp"),
  // root_rot: require("../../assets/reference/diseases/root_rot.webp"),
  // rhizome_rot: require("../../assets/reference/diseases/rhizome_rot.webp"),
  // stem_rot: require("../../assets/reference/diseases/stem_rot.webp"),
  // damping_off: require("../../assets/reference/diseases/damping_off.webp"),
  // rust: require("../../assets/reference/diseases/rust.webp"),
  // bud_rot: require("../../assets/reference/diseases/bud_rot.webp"),
  // early_blight: require("../../assets/reference/diseases/early_blight.webp"),
  // late_blight: require("../../assets/reference/diseases/late_blight.webp"),
  // phomopsis_blight: require("../../assets/reference/diseases/phomopsis_blight.webp"),
  // leaf_blight: require("../../assets/reference/diseases/leaf_blight.webp"),
  // dieback: require("../../assets/reference/diseases/dieback.webp"),
  // gummosis: require("../../assets/reference/diseases/gummosis.webp"),
  // sooty_mold: require("../../assets/reference/diseases/sooty_mold.webp"),
  // stem_bleeding: require("../../assets/reference/diseases/stem_bleeding.webp"),
  // canker: require("../../assets/reference/diseases/canker.webp"),

  // Bacterial
  // bacterial_wilt: require("../../assets/reference/diseases/bacterial_wilt.webp"),
  // bacterial_blight: require("../../assets/reference/diseases/bacterial_blight.webp"),
  // wilt: require("../../assets/reference/diseases/wilt.webp"),
  // citrus_canker: require("../../assets/reference/diseases/citrus_canker.webp"),
  // panama_wilt: require("../../assets/reference/diseases/panama_wilt.webp"),
  // thanjavur_wilt: require("../../assets/reference/diseases/thanjavur_wilt.webp"),
  // root_wilt: require("../../assets/reference/diseases/root_wilt.webp"),

  // Viral
  // mosaic_virus: require("../../assets/reference/diseases/mosaic_virus.webp"),
  // leaf_curl_virus: require("../../assets/reference/diseases/leaf_curl_virus.webp"),
  // yellow_vein_mosaic_virus: require("../../assets/reference/diseases/yellow_vein_mosaic_virus.webp"),
  // cassava_mosaic_disease: require("../../assets/reference/diseases/cassava_mosaic_disease.webp"),
  // bunchy_top_virus: require("../../assets/reference/diseases/bunchy_top_virus.webp"),
  // papaya_ringspot_virus: require("../../assets/reference/diseases/papaya_ringspot_virus.webp"),
  // greening_disease: require("../../assets/reference/diseases/greening_disease.webp"),
  // little_leaf_disease: require("../../assets/reference/diseases/little_leaf_disease.webp"),

  // Physiological
  // nut_fall: require("../../assets/reference/diseases/nut_fall.webp"),
};

// ─── Lookup helpers ──────────────────────────────────────────────────────────

/**
 * Returns the bundled image for a pest, or undefined if none exists.
 * Uses `imageAsset` if set, otherwise falls back to the pest's `id`.
 */
export function getPestImage(
  id: string,
  imageAsset?: string,
): ImageSource | undefined {
  return PEST_IMAGES[imageAsset ?? id];
}

/**
 * Returns the bundled image for a disease, or undefined if none exists.
 * Uses `imageAsset` if set, otherwise falls back to the disease's `id`.
 */
export function getDiseaseImage(
  id: string,
  imageAsset?: string,
): ImageSource | undefined {
  return DISEASE_IMAGES[imageAsset ?? id];
}
