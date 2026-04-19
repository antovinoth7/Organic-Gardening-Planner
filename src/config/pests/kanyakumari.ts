/**
 * Pest reference data for the Kanyakumari / High Rainfall agro-climatic zone.
 *
 * Consolidates existing scattered data from plantHelpers.ts
 * (PEST_CATEGORY_MAP, ORGANIC_TREATMENTS, TREATMENT_DETAILS,
 * TAMIL_NADU_COMMON_PESTS_DISEASES, TAMIL_NADU_CROP_SPECIFIC_ISSUES)
 * into structured PestEntry objects for the reference screens.
 */

import type { PestEntry } from "@/types/database.types";

export const KANYAKUMARI_PESTS: PestEntry[] = [
  // ── Sap-Sucking ──────────────────────────────────────────────────────────
  {
    id: "aphids",
    name: "Aphids",
    tamilName: "அசுவினி",
    category: "sap_sucking",
    emoji: "🪰",
    identification:
      "Tiny soft-bodied insects (1–3 mm), green/black/yellow. Cluster on tender shoots, underside of leaves, and flower buds. Secrete sticky honeydew.",
    damageDescription:
      "Suck plant sap causing leaf curling, stunted growth, and yellowing. Honeydew promotes sooty mold. Can transmit viral diseases.",
    organicPrevention: [
      "Encourage natural predators (ladybirds, lacewings)",
      "Avoid excessive nitrogen fertilisation",
      "Interplant with repellent herbs (basil, coriander)",
    ],
    organicTreatments: [
      {
        name: "Neem oil spray (2–3 ml/L)",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 2–3 ml cold-pressed neem oil with 1 L water and a few drops of liquid soap as emulsifier. Shake well. Spray thoroughly on leaf undersides and growing tips.",
        frequency: "Every 5–7 days until infestation clears",
        timing: "Dusk or early morning to avoid leaf burn and protect pollinators",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Avoid spraying open flowers to protect pollinators.",
      },
      {
        name: "Soapnut water spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Soak 10–12 soapnut (reetha) shells in 1 L warm water overnight. Strain and dilute 1:3 with water before spraying on affected areas.",
        frequency: "Every 3–5 days",
        timing: "Early morning or evening",
        safetyNotes:
          "Test on a few leaves first — can cause phytotoxicity on sensitive plants at high concentration.",
      },
      {
        name: "Garlic-chili spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Blend 10 garlic cloves and 5 dried chilies in 1 L water. Strain through fine cloth. Dilute 1:10 with water before spraying.",
        frequency: "Every 5–7 days",
        timing: "Evening — UV breaks down active compounds quickly in direct sun",
        safetyNotes:
          "Wear gloves and avoid touching eyes. Strain thoroughly to prevent nozzle blockage.",
      },
      {
        name: "Lady beetle release",
        method: "biocontrol",
        effort: "advanced",
        howToApply:
          "Release purchased Coccinella septempunctata beetles at dusk near aphid colonies — 10–20 beetles per plant. Mist plants lightly before release.",
        frequency: "Single release; repeat if population resurges",
        timing: "Dusk to prevent beetles flying away",
        safetyNotes:
          "Avoid pesticide sprays for 2 weeks before and after release to protect the biocontrol agents.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate", ne_monsoon: "moderate", cool_dry: "low" },
    plantsAffected: ["Chilli", "Brinjal", "Ladies Finger", "Papaya", "Banana", "Jasmine", "Drumstick"],
  },
  {
    id: "whiteflies",
    name: "Whiteflies",
    tamilName: "வெள்ளை ஈ",
    category: "sap_sucking",
    emoji: "🪰",
    identification:
      "Tiny white moth-like insects (1–2 mm) that fly up in clouds when disturbed. Found on leaf undersides.",
    damageDescription:
      "Suck sap causing yellowing, leaf drop. Excrete honeydew leading to sooty mold. Vector for viral diseases (leaf curl, mosaic).",
    organicPrevention: [
      "Yellow sticky traps as early warning",
      "Avoid monoculture — diversify plantings",
      "Remove and destroy severely infested leaves",
    ],
    organicTreatments: [
      {
        name: "Yellow sticky traps",
        method: "trap",
        effort: "easy",
        howToApply:
          "Hang yellow sticky cards at plant canopy height, 1 trap per 2 m². Replace when fully covered with insects.",
        frequency: "Check weekly; replace every 2–4 weeks",
        timing: "Install at first sign of infestation or as a preventive measure",
        safetyNotes:
          "Keep out of reach of children. Avoid placing directly next to flowering plants to reduce accidental trapping of beneficial insects.",
      },
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 1 ml liquid soap per litre of water. Spray leaf undersides where whiteflies congregate. Ensure complete coverage.",
        frequency: "Every 5–7 days for 3 consecutive applications",
        timing: "Dusk or early morning",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Avoid spraying during open bloom to protect pollinators.",
      },
      {
        name: "Soapnut solution",
        method: "spray",
        effort: "easy",
        howToApply:
          "Soak 10 soapnut shells in 1 L water overnight, strain. Dilute 1:3 with water. Spray directly onto whitefly colonies on leaf undersides.",
        frequency: "Every 3–5 days",
        timing: "Morning or evening",
        safetyNotes:
          "Test on a small leaf area first — can cause phytotoxicity on sensitive plants at high concentration.",
      },
      {
        name: "Garlic extract spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Blend 10 garlic cloves in 500 ml water, strain well. Dilute 1:10 with water before use. Spray on leaf undersides.",
        frequency: "Every 5–7 days",
        timing: "Evening",
        safetyNotes:
          "Strong odour — avoid contact with eyes. Wash hands thoroughly after handling.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate", ne_monsoon: "moderate", cool_dry: "low" },
    plantsAffected: ["Tomato", "Chilli", "Brinjal", "Ladies Finger", "Papaya", "Tapioca"],
  },
  {
    id: "spiralling_whitefly",
    name: "Spiralling Whitefly",
    tamilName: "சுருள் வெள்ளை ஈ",
    category: "sap_sucking",
    emoji: "🪰",
    identification:
      "Larger than common whitefly. Lays eggs in spiral patterns on leaf undersides. White waxy coating on leaves.",
    damageDescription:
      "Heavy sap loss, copious honeydew, dense sooty mold reducing photosynthesis. Affects many fruit and ornamental trees.",
    organicPrevention: [
      "Monitor undersides of leaves regularly",
      "Encourage Encarsia parasitoid naturally",
    ],
    organicTreatments: [
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3–5 ml neem oil + 1 ml liquid soap per litre. Spray both leaf surfaces thoroughly, paying attention to spiral egg masses on undersides.",
        frequency: "Every 7 days for 3–4 applications",
        timing: "Dusk or early morning",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Repeat after rain as neem degrades rapidly in water.",
      },
      {
        name: "Release Encarsia parasitoid",
        method: "biocontrol",
        effort: "advanced",
        howToApply:
          "Obtain Encarsia formosa cards from biocontrol suppliers. Hang 1 card per 10 plants in a shaded area near the infestation, following supplier instructions.",
        frequency: "Two releases 1–2 weeks apart",
        timing: "During warm weather above 20°C when whitefly populations are building",
        safetyNotes:
          "Do not use any pesticides for 3 weeks around the release period. Keep cards out of direct sunlight.",
      },
      {
        name: "Yellow sticky traps",
        method: "trap",
        effort: "easy",
        howToApply:
          "Hang yellow sticky cards at canopy height, 1 per 2–3 m². Replace when covered.",
        frequency: "Check weekly; replace every 2–4 weeks",
        timing: "Install as a preventive before heavy infestation builds",
        safetyNotes:
          "Primarily for monitoring population levels. Avoid placing near flowering plants.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate" },
    plantsAffected: ["Tapioca", "Guava", "Coconut"],
  },
  {
    id: "mealybugs",
    name: "Mealybugs",
    tamilName: "மாவுப்பூச்சி",
    category: "sap_sucking",
    emoji: "🪰",
    identification:
      "Soft oval insects (2–5 mm) covered with white waxy coating. Cluster at nodes, leaf axils, and fruit bases.",
    damageDescription:
      "Suck sap causing wilting, yellowing, and honeydew/sooty mold. Heavy infestations can kill young plants.",
    organicPrevention: [
      "Inspect new plants before introducing to garden",
      "Maintain plant health to resist infestations",
      "Encourage natural enemies (Cryptolaemus beetle)",
    ],
    organicTreatments: [
      {
        name: "Neem oil + soap spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 2 ml liquid soap per litre water. Spray directly on mealybug colonies, especially in leaf axils and nodes. Use a brush to dislodge dense clusters first.",
        frequency: "Every 5–7 days for 4–5 applications",
        timing: "Morning or evening",
        safetyNotes:
          "Mealybugs hide in crevices — be thorough. Waxy coating resists sprays, so multiple applications are essential.",
      },
      {
        name: "Isopropyl alcohol swab",
        method: "spray",
        effort: "easy",
        howToApply:
          "Dab a cotton swab in 70% isopropyl alcohol. Touch each mealybug cluster directly to dissolve the wax and kill on contact. Best for small, accessible infestations.",
        frequency: "As needed when visible colonies appear",
        timing: "Any time",
        safetyNotes:
          "Test on a small area first — some plants are sensitive to alcohol. Do not spray alcohol directly on edible parts close to harvest.",
      },
      {
        name: "Release lacewings",
        method: "biocontrol",
        effort: "advanced",
        howToApply:
          "Release green lacewing (Chrysoperla carnea) eggs or early-stage larvae near mealybug colonies — 5–10 per infested plant, placed at dusk.",
        frequency: "Single release; repeat after 3 weeks if population remains high",
        timing: "Dusk, in temperatures between 20–30°C",
        safetyNotes:
          "Avoid all pesticide applications 2 weeks before and after release to protect lacewing larvae.",
      },
      {
        name: "Diatomaceous earth",
        method: "soil",
        effort: "easy",
        howToApply:
          "Dust food-grade diatomaceous earth (DE) lightly around the base of affected plants and along stems. Creates a physical barrier that damages the insects' waxy coating.",
        frequency: "Reapply after each rain event or every 1–2 weeks in dry weather",
        timing: "Any time; most effective in dry conditions",
        safetyNotes:
          "Wear a dust mask when applying — DE is a lung irritant. Use food-grade DE only. Avoid applying directly to open flowers.",
      },
    ],
    seasonalRisk: { summer: "high", cool_dry: "moderate" },
    plantsAffected: ["Guava", "Papaya", "Mango", "Tapioca"],
  },
  {
    id: "coconut_mealybug",
    name: "Coconut Mealybug",
    tamilName: "தென்னை மாவுப்பூச்சி",
    category: "sap_sucking",
    emoji: "🪰",
    identification:
      "White waxy masses on coconut fronds, especially at the base of leaflets and on the crown.",
    damageDescription:
      "Yellowing of fronds, reduced nut yield, sooty mold on leaves. Spreading rapidly in Tamil Nadu.",
    organicPrevention: [
      "Maintain clean crowns",
      "Monitor regularly for early detection",
    ],
    organicTreatments: [
      {
        name: "Release Cryptolaemus beetle",
        method: "biocontrol",
        effort: "advanced",
        howToApply:
          "Source Cryptolaemus montrouzieri beetles from biocontrol laboratories. Release 10–15 adults per tree near mealybug colonies in the crown.",
        frequency: "One release; monitor over 4–6 weeks for population reduction",
        timing: "Release in evening during warm weather (25–32°C)",
        safetyNotes:
          "No pesticide application 3 weeks before or after release. Larvae of Cryptolaemus resemble mealybugs — learn to distinguish before culling.",
      },
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3–5 ml neem oil per litre water with 1 ml liquid soap. Spray on frond bases and crown area where mealybugs congregate. Use a knapsack sprayer with a long lance for better reach.",
        frequency: "Every 7–10 days",
        timing: "Morning or evening",
        safetyNotes:
          "Wear protective clothing when spraying coconut crowns. Work systematically from the base of the palm upward.",
      },
      {
        name: "Soapnut solution",
        method: "spray",
        effort: "easy",
        howToApply:
          "Soak 10 soapnut shells in 1 L water overnight, strain. Dilute 1:3. Spray directly onto mealybug colonies on fronds.",
        frequency: "Every 5–7 days",
        timing: "Morning or evening",
        safetyNotes:
          "Test on a small frond section first. For severe infestations, combine with neem oil.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate", ne_monsoon: "moderate" },
    plantsAffected: ["Coconut"],
  },
  {
    id: "papaya_mealybug",
    name: "Papaya Mealybug",
    tamilName: "பப்பாளி மாவுப்பூச்சி",
    category: "sap_sucking",
    emoji: "🪰",
    identification:
      "Dense white waxy clusters on leaves, stems and fruit of papaya. Also attacks mulberry and tapioca.",
    damageDescription:
      "Curling and distortion of leaves, stunted growth, fruit drop. Can devastate entire papaya orchards.",
    organicPrevention: [
      "Quarantine new plants",
      "Encourage Acerophagus papayae parasitoid",
    ],
    organicTreatments: [
      {
        name: "Release Acerophagus papayae",
        method: "biocontrol",
        effort: "advanced",
        howToApply:
          "Obtain Acerophagus papayae parasitoid wasp cards from biocontrol laboratories. Release 50–100 adults per heavily infested tree near mealybug colonies.",
        frequency: "Two releases 2 weeks apart per season",
        timing: "Morning, when temperature is 25–32°C",
        safetyNotes:
          "Avoid all pesticides for 4 weeks before and after release. Mark treated trees to avoid accidental spraying.",
      },
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 2 ml liquid soap per litre water. Spray directly on colonies at leaf axils, stems and fruit surfaces. Use a brush to dislodge dense clusters before spraying.",
        frequency: "Every 5–7 days for 4–5 applications",
        timing: "Morning or evening",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Waxy mealybug coating reduces penetration — thorough application is critical.",
      },
      {
        name: "Soapnut spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Soak 10 soapnut shells in 1 L warm water overnight. Strain. Dilute 1:3. Spray directly on mealybug clusters.",
        frequency: "Every 5–7 days",
        timing: "Morning or evening",
        safetyNotes:
          "Test on a small leaf area first. Combine with neem oil spray for better efficacy.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate" },
    plantsAffected: ["Papaya"],
  },
  {
    id: "scale_insects",
    name: "Scale Insects",
    tamilName: "செதில் பூச்சி",
    category: "sap_sucking",
    emoji: "🪰",
    identification:
      "Small (1–5 mm) flat or domed insects with hard shell-like covering. Attach to stems, branches and leaves.",
    damageDescription:
      "Suck sap causing yellowing, dieback of branches. Honeydew and sooty mold. Hard to detect early.",
    organicPrevention: [
      "Regular inspection of woody stems",
      "Prune and destroy heavily infested branches",
    ],
    organicTreatments: [
      {
        name: "Neem oil + soap spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 5 ml neem oil + 2 ml liquid soap per litre water. Apply directly to scale-covered stems using a brush or fine-mist sprayer. Work solution under scales for penetration.",
        frequency: "Every 7 days for 3–4 weeks",
        timing: "Morning or evening",
        safetyNotes:
          "Scales have a hard protective coating — coverage and repetition are key. Dormant-season application (cool dry) is most effective.",
      },
      {
        name: "Manual removal with brush",
        method: "manual",
        effort: "easy",
        howToApply:
          "Dip an old toothbrush or stiff-bristle brush in soapy water. Scrub scale insects firmly off stems and branches, working in one direction.",
        frequency: "Weekly until controlled",
        timing: "Any time; follow up immediately with a neem oil spray",
        safetyNotes:
          "Dispose of removed scales away from the garden — do not compost. Wear gloves.",
      },
      {
        name: "Horticultural oil",
        method: "spray",
        effort: "easy",
        howToApply:
          "Dilute certified horticultural oil at 1–2% in water (follow product label). Spray thoroughly on all infested bark and stem surfaces — works by smothering the scales.",
        frequency: "Once during dormant season; repeat after 3 weeks if needed",
        timing: "Apply in the cooler part of the day. Do NOT apply above 30°C — risk of severe leaf burn.",
        safetyNotes:
          "Never apply to drought-stressed plants. Pre-harvest interval: 24 hours. Can affect beneficial insects when wet.",
      },
      {
        name: "Release parasitic wasps",
        method: "biocontrol",
        effort: "advanced",
        howToApply:
          "Obtain Metaphycus or Aphytis parasitoid wasps from biocontrol suppliers. Release near scale colonies following supplier instructions on quantity and placement.",
        frequency: "Single release per season is typically sufficient",
        timing: "When scale populations are building (summer or early monsoon)",
        safetyNotes:
          "No pesticide use for 4 weeks before or after release. Wasps are small and require a hand lens to observe.",
      },
    ],
    seasonalRisk: { summer: "high", cool_dry: "moderate" },
    plantsAffected: ["Guava", "Lemon", "Mango", "Coconut", "Tapioca"],
  },
  {
    id: "jassids",
    name: "Jassids",
    tamilName: "தத்துப்பூச்சி",
    category: "sap_sucking",
    emoji: "🪰",
    identification:
      "Small wedge-shaped leafhoppers (2–3 mm), green to yellowish. Hop sideways when disturbed.",
    damageDescription:
      "Feed on leaf undersides causing curling of leaf margins ('hopper burn'). Yellowing and drying of leaves.",
    organicPrevention: [
      "Avoid excess nitrogen",
      "Grow resistant varieties where available",
    ],
    organicTreatments: [
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on leaf undersides where jassids feed. Ensure thorough coverage.",
        frequency: "Every 5–7 days",
        timing: "Evening — jassids are more active in cooler hours",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Avoid bloom period to protect pollinators.",
      },
      {
        name: "Yellow sticky traps",
        method: "trap",
        effort: "easy",
        howToApply:
          "Hang yellow sticky cards at crop canopy height, 1–2 per 5 m². Replace when covered.",
        frequency: "Check weekly; replace every 2–3 weeks",
        timing: "Install at first sign of damage",
        safetyNotes:
          "Useful for monitoring population density and timing sprays. Keep away from flowering plants.",
      },
      {
        name: "Garlic-chili spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Blend 10 garlic cloves + 5 dried chilies in 1 L water. Strain. Dilute 1:10. Spray on leaf undersides.",
        frequency: "Every 5–7 days",
        timing: "Evening",
        safetyNotes:
          "Wear gloves. Avoid contact with eyes. Strain thoroughly to prevent nozzle blockage.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate" },
    plantsAffected: ["Ladies Finger", "Brinjal", "Cotton"],
  },
  {
    id: "thrips",
    name: "Thrips",
    tamilName: "இலைப்பேன்",
    category: "sap_sucking",
    emoji: "🪰",
    identification:
      "Tiny slender insects (1–2 mm), pale yellow to dark brown. Barely visible to the naked eye. Found in flowers and on leaf surfaces.",
    damageDescription:
      "Rasping-sucking damage causes silvery streaks on leaves, flower drop, deformed fruit. Vector for tospo viruses.",
    organicPrevention: [
      "Blue sticky traps for monitoring",
      "Mulch to reduce soil pupation",
      "Avoid monoculture",
    ],
    organicTreatments: [
      {
        name: "Blue sticky traps",
        method: "trap",
        effort: "easy",
        howToApply:
          "Hang blue sticky cards at flower or canopy height, 1–2 per 5 m². Thrips are strongly attracted to blue colour.",
        frequency: "Check weekly; replace every 2–3 weeks or when full",
        timing: "Install at first sign of damage or as a preventive",
        safetyNotes:
          "Place away from open flowers to reduce trapping of beneficial insects. Most effective for monitoring — combine with sprays for control.",
      },
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray into flowers and on leaf surfaces where thrips hide. Ensure spray reaches inside flowers.",
        frequency: "Every 5 days for 3–4 applications",
        timing: "Early morning when thrips are less active. Reapply after rain.",
        safetyNotes:
          "Thrips hide deep inside flowers — good penetration is essential. Pre-harvest interval: 24 hours.",
      },
      {
        name: "Spinosad (organic)",
        method: "spray",
        effort: "easy",
        howToApply:
          "Dilute certified organic spinosad at 0.1–0.2 ml per litre water. Spray foliage and flowers in the evening to minimise bee contact.",
        frequency: "Every 7 days; maximum 3 consecutive applications, then rotate to neem",
        timing: "Evening only — spinosad is toxic to bees when wet",
        safetyNotes:
          "Do not exceed 3 consecutive applications to prevent resistance developing. Pre-harvest interval: 1 day.",
      },
      {
        name: "Garlic extract",
        method: "spray",
        effort: "easy",
        howToApply:
          "Blend 10 garlic cloves in 500 ml water. Strain through fine cloth. Dilute 1:10. Spray on foliage and into flower buds.",
        frequency: "Every 5–7 days",
        timing: "Evening",
        safetyNotes:
          "Strain very finely to avoid blocking spray nozzle. Wear gloves — avoid eye contact.",
      },
    ],
    seasonalRisk: { summer: "high", cool_dry: "moderate" },
    plantsAffected: ["Chilli", "Jasmine", "Banana", "Drumstick"],
  },
  {
    id: "citrus_psylla",
    name: "Citrus Psylla",
    tamilName: "எலுமிச்சை சில்லிட்",
    category: "sap_sucking",
    emoji: "🪰",
    identification:
      "Small brownish jumping insect (3–4 mm). Nymphs produce white waxy threads. Found on new flush growth.",
    damageDescription:
      "Sucks sap from tender shoots. Vector for Citrus Greening Disease (Huanglongbing) which kills trees.",
    organicPrevention: [
      "Remove water sprouts that attract psylla",
      "Monitor new flush regularly",
    ],
    organicTreatments: [
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 1 ml liquid soap per litre water. Focus spray on new flush growth where nymphs concentrate. Cover all tender shoots thoroughly.",
        frequency: "Every 5–7 days during each flush emergence",
        timing: "Evening; treat each new flush as it appears — psylla colonises within days",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Critical to spray every new flush as it emerges, not just once.",
      },
      {
        name: "Yellow sticky traps",
        method: "trap",
        effort: "easy",
        howToApply:
          "Place yellow sticky cards within the tree canopy at new flush level, 2–3 per tree. Replace when covered.",
        frequency: "Replace every 2–3 weeks",
        timing: "Install before flush emergence as a monitoring tool",
        safetyNotes:
          "Used primarily for population monitoring to time neem sprays effectively.",
      },
      {
        name: "Remove affected shoots",
        method: "manual",
        effort: "easy",
        howToApply:
          "Prune out psylla-infested new flush shoots at their base. Destroy removed material immediately — do not compost. Clean pruning tools between cuts with dilute bleach.",
        frequency: "Weekly during flush periods",
        timing: "Any time; immediate removal prevents spread to remaining flush",
        safetyNotes:
          "Do not compost infested material — psylla can spread. Sanitise pruning tools between trees to prevent Citrus Greening transmission.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate" },
    plantsAffected: ["Lemon", "Lime", "Orange"],
  },
  {
    id: "mango_hopper",
    name: "Mango Hopper",
    tamilName: "மாம்பூத் தத்துப்பூச்சி",
    category: "sap_sucking",
    emoji: "🪰",
    identification:
      "Small wedge-shaped hoppers (3–5 mm), greenish-brown. Found in large numbers on flower panicles.",
    damageDescription:
      "Suck sap from flower panicles causing flower drop and poor fruit set. Honeydew leads to sooty mold on leaves.",
    organicPrevention: [
      "Prune trees to allow air circulation",
      "Avoid excess watering during flowering",
    ],
    organicTreatments: [
      {
        name: "Neem oil spray at flowering",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3–5 ml neem oil + 2 ml liquid soap per 1 L water. Spray on flower panicles covering all surfaces — both sides of the panicle stalk.",
        frequency: "2–3 sprays at 7-day intervals during panicle emergence and early flowering",
        timing: "Evening only — avoid daytime spraying during peak bloom to protect pollinators",
        safetyNotes:
          "Do not spray when flowers are fully open. Apply when panicles are 20–30% open. Over-spraying during peak bloom reduces fruit set.",
      },
      {
        name: "Sticky traps",
        method: "trap",
        effort: "easy",
        howToApply:
          "Place yellow sticky cards within the tree canopy near flower panicles, 4–6 per tree.",
        frequency: "Replace when full, approximately every 2 weeks",
        timing: "Install at panicle emergence",
        safetyNotes:
          "Remove traps once fruit have set to avoid trapping beneficial insects during the growing season.",
      },
      {
        name: "Garlic-chili spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Blend 10 garlic cloves + 5 dry chilies in 1 L water. Strain. Dilute 1:5. Spray on panicles and adjacent foliage.",
        frequency: "Every 5–7 days during panicle emergence",
        timing: "Evening",
        safetyNotes:
          "Avoid when flowers are fully open — strong odour may repel pollinators. Strain thoroughly before use.",
      },
    ],
    seasonalRisk: { cool_dry: "high", summer: "high" },
    plantsAffected: ["Mango"],
  },

  // ── Mites ────────────────────────────────────────────────────────────────
  {
    id: "mites",
    name: "Mites",
    tamilName: "சிறு பூச்சி",
    category: "mites",
    emoji: "🕷️",
    identification:
      "Microscopic arthropods (<1 mm). Cause fine webbing on leaf undersides. Barely visible without magnification.",
    damageDescription:
      "Stippling and bronzing of leaves, fine webbing, leaf drop in severe cases. Thrive in hot dry conditions.",
    organicPrevention: [
      "Maintain humidity around plants",
      "Spray water on leaf undersides regularly",
    ],
    organicTreatments: [
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3–5 ml neem oil + 1 ml liquid soap per litre water. Focus spray on leaf undersides where mites colonise. Ensure complete coverage of all webbing.",
        frequency: "Every 5 days for 3 applications",
        timing: "Morning or evening; avoid hot afternoon application above 30°C",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Resistance can develop — rotate with sulfur spray after 3 applications.",
      },
      {
        name: "Sulfur-based spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Dilute wettable sulfur powder at 2–3 g per litre of water. Spray leaf undersides thoroughly, ensuring all mite colonies are covered.",
        frequency: "Every 7 days; maximum 3 consecutive applications",
        timing: "Morning only. NEVER apply above 35°C — severe and irreversible leaf burn will result.",
        safetyNotes:
          "Do NOT apply within 2 weeks of any oil-based spray — sulfur combined with oil causes phytotoxicity. Wear gloves and mask as sulfur is an irritant.",
      },
      {
        name: "Predatory mite release",
        method: "biocontrol",
        effort: "advanced",
        howToApply:
          "Order Phytoseiid predatory mites (e.g. Neoseiulus californicus) from biocontrol suppliers. Release 50–100 per plant directly onto infested leaves.",
        frequency: "Single release; check effectiveness after 2 weeks",
        timing: "Cooler part of day when humidity is above 60%",
        safetyNotes:
          "No sulfur or acaricide use for 3 weeks before or after release. High temperatures above 35°C reduce predatory mite survival significantly.",
      },
      {
        name: "Strong water jet",
        method: "spray",
        effort: "easy",
        howToApply:
          "Use a garden hose with a strong nozzle to blast water forcefully on leaf undersides, dislodging mites and their webbing.",
        frequency: "Daily for 1 week to disrupt the mite lifecycle",
        timing: "Morning to allow foliage to dry before evening",
        safetyNotes:
          "Effective as a knockdown treatment — follow up with neem oil. Avoid on young seedlings as strong water pressure can damage tender growth.",
      },
    ],
    seasonalRisk: { summer: "high", cool_dry: "moderate" },
    plantsAffected: ["Chilli", "Brinjal", "Ladies Finger", "Papaya", "Jasmine"],
  },
  {
    id: "red_spider_mite",
    name: "Red Spider Mite",
    tamilName: "சிவப்பு சிலந்தி",
    category: "mites",
    emoji: "🕷️",
    identification:
      "Tiny reddish mites visible as moving dots under magnification. Dense webbing on leaf undersides.",
    damageDescription:
      "Severe stippling, bronzing and drying of leaves. Can defoliate plants in hot weather. Causes fruit scarring.",
    organicPrevention: [
      "Overhead irrigation to increase humidity",
      "Avoid dusty conditions near plants",
    ],
    organicTreatments: [
      {
        name: "Wettable sulfur spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Dissolve 3 g wettable sulfur per litre water. Spray thoroughly on both leaf surfaces, especially undersides where colonies are densest.",
        frequency: "Every 7–10 days for 2–3 applications",
        timing: "Morning only. NEVER spray above 32°C — risk of severe, irreversible leaf burn.",
        safetyNotes:
          "CRITICAL: Do NOT apply within 2 weeks of any oil spray. Do NOT apply above 32°C. Wear gloves, mask and eye protection — sulfur is a respiratory and skin irritant.",
      },
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3–5 ml neem oil + 1 ml liquid soap per litre water. Spray all leaf surfaces with particular focus on undersides. Ensure webbing is penetrated.",
        frequency: "Every 5 days for 3 applications",
        timing: "Morning or evening",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Rotate with sulfur spray to prevent resistance. Do not apply both simultaneously.",
      },
      {
        name: "Predatory mite release",
        method: "biocontrol",
        effort: "advanced",
        howToApply:
          "Release Phytoseiulus persimilis or Neoseiulus californicus at 50–100 per plant on infested leaves, following supplier instructions.",
        frequency: "Single release; reassess after 2 weeks",
        timing: "Cooler part of day, humidity above 60%",
        safetyNotes:
          "No sulfur or acaricide applications for 3 weeks before or after release. High heat (>35°C) kills predatory mites.",
      },
      {
        name: "Increase humidity",
        method: "cultural",
        effort: "easy",
        howToApply:
          "Mist foliage with water twice daily. Overhead irrigation or placing potted plants on trays with water also helps raise local humidity.",
        frequency: "Twice daily in dry or hot weather",
        timing: "Morning and late afternoon",
        safetyNotes:
          "Red spider mites thrive in dry conditions — humidity above 60% suppresses populations significantly. Ensure good air circulation to prevent fungal disease alongside misting.",
      },
    ],
    seasonalRisk: { summer: "high", cool_dry: "moderate" },
    plantsAffected: ["Tapioca", "Brinjal", "Tomato"],
  },
  {
    id: "eriophyid_mite",
    name: "Eriophyid Mite",
    tamilName: "எரியோபிட் சிறு பூச்சி",
    category: "mites",
    emoji: "🕷️",
    identification:
      "Microscopic elongated mites found on coconut perianth. Invisible to the naked eye. Diagnosed by nut scarring.",
    damageDescription:
      "Scarring and browning of coconut husk, reduced copra quality, button shedding. Causes coconut eriophyid mite disease.",
    organicPrevention: [
      "Maintain palm nutrition (especially boron)",
      "Remove and destroy heavily infested nuts",
    ],
    organicTreatments: [
      {
        name: "Neem oil + garlic spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 5 ml neem oil + 5 garlic cloves (finely ground) + 1 ml liquid soap per litre water. Filter well through fine cloth. Spray on developing nuts and crown area.",
        frequency: "Monthly during dry season (March–May)",
        timing: "Morning or evening",
        safetyNotes:
          "Coconut mites are located deep in the perianth area — use a knapsack sprayer with a long lance for better crown penetration. Wear protective clothing.",
      },
      {
        name: "Wettable sulfur",
        method: "spray",
        effort: "easy",
        howToApply:
          "Dissolve 3 g wettable sulfur per litre water. Spray on developing nut bunches focusing on perianth (base of nut).",
        frequency: "Every 15–20 days during dry summer months",
        timing: "Morning only. Do not spray above 32°C.",
        safetyNotes:
          "Do not apply within 2 weeks of oil sprays. Wear gloves and mask. Sulfur is most effective when temperature is between 20–28°C.",
      },
      {
        name: "Azadirachtin spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Use certified Azadirachtin 0.03% EC. Dilute as per label (typically 5 ml/L). Spray on developing nuts covering the perianth area thoroughly.",
        frequency: "Every 15–20 days during summer",
        timing: "Evening for best efficacy — Azadirachtin degrades rapidly in UV light",
        safetyNotes:
          "Pre-harvest interval: 3 days. Store in a cool, dark place. Apply in evening to maximise effectiveness.",
      },
      {
        name: "Root feeding neem cake",
        method: "soil",
        effort: "easy",
        howToApply:
          "Mix 2–3 kg neem cake per tree. Apply in a ring at the drip zone, incorporate into topsoil with a fork, then water thoroughly.",
        frequency: "Once per season, applied before the onset of monsoon",
        timing: "Pre-monsoon (May) for best root absorption with subsequent rains",
        safetyNotes:
          "Neem cake also improves soil nitrogen. Apply away from the stem base to prevent rot. Doubles as organic fertiliser.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate", ne_monsoon: "moderate" },
    plantsAffected: ["Coconut"],
  },
  {
    id: "coconut_mite",
    name: "Coconut Mite",
    tamilName: "தென்னை சிறு பூச்சி",
    category: "mites",
    emoji: "🕷️",
    identification:
      "Related to eriophyid mite. Feeds beneath the perianth of developing nuts. Diagnosed by brown scarring on nuts.",
    damageDescription:
      "Feeding causes brown necrotic patches on husk, stunted nuts, premature nut fall. Reduces copra yield.",
    organicPrevention: [
      "Regular crown cleaning",
      "Adequate nutrition and irrigation",
    ],
    organicTreatments: [
      {
        name: "Wettable sulfur spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Dissolve 3 g wettable sulfur per litre water. Spray on developing nut bunches targeting the perianth (base of each nut).",
        frequency: "Every 15 days during nut development in dry months",
        timing: "Morning only. Never apply above 32°C.",
        safetyNotes:
          "Do NOT apply within 2 weeks of any oil-based spray. Wear gloves and a dust mask during preparation and spraying.",
      },
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 5 ml neem oil + 2 ml liquid soap per litre water. Spray on nut bunches, particularly at the perianth (base of nut) where mites shelter.",
        frequency: "Every 15 days during nut development",
        timing: "Morning or evening",
        safetyNotes:
          "Use a high-pressure sprayer with long lance for adequate crown coverage. Wear protective clothing.",
      },
      {
        name: "Azadirachtin 1%",
        method: "spray",
        effort: "easy",
        howToApply:
          "Dilute Azadirachtin 1% EC at 1–2 ml per litre water. Spray thoroughly on nut bunches targeting the perianth area of each developing nut.",
        frequency: "Every 21 days during nut development",
        timing: "Evening — Azadirachtin degrades in UV light, evening application improves persistence",
        safetyNotes:
          "Pre-harvest interval: 3 days. Avoid spraying in rain. Store product in cool, dark place.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate" },
    plantsAffected: ["Coconut"],
  },

  // ── Borers & Larvae ──────────────────────────────────────────────────────
  {
    id: "fruit_borer",
    name: "Fruit Borer",
    tamilName: "காய்ப்புழு",
    category: "borers_larvae",
    emoji: "🐛",
    identification:
      "Green/brown caterpillar (15–40 mm) that bores into fruits. Entry holes with frass visible on fruit surface.",
    damageDescription:
      "Larvae bore into fruits causing internal feeding damage, fruit rot and drop. Major pest of tomato and brinjal.",
    organicPrevention: [
      "Erect pheromone traps early in season",
      "Remove and destroy infested fruits",
    ],
    organicTreatments: [
      {
        name: "Pheromone traps",
        method: "trap",
        effort: "moderate",
        howToApply:
          "Set up species-specific pheromone traps (Helicoverpa lure) at 1 trap per 1000 m². Hang at crop canopy height on a stake or wire.",
        frequency: "Change lures every 4–6 weeks; monitor and record catches weekly",
        timing: "Install 2 weeks before crop flowering to establish baseline counts",
        safetyNotes:
          "Mass trapping is most effective as a community-wide effort across neighbouring plots. High catch counts (>8 per trap per night) signal need for spray intervention.",
      },
      {
        name: "Neem seed kernel extract",
        method: "spray",
        effort: "easy",
        howToApply:
          "Soak 500 g crushed neem kernels overnight in 10 L water. Strain through fine cloth. Spray crop at 10 L per 100 m².",
        frequency: "Every 5–7 days from fruit set onwards",
        timing: "Evening — NSKE degrades rapidly in sunlight and loses efficacy within 12 hours of mixing",
        safetyNotes:
          "Prepare fresh on the day of use — loses efficacy after 24 hours. Strain thoroughly to avoid nozzle blockage.",
      },
      {
        name: "Bt spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 2 g Bacillus thuringiensis var. kurstaki (Bt) per litre water. Spray on fruit and foliage covering all surfaces, particularly fruit entry points.",
        frequency: "Every 5–7 days; reapply after rain as Bt is washed off",
        timing: "Evening — Bt protein degrades in UV light; evening application maximises residual activity",
        safetyNotes:
          "Bt is harmless to mammals, birds and bees — safe to use close to harvest. Effective only on young caterpillars before they bore into fruit. Must be ingested.",
      },
      {
        name: "Trichogramma egg cards",
        method: "biocontrol",
        effort: "advanced",
        howToApply:
          "Attach Trichogramma chilonis egg cards (1 card per 100 m²) to plant stakes inside the crop canopy. Place when cards are ready to hatch per supplier instructions.",
        frequency: "Weekly releases for 6–8 weeks during the crop season",
        timing: "Place cards in morning; avoid direct sunlight on cards",
        safetyNotes:
          "Keep cards moist and shaded until placement. Avoid insecticide use throughout the release period. Parasitoids attack the moth eggs before larvae hatch.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate", ne_monsoon: "moderate" },
    plantsAffected: ["Tomato", "Brinjal", "Chilli"],
  },
  {
    id: "fruit_and_shoot_borer",
    name: "Fruit and Shoot Borer",
    tamilName: "காய் தண்டுப்புழு",
    category: "borers_larvae",
    emoji: "🐛",
    identification:
      "Pink/white larva boring into tender shoots and fruits. Wilting of shoots with bore holes at tips.",
    damageDescription:
      "Bore into shoots causing wilting and dieback. Bore into fruits causing internal damage. Major pest of ladies finger.",
    organicPrevention: [
      "Remove and destroy infested shoots early",
      "Set up pheromone traps before flowering",
    ],
    organicTreatments: [
      {
        name: "Pheromone traps",
        method: "trap",
        effort: "moderate",
        howToApply:
          "Set up Earias vittella or Leucinodes orbonalis pheromone traps at 1 per 1000 m² at canopy height.",
        frequency: "Change lures every 4–6 weeks; inspect weekly",
        timing: "Install at planting time as both a monitoring and suppression tool",
        safetyNotes:
          "Remove and destroy wilted shoots immediately — do not leave infested material in the field.",
      },
      {
        name: "Neem seed kernel extract",
        method: "spray",
        effort: "easy",
        howToApply:
          "Soak 500 g crushed neem kernels overnight in 10 L water. Strain. Spray on shoots and developing fruits covering all surfaces.",
        frequency: "Every 5–7 days from first flowering",
        timing: "Evening — NSKE degrades rapidly in UV light",
        safetyNotes:
          "Prepare fresh daily — loses efficacy after 24 hours. Thorough coverage of shoot tips is essential.",
      },
      {
        name: "Bt spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 2 g Bt kurstaki per litre water. Spray onto shoot tips and developing fruits where young larvae feed before boring.",
        frequency: "Every 5–7 days; reapply after rain",
        timing: "Evening for maximum UV stability",
        safetyNotes:
          "Bt must be ingested by larvae — effective only on young caterpillars before boring. Safe for beneficial insects.",
      },
      {
        name: "Trap crops",
        method: "trap",
        effort: "moderate",
        howToApply:
          "Plant African marigold (Tagetes erecta) or castor as a border around the main crop to attract adult moths for egg-laying. Monitor trap crops weekly and destroy infested plants.",
        frequency: "Plant 2–3 weeks before main crop; destroy infested trap plants every 2 weeks",
        timing: "Establish trap crop before main crop is transplanted",
        safetyNotes:
          "Trap crops must be monitored rigorously and destroyed before pests can migrate back to the main crop — a neglected trap crop becomes a pest reservoir.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate" },
    plantsAffected: ["Ladies Finger", "Brinjal"],
  },
  {
    id: "shoot_and_fruit_borer",
    name: "Shoot and Fruit Borer",
    tamilName: "தண்டு காய்ப்புழு",
    category: "borers_larvae",
    emoji: "🐛",
    identification:
      "Similar to fruit and shoot borer. Larva bores into shoots first, then moves to fruits as they develop.",
    damageDescription:
      "Wilting of growing tips, bore holes in fruits with frass. Major yield loss in brinjal and okra.",
    organicPrevention: [
      "Clip and destroy affected shoots weekly",
      "Install pheromone traps at planting",
    ],
    organicTreatments: [
      {
        name: "Pheromone traps",
        method: "trap",
        effort: "moderate",
        howToApply:
          "Set up Leucinodes orbonalis pheromone traps at 1 per 1000 m² at crop canopy height.",
        frequency: "Change lures every 4–6 weeks; monitor catches weekly",
        timing: "Install at planting time and maintain throughout the season",
        safetyNotes:
          "High nightly catches (>5 moths per trap) indicate need for immediate Bt spray intervention.",
      },
      {
        name: "Bt spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 2 g Bt kurstaki per litre water. Spray onto shoot tips and fruits. Ensure coverage of areas where larvae enter.",
        frequency: "Every 5–7 days; reapply after rain",
        timing: "Evening for maximum UV stability",
        safetyNotes:
          "Safe for humans, birds and bees. Effective only on young larvae — act early before larvae bore into fruit.",
      },
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 1 ml liquid soap per litre. Spray on shoot tips and developing fruits thoroughly.",
        frequency: "Every 5–7 days",
        timing: "Evening or early morning",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Combine with Bt spray — use on alternate applications to broaden control.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate" },
    plantsAffected: ["Brinjal", "Ladies Finger"],
  },
  {
    id: "stem_borer",
    name: "Stem Borer",
    tamilName: "தண்டுத் துளைப்பான்",
    category: "borers_larvae",
    emoji: "🐛",
    identification:
      "Larva bores into stems and branches. Frass (sawdust-like excrement) at bore holes. Wilting of branches above entry.",
    damageDescription:
      "Tunnelling weakens stems, causes branch dieback. Can girdle and kill young trees. Bore holes allow fungal entry.",
    organicPrevention: [
      "Keep trees healthy with balanced nutrition",
      "Seal pruning cuts with Bordeaux paste",
    ],
    organicTreatments: [
      {
        name: "Inject neem oil into bore holes",
        method: "manual",
        effort: "advanced",
        howToApply:
          "Use a veterinary syringe to inject 2–3 ml of undiluted neem oil (or 10% neem oil solution) into each active bore hole where fresh frass is present. Seal the hole with clay immediately after injection.",
        frequency: "Single treatment per bore hole; reinspect after 2 weeks for new frass",
        timing: "Any time on discovery; act immediately on finding fresh frass",
        safetyNotes:
          "Identify all active bore holes by fresh frass presence before treating. Sealing multiple entry points traps larvae inside.",
      },
      {
        name: "Seal holes with mud",
        method: "manual",
        effort: "moderate",
        howToApply:
          "Mix clay or garden soil with a few drops of neem oil. Press the mixture firmly into each bore hole to seal it and deprive the larva of oxygen.",
        frequency: "Repeat if mud falls out or new frass appears alongside the seal",
        timing: "Any time",
        safetyNotes:
          "Most effective when combined with neem oil injection. Monitor sealed holes regularly for re-emergence of frass.",
      },
      {
        name: "Prune affected branches",
        method: "manual",
        effort: "moderate",
        howToApply:
          "Cut the affected branch 15–20 cm below the lowest visible bore hole. Destroy pruned material by burning — do not compost.",
        frequency: "As soon as wilting or dieback is first noticed",
        timing: "Any time; do not delay — larvae spread to adjacent wood",
        safetyNotes:
          "Seal all pruning cuts with Bordeaux paste (copper sulfate + lime) to prevent fungal infection. Do not leave pruned material lying near the tree.",
      },
    ],
    seasonalRisk: { sw_monsoon: "moderate", ne_monsoon: "moderate" },
    plantsAffected: ["Mango", "Guava", "Lemon"],
  },
  {
    id: "leaf_miner",
    name: "Leaf Miner",
    tamilName: "சுரங்கப்புழு",
    category: "borers_larvae",
    emoji: "🐛",
    identification:
      "Tiny larvae mine between leaf surfaces creating visible serpentine trails. Adults are small flies or moths.",
    damageDescription:
      "Serpentine mines reduce leaf area for photosynthesis. Severe infestations cause leaf drop and reduced vigour.",
    organicPrevention: [
      "Remove and destroy mined leaves",
      "Yellow sticky traps to catch adult flies",
    ],
    organicTreatments: [
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray leaf undersides and surfaces where adult flies lay eggs. Neem disrupts egg-laying behaviour.",
        frequency: "Every 5–7 days",
        timing: "Evening — UV rapidly degrades neem's active azadirachtin",
        safetyNotes:
          "Neem is most effective at preventing egg-laying, not killing established miners. Start treatment early at first sign of mines.",
      },
      {
        name: "Remove affected leaves",
        method: "manual",
        effort: "easy",
        howToApply:
          "Pick off leaves with visible serpentine mines. Place removed leaves in a sealed black plastic bag and leave in the sun for 2 days to kill larvae before disposal.",
        frequency: "Weekly removal throughout the infestation period",
        timing: "Any time",
        safetyNotes:
          "Do not compost mined leaves — larvae inside can survive composting. Most effective combined with yellow sticky traps for adults.",
      },
      {
        name: "Yellow sticky traps",
        method: "trap",
        effort: "easy",
        howToApply:
          "Hang yellow sticky cards at canopy height, 1–2 per 5 m², to catch adult leaf miner flies.",
        frequency: "Replace every 2–3 weeks or when covered",
        timing: "Install at first sign of damage",
        safetyNotes:
          "Primarily for monitoring adult fly populations. High adult catch helps time neem sprays during peak egg-laying.",
      },
      {
        name: "Spinosad spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Dilute certified organic spinosad at 0.1 ml per litre water. Spray foliage thoroughly — spinosad is systemic and reaches miners inside leaf tissue.",
        frequency: "Every 7 days; maximum 2–3 consecutive applications, then rotate to neem",
        timing: "Evening to minimise bee exposure",
        safetyNotes:
          "Rotate with neem to prevent resistance developing. Pre-harvest interval: 1 day. Toxic to bees when wet.",
      },
    ],
    seasonalRisk: { summer: "moderate", cool_dry: "moderate" },
    plantsAffected: ["Lemon", "Tomato", "Chilli"],
  },
  {
    id: "bud_worm",
    name: "Bud Worm",
    tamilName: "மொட்டுப்புழு",
    category: "borers_larvae",
    emoji: "🐛",
    identification:
      "Small caterpillar found inside flower buds. Causes bud drop and malformed flowers. Found in jasmine.",
    damageDescription:
      "Larvae feed inside flower buds causing bud drop, reducing flower yield significantly in jasmine.",
    organicPrevention: [
      "Collect and destroy fallen buds",
      "Monitor buds regularly during flowering season",
    ],
    organicTreatments: [
      {
        name: "Bt spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 2 g Bt kurstaki per litre water. Spray into flower buds and on stems where young larvae feed. Ensure spray penetrates into bud crevices.",
        frequency: "Every 5–7 days during the flowering season",
        timing: "Evening — Bt degrades in UV light, evening application maximises residual activity",
        safetyNotes:
          "Bt must be ingested by larvae to work — thorough bud coverage is critical. Safe for pollinators and humans.",
      },
      {
        name: "Neem oil",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on flower buds, stems and foliage covering all surfaces.",
        frequency: "Every 7 days",
        timing: "Evening or early morning",
        safetyNotes:
          "Avoid spraying fully open flowers. Neem disrupts larval feeding and egg-laying behaviour.",
      },
      {
        name: "Pheromone traps",
        method: "trap",
        effort: "moderate",
        howToApply:
          "Set up moth-specific pheromone traps (Maruca vitrata lure) at canopy height near jasmine plants.",
        frequency: "Change lures every 4 weeks; monitor weekly",
        timing: "Install at first sign of bud damage",
        safetyNotes:
          "Catch counts help time Bt sprays precisely for peak moth oviposition. Record catches to identify infestation patterns.",
      },
      {
        name: "Hand picking",
        method: "manual",
        effort: "easy",
        howToApply:
          "Inspect flower buds daily and hand-pick infested buds showing entry holes or caterpillar frass. Place removed buds in soapy water. Destroy immediately.",
        frequency: "Daily during the peak flowering and infestation period",
        timing: "Morning when larvae are less active and easier to locate inside buds",
        safetyNotes:
          "Combine hand-picking with Bt spray for best control. Wash hands after handling infested buds.",
      },
    ],
    seasonalRisk: { summer: "high", cool_dry: "moderate" },
    plantsAffected: ["Jasmine"],
  },
  {
    id: "bud_borer",
    name: "Bud Borer",
    tamilName: "மொட்டுத் துளைப்பான்",
    category: "borers_larvae",
    emoji: "🐛",
    identification:
      "Larva bores into vegetative and flower buds. Causes drying and death of growing tips.",
    damageDescription:
      "Tunnels into terminal buds causing die-back of shoots, reduced branching and delayed flowering.",
    organicPrevention: [
      "Maintain plant vigour",
      "Remove and destroy affected buds early",
    ],
    organicTreatments: [
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on terminal buds, shoot tips and surrounding foliage.",
        frequency: "Every 7 days during the active growing and flowering season",
        timing: "Evening or early morning",
        safetyNotes:
          "Remove and destroy visibly dead shoot tips before spraying to reduce pest load. Pre-harvest interval: 24 hours.",
      },
      {
        name: "Bt spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 2 g Bt kurstaki per litre water. Spray onto terminal buds and growing tips where larvae feed on entry.",
        frequency: "Every 5–7 days; reapply after rain",
        timing: "Evening for best UV stability",
        safetyNotes:
          "Effective on young larvae before boring begins. Safe for humans, birds and beneficial insects.",
      },
    ],
    seasonalRisk: { summer: "moderate" },
    plantsAffected: ["Jasmine", "Flower crops"],
  },
  {
    id: "caterpillar",
    name: "Caterpillar",
    tamilName: "புழு",
    category: "borers_larvae",
    emoji: "🐛",
    identification:
      "Various moth/butterfly larvae feeding on leaves. Green or brown, 10–50 mm. Chewing damage on leaf edges.",
    damageDescription:
      "Defoliation from leaf feeding. Skeletonised leaves in severe cases. Reduces plant vigour and yield.",
    organicPrevention: [
      "Encourage birds and parasitic wasps",
      "Handpick and destroy visible caterpillars",
    ],
    organicTreatments: [
      {
        name: "Bt (Bacillus thuringiensis)",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 2 g Bt kurstaki per litre water. Spray thoroughly on all foliage that caterpillars are feeding on, coating both leaf surfaces.",
        frequency: "Every 5–7 days; reapply after rain as Bt is washed off",
        timing: "Evening for maximum residual activity — Bt protein degrades in UV light",
        safetyNotes:
          "Bt is completely safe for mammals, birds and bees — approved for use close to harvest. Effective only when ingested by caterpillars — spray where larvae are actively feeding.",
      },
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on leaves covering both surfaces. Neem disrupts larval moulting and feeding.",
        frequency: "Every 5–7 days",
        timing: "Morning or evening",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Most effective on young caterpillars (1st–2nd instar).",
      },
      {
        name: "Handpicking",
        method: "manual",
        effort: "easy",
        howToApply:
          "Check plants in early morning and evening. Handpick caterpillars and drop into a bucket of soapy water. Check leaf undersides for egg masses and remove those too.",
        frequency: "Daily during active infestation",
        timing: "Early morning or evening when caterpillars are most active on leaf surfaces",
        safetyNotes:
          "Wear gloves — some caterpillar species have urticating (irritating) hairs. Inspect leaf undersides carefully for egg clusters.",
      },
      {
        name: "Trichogramma egg cards",
        method: "biocontrol",
        effort: "advanced",
        howToApply:
          "Attach Trichogramma chilonis cards (1 card per 100 m²) inside the crop canopy on stakes at the time of card hatching per supplier instructions.",
        frequency: "Weekly releases for 6–8 weeks",
        timing: "Place cards in morning; shade from direct sun",
        safetyNotes:
          "Parasitoid wasps attack moth eggs — preventive and ongoing releases work best. Avoid insecticides throughout the release period.",
      },
    ],
    seasonalRisk: { sw_monsoon: "moderate", ne_monsoon: "moderate" },
    plantsAffected: ["Vegetables", "Fruit trees"],
  },
  {
    id: "hairy_caterpillar",
    name: "Hairy Caterpillar",
    tamilName: "ரோம புழு",
    category: "borers_larvae",
    emoji: "🐛",
    identification:
      "Large hairy caterpillars (30–60 mm) with urticating hairs. Gregarious — cluster on leaves and stems.",
    damageDescription:
      "Rapid defoliation in swarm attacks. Can strip entire trees. Contact with hairs causes skin irritation.",
    organicPrevention: [
      "Light traps to catch adult moths at night",
      "Remove egg masses from leaf undersides",
    ],
    organicTreatments: [
      {
        name: "Bt spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 g Bt kurstaki per litre water (slightly higher rate for large caterpillars). Spray entire tree canopy at high volume ensuring all foliage is covered.",
        frequency: "Every 5–7 days during larval stage; reapply after rain",
        timing: "Evening",
        safetyNotes:
          "Safe for humans and beneficial insects. Most effective on young (1st–3rd instar) larvae before they grow large and hairy.",
      },
      {
        name: "Light traps",
        method: "trap",
        effort: "moderate",
        howToApply:
          "Set up a light trap or solar-powered light trap 1 m above ground level. Place a tray of soapy water below to drown attracted moths.",
        frequency: "Operate nightly during adult moth season (monsoon onset)",
        timing: "Switch on from dusk to midnight",
        safetyNotes:
          "Collect and destroy trapped moths each morning. Keep away from living areas. Light traps also attract beneficial insects — use judiciously.",
      },
      {
        name: "Neem kernel extract",
        method: "spray",
        effort: "easy",
        howToApply:
          "Soak 500 g crushed neem kernels overnight in 10 L water. Strain through fine cloth. Spray entire tree canopy at high volume using a high-pressure sprayer.",
        frequency: "Every 5–7 days during active larval feeding",
        timing: "Evening",
        safetyNotes:
          "Prepare fresh daily — loses efficacy after 24 hours. Use high-pressure sprayer for complete coverage of large trees.",
      },
      {
        name: "Manual collection and destruction",
        method: "manual",
        effort: "easy",
        howToApply:
          "Young hairy caterpillars are gregarious and cluster on leaves or branches. Locate the colony early, remove the entire infested branch or leaf and burn it immediately.",
        frequency: "Check trees daily when caterpillars are in early gregarious larval stage",
        timing: "Morning when caterpillars are still clustered on one branch",
        safetyNotes:
          "IMPORTANT: Wear full-sleeve clothing, gloves and eye protection — urticating hairs cause skin rash and severe eye irritation. Do NOT rub eyes after handling.",
      },
    ],
    seasonalRisk: { sw_monsoon: "high", ne_monsoon: "moderate" },
    plantsAffected: ["Drumstick", "Castor", "Moringa"],
  },
  {
    id: "black_headed_caterpillar",
    name: "Black-Headed Caterpillar",
    tamilName: "கருந்தலை புழு",
    scientificName: "Opisina arenosella",
    category: "borers_larvae",
    emoji: "🐛",
    identification:
      "Caterpillar with distinct black head, feeds on coconut leaflets. Creates silk galleries on frond undersides.",
    damageDescription:
      "Scrapes leaf tissue causing drying and browning of fronds. Severe infestations give coconut palm a scorched appearance, reducing yield.",
    organicPrevention: [
      "Maintain palm health",
      "Release parasitoids preventively in endemic areas",
    ],
    organicTreatments: [
      {
        name: "Release parasitoids (Goniozus nephantidis)",
        method: "biocontrol",
        effort: "advanced",
        howToApply:
          "Source Goniozus nephantidis parasitoid wasp cards from biocontrol laboratories. Attach 1 card per 5 affected fronds, placing near silk galleries on the frond undersides.",
        frequency: "Two releases 2 weeks apart per season",
        timing: "Morning when temperature is 25–30°C",
        safetyNotes:
          "Avoid all pesticides for 4 weeks around the release period. Parasitoid release works best as a preventive measure in areas with endemic infestation history.",
      },
      {
        name: "Bt spray on fronds",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 g Bt kurstaki per litre water. Spray fronds from crown downward, covering both surfaces. Use a high-pressure knapsack sprayer for penetration into silk galleries.",
        frequency: "Every 7 days for 3–4 applications during active infestation",
        timing: "Morning",
        safetyNotes:
          "Spray must penetrate the silk galleries to reach larvae inside. Wear protective gear when working at height near palms.",
      },
      {
        name: "Remove and burn affected leaves",
        method: "manual",
        effort: "easy",
        howToApply:
          "Cut severely infested fronds and leaflets at the base. Remove silk galleries with larvae inside. Burn all removed material immediately.",
        frequency: "As soon as infestation is identified; do not delay",
        timing: "Any time",
        safetyNotes:
          "Do NOT compost infested fronds — larvae can survive. Burning removes both larvae and silk structures.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate" },
    plantsAffected: ["Coconut"],
  },
  {
    id: "bark_eating_caterpillar",
    name: "Bark Eating Caterpillar",
    tamilName: "பட்டை அரிப்பு புழு",
    category: "borers_larvae",
    emoji: "🐛",
    identification:
      "Caterpillar creates web-like silk shelters on bark and branches. Frass visible at tunnel openings.",
    damageDescription:
      "Tunnels under bark weakening branches. Heavy infestation causes branch dieback. Common in mango and guava.",
    organicPrevention: [
      "Regular trunk inspection",
      "Clean shelters from bark during pruning",
    ],
    organicTreatments: [
      {
        name: "Clean frass from tunnels",
        method: "manual",
        effort: "moderate",
        howToApply:
          "Use a thin wire or rod to scrape out frass (caterpillar excrement) and silk webbing from tunnels on bark. Dispose of removed material away from the tree.",
        frequency: "Monthly trunk inspection and cleaning",
        timing: "Any time during the dry season when frass is most visible",
        safetyNotes:
          "Wear gloves. After cleaning, apply neem paste or Bt paste into open tunnel entrances to kill remaining larvae.",
      },
      {
        name: "Inject neem oil",
        method: "manual",
        effort: "advanced",
        howToApply:
          "Use a syringe to inject 2–3 ml of undiluted neem oil into each tunnel entrance where fresh frass is present. Seal the hole with clay or moist cotton wool immediately after.",
        frequency: "Single treatment per tunnel; reinspect after 3 weeks for new frass",
        timing: "Any time; act quickly when fresh frass indicates active infestation",
        safetyNotes:
          "Treat only active tunnels where fresh frass is present. Seal all tunnel entries after treatment to trap larvae inside.",
      },
      {
        name: "Apply Bt paste",
        method: "spray",
        effort: "moderate",
        howToApply:
          "Mix 5 g Bt kurstaki in 30–50 ml water to form a thick paste. Pack paste into tunnel entrances using a thin brush or syringe. Seal with clay after application.",
        frequency: "Single application; repeat if new frass appears after 3 weeks",
        timing: "Any time",
        safetyNotes:
          "Wear gloves. Ensure paste reaches deep into the tunnel to contact the larva. Seal tunnel entrance after application to prevent paste drying out before ingestion.",
      },
    ],
    seasonalRisk: { sw_monsoon: "moderate", ne_monsoon: "moderate" },
    plantsAffected: ["Mango", "Guava"],
  },
  {
    id: "pseudostem_borer",
    name: "Pseudostem Borer",
    tamilName: "போலித்தண்டு துளைப்பான்",
    category: "borers_larvae",
    emoji: "🐛",
    identification:
      "Weevil larva boring into banana pseudostem. Entry holes with oozing sap and frass at stem base.",
    damageDescription:
      "Tunnelling weakens pseudostem causing toppling in wind. Reduces bunch weight. Can destroy entire mat.",
    organicPrevention: [
      "Remove and destroy dead pseudostems after harvest",
      "Keep field clean of plant debris",
    ],
    organicTreatments: [
      {
        name: "Inject neem solution into pseudostem",
        method: "manual",
        effort: "advanced",
        howToApply:
          "Make holes at 30 cm intervals around the pseudostem using a knife or drill. Inject 50 ml of 10% neem oil solution per hole using a syringe. Seal holes with clay after injection.",
        frequency: "Single treatment on discovery; monitor for new boring damage after 2 weeks",
        timing: "Any time on discovery; most effective on young infestations",
        safetyNotes:
          "Treatment is more effective when infestation is detected early. Severely tunnelled pseudostems may require removal to prevent toppling.",
      },
      {
        name: "Remove and destroy affected parts",
        method: "manual",
        effort: "easy",
        howToApply:
          "Cut the affected pseudostem at the base. Split it open to expose and destroy all larvae inside. Remove the entire infected mat if the rhizome is also damaged.",
        frequency: "Immediately when wilting of pseudostem is detected",
        timing: "Any time",
        safetyNotes:
          "Do NOT leave cut pseudostem pieces in the field — adult weevils breed in decaying banana material. Allow cut surfaces to dry for 2–3 days before considering replanting.",
      },
    ],
    seasonalRisk: { sw_monsoon: "moderate", ne_monsoon: "moderate" },
    plantsAffected: ["Banana"],
  },

  // ── Beetles & Weevils ────────────────────────────────────────────────────
  {
    id: "red_palm_weevil",
    name: "Red Palm Weevil",
    tamilName: "சிவப்பு பனை வண்டு",
    scientificName: "Rhynchophorus ferrugineus",
    category: "beetles_weevils",
    emoji: "🪲",
    identification:
      "Large reddish-brown snout beetle (30–40 mm). Larvae are creamy grubs found inside palm trunk. Fermented smell from trunk.",
    damageDescription:
      "Larvae tunnel inside palm trunk destroying vascular tissue. Usually fatal — tree collapses when damage discovered. Most destructive coconut pest.",
    organicPrevention: [
      "Seal all pruning wounds with Bordeaux paste",
      "Install pheromone traps around plantation",
      "Monitor for fermented smell from crown",
    ],
    organicTreatments: [
      {
        name: "Pheromone traps",
        method: "trap",
        effort: "moderate",
        howToApply:
          "Set up aggregation pheromone traps (Rhynchopherol lure + sugarcane pieces) at 1 trap per 25 trees, placed at 1 m height. Inspect and empty every 3 days.",
        frequency: "Change lures every 6–8 weeks; inspect every 3 days year-round",
        timing: "Install year-round — this is the most important early-warning tool for this pest",
        safetyNotes:
          "Community-level trapping across neighbouring plots is far more effective than individual plots. Record catches and alert neighbours. Burn or drown all captured beetles.",
      },
      {
        name: "Inject neem oil into trunk",
        method: "manual",
        effort: "advanced",
        howToApply:
          "Drill 4 holes (1 cm diameter) at the base of the crown, spaced 90° apart. Inject 50–100 ml of 10% neem oil + neem cake extract using a syringe into each hole. Seal holes with clay.",
        frequency: "Repeat every 2 months in endemic areas; immediately on first signs of infestation",
        timing: "Any time; URGENCY IS CRITICAL — act immediately on first signs (fermented odour, frass, wilting fronds)",
        safetyNotes:
          "IMPORTANT: Red Palm Weevil can kill a palm within 3–6 months of infestation. Do not delay treatment. Consult your local agriculture department if infestation is confirmed — subsidised treatment programmes exist.",
      },
      {
        name: "Entomopathogenic nematodes",
        method: "biocontrol",
        effort: "advanced",
        howToApply:
          "Apply Steinernema or Heterorhabditis nematodes at 5 million nematodes per litre. Inject into bore holes or drench into crown base and root zone at dusk.",
        frequency: "Two applications 2 weeks apart",
        timing: "Evening — nematodes are UV-sensitive and die in direct sunlight. Apply when temperature is below 30°C.",
        safetyNotes:
          "Keep nematode sachets refrigerated (4–8°C) until use. Apply immediately after dilution — viability drops rapidly. Use rainwater or settled water — chlorinated tap water kills nematodes.",
      },
      {
        name: "Clean crown regularly",
        method: "manual",
        effort: "moderate",
        howToApply:
          "Remove dry fronds and accumulated debris from the crown every 2–3 months. Seal any fresh cuts or wounds immediately with Bordeaux paste (copper sulfate + lime) mixed with neem cake.",
        frequency: "Every 2–3 months",
        timing: "Dry season preferred to reduce risk of fungal infection at pruning cuts",
        safetyNotes:
          "NEVER leave open, unsealed wounds on palms — the weevil is strongly attracted to fermenting plant sap at wound sites.",
      },
    ],
    seasonalRisk: { sw_monsoon: "high", ne_monsoon: "high", summer: "moderate" },
    plantsAffected: ["Coconut"],
  },
  {
    id: "rhinoceros_beetle",
    name: "Rhinoceros Beetle",
    tamilName: "காண்டாமிருக வண்டு",
    scientificName: "Oryctes rhinoceros",
    category: "beetles_weevils",
    emoji: "🪲",
    identification:
      "Large black beetle (30–50 mm) with horn on head. Bores into coconut crown at night. V-shaped cuts on fronds.",
    damageDescription:
      "Bores into the growing point of palms. Damages emerging fronds causing characteristic V-shaped cuts. Creates entry for Red Palm Weevil.",
    organicPrevention: [
      "Remove breeding sites (compost heaps near palms, decaying logs)",
      "Fill bore holes with neem cake mixture",
    ],
    organicTreatments: [
      {
        name: "Rhinolure pheromone trap",
        method: "trap",
        effort: "moderate",
        howToApply:
          "Set up Rhinolure pheromone trap with funnel-bucket design at 1 per 25 trees, placed at 1–1.5 m height. Add a small piece of fermenting palm material to enhance attraction.",
        frequency: "Inspect every 3 days; change lure every 6 weeks",
        timing: "Year-round; most important during SW Monsoon onset when adults are most active",
        safetyNotes:
          "Community-level trapping significantly reduces population. Burn or drown all captured beetles daily. Coordinate with neighbouring farms for maximum impact.",
      },
      {
        name: "Metarhizium anisopliae (fungal biocontrol)",
        method: "biocontrol",
        effort: "advanced",
        howToApply:
          "Apply Metarhizium anisopliae WP at 5 g per litre water. Spray on compost heaps, decaying organic matter near palms, and on the crown base of palms.",
        frequency: "Every 2–3 months; apply to every compost batch made near palms",
        timing: "Apply in humid conditions (>70% RH) for best fungal establishment. Spray in evening.",
        safetyNotes:
          "Metarhizium requires moist conditions to germinate and infect beetles. Do NOT mix with fungicides. Store in the refrigerator. Results take 1–3 weeks to show as fungus must infect and kill beetles.",
      },
      {
        name: "Hook out adults from crown",
        method: "manual",
        effort: "moderate",
        howToApply:
          "Use a long metal hook (a bent metal rod works) to carefully probe the crown funnel and extract adult beetles found boring in the growing point. Destroy removed beetles by crushing or drowning.",
        frequency: "Weekly crown monitoring; hook out beetles immediately on finding them",
        timing: "Morning when adults are resting after nocturnal feeding",
        safetyNotes:
          "Check for fresh entry holes (V-shaped cuts on emerging fronds). Seal entry holes with neem cake paste + clay after extraction to repel further entry.",
      },
      {
        name: "Neem cake in manure pits",
        method: "soil",
        effort: "easy",
        howToApply:
          "Mix 2 kg neem cake per 100 kg compost heap. Incorporate neem cake into all compost or organic matter pits maintained near palms to prevent beetle breeding.",
        frequency: "Add to every compost batch; reapply annually to established compost pits",
        timing: "When preparing fresh compost or adding new organic matter to pits",
        safetyNotes:
          "Rhinoceros beetle primarily breeds in decomposing organic matter — treating all compost heaps near palms is a priority preventive action.",
      },
    ],
    seasonalRisk: { sw_monsoon: "high", ne_monsoon: "moderate" },
    plantsAffected: ["Coconut"],
  },
  {
    id: "epilachna_beetle",
    name: "Epilachna Beetle",
    tamilName: "எபிலாக்னா வண்டு",
    category: "beetles_weevils",
    emoji: "🪲",
    identification:
      "Yellowish-brown ladybird-like beetle (6–8 mm) with dark spots. Both adults and grubs feed on leaves.",
    damageDescription:
      "Scrapes leaf surface leaving only veins (skeletonisation). Grubs are more damaging than adults. Major pest of brinjal.",
    organicPrevention: [
      "Handpick adults and egg masses",
      "Remove alternate weed hosts",
    ],
    organicTreatments: [
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on both leaf surfaces covering all feeding areas. Ensure egg masses on leaf undersides are also contacted.",
        frequency: "Every 5–7 days for 3–4 applications",
        timing: "Morning or evening",
        safetyNotes:
          "Also spray yellow egg clusters visible on leaf undersides. Pre-harvest interval: 24 hours.",
      },
      {
        name: "Handpicking",
        method: "manual",
        effort: "easy",
        howToApply:
          "Inspect plants in early morning. Collect adults, grubs and yellow egg clusters from both leaf surfaces. Drop into a bucket of soapy water.",
        frequency: "Daily until infestation is controlled",
        timing: "Early morning when beetles are less active and easier to collect",
        safetyNotes:
          "Wear gloves. Check leaf undersides carefully — eggs are bright yellow and laid in neat clusters. Remove egg masses before they hatch.",
      },
      {
        name: "Bt spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 2 g Bt kurstaki per litre water. Spray both leaf surfaces thoroughly.",
        frequency: "Every 7 days",
        timing: "Evening",
        safetyNotes:
          "Bt is effective only on larvae (grubs), not adult beetles — combine with handpicking of adults for complete control.",
      },
    ],
    seasonalRisk: { summer: "moderate", sw_monsoon: "moderate" },
    plantsAffected: ["Brinjal", "Bitter gourd"],
  },
  {
    id: "rhizome_weevil",
    name: "Rhizome Weevil",
    tamilName: "கிழங்கு வண்டு",
    category: "beetles_weevils",
    emoji: "🪲",
    identification:
      "Dark brown weevil (10–15 mm). Larvae feed inside banana rhizome. Wilting and yellowing of outer leaves.",
    damageDescription:
      "Larvae tunnel through rhizome destroying root system. Causes toppling, reduced bunch size. Spreads through infested suckers.",
    organicPrevention: [
      "Use healthy pest-free suckers for planting",
      "Pare and treat rhizome before planting",
    ],
    organicTreatments: [
      {
        name: "Trap with pseudostems",
        method: "trap",
        effort: "moderate",
        howToApply:
          "Cut fresh pseudostem sections (50 cm long) lengthwise to expose the moist interior. Place flat-side-down on soil near plants as attractant traps. Collect and destroy all weevils found underneath every 3 days.",
        frequency: "Replace trap pieces every 7–10 days; inspect every 3 days",
        timing: "Place traps at planting time and maintain throughout the growing season",
        safetyNotes:
          "Trap pieces MUST be removed and replaced regularly — neglected pseudostem traps become breeding sites rather than traps.",
      },
      {
        name: "Neem cake in soil",
        method: "soil",
        effort: "easy",
        howToApply:
          "Mix 250 g neem cake per planting hole at establishment. For established plants, broadcast 1 kg per m² in the root zone and incorporate into the top 10 cm of soil.",
        frequency: "At planting and every 3 months thereafter",
        timing: "Apply before planting or during regular soil amendment; water thoroughly after application",
        safetyNotes:
          "Neem cake is also an organic nitrogen source — it improves soil fertility while suppressing pests.",
      },
      {
        name: "Beauveria bassiana",
        method: "biocontrol",
        effort: "advanced",
        howToApply:
          "Mix Beauveria bassiana WP at 5 g per litre water. Drench soil around the rhizome zone, applying 500 ml per plant.",
        frequency: "Twice per season — at planting and again 3 months later",
        timing: "Evening or early morning in humid conditions for best fungal spore establishment",
        safetyNotes:
          "Do NOT apply in direct sunlight — UV radiation kills spores. Do NOT mix with fungicides. Keep product refrigerated until use. Results take 1–3 weeks as fungus must infect and kill weevils.",
      },
    ],
    seasonalRisk: { sw_monsoon: "moderate", ne_monsoon: "moderate" },
    plantsAffected: ["Banana"],
  },

  // ── Other Pests ──────────────────────────────────────────────────────────
  {
    id: "nematodes",
    name: "Nematodes",
    tamilName: "நூற்புழு",
    category: "other",
    emoji: "🪱",
    identification:
      "Microscopic roundworms in soil. Visible only by symptoms: root galls (root-knot nematode), stunting, yellowing.",
    damageDescription:
      "Root galls block water/nutrient uptake. Stunted growth, yellowing, wilting despite adequate water. Facilitates fungal root rots.",
    organicPrevention: [
      "Interplant with marigold (releases nematode-repelling compounds)",
      "Rotate crops — avoid planting same family consecutively",
    ],
    organicTreatments: [
      {
        name: "Neem cake soil application",
        method: "soil",
        effort: "easy",
        howToApply:
          "Broadcast 2–3 kg neem cake per 10 m² of bed. Incorporate into the top 15 cm of soil using a fork or hoe. Water thoroughly after application.",
        frequency: "Once before planting; repeat mid-season if symptoms persist",
        timing: "Apply 2–3 weeks before transplanting for best pre-planting suppression",
        safetyNotes:
          "Neem cake also acts as an organic nitrogen fertiliser. Do not over-apply — very heavy rates can temporarily affect beneficial soil microbes.",
      },
      {
        name: "Marigold interplanting",
        method: "soil",
        effort: "moderate",
        howToApply:
          "Plant African marigold (Tagetes erecta) densely around crop borders or at a 1:4 ratio within the crop (1 marigold per 4 vegetable plants). Allow roots to remain in soil between crop seasons.",
        frequency: "Plant at or before main crop establishment; maintain for the full season",
        timing: "Establish marigolds 3–4 weeks before main crop for maximum nematode-suppressing root exudate release",
        safetyNotes:
          "French marigold (T. patula) is also effective. Avoid planting marigolds too close to fruiting vegetables during early stages as they may compete for water.",
      },
      {
        name: "Trichoderma soil treatment",
        method: "soil",
        effort: "moderate",
        howToApply:
          "Mix 100 g Trichoderma viride with 10 kg well-decomposed farmyard compost. Broadcast 500 g of this mixture per m² and incorporate into the top 15 cm before planting.",
        frequency: "At planting; one additional application at 45 days after transplanting",
        timing: "Apply in moist soil conditions (after rain or irrigation) for best fungal colonisation",
        safetyNotes:
          "Do NOT apply simultaneously with synthetic fungicides — they kill Trichoderma. If fungicide use is absolutely needed, use only copper or sulfur-based products.",
      },
      {
        name: "Castor cake",
        method: "soil",
        effort: "easy",
        howToApply:
          "Incorporate 2–3 kg castor cake per 10 m² into the topsoil by mixing well. Apply 2–3 weeks before planting.",
        frequency: "Once per season before planting",
        timing: "Pre-planting, 2–3 weeks before transplanting",
        safetyNotes:
          "IMPORTANT: Castor cake contains ricin and is toxic to humans and animals if ingested — keep stored product away from children and livestock. Wear gloves when handling.",
      },
    ],
    seasonalRisk: { summer: "moderate", sw_monsoon: "moderate" },
    plantsAffected: ["Tomato", "Brinjal", "Ladies Finger", "Banana"],
  },
  {
    id: "termites",
    name: "Termites",
    tamilName: "கரையான்",
    category: "other",
    emoji: "🐜",
    identification:
      "Small pale social insects in mud tubes on trunks and in soil. Hollow-sounding stems. Mud trails on bark.",
    damageDescription:
      "Feed on dead wood and roots. Attack living trees through wounds. Can hollow out trunks killing mature trees.",
    organicPrevention: [
      "Remove dead wood and stumps near garden",
      "Maintain soil moisture — termites prefer dry conditions",
    ],
    organicTreatments: [
      {
        name: "Neem cake soil application",
        method: "soil",
        effort: "easy",
        howToApply:
          "Broadcast 2–3 kg neem cake per 10 m² around affected plants. Incorporate into topsoil. Also apply directly to active mud tubes on trunks, mixing neem cake into mud tube material.",
        frequency: "Every 3 months in termite-prone areas; immediately on discovery",
        timing: "Apply before monsoon to allow incorporation into soil",
        safetyNotes:
          "Neem cake disrupts termite colony activity through azadirachtin. Combine with Beauveria application for better control.",
      },
      {
        name: "Beauveria bassiana",
        method: "biocontrol",
        effort: "advanced",
        howToApply:
          "Mix Beauveria bassiana WP at 5 g per litre water. Drench affected soil zone and spray directly on mud tubes and tunnels on trunks at 1–2 litres per tree.",
        frequency: "Two applications 2 weeks apart; repeat at the start of each dry season",
        timing: "Evening in humid conditions — fungal spores require moisture to germinate and infect termites",
        safetyNotes:
          "Do not apply with fungicides. Results take 1–3 weeks — Beauveria must infect and kill termites through contact. Most effective in moist soil.",
      },
    ],
    seasonalRisk: { summer: "high", cool_dry: "moderate" },
    plantsAffected: ["Timber trees", "Coconut", "Fruit trees"],
  },
  {
    id: "fruit_fly",
    name: "Fruit Fly",
    tamilName: "பழ ஈ",
    scientificName: "Bactrocera dorsalis",
    category: "other",
    emoji: "🪰",
    identification:
      "Small fly (5–8 mm) with banded wings. Puncture marks on ripening fruit. Maggots inside cut fruit.",
    damageDescription:
      "Female lays eggs in ripening fruit. Maggots feed inside causing fruit rot and drop. Major post-harvest loss.",
    organicPrevention: [
      "Harvest fruit at mature-green stage",
      "Set pheromone traps before fruiting season",
      "Destroy fallen infested fruits",
    ],
    organicTreatments: [
      {
        name: "Pheromone traps",
        method: "trap",
        effort: "moderate",
        howToApply:
          "Hang Methyl eugenol pheromone traps (specific for Bactrocera dorsalis) at 1 per 25 trees, placed at 1.5 m height in the orchard. Follow supplier instructions for lure fitting.",
        frequency: "Replace lure every 4–6 weeks; record catches weekly",
        timing: "Install 4–6 weeks before fruit ripening begins",
        safetyNotes:
          "These traps are male-specific — use alongside protein bait traps for comprehensive control. High weekly catches (>25) indicate immediate spray intervention is needed.",
      },
      {
        name: "Neem oil fruit spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 5 ml neem oil + 2 ml liquid soap per litre water. Spray on developing and ripening fruit surfaces and surrounding foliage to deter female egg-laying.",
        frequency: "Every 5–7 days during the fruit ripening stage",
        timing: "Evening",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Wash fruit before eating. Neem does not kill established larvae inside fruit — prevention through deterring egg-laying is the primary mechanism.",
      },
      {
        name: "Bait traps (jaggery + spinosad)",
        method: "trap",
        effort: "moderate",
        howToApply:
          "Mix 50 g jaggery in 1 L water with fresh citrus peel or juice. Add 0.2 ml organic spinosad. Pour 200 ml into hanging bottles at canopy height, 1 bottle per 5 trees.",
        frequency: "Refresh bait every 3–5 days",
        timing: "Hang traps before fruit enters the ripening stage",
        safetyNotes:
          "Spinosad-based bait is suitable for organic farming — do NOT use malathion if organic certification is required. Dispose of used bait carefully — keep away from water sources and drains.",
      },
      {
        name: "Early harvest",
        method: "cultural",
        effort: "easy",
        howToApply:
          "Harvest fruits at the mature-green stage before they fully ripen on the tree. Allow fruit to ripen in shade off the tree. Avoid leaving overripe or fallen fruit in the orchard.",
        frequency: "Harvest every 3–4 days once fruits reach mature-green stage during peak fly season",
        timing: "Early morning for best post-harvest quality and firmness",
        safetyNotes:
          "Collect ALL fallen and infested fruits immediately and bury at least 30 cm deep to prevent maggots from completing their lifecycle in the soil.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate" },
    plantsAffected: ["Mango", "Guava", "Papaya"],
  },
  {
    id: "pod_fly",
    name: "Pod Fly",
    tamilName: "நெற்று ஈ",
    category: "other",
    emoji: "🪰",
    identification:
      "Small fly that lays eggs on developing pods. Maggots feed inside pods causing premature drying.",
    damageDescription:
      "Larvae feed inside pods destroying seeds. Pods shrivel and dry prematurely. Major pest of drumstick.",
    organicPrevention: [
      "Spray neem at pod formation stage",
      "Collect and destroy infested pods",
    ],
    organicTreatments: [
      {
        name: "Neem oil spray at pod formation",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 5 ml neem oil + 2 ml liquid soap per litre water. Spray thoroughly on developing pods covering all surfaces, especially the pod surface and stalk junction where eggs are laid.",
        frequency: "Every 7 days during pod development, starting immediately at pod set",
        timing: "Evening",
        safetyNotes:
          "Spray must begin at pod set stage — once larvae are inside pods, external spraying has no effect. Pre-harvest interval: 24 hours.",
      },
      {
        name: "Early harvest",
        method: "cultural",
        effort: "easy",
        howToApply:
          "Harvest drumstick pods when mature but before they turn yellow or soft. Do not allow pods to over-ripen on the tree as ripe fruits attract more flies for egg-laying.",
        frequency: "Harvest every 5–7 days once pods are mature",
        timing: "Morning harvest for best quality",
        safetyNotes:
          "Remove and bury or burn fallen infested pods immediately — they contain larvae completing their lifecycle which will create the next generation of flies.",
      },
      {
        name: "Pheromone traps",
        method: "trap",
        effort: "moderate",
        howToApply:
          "Hang pod fly pheromone traps at 1.5 m height near drumstick trees. Follow supplier instructions for lure quantity and trap type.",
        frequency: "Change lure every 4 weeks; inspect weekly",
        timing: "Install before pod formation — primarily used for population monitoring",
        safetyNotes:
          "Catch monitoring helps time neem spray applications for peak fly oviposition activity. Record catches to predict high-risk periods.",
      },
    ],
    seasonalRisk: { summer: "moderate", cool_dry: "moderate" },
    plantsAffected: ["Drumstick"],
  },
  {
    id: "leaf_defoliators",
    name: "Leaf Defoliators",
    tamilName: "இலை அரிப்பான்",
    category: "other",
    emoji: "🐜",
    identification:
      "Various insects (beetles, caterpillars, sawflies) that consume leaf tissue. Irregular holes or complete defoliation.",
    damageDescription:
      "Reduces photosynthetic area. Severe defoliation weakens trees, reduces fruit set and yield. Repeated attacks can kill young trees.",
    organicPrevention: [
      "Encourage insectivorous birds",
      "Maintain biodiversity in the garden",
    ],
    organicTreatments: [
      {
        name: "Bt spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 2–3 g Bt kurstaki per litre water. Spray on all defoliated or actively fed-upon foliage, coating both leaf surfaces thoroughly.",
        frequency: "Every 5–7 days; reapply after rain",
        timing: "Evening for maximum residual activity",
        safetyNotes:
          "Bt is safe for humans, birds, and bees — use freely near harvest. Effective only when ingested by caterpillars and sawfly larvae. Not effective on adult beetles.",
      },
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on foliage covering both surfaces. Neem disrupts feeding and larval development.",
        frequency: "Every 5–7 days",
        timing: "Morning or evening",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Most effective on young larvae. For severe infestations, increase frequency to every 3–4 days initially.",
      },
      {
        name: "Handpicking",
        method: "manual",
        effort: "easy",
        howToApply:
          "Inspect trees in morning and evening. Handpick beetles, caterpillars and sawfly larvae from foliage and drop into soapy water. Check leaf undersides for egg masses and remove.",
        frequency: "Daily during active infestation",
        timing: "Early morning and evening when insects are most accessible on leaf surfaces",
        safetyNotes:
          "Wear gloves — some caterpillar species have irritating hairs. Inspect leaf undersides carefully for egg clusters and gregarious young larvae.",
      },
    ],
    seasonalRisk: { sw_monsoon: "moderate" },
    plantsAffected: ["Timber trees", "Teak", "Tamarind"],
  },
];
