/**
 * Disease reference data for the Kanyakumari / High Rainfall agro-climatic zone.
 *
 * Consolidates existing scattered data from plantHelpers.ts
 * (DISEASE_CATEGORY_MAP, ORGANIC_TREATMENTS, TREATMENT_DETAILS,
 * TAMIL_NADU_COMMON_PESTS_DISEASES, TAMIL_NADU_CROP_SPECIFIC_ISSUES)
 * into structured DiseaseEntry objects for the reference screens.
 */

import type { DiseaseEntry } from "@/types/database.types";

export const KANYAKUMARI_DISEASES: DiseaseEntry[] = [
  // ── Fungal ───────────────────────────────────────────────────────────────
  {
    id: "powdery_mildew",
    name: "Powdery Mildew",
    tamilName: "சாம்பல் நோய்",
    category: "fungal",
    emoji: "🍄",
    identification:
      "White powdery growth on leaf surfaces, stems and flowers. Starts as small circular patches and spreads rapidly.",
    damageDescription:
      "Reduces photosynthesis, causes leaf distortion and premature leaf drop. Flower infection leads to poor fruit set.",
    organicPrevention: [
      "Ensure good air circulation between plants",
      "Avoid overhead watering",
      "Remove and destroy infected plant parts",
    ],
    organicTreatments: [
      {
        name: "Baking soda spray (1 tsp/L)",
        method: "spray",
        effort: "easy",
        howToApply:
          "Dissolve 1 tsp (5 g) baking soda in 1 L water. Add 1 ml liquid soap to help it stick to leaves. Spray on both leaf surfaces, thoroughly coating all powdery growth.",
        frequency: "Every 5–7 days for 3–4 applications",
        timing: "Morning — allows foliage to dry before evening and avoids baking residue from afternoon heat",
        safetyNotes:
          "Do not exceed 1 tsp/L — higher concentrations cause leaf tip burn. Test on a few leaves first. Rinse edible crops before consuming.",
      },
      {
        name: "Neem oil",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on all affected leaf surfaces, covering both sides thoroughly.",
        frequency: "Every 5–7 days",
        timing: "Evening or early morning to prevent leaf burn and protect pollinators",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Neem disrupts spore germination — begin treatment at first signs for best results.",
      },
      {
        name: "Milk spray (1:9)",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 1 part fresh cow's milk with 9 parts water. Spray on both leaf surfaces. Milk proteins create an alkaline environment hostile to powdery mildew fungi.",
        frequency: "Every 7 days for 3–4 applications",
        timing: "Morning — requires UV light to activate the antimicrobial compounds in milk",
        safetyNotes:
          "Use within 24 hours of mixing — spoiled milk is ineffective and attracts insects. Most effective as a preventive and on early-stage infections.",
      },
      {
        name: "Sulfur-based fungicide",
        method: "spray",
        effort: "easy",
        howToApply:
          "Dissolve 2–3 g wettable sulfur per litre water. Spray on all affected surfaces, particularly the upper leaf surface where powdery growth is visible.",
        frequency: "Every 7–10 days",
        timing: "Morning only. NEVER apply above 32°C — severe and irreversible leaf burn will result.",
        safetyNotes:
          "Do NOT apply within 2 weeks of any oil-based spray. Do NOT apply above 32°C. Wear gloves and a dust mask when handling.",
      },
    ],
    seasonalRisk: { cool_dry: "high", summer: "moderate" },
    plantsAffected: ["Chilli", "Ladies Finger", "Drumstick", "Mango"],
  },
  {
    id: "anthracnose",
    name: "Anthracnose",
    tamilName: "கரும்புள்ளி நோய்",
    category: "fungal",
    emoji: "🍄",
    identification:
      "Dark sunken lesions on fruits, leaves and stems. Lesions may have concentric rings. Salmon-pink spore masses in wet weather.",
    damageDescription:
      "Fruit rot, leaf blight, twig dieback. Major post-harvest disease causing fruit loss. Spreads rapidly in humid conditions.",
    organicPrevention: [
      "Prune to improve air circulation",
      "Remove and destroy fallen infected fruit",
      "Avoid wetting foliage during irrigation",
    ],
    organicTreatments: [
      {
        name: "Copper-based fungicide",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix copper hydroxide or copper oxychloride at 3–4 g per litre water (follow product label). Spray on all plant surfaces — leaves, stems and fruit — as a protective cover.",
        frequency: "Every 7–10 days during monsoon season; preventively before fruit set",
        timing: "Morning or evening",
        safetyNotes:
          "Pre-harvest interval: 7 days. Copper accumulates in soil with repeated use — apply only when needed. Wear gloves.",
      },
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3–5 ml neem oil + 1 ml liquid soap per litre water. Spray on all plant surfaces covering fruit, leaves and stems thoroughly.",
        frequency: "Every 5–7 days alternating with copper spray",
        timing: "Evening or early morning",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Most effective as a preventive — begin spraying before symptoms appear during high-risk monsoon periods.",
      },
      {
        name: "Remove infected parts",
        method: "manual",
        effort: "easy",
        howToApply:
          "Prune and remove all affected leaves, shoots and fruit showing dark sunken lesions. Bag removed material immediately and burn — do not compost. Collect all fallen infected fruit from the ground.",
        frequency: "Weekly throughout the growing season",
        timing: "Any time; act immediately on discovery",
        safetyNotes:
          "Disinfect pruning tools between cuts with dilute bleach (1:10). Leaving infected material on the ground or tree dramatically increases spore load for next season.",
      },
      {
        name: "Improve air circulation",
        method: "cultural",
        effort: "easy",
        howToApply:
          "Prune interior crossing branches to open the canopy. Remove weeds from around plants. Thin fruit clusters to improve airflow. Avoid overhead irrigation.",
        frequency: "Once or twice per season — before monsoon and after harvest",
        timing: "During dry weather so pruning wounds heal before rain",
        safetyNotes:
          "Seal large pruning wounds with Bordeaux paste to prevent fungal entry. Dense humid canopies favour Anthracnose spread significantly.",
      },
    ],
    seasonalRisk: { sw_monsoon: "high", ne_monsoon: "high", summer: "moderate" },
    plantsAffected: ["Mango", "Chilli", "Guava", "Papaya", "Banana"],
  },
  {
    id: "leaf_spot",
    name: "Leaf Spot",
    tamilName: "இலைப்புள்ளி நோய்",
    category: "fungal",
    emoji: "🍂",
    identification:
      "Circular to irregular brown/dark spots on leaves, often with yellow halo. May merge in severe cases.",
    damageDescription:
      "Reduces photosynthetic area. Severe infections cause premature defoliation. Weakens plant over time.",
    organicPrevention: [
      "Remove and destroy fallen leaves",
      "Avoid overhead watering",
      "Maintain plant spacing for air flow",
    ],
    organicTreatments: [
      {
        name: "Copper hydroxide spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 g copper hydroxide (Kocide) per litre water. Spray on both leaf surfaces thoroughly, starting with lower leaves where spots first appear.",
        frequency: "Every 7–10 days during monsoon; preventively in high-humidity periods",
        timing: "Morning or evening",
        safetyNotes:
          "Pre-harvest interval: 7 days. Avoid repeated copper applications to the same soil — copper accumulation can cause toxicity. Wear gloves.",
      },
      {
        name: "Neem oil",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on both leaf surfaces.",
        frequency: "Every 5–7 days",
        timing: "Evening or early morning",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Begin at first sign of spots — neem is more effective as a preventive than curative treatment.",
      },
      {
        name: "Remove and burn infected leaves",
        method: "manual",
        effort: "easy",
        howToApply:
          "Pick off all leaves showing spots. Place in bags and burn or bury deeply — do not leave on the ground. Also rake and remove fallen spotted leaves from around the plant base.",
        frequency: "Weekly throughout the growing season",
        timing: "Any time",
        safetyNotes:
          "Do not compost spotted leaves — fungal spores survive composting and reinfect next season. Wash hands after handling diseased material.",
      },
      {
        name: "Avoid overhead watering",
        method: "cultural",
        effort: "easy",
        howToApply:
          "Switch to drip irrigation or water only at the base of plants. If overhead watering is unavoidable, water in early morning only so foliage dries completely before evening.",
        frequency: "Permanent cultural practice throughout the growing season",
        timing: "If overhead watering is used, only in early morning",
        safetyNotes:
          "Wet foliage is the primary driver of fungal leaf spot spread — keeping leaves dry is the most effective long-term prevention strategy.",
      },
    ],
    seasonalRisk: { sw_monsoon: "high", ne_monsoon: "moderate" },
    plantsAffected: ["Guava", "Drumstick", "Jasmine", "Vegetables"],
  },
  {
    id: "cercospora_leaf_spot",
    name: "Cercospora Leaf Spot",
    tamilName: "செர்கோஸ்போரா இலைப்புள்ளி",
    category: "fungal",
    emoji: "🍂",
    identification:
      "Small circular spots with grey centres and dark brown borders. Often appears on older leaves first.",
    damageDescription:
      "Progressive defoliation from lower leaves upward. Reduces yield in vegetables. Common in humid weather.",
    organicPrevention: [
      "Maintain good drainage",
      "Rotate crops — avoid replanting same family",
    ],
    organicTreatments: [
      {
        name: "Copper oxychloride spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 g copper oxychloride per litre water. Spray on both leaf surfaces, starting with lower (older) leaves where disease begins.",
        frequency: "Every 7–10 days during wet weather",
        timing: "Morning or evening",
        safetyNotes:
          "Pre-harvest interval: 7 days. Wear gloves and mask — copper oxychloride is a moderate irritant.",
      },
      {
        name: "Remove infected foliage",
        method: "manual",
        effort: "easy",
        howToApply:
          "Remove lower infected leaves at first sign of grey-centred spots. Bag and burn or bury. This slows upward disease progression significantly.",
        frequency: "Weekly throughout the crop season",
        timing: "Any time",
        safetyNotes:
          "Do not compost — spores survive. Removing lower infected leaves is one of the most effective early interventions.",
      },
      {
        name: "Improve drainage",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Create raised beds or earthen channels to divert standing water away from plant roots. In heavy soils, incorporate sand or coco peat to improve drainage before planting.",
        frequency: "Before planting season; maintain drainage infrastructure throughout",
        timing: "Establish before monsoon season",
        safetyNotes:
          "Wet soil and wet foliage together create ideal conditions for Cercospora — improving drainage is a permanent, long-term solution.",
      },
    ],
    seasonalRisk: { sw_monsoon: "high", ne_monsoon: "moderate" },
    plantsAffected: ["Ladies Finger", "Tapioca"],
  },
  {
    id: "sigatoka_leaf_spot",
    name: "Sigatoka Leaf Spot",
    tamilName: "சிகடோகா இலைப்புள்ளி",
    category: "fungal",
    emoji: "🍂",
    identification:
      "Elongated brown streaks on banana leaves, starting parallel to veins. Leaves dry from edges inward.",
    damageDescription:
      "Severe defoliation reduces bunch weight and fruit quality. Premature ripening. Major banana disease worldwide.",
    organicPrevention: [
      "Remove and destroy affected leaves promptly",
      "Avoid overcrowding — maintain 2m spacing",
    ],
    organicTreatments: [
      {
        name: "Remove affected leaves",
        method: "manual",
        effort: "easy",
        howToApply:
          "Cut out banana leaves showing elongated brown streaks entirely — cut at the leaf base (petiole). Burn removed material immediately. Do not drag removed leaves through the healthy canopy.",
        frequency: "Weekly scouting; remove affected leaves without delay",
        timing: "Any time; do not postpone removal",
        safetyNotes:
          "Do not compost — Sigatoka spores survive. Leaf removal is the single most effective organic management tool for this disease. Wear gloves.",
      },
      {
        name: "Copper spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 4 g copper oxychloride per litre water. Spray lower and middle leaves where disease starts — cover both leaf surfaces thoroughly. Use a high-volume sprayer for banana canopy.",
        frequency: "Every 10–14 days during monsoon season",
        timing: "Morning or evening",
        safetyNotes:
          "Pre-harvest interval: 7 days. Copper is a contact fungicide — thorough coverage of leaf undersides (where spores germinate) is critical.",
      },
      {
        name: "Improve spacing",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Thin banana stools to 1 mother plant + 1 follower sucker per mat. Remove all additional suckers promptly. Maintain minimum 2 m spacing between mats for adequate air circulation.",
        frequency: "Ongoing — thin suckers every 2–3 months",
        timing: "Any time during growing season",
        safetyNotes:
          "Crowded plantations trap moisture on leaf surfaces far longer, dramatically worsening Sigatoka spread. Spacing management must be maintained persistently.",
      },
    ],
    seasonalRisk: { sw_monsoon: "high", ne_monsoon: "high" },
    plantsAffected: ["Banana"],
  },
  {
    id: "root_rot",
    name: "Root Rot",
    tamilName: "வேர் அழுகல்",
    category: "fungal",
    emoji: "🍄",
    identification:
      "Wilting despite adequate water. Roots are brown/black and mushy when pulled. Foul smell from root zone.",
    damageDescription:
      "Destroys root system — plant cannot absorb water/nutrients. Progressive wilting and death. Caused by waterlogged conditions.",
    organicPrevention: [
      "Ensure good drainage — raise beds in heavy soils",
      "Avoid overwatering",
      "Use Trichoderma as preventive soil treatment",
    ],
    organicTreatments: [
      {
        name: "Trichoderma viride soil drench",
        method: "soil",
        effort: "moderate",
        howToApply:
          "Mix 100 g Trichoderma viride into 5 kg well-composted manure first (allows colonisation). Apply 500 ml–1 L soil drench (100 g in 10 L water) per affected plant directly into the root zone.",
        frequency: "At planting as a preventive; repeat every 45 days if infection is present",
        timing: "Apply to moist soil after irrigation or rain for best fungal colonisation",
        safetyNotes:
          "Do NOT apply with synthetic fungicides — they destroy Trichoderma. If fungicide use is unavoidable, wait 2 weeks before applying Trichoderma.",
      },
      {
        name: "Improve drainage",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Create raised beds for susceptible crops. Install channels to divert water away from plant stems. Incorporate sand or coco peat into heavy clay soils. Ensure water never ponds near plant stems.",
        frequency: "Before planting; maintain permanent drainage infrastructure",
        timing: "Establish before monsoon season for maximum benefit",
        safetyNotes:
          "Root rot is almost entirely caused by waterlogged soil — no treatment is effective without addressing drainage first. A wilting plant may be overwatered, not underwatered — check roots before increasing irrigation.",
      },
      {
        name: "Reduce watering",
        method: "cultural",
        effort: "easy",
        howToApply:
          "Allow the top 5 cm of soil to dry between waterings. Check soil moisture by inserting a finger — water only when dry at 5 cm depth. Use drip irrigation for precision.",
        frequency: "Adjust watering schedule based on weather — significantly reduce in rainy season",
        timing: "Water in morning only to allow surface drying before evening",
        safetyNotes:
          "Overwatering is the leading cause of root rot. Plants showing early root rot symptoms need less water, not more — counter-intuitive but critical.",
      },
      {
        name: "Neem cake in soil",
        method: "soil",
        effort: "easy",
        howToApply:
          "Incorporate 2 kg neem cake per 10 m² into the top 15 cm of soil. For established plants, mix 500 g into the root zone as a top-dressing and water in well.",
        frequency: "Once per season before planting",
        timing: "2–3 weeks before transplanting for best pre-planting soil suppression",
        safetyNotes:
          "Neem cake suppresses soil fungal pathogens (Pythium, Phytophthora) and simultaneously improves soil nitrogen levels.",
      },
    ],
    seasonalRisk: { sw_monsoon: "high", ne_monsoon: "high" },
    plantsAffected: ["Papaya", "Jasmine", "Drumstick", "Vegetables"],
  },
  {
    id: "rhizome_rot",
    name: "Rhizome Rot",
    tamilName: "கிழங்கு அழுகல்",
    category: "fungal",
    emoji: "🍄",
    identification:
      "Yellowing and wilting of lower leaves. Rhizome is soft and brown when cut. Water-soaked rot at base.",
    damageDescription:
      "Destroys rhizome leading to plant collapse. Spreads to adjacent plants through soil. Common in poorly drained fields.",
    organicPrevention: [
      "Plant in well-drained raised beds",
      "Use disease-free planting material",
    ],
    organicTreatments: [
      {
        name: "Trichoderma treatment",
        method: "soil",
        effort: "moderate",
        howToApply:
          "Mix 100 g Trichoderma viride into 5 kg compost first. Apply to planting hole before transplanting. For standing crops, drench root zone with 100 g in 10 L water per plant.",
        frequency: "At planting; repeat every 45 days in affected fields",
        timing: "Apply to moist soil after watering for best colonisation",
        safetyNotes:
          "Remove and destroy affected rhizomes before treating remaining healthy plants. Do not apply with synthetic fungicides.",
      },
      {
        name: "Improve drainage",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Raise beds 15–20 cm above ground level for ginger, turmeric and banana. Dig drainage channels between rows. In heavy soils, mix in coarse sand at 25% by volume before planting.",
        frequency: "Before planting; maintain drainage throughout the season",
        timing: "Before monsoon season",
        safetyNotes:
          "Never plant ginger, turmeric or banana in poorly drained areas — rhizome rot will be endemic and severe every rainy season.",
      },
      {
        name: "Neem cake application",
        method: "soil",
        effort: "easy",
        howToApply:
          "Mix 2 kg neem cake per 10 m² into topsoil before planting. For standing crops, apply 500 g around each plant and incorporate into top soil layer.",
        frequency: "At planting and once mid-season",
        timing: "2 weeks before transplanting for best effect",
        safetyNotes:
          "Combine with Trichoderma treatment for best suppression of rhizome rot pathogens. Neem cake also provides organic nitrogen.",
      },
    ],
    seasonalRisk: { sw_monsoon: "high", ne_monsoon: "moderate" },
    plantsAffected: ["Banana", "Turmeric", "Ginger"],
  },
  {
    id: "stem_rot",
    name: "Stem Rot",
    tamilName: "தண்டு அழுகல்",
    category: "fungal",
    emoji: "🍄",
    identification:
      "Water-soaked lesions on stem near soil line. Stem becomes soft, dark and collapses. White mycelium may be visible.",
    damageDescription:
      "Stem collapse leads to plant death. Spreads through contaminated soil. Common in waterlogged conditions.",
    organicPrevention: [
      "Avoid waterlogging near stem base",
      "Mulch to prevent soil splash",
    ],
    organicTreatments: [
      {
        name: "Trichoderma soil treatment",
        method: "soil",
        effort: "moderate",
        howToApply:
          "Mix 100 g Trichoderma viride into 5 kg compost. Apply to planting zone. For established plants with stem rot, drench soil around affected stem with 100 g in 10 L water.",
        frequency: "At planting; repeat at 45-day intervals in affected plots",
        timing: "Apply when soil is moist after irrigation",
        safetyNotes:
          "Remove affected plant debris before treating soil. Do not apply with synthetic fungicides.",
      },
      {
        name: "Improve drainage",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Raise beds or create channels to prevent water pooling around stem bases. Use dry mulch (straw, coco peat) around stem base to prevent soil splash onto stems.",
        frequency: "Before planting; maintain permanently during wet season",
        timing: "Before onset of monsoon",
        safetyNotes:
          "Stem rot is triggered almost entirely by waterlogging — addressing drainage and water splash is the primary intervention. No spray treatment is effective without correcting water management.",
      },
      {
        name: "Copper-based spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 g copper oxychloride per litre water. Spray on the lower stem and as a soil drench around the stem base as a protective barrier.",
        frequency: "Every 10–14 days during wet season as a preventive",
        timing: "Morning or evening",
        safetyNotes:
          "Pre-harvest interval: 7 days. Copper cannot cure established rot but can protect healthy stem tissue adjacent to developing lesions.",
      },
    ],
    seasonalRisk: { sw_monsoon: "high", ne_monsoon: "moderate" },
    plantsAffected: ["Timber trees", "Vegetables"],
  },
  {
    id: "damping_off",
    name: "Damping Off",
    tamilName: "நாற்று அழுகல்",
    category: "fungal",
    emoji: "💧",
    identification:
      "Seedlings collapse at soil line. Stem pinches at base and seedling falls over. Seeds may rot before emergence.",
    damageDescription:
      "Kills seedlings before or just after emergence. Can wipe out entire nursery trays. Caused by Pythium/Rhizoctonia fungi.",
    organicPrevention: [
      "Use well-drained sterile potting mix",
      "Avoid overwatering seedlings",
      "Provide good air circulation in nursery",
    ],
    organicTreatments: [
      {
        name: "Trichoderma seed treatment",
        method: "soil",
        effort: "moderate",
        howToApply:
          "Coat seeds with 10 g Trichoderma viride per kg seeds before sowing. Alternatively, drench nursery trays with 50 g Trichoderma in 10 L water before sowing — repeat at 15 days if symptoms appear.",
        frequency: "Once at sowing as a preventive; cannot cure established damping off",
        timing: "At sowing time — Trichoderma is a preventive, not a curative",
        safetyNotes:
          "Do not apply with fungicide-dressed seeds or synthetic fungicides. Trichoderma cannot cure established damping off — it works by colonising soil before the pathogen establishes.",
      },
      {
        name: "Well-drained soil",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Use a seedling mix of equal parts coco peat, coarse sand and compost. Ensure all trays have adequate drainage holes. Before use, sterilise potting mix by solar pasteurisation — cover moist soil under transparent plastic for 4–6 weeks in summer heat.",
        frequency: "Permanent practice for all nursery operations",
        timing: "Set up and sterilise mix before sowing",
        safetyNotes:
          "Solar pasteurisation kills Pythium and Rhizoctonia spores without chemicals. Prepare sterilised mix well in advance of sowing season.",
      },
      {
        name: "Avoid overwatering",
        method: "cultural",
        effort: "easy",
        howToApply:
          "Water seedling trays only when the top 1 cm feels dry. Use a fine mist nozzle to avoid disturbing soil surface. Avoid wetting seedling stems — water at soil level only.",
        frequency: "Daily assessment — water when needed, not on a fixed schedule",
        timing: "Morning only, so foliage dries completely before evening",
        safetyNotes:
          "The most common cause of damping off is overwatering combined with poor air circulation. Ensure continuous airflow around seedling trays — a small fan is very effective in enclosed nurseries.",
      },
      {
        name: "Cinnamon powder",
        method: "soil",
        effort: "easy",
        howToApply:
          "Dust a thin, even layer of food-grade cinnamon powder on the soil surface of seedling trays after sowing. Cinnamon contains cinnamaldehyde which has natural antifungal properties.",
        frequency: "At sowing; reapply lightly after watering washes it away",
        timing: "At sowing and after each watering event",
        safetyNotes:
          "Use as a supporting treatment alongside Trichoderma — cinnamon alone is insufficient for severe infections. It is a safe, low-cost preventive addition to standard nursery hygiene.",
      },
    ],
    seasonalRisk: { sw_monsoon: "high", ne_monsoon: "moderate" },
    plantsAffected: ["Tomato", "Chilli", "Brinjal", "Papaya"],
  },
  {
    id: "rust",
    name: "Rust",
    tamilName: "துரு நோய்",
    category: "fungal",
    emoji: "🍂",
    identification:
      "Orange-brown powdery pustules on leaf undersides. Upper leaf surface shows yellow spots corresponding to pustules.",
    damageDescription:
      "Reduces photosynthesis, causes premature leaf fall. Weakens plants over multiple seasons. Spores spread by wind.",
    organicPrevention: [
      "Remove infected leaves promptly",
      "Ensure good air circulation",
    ],
    organicTreatments: [
      {
        name: "Sulfur-based spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Dissolve 2–3 g wettable sulfur per litre water. Spray on leaf undersides where orange-brown pustules are visible — thorough coverage is critical.",
        frequency: "Every 7–10 days for 2–3 applications",
        timing: "Morning only. NEVER apply above 32°C — severe, irreversible leaf burn.",
        safetyNotes:
          "Do NOT apply within 2 weeks of any oil spray. Do NOT apply above 32°C. Wear gloves and a dust mask — sulfur is a respiratory irritant.",
      },
      {
        name: "Neem oil",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on leaf undersides focusing on pustule areas. Disrupts spore germination.",
        frequency: "Every 5–7 days",
        timing: "Evening or early morning",
        safetyNotes:
          "Pre-harvest interval: 24 hours. More effective as a preventive than curative — begin treatment early at first signs of rust.",
      },
      {
        name: "Remove infected leaves",
        method: "manual",
        effort: "easy",
        howToApply:
          "Remove all leaves showing orange pustules. Place directly into a bag — do not shake leaves as spores will spread. Burn all removed material.",
        frequency: "Weekly throughout the active rust period",
        timing: "Any time; do not handle affected plants in wind",
        safetyNotes:
          "Wear gloves — rust spores are a respiratory irritant if inhaled in quantity. Destroy removed leaves by burning — spores survive composting and wintering.",
      },
      {
        name: "Improve air circulation",
        method: "cultural",
        effort: "easy",
        howToApply:
          "Prune interior branches and thin dense canopy. Remove weeds. Maintain recommended plant spacing. Avoid overhead irrigation.",
        frequency: "Once or twice per season",
        timing: "During dry weather for wound healing after pruning",
        safetyNotes:
          "Good air circulation reduces leaf wetness — rust requires moisture on leaf surfaces for spore germination. Structural improvement is more durable than repeated spraying.",
      },
    ],
    seasonalRisk: { sw_monsoon: "moderate", ne_monsoon: "moderate" },
    plantsAffected: ["Jasmine", "Beans"],
  },
  {
    id: "bud_rot",
    name: "Bud Rot",
    tamilName: "குருத்து அழுகல்",
    scientificName: "Phytophthora palmivora",
    category: "fungal",
    emoji: "🍄",
    identification:
      "Yellowing and drooping of central whorl of coconut fronds. Rotten smell from crown. Spindle leaf falls easily.",
    damageDescription:
      "Destroys the growing point (bud) of coconut palm. Fatal if not treated early. Most common in young palms during monsoon.",
    organicPrevention: [
      "Ensure drainage around palm base",
      "Apply Bordeaux paste preventively before monsoon",
    ],
    organicTreatments: [
      {
        name: "Bordeaux paste on crown",
        method: "spray",
        effort: "moderate",
        howToApply:
          "Make Bordeaux paste: dissolve 100 g copper sulfate in 1 L water; dissolve 100 g quicklime in 1 L water separately. Mix both together. Apply the paste directly into the coconut crown (between fronds at the growing point) using a long brush.",
        frequency: "Preventively before monsoon onset; repeat monthly during SW Monsoon",
        timing: "Apply only during dry weather — paste must dry before rain arrives",
        safetyNotes:
          "Bordeaux paste is protective — it cannot cure bud rot that has already destroyed the growing tip. Wear gloves. Act at the FIRST sign of crown yellowing — delay is fatal for the palm.",
      },
      {
        name: "Remove infected tissue",
        method: "manual",
        effort: "easy",
        howToApply:
          "Using a clean sharp knife, carefully remove all soft, rotted tissue from the crown until firm, healthy white tissue is reached. Disinfect the wound with 1% copper sulfate solution, then immediately apply a thick layer of Bordeaux paste.",
        frequency: "Single intervention on discovery; follow with monthly preventive Bordeaux paste",
        timing: "During dry weather only — do not treat in rain as copper is washed away",
        safetyNotes:
          "If the bud (growing point) is completely rotted through, the palm cannot be saved — focus resources on protecting adjacent healthy palms. Wear gloves and disinfect all tools.",
      },
      {
        name: "Improve drainage",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Clear drainage channels around the palm basin. Ensure water does not pool at the base after rain. Mound soil slightly away from the trunk base to encourage water to flow away.",
        frequency: "Before monsoon; maintain drainage after each heavy rain event",
        timing: "Pre-monsoon (May) preparation",
        safetyNotes:
          "Waterlogging around palm base greatly increases susceptibility to Phytophthora bud rot — keeping the root zone well-drained is critical preventive management.",
      },
      {
        name: "Copper oxychloride",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 4 g copper oxychloride per litre water. Spray directly into the crown area between fronds covering all inner surfaces thoroughly.",
        frequency: "Monthly during monsoon as a protective spray",
        timing: "During dry spells within the monsoon season",
        safetyNotes:
          "Pre-harvest interval: 7 days. Copper is protective, not curative — must be applied before infection or at very early stages.",
      },
    ],
    seasonalRisk: { sw_monsoon: "high", ne_monsoon: "high" },
    plantsAffected: ["Coconut"],
  },
  {
    id: "early_blight",
    name: "Early Blight",
    tamilName: "ஆரம்ப கருகல்",
    scientificName: "Alternaria solani",
    category: "fungal",
    emoji: "🍂",
    identification:
      "Dark brown spots with concentric rings (target-board pattern) on older leaves. Starts from lower leaves.",
    damageDescription:
      "Progressive defoliation from bottom up. Reduces fruit size and yield. Common in stressed plants.",
    organicPrevention: [
      "Mulch to prevent soil splash",
      "Adequate spacing for air circulation",
      "Avoid overhead irrigation",
    ],
    organicTreatments: [
      {
        name: "Copper-based fungicide",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 g copper hydroxide or copper oxychloride per litre water. Spray on all plant surfaces starting with lower leaves where disease initiates. Coat both leaf surfaces.",
        frequency: "Every 7–10 days from first symptom appearance",
        timing: "Morning or evening",
        safetyNotes:
          "Pre-harvest interval: 7 days. Copper is protective — early application stops disease progression. Wear gloves.",
      },
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on both leaf surfaces.",
        frequency: "Every 5–7 days, alternating with copper spray",
        timing: "Evening or early morning",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Alternating neem and copper reduces copper accumulation in soil while maintaining disease control.",
      },
      {
        name: "Remove infected leaves",
        method: "manual",
        effort: "easy",
        howToApply:
          "Remove all leaves showing target-board spots, beginning with the lowest branches. Bag and burn all removed material.",
        frequency: "Weekly throughout the growing season",
        timing: "Any time",
        safetyNotes:
          "Do not compost infected material — Alternaria spores survive in soil on plant debris. Early removal significantly reduces the inoculum load for the current and next season.",
      },
    ],
    seasonalRisk: { sw_monsoon: "moderate", ne_monsoon: "moderate" },
    plantsAffected: ["Tomato"],
  },
  {
    id: "late_blight",
    name: "Late Blight",
    tamilName: "பிற்கால கருகல்",
    scientificName: "Phytophthora infestans",
    category: "fungal",
    emoji: "🍂",
    identification:
      "Water-soaked dark green/brown lesions on leaves, spreading rapidly. White mold on leaf undersides in humid conditions.",
    damageDescription:
      "Can destroy entire crop within days in cool wet weather. Affects leaves, stems and fruits. Devastating to tomato and potato.",
    organicPrevention: [
      "Use resistant varieties",
      "Avoid overhead irrigation",
      "Increase spacing for air flow",
    ],
    organicTreatments: [
      {
        name: "Copper-based fungicide",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 4 g copper oxychloride per litre water. Spray preventively before symptoms appear, or at first sign of water-soaked lesions. Cover all plant surfaces thoroughly.",
        frequency: "Every 5–7 days during cool wet weather (NE Monsoon and Cool Dry season)",
        timing: "Morning — Late Blight spreads at night in humid conditions; morning application provides daytime protection",
        safetyNotes:
          "URGENT — Late Blight can destroy an entire crop in 5–7 days. Act immediately at first symptoms. Pre-harvest interval: 7 days. Alert neighbouring farmers.",
      },
      {
        name: "Remove and burn infected leaves",
        method: "manual",
        effort: "easy",
        howToApply:
          "Remove all leaves and stems showing water-soaked dark lesions. Bag removed material immediately — do not leave it in the field or on paths. Burn all removed material that day.",
        frequency: "Daily removal during active infection",
        timing: "Act immediately — every hour of delay increases infection spread",
        safetyNotes:
          "Do NOT compost — Phytophthora spores are extremely persistent and can spread to neighbouring gardens. Late Blight spreads via wind-carried sporangia — alert neighbours to protect their crops.",
      },
      {
        name: "Improve air circulation",
        method: "cultural",
        effort: "easy",
        howToApply:
          "Stake and tie tomato plants to create an open, upright canopy. Remove all side suckers. Keep lower leaves off the soil surface. Use drip irrigation instead of overhead watering.",
        frequency: "Ongoing weekly maintenance throughout the growing season",
        timing: "Throughout crop season — begin at transplanting",
        safetyNotes:
          "Cool, wet, humid conditions are ideal for Late Blight — improving air circulation is the most important long-term preventive structural measure.",
      },
    ],
    seasonalRisk: { ne_monsoon: "high", cool_dry: "moderate" },
    plantsAffected: ["Tomato"],
  },
  {
    id: "phomopsis_blight",
    name: "Phomopsis Blight",
    tamilName: "போமாப்சிஸ் கருகல்",
    category: "fungal",
    emoji: "🍂",
    identification:
      "Circular pale brown spots on leaves and fruit. Fruit rot starts at blossom end. Pycnidia (tiny dots) visible on lesions.",
    damageDescription:
      "Fruit rot and leaf blight in brinjal. Can cause significant pre- and post-harvest losses.",
    organicPrevention: [
      "Use healthy seed",
      "Remove crop debris after harvest",
    ],
    organicTreatments: [
      {
        name: "Copper-based fungicide",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 g copper oxychloride per litre water. Spray on all plant surfaces including developing fruit, focusing on the blossom end where infection begins.",
        frequency: "Every 7–10 days during wet season; begin at flowering",
        timing: "Morning or evening",
        safetyNotes:
          "Pre-harvest interval: 7 days. Start spraying preventively at the flowering stage before fruit set — infection enters through the blossom end.",
      },
      {
        name: "Remove infected parts",
        method: "manual",
        effort: "easy",
        howToApply:
          "Remove spotted leaves and infected fruit showing blossom-end rot. Bag and burn all removed material. Do not leave infected fruit on the plant or on the ground.",
        frequency: "Weekly throughout the crop season",
        timing: "Any time",
        safetyNotes:
          "Do not compost infected material. Disinfect pruning tools with dilute bleach between plants.",
      },
    ],
    seasonalRisk: { sw_monsoon: "moderate", ne_monsoon: "moderate" },
    plantsAffected: ["Brinjal"],
  },
  {
    id: "leaf_blight",
    name: "Leaf Blight",
    tamilName: "இலைக் கருகல்",
    category: "fungal",
    emoji: "🍂",
    identification:
      "Large irregular brown lesions starting from leaf tips/margins. Rapid browning and drying of leaf tissue.",
    damageDescription:
      "Large-scale leaf damage reducing canopy. Affects photosynthesis and yield. Common in coconut and other palms.",
    organicPrevention: [
      "Remove and destroy affected fronds",
      "Maintain adequate plant nutrition",
    ],
    organicTreatments: [
      {
        name: "Copper fungicide spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3–4 g copper oxychloride per litre water. Spray on both sides of leaves focusing on tip and marginal lesion areas. Use high-volume sprayer for tree canopy.",
        frequency: "Every 10–14 days during monsoon season",
        timing: "Morning or evening",
        safetyNotes:
          "Pre-harvest interval: 7 days. Copper is protective — spray before lesions spread. Thorough coverage of leaf undersides is important.",
      },
      {
        name: "Remove affected fronds",
        method: "manual",
        effort: "easy",
        howToApply:
          "Cut severely affected fronds at the petiole base. Burn all removed fronds immediately. Avoid dragging removed fronds through the healthy canopy during removal.",
        frequency: "As symptoms appear; do not allow blighted fronds to remain on the tree",
        timing: "During dry weather when possible",
        safetyNotes:
          "Do not compost blighted fronds — spores survive. Keep pruning tools clean with dilute bleach solution between trees.",
      },
      {
        name: "Improve air circulation",
        method: "cultural",
        effort: "easy",
        howToApply:
          "Thin the canopy by removing crossing interior branches. Maintain recommended spacing between trees. Remove weeds that trap humidity at the canopy base.",
        frequency: "Twice per season — before monsoon and after monsoon",
        timing: "During dry weather before monsoon onset",
        safetyNotes:
          "Dense, humid canopies create persistent leaf wetness — the primary condition for Leaf Blight spread. Open canopy management is essential in high-rainfall areas.",
      },
    ],
    seasonalRisk: { sw_monsoon: "moderate", ne_monsoon: "moderate" },
    plantsAffected: ["Coconut", "Jasmine"],
  },
  {
    id: "dieback",
    name: "Dieback",
    tamilName: "நுனிக் கருகல்",
    category: "fungal",
    emoji: "🍄",
    identification:
      "Progressive drying of twigs from tips backward. Dark discolouration of affected branches. Bark peeling.",
    damageDescription:
      "Branch-by-branch death. Reduces canopy and yield. Can kill young trees. Often associated with Colletotrichum.",
    organicPrevention: [
      "Prune dead wood promptly",
      "Maintain balanced nutrition",
    ],
    organicTreatments: [
      {
        name: "Prune and burn affected branches",
        method: "manual",
        effort: "moderate",
        howToApply:
          "Cut affected branch 10–15 cm below the visible dieback margin, cutting back into firm healthy green wood. Burn all removed material immediately.",
        frequency: "As soon as dieback is noticed; monitor cut ends for further progression",
        timing: "During dry weather — avoid pruning in rain to prevent fungal entry",
        safetyNotes:
          "Always cut back to healthy wood — cutting within affected tissue allows disease to continue progressing. Disinfect tools between cuts with 1% bleach solution.",
      },
      {
        name: "Copper fungicide paste on cuts",
        method: "spray",
        effort: "moderate",
        howToApply:
          "Make a thick paste of copper oxychloride (100 g in 200 ml water). Paint directly onto all pruning wounds and exposed wood immediately after cutting, using a brush.",
        frequency: "Apply immediately after each pruning cut — do not delay",
        timing: "Immediately after cutting, before spores can enter",
        safetyNotes:
          "Every fresh cut is a fungal entry point — never leave pruning wounds unsealed in dieback-prone areas like mango orchards. Wear gloves.",
      },
      {
        name: "Balanced nutrition",
        method: "cultural",
        effort: "easy",
        howToApply:
          "Apply balanced organic fertiliser (compost + neem cake + bone meal or wood ash) to the root zone. Test soil pH — dieback is worsened by acidic soil or potassium deficiency.",
        frequency: "Once per season at the start of the growing period",
        timing: "Pre-monsoon or pre-fruiting stage",
        safetyNotes:
          "Stressed, nutrient-deficient plants are far more susceptible to dieback. Adequate potassium improves plant disease resistance.",
      },
    ],
    seasonalRisk: { summer: "moderate", cool_dry: "moderate" },
    plantsAffected: ["Chilli", "Mango", "Guava"],
  },
  {
    id: "gummosis",
    name: "Gummosis",
    tamilName: "பிசின் நோய்",
    category: "fungal",
    emoji: "🍄",
    identification:
      "Oozing of gummy sap from bark cracks on trunk and branches. Dark water-soaked bark lesions.",
    damageDescription:
      "Bark cankers girdle branches causing dieback. Gum exudation weakens tree. Common in citrus during wet weather.",
    organicPrevention: [
      "Avoid trunk injuries",
      "Maintain good drainage around base",
    ],
    organicTreatments: [
      {
        name: "Bordeaux paste on trunk",
        method: "spray",
        effort: "moderate",
        howToApply:
          "Scrape away all loose bark and gummy exudate from the lesion using a clean knife. Apply 1% copper sulfate solution to the wound. Then paint a thick layer of Bordeaux paste (100 g copper sulfate + 100 g lime per litre) onto the scraped wound and the surrounding bark.",
        frequency: "Apply after scraping; reapply every 2–3 months or after heavy rain removes paste",
        timing: "During dry weather so paste adheres and dries before rain",
        safetyNotes:
          "Remove and burn all scraped bark material — it harbours fungal spores. Wear gloves — copper sulfate is toxic. Mark treated trees to monitor healing progress.",
      },
      {
        name: "Improve drainage",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Create a basin around the trunk that slopes away from the stem. Install drainage channels to divert water away from the trunk base after rain. Avoid mounding soil against the trunk.",
        frequency: "Permanent cultural practice; inspect and clear channels after each monsoon",
        timing: "Before monsoon season",
        safetyNotes:
          "Water accumulation at trunk base is the primary cause of gummosis in citrus — ensuring dry bark conditions at the trunk base prevents and controls the disease long-term.",
      },
      {
        name: "Remove infected bark",
        method: "manual",
        effort: "moderate",
        howToApply:
          "Use a clean sharp knife to scrape out all soft, discoloured bark within the lesion. Continue scraping until firm, healthy tissue is reached. Disinfect the exposed area with 1% copper sulfate solution. Apply Bordeaux paste immediately.",
        frequency: "Single debridement; monitor for re-growth of lesion every 2 months",
        timing: "During dry weather only",
        safetyNotes:
          "Sterilise knife with bleach between trees. Burn all removed bark. If the lesion has girdled more than 50% of the trunk circumference, the tree may not recover fully.",
      },
    ],
    seasonalRisk: { sw_monsoon: "high", ne_monsoon: "moderate" },
    plantsAffected: ["Lemon", "Citrus"],
  },
  {
    id: "sooty_mold",
    name: "Sooty Mold",
    tamilName: "கரிப்பூசணம்",
    category: "fungal",
    emoji: "🍄",
    identification:
      "Black powdery coating on leaf surfaces. Easily wiped off unlike other leaf diseases. Grows on honeydew from sap-sucking insects.",
    damageDescription:
      "Blocks sunlight reducing photosynthesis. Cosmetic damage to fruits. Indicates underlying sap-sucking pest infestation.",
    organicPrevention: [
      "Control the underlying pest (aphids, mealybugs, scale)",
      "Wash honeydew off leaves periodically",
    ],
    organicTreatments: [
      {
        name: "Control sap-sucking insects first",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Identify the pest producing honeydew (aphids, mealybugs, scale insects or whiteflies) and apply the relevant organic treatment from the pest reference section. Sooty mold cannot be controlled without first stopping honeydew production.",
        frequency: "Treat the underlying pest per pest-specific schedule — all other sooty mold treatments are secondary",
        timing: "Treat pests first — do not focus on the mold until the pest is under control",
        safetyNotes:
          "Sooty mold is a symptom of a pest infestation, not a primary disease. Treating only the mold without controlling the pest is completely ineffective.",
      },
      {
        name: "Wash with soapnut water",
        method: "spray",
        effort: "easy",
        howToApply:
          "Soak 10 soapnut shells in 1 L water overnight, strain. Dilute 1:3. Use a soft cloth or sponge to gently wipe sooty mold off leaves and fruit surfaces.",
        frequency: "Every 5–7 days until mold clears (only effective once the pest is controlled)",
        timing: "Morning so leaves dry during the day",
        safetyNotes:
          "Do not scrub aggressively — leaf surface is delicate under the mold. Once the pest producing honeydew is controlled, sooty mold gradually washes off in rain.",
      },
      {
        name: "Neem oil spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 ml neem oil + 1 ml liquid soap per litre water. Spray on mold-covered surfaces — neem helps dissolve the mold and simultaneously controls residual pest insects.",
        frequency: "Every 5–7 days alongside pest control treatments",
        timing: "Evening or early morning",
        safetyNotes:
          "Pre-harvest interval: 24 hours. Wash fruit before eating. Neem addresses both the mold and the underlying pest in one application.",
      },
    ],
    seasonalRisk: { summer: "moderate", sw_monsoon: "moderate" },
    plantsAffected: ["Mango", "Lemon", "Coconut"],
  },
  {
    id: "stem_bleeding",
    name: "Stem Bleeding",
    tamilName: "தண்டு இரத்தக்கசிவு",
    category: "fungal",
    emoji: "🍄",
    identification:
      "Dark reddish-brown liquid oozing from trunk cracks in coconut palm. Bark becomes dark and depressed at lesion sites.",
    damageDescription:
      "Progressive bark decay, reduced nut yield, eventual palm decline. Caused by Thielaviopsis paradoxa.",
    organicPrevention: [
      "Avoid trunk injuries during climbing/harvest",
      "Maintain palm nutrition",
    ],
    organicTreatments: [
      {
        name: "Apply Bordeaux paste",
        method: "spray",
        effort: "moderate",
        howToApply:
          "Scrape away all bleeding bark and dark soft tissue using a clean chisel or knife until firm, healthy wood is reached. Swab the wound with 1% copper sulfate solution. Paint a thick layer of Bordeaux paste onto the entire wound and 5 cm of surrounding bark.",
        frequency: "Apply after scraping; reapply every 2–3 months or after heavy rain",
        timing: "During dry weather — paste must adhere and dry before rain",
        safetyNotes:
          "Wear gloves — copper sulfate is toxic. Burn all scraped material away from the palm. Mark treated palms to monitor healing progress monthly.",
      },
      {
        name: "Avoid trunk injury",
        method: "cultural",
        effort: "easy",
        howToApply:
          "Instruct all palm climbers to use soft rope slings or pole-climbing techniques that do not wound the bark. Seal any accidental wounds immediately with Bordeaux paste on the day of injury.",
        frequency: "Permanent practice — every person handling the palm must follow this protocol",
        timing: "Any time bark is accidentally damaged",
        safetyNotes:
          "Trunk wounds are the primary and almost exclusive entry point for Thielaviopsis — preventing injuries is more effective than all curative treatments combined.",
      },
      {
        name: "Neem cake basal application",
        method: "soil",
        effort: "easy",
        howToApply:
          "Apply 2–3 kg neem cake per palm in the root zone drip circle. Incorporate into topsoil and water thoroughly.",
        frequency: "Once per season before monsoon",
        timing: "Pre-monsoon (May)",
        safetyNotes:
          "Neem cake improves root health, soil biology and nitrogen levels — a healthy palm with strong root development is more resistant to stem bleeding.",
      },
    ],
    seasonalRisk: { sw_monsoon: "moderate", ne_monsoon: "moderate" },
    plantsAffected: ["Coconut"],
  },
  {
    id: "canker",
    name: "Canker",
    tamilName: "புண்",
    category: "fungal",
    emoji: "🍄",
    identification:
      "Sunken dead areas on bark of stems and branches. May crack and expose inner wood. Dark discolouration.",
    damageDescription:
      "Girdles branches causing dieback above the canker. Entry point for secondary infections. Reduces tree vigour.",
    organicPrevention: [
      "Protect bark from injuries",
      "Apply Bordeaux paste to pruning wounds",
    ],
    organicTreatments: [
      {
        name: "Copper-based spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3–4 g copper oxychloride per litre water. Spray on all plant surfaces — stem, branches and leaves — as a protective treatment, particularly after pruning operations.",
        frequency: "Every 10–14 days during monsoon; after every pruning operation",
        timing: "Morning or evening",
        safetyNotes:
          "Pre-harvest interval: 7 days. Copper protects healthy tissue around existing cankers but cannot cure established cankers. Pruning is more important than spraying.",
      },
      {
        name: "Remove and burn infected parts",
        method: "manual",
        effort: "easy",
        howToApply:
          "Prune branches with visible cankers at least 15 cm below the lowest canker margin, cutting into healthy wood. Seal all wounds immediately with Bordeaux paste. Burn all removed material.",
        frequency: "On discovery; monitor for new canker development monthly",
        timing: "During dry weather for wound healing",
        safetyNotes:
          "Disinfect pruning tools between every cut with 1:10 bleach solution — never transfer canker spores to healthy wood. Do not leave pruned material near the tree.",
      },
    ],
    seasonalRisk: { sw_monsoon: "moderate" },
    plantsAffected: ["Guava", "Mango"],
  },

  // ── Bacterial ────────────────────────────────────────────────────────────
  {
    id: "bacterial_wilt",
    name: "Bacterial Wilt",
    tamilName: "பாக்டீரிய வாடல்",
    scientificName: "Ralstonia solanacearum",
    category: "bacterial",
    emoji: "🦠",
    identification:
      "Sudden wilting of entire plant despite wet soil. Cut stem placed in water shows milky bacterial ooze streaming out.",
    damageDescription:
      "Rapid plant death — no recovery once wilting starts. Soil-borne pathogen persists for years. Devastating to solanaceous crops.",
    organicPrevention: [
      "Crop rotation with non-solanaceous crops",
      "Improve soil drainage",
      "Use resistant varieties where available",
    ],
    organicTreatments: [
      {
        name: "Trichoderma soil treatment",
        method: "soil",
        effort: "moderate",
        howToApply:
          "Mix 100 g Trichoderma viride into 10 kg well-composted manure. Apply 2 kg per m² in the planting zone and incorporate into soil 2–3 weeks before transplanting.",
        frequency: "At planting; repeat at 45-day intervals as a suppressive treatment for healthy surrounding plants",
        timing: "Apply 2–3 weeks before transplanting for best soil colonisation",
        safetyNotes:
          "Trichoderma cannot cure established bacterial wilt. Remove and destroy infected plants immediately. Apply Trichoderma to protect healthy plants in adjacent areas.",
      },
      {
        name: "Pseudomonas fluorescens",
        method: "soil",
        effort: "moderate",
        howToApply:
          "Mix 250 g Pseudomonas fluorescens (Pf1) into 10 kg compost. Apply to root zone at planting. Alternatively, drench root zone with 5 g in 1 L water per plant every 30 days.",
        frequency: "At planting and every 30 days as a preventive soil treatment",
        timing: "Apply to moist soil after irrigation",
        safetyNotes:
          "Store product in the refrigerator. Do NOT apply with synthetic bactericides. Pseudomonas works by colonising roots and producing antibiotics that suppress Ralstonia.",
      },
      {
        name: "Crop rotation",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Do not plant tomato, brinjal or chilli in the same bed for a minimum of 3 years after bacterial wilt has occurred. Use non-solanaceous crops (corn, banana, leafy vegetables) in the rotation. Soil solarisation (covering moist soil with transparent plastic for 6 weeks in summer) before replanting reduces soil pathogen levels.",
        frequency: "Mandatory 3-year rotation after bacterial wilt outbreak",
        timing: "Implement immediately after removing the infected crop",
        safetyNotes:
          "Ralstonia solanacearum survives in soil for many years — rotation is the most important long-term management tool. Solarisation significantly reduces inoculum levels.",
      },
      {
        name: "Improve drainage",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Raise beds 20–25 cm for tomato and solanaceous crops. Create channels to divert waterflow away from roots. Incorporate sand and organic matter into clay soils before planting.",
        frequency: "Before every planting season",
        timing: "2–3 weeks before transplanting",
        safetyNotes:
          "Bacterial wilt thrives in warm, waterlogged soil — drainage is the most critical structural prevention. Waterlogged roots create entry points for the pathogen.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate" },
    plantsAffected: ["Tomato", "Brinjal", "Chilli"],
  },
  {
    id: "bacterial_blight",
    name: "Bacterial Blight",
    tamilName: "பாக்டீரிய கருகல்",
    category: "bacterial",
    emoji: "🦠",
    identification:
      "Water-soaked lesions on leaves that turn brown. Angular spots limited by veins. Gummy exudates in humid conditions.",
    damageDescription:
      "Severe defoliation and stem cankers. Reduces yield significantly. Spreads by wind-driven rain and contaminated tools.",
    organicPrevention: [
      "Use certified disease-free seed/planting material",
      "Avoid working in wet fields",
    ],
    organicTreatments: [
      {
        name: "Copper-based spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3 g copper hydroxide or copper oxychloride per litre water. Spray on all plant surfaces including stems and leaf undersides at first sign of angular water-soaked spots.",
        frequency: "Every 7–10 days during wet season; preventively before expected rain",
        timing: "Morning or evening. Do not spray in wind-driven rain — this actively spreads the bacteria.",
        safetyNotes:
          "Pre-harvest interval: 7 days. Do not work in the field when foliage is wet — contaminated hands and tools spread bacteria rapidly between plants. Disinfect tools between plants.",
      },
      {
        name: "Resistant varieties",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Select and plant tapioca/cassava varieties known to have resistance to bacterial blight. Obtain certified planting material from government agriculture farms or research stations.",
        frequency: "One-time planting decision",
        timing: "Before planting season",
        safetyNotes:
          "Variety resistance is the most durable and sustainable long-term management strategy for bacterial blight in tapioca.",
      },
      {
        name: "Crop rotation",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "After a bacterial blight outbreak, do not replant tapioca in the same field for at least 1 full season. Use legume crops (groundnut, cowpea) to improve soil and break the disease cycle.",
        frequency: "Minimum 1-season break from tapioca after outbreak",
        timing: "Implement after harvest of infected crop",
        safetyNotes:
          "Use only disease-free stakes from verified healthy plants for subsequent planting — infected stakes transmit bacterial blight to 100% of new plants.",
      },
      {
        name: "Remove infected parts",
        method: "manual",
        effort: "easy",
        howToApply:
          "Cut out stems and branches showing angular water-soaked lesions. Destroy by burning. Disinfect tools between every cut with dilute bleach solution.",
        frequency: "Weekly during monsoon season when disease is most active",
        timing: "During dry weather — avoid working with infected plants in rain",
        safetyNotes:
          "Movement through wet foliage spreads bacterial blight dramatically. Avoid working in the field after rain or when foliage is wet.",
      },
    ],
    seasonalRisk: { sw_monsoon: "high", ne_monsoon: "moderate" },
    plantsAffected: ["Tapioca"],
  },
  {
    id: "wilt",
    name: "Wilt",
    tamilName: "வாடல் நோய்",
    category: "bacterial",
    emoji: "🥀",
    identification:
      "Progressive wilting of plant despite adequate irrigation. Leaves lose turgidity, droop and dry. Vascular browning on cut stem.",
    damageDescription:
      "Plant death from blocked vascular system. Soil pathogen that persists between seasons. Can affect multiple plant families.",
    organicPrevention: [
      "Use resistant varieties",
      "Ensure good drainage",
      "Treat soil with Trichoderma before planting",
    ],
    organicTreatments: [
      {
        name: "Trichoderma soil treatment",
        method: "soil",
        effort: "moderate",
        howToApply:
          "Mix 100 g Trichoderma viride into 10 kg compost. Apply 2 kg per m² and incorporate before planting. For established plants, drench root zone with 100 g in 10 L water.",
        frequency: "At planting; every 45 days as a preventive for surrounding healthy plants",
        timing: "2–3 weeks before transplanting; apply to moist soil",
        safetyNotes:
          "Trichoderma is a preventive, not a cure. Remove and burn affected plants (including roots) immediately — root debris in soil is the primary source of future infections.",
      },
      {
        name: "Pseudomonas fluorescens",
        method: "soil",
        effort: "moderate",
        howToApply:
          "Mix 250 g Pseudomonas fluorescens into 10 kg compost. Apply at planting. Alternatively, drench root zone with 5 g per litre water per plant.",
        frequency: "At planting and every 30 days",
        timing: "Apply to moist soil after irrigation",
        safetyNotes:
          "Refrigerate product until use. Do NOT combine with synthetic bactericides or fungicides.",
      },
      {
        name: "Crop rotation",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Do not replant guava or jasmine in the same location for 2–3 years after wilt. Soil solarisation with transparent plastic for 6 weeks in summer reduces Fusarium inoculum significantly.",
        frequency: "Mandatory 2–3 year gap after wilt outbreak",
        timing: "Immediately after removing infected plant",
        safetyNotes:
          "Remove and burn all affected plants including roots — leaving infected roots in soil contaminates the site for years.",
      },
      {
        name: "Improve drainage",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Raise planting beds and create channels to divert water away from root zones. Incorporate sand and compost into clay soils before planting.",
        frequency: "Before every planting",
        timing: "Before planting season",
        safetyNotes:
          "Waterlogged roots are highly susceptible to wilt pathogens — drainage improvement is the structural foundation of all management.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate" },
    plantsAffected: ["Guava", "Jasmine"],
  },
  {
    id: "citrus_canker",
    name: "Citrus Canker",
    tamilName: "எலுமிச்சை புண்",
    scientificName: "Xanthomonas citri",
    category: "bacterial",
    emoji: "🦠",
    identification:
      "Raised corky lesions on leaves, stems and fruit with oily margin. Crater-like appearance. Yellow halo around lesions.",
    damageDescription:
      "Defoliation, fruit drop, fruit blemish reducing market value. Spreads by wind-driven rain. Very contagious.",
    organicPrevention: [
      "Windbreaks to reduce rain splash spread",
      "Disinfect pruning tools between trees",
    ],
    organicTreatments: [
      {
        name: "Copper-based spray",
        method: "spray",
        effort: "easy",
        howToApply:
          "Mix 3–4 g copper oxychloride or copper hydroxide per litre water. Spray all plant surfaces — leaves, stems and fruit — at monthly intervals and additionally after each new flush emergence.",
        frequency: "Monthly; additionally after each new flush emergence and after rain",
        timing: "Morning or evening. Do not spray in wind — bacteria spread via rain splash.",
        safetyNotes:
          "Pre-harvest interval: 7 days. Very contagious — disinfect hands and tools between every tree. Copper sprays reduce new infections but cannot cure existing corky lesions.",
      },
      {
        name: "Remove and burn infected parts",
        method: "manual",
        effort: "easy",
        howToApply:
          "Prune all leaves, shoots and fruit showing raised corky lesions. Cut 10 cm beyond the last visible lesion into healthy tissue. Burn all removed material immediately.",
        frequency: "Whenever lesions are detected; additional thorough pruning after monsoon season",
        timing: "During dry weather only",
        safetyNotes:
          "CRITICAL: Disinfect tools with 1% sodium hypochlorite (bleach) between every single cut and between every tree — Citrus Canker is extremely contagious. Do not allow removed material to contact healthy plants.",
      },
      {
        name: "Avoid rain splash",
        method: "cultural",
        effort: "easy",
        howToApply:
          "Plant tall windbreak rows (banana, drumstick, casuarina) around the citrus block to block wind-driven rain. Use only drip irrigation — no overhead watering. Avoid all orchard operations during and immediately after rain.",
        frequency: "Permanent orchard management — establish windbreaks before first monsoon",
        timing: "Establish windbreaks in the season before orchard establishment",
        safetyNotes:
          "Wind-driven rain is the primary vector for citrus canker spread between trees and between orchards. Windbreak protection significantly reduces spread in endemic areas.",
      },
    ],
    seasonalRisk: { sw_monsoon: "high", ne_monsoon: "high" },
    plantsAffected: ["Lemon", "Lime", "Orange"],
  },
  {
    id: "panama_wilt",
    name: "Panama Wilt",
    tamilName: "பனாமா வாடல்",
    scientificName: "Fusarium oxysporum f.sp. cubense",
    category: "bacterial",
    emoji: "🥀",
    identification:
      "Yellowing of older leaves starting from margins. Leaves break at petiole. Pseudostem splitting. Brown vascular discolouration.",
    damageDescription:
      "Soil-borne — persists for decades. Kills plants before harvest. No cure once infected. Plant resistant varieties only.",
    organicPrevention: [
      "Use resistant banana varieties (Poovan, Karpuravalli)",
      "Avoid planting in previously infected soil",
    ],
    organicTreatments: [
      {
        name: "Use resistant varieties",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Plant only Panama wilt-resistant banana varieties: Poovan (Rasthali), Karpuravalli, Nendran or Red Banana. Avoid susceptible varieties (Robusta, Cavendish) in all fields with any Panama wilt history.",
        frequency: "One-time variety selection decision at planting",
        timing: "Before planting season",
        safetyNotes:
          "There is NO effective cure for Panama wilt. Variety selection is the ONLY reliable management strategy. Fusarium oxysporum f.sp. cubense persists in soil for 30+ years.",
      },
      {
        name: "Trichoderma soil treatment",
        method: "soil",
        effort: "moderate",
        howToApply:
          "Mix 250 g Trichoderma viride per planting hole into compost. Apply 500 ml/10 L Trichoderma drench per plant every 45 days to suppress soil Fusarium levels around healthy plants.",
        frequency: "At planting and every 45 days",
        timing: "Apply to moist soil after irrigation",
        safetyNotes:
          "Trichoderma can suppress Fusarium levels in soil but cannot cure infected plants. Remove and burn infected plants including the entire rhizome immediately — infected rhizomes contaminate surrounding soil.",
      },
      {
        name: "Avoid infected fields",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "If a field has confirmed Panama wilt history, avoid planting susceptible banana varieties there indefinitely. Grow sugarcane, tapioca or vegetables instead. Never transport soil, tools or plant material from infected fields to clean ones.",
        frequency: "Permanent restriction on susceptible banana cultivation in confirmed infected fields",
        timing: "Permanent management decision",
        safetyNotes:
          "Fusarium survives in soil for decades. Soil contamination spreads on boots, tools and vehicles — clean and disinfect all equipment leaving infected areas.",
      },
    ],
    seasonalRisk: { summer: "moderate", sw_monsoon: "moderate" },
    plantsAffected: ["Banana"],
  },
  {
    id: "thanjavur_wilt",
    name: "Thanjavur Wilt",
    tamilName: "தஞ்சாவூர் வாடல்",
    scientificName: "Ganoderma lucidum",
    category: "bacterial",
    emoji: "🥀",
    identification:
      "Yellowing and drooping of outer fronds. Brown exudation from trunk base. Bracket fungus may appear on trunk.",
    damageDescription:
      "Slow decline and death of coconut palm over 1–3 years. Root and basal trunk rot. Major problem in TN coconut belt.",
    organicPrevention: [
      "Maintain basin hygiene — remove debris",
      "Avoid waterlogging at palm base",
    ],
    organicTreatments: [
      {
        name: "Neem cake + Trichoderma in basin",
        method: "soil",
        effort: "moderate",
        howToApply:
          "Mix 2 kg neem cake + 100 g Trichoderma viride into 5 kg compost. Apply this mixture in a ring at the drip zone of the palm basin. Incorporate into topsoil and water thoroughly.",
        frequency: "Twice per year — before SW Monsoon (May) and before NE Monsoon (September)",
        timing: "Apply when soil is moist for best Trichoderma colonisation",
        safetyNotes:
          "This treatment is suppressive, not curative. Apply to all palms near infected trees as a preventive measure. Remove and destroy any Ganoderma bracket fungus (conk) visible on the trunk.",
      },
      {
        name: "Avoid water stagnation",
        method: "cultural",
        effort: "easy",
        howToApply:
          "Clear drainage channels around palm basins regularly. Create raised bunding to direct water away from the trunk base. Ensure no water ponds within 1 metre of the trunk after rain.",
        frequency: "Before every monsoon; maintain drainage throughout wet season",
        timing: "Pre-monsoon preparation (May)",
        safetyNotes:
          "Waterlogging at the palm base greatly accelerates Ganoderma infection and spread — keeping the trunk base dry is the single most important prevention. Check and clear channels after every heavy rain.",
      },
      {
        name: "Auger and treat with fungicide",
        method: "manual",
        effort: "advanced",
        howToApply:
          "Drill 4–5 holes (2.5 cm diameter, 30 cm deep) at a 45° angle into the trunk base. Fill each hole with Trichoderma paste (100 g Trichoderma in 100 ml water) or copper oxychloride paste. Seal holes with cork or clay.",
        frequency: "Once per year on affected palms; repeat if decline continues",
        timing: "During dry weather (February–May)",
        safetyNotes:
          "This is an advanced treatment requiring care. Effective only at early-to-moderate Thanjavur Wilt stages — severely affected palms do not respond. Mark treated palms and monitor monthly.",
      },
    ],
    seasonalRisk: { sw_monsoon: "moderate", ne_monsoon: "moderate" },
    plantsAffected: ["Coconut"],
  },
  {
    id: "root_wilt",
    name: "Root Wilt",
    tamilName: "வேர் வாடல்",
    category: "bacterial",
    emoji: "🥀",
    identification:
      "Yellowing (ribbing) of leaflets. Flaccidity of fronds. Reduced crown size. Gradual decline in nut production.",
    damageDescription:
      "Chronic decline disease of coconut. Reduces yield progressively over years. Caused by phytoplasma transmitted by plant hoppers.",
    organicPrevention: [
      "Control plant hopper vectors",
      "Maintain palm nutrition (especially potash)",
    ],
    organicTreatments: [
      {
        name: "Trichoderma + Pseudomonas soil drench",
        method: "soil",
        effort: "moderate",
        howToApply:
          "Mix 100 g Trichoderma viride + 100 g Pseudomonas fluorescens into 5 kg compost. Apply to root zone or drench with 200 g of the mixture dissolved in 20 L water per palm.",
        frequency: "Twice per year — before SW Monsoon (May) and before NE Monsoon (September)",
        timing: "Apply to moist soil after irrigation",
        safetyNotes:
          "Root Wilt is caused by phytoplasma transmitted by plant hoppers — these soil treatments strengthen root health and tolerance but cannot eliminate the phytoplasma. Controlling the plant hopper vector is essential to slow spread.",
      },
      {
        name: "Neem cake application",
        method: "soil",
        effort: "easy",
        howToApply:
          "Apply 2–3 kg neem cake per palm in the root zone drip circle. Incorporate into topsoil and water thoroughly.",
        frequency: "Once per year before monsoon",
        timing: "Pre-monsoon (May)",
        safetyNotes:
          "Neem cake improves soil biology and supplies organic nitrogen, boosting palm health and tolerance to root wilt symptoms. Also suppresses some soil-borne pests.",
      },
      {
        name: "Maintain basin hygiene",
        method: "cultural",
        effort: "easy",
        howToApply:
          "Remove all fallen fronds, coconut husks and organic debris from the palm basin. Keep a clean 2-m radius around each palm free of weeds and debris.",
        frequency: "Monthly; increase frequency during monsoon season",
        timing: "Any time",
        safetyNotes:
          "Organic debris in the basin harbours plant hoppers — the phytoplasma vector for Root Wilt. Keeping basins clean and weed-free directly reduces the vector population near each palm.",
      },
    ],
    seasonalRisk: { sw_monsoon: "moderate" },
    plantsAffected: ["Coconut"],
  },

  // ── Viral ────────────────────────────────────────────────────────────────
  {
    id: "mosaic_virus",
    name: "Mosaic Virus",
    tamilName: "தேமல் நோய்",
    category: "viral",
    emoji: "🧬",
    identification:
      "Alternating light and dark green patches on leaves in mosaic pattern. Leaf distortion, curling, and reduced size.",
    damageDescription:
      "Stunted growth, reduced fruit yield, malformed fruit. No cure — infected plants remain symptomatic. Spread by sap-sucking insects.",
    organicPrevention: [
      "Control aphid/whitefly vectors promptly",
      "Remove and destroy infected plants",
      "Use virus-free seed",
    ],
    organicTreatments: [
      {
        name: "Remove infected plants",
        method: "manual",
        effort: "moderate",
        howToApply:
          "Uproot entire infected plants including roots. Bag immediately in black plastic. Do not allow removed plants to contact healthy ones. Burn or bury deeply (>30 cm) away from the garden.",
        frequency: "Immediately on detection — every day of delay allows insect vectors to spread virus to more plants",
        timing: "Act on the same day symptoms are identified",
        safetyNotes:
          "Viral diseases have no cure — removing infected plants is the only way to stop further spread. Do NOT compost infected material.",
      },
      {
        name: "Control aphid vectors",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Apply neem oil spray (3 ml/L) on all surrounding healthy plants to repel aphids carrying the virus. Install yellow sticky traps around the crop at 1 per 2 m².",
        frequency: "Every 5–7 days on surrounding healthy plants after removing infected ones",
        timing: "Evening for neem spray",
        safetyNotes:
          "Even 1–2 remaining infected plants are a continuous reservoir for vector-mediated spread. Strict removal combined with vector control is the complete management strategy.",
      },
      {
        name: "Use resistant varieties",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "For subsequent plantings, source varieties listed as resistant or tolerant to mosaic virus from the local government agriculture office or certified seed supplier.",
        frequency: "One-time variety selection for next planting",
        timing: "Before next planting season",
        safetyNotes:
          "Once mosaic virus is established in a field, resistant variety selection is the most sustainable long-term management solution.",
      },
    ],
    seasonalRisk: { summer: "moderate" },
    plantsAffected: ["Vegetables"],
  },
  {
    id: "leaf_curl_virus",
    name: "Leaf Curl Virus",
    tamilName: "இலைச் சுருட்டு நோய்",
    category: "viral",
    emoji: "🧬",
    identification:
      "Upward curling and puckering of leaves. Thick leathery texture. Stunted plant with bushy appearance.",
    damageDescription:
      "Severe stunting, reduced leaf area, fruit drop. Plants become unproductive. Transmitted by whitefly.",
    organicPrevention: [
      "Control whitefly population with sticky traps",
      "Use resistant varieties (e.g. Arka Rakshak tomato)",
    ],
    organicTreatments: [
      {
        name: "Remove infected plants",
        method: "manual",
        effort: "moderate",
        howToApply:
          "Uproot entire infected plants immediately, including roots. Bag in black plastic bags without delay. Burn or bury deeply away from the garden.",
        frequency: "Immediately on detection",
        timing: "Act on the same day of detection",
        safetyNotes:
          "There is no cure for Leaf Curl Virus. Every infected plant is a source for whitefly-mediated spread to healthy plants — immediate removal is the most important action.",
      },
      {
        name: "Control whiteflies",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Apply neem oil spray (3 ml/L) on all remaining healthy plants, focusing on leaf undersides where whiteflies feed. Install yellow sticky traps at 1 per 2 m².",
        frequency: "Every 5–7 days for neem spray; check traps weekly",
        timing: "Evening for neem spray",
        safetyNotes:
          "Leaf Curl Virus is transmitted within minutes by a single whitefly feeding — aggressive vector control must begin before plants show symptoms in high-risk seasons.",
      },
      {
        name: "Resistant varieties",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "For tomato, plant varieties with Ty-1 resistance to Tomato Leaf Curl Virus: Arka Rakshak, Arka Samrat, Arka Vishal or hybrid varieties labelled TLCV-R. Source from verified seed suppliers.",
        frequency: "One-time variety selection",
        timing: "Before planting",
        safetyNotes:
          "Resistance genes do not fully prevent infection under very heavy whitefly pressure — always combine resistant varieties with active vector management.",
      },
    ],
    seasonalRisk: { summer: "high" },
    plantsAffected: ["Tomato", "Chilli"],
  },
  {
    id: "yellow_vein_mosaic_virus",
    name: "Yellow Vein Mosaic Virus",
    tamilName: "மஞ்சள் நரம்பு நோய்",
    category: "viral",
    emoji: "🧬",
    identification:
      "Bright yellow network pattern on leaf veins. Leaves become entirely yellow in severe cases. Fruit malformation.",
    damageDescription:
      "Dramatic yield reduction. Fruits become small, tough, and unmarketable. Major disease of okra/ladies finger.",
    organicPrevention: [
      "Control whitefly vectors",
      "Use resistant varieties (e.g. Arka Anamika)",
    ],
    organicTreatments: [
      {
        name: "Remove infected plants",
        method: "manual",
        effort: "moderate",
        howToApply:
          "Uproot and bag infected plants immediately on detection of yellow vein symptoms. Burn or bury deeply. Do not allow removed plants to contact healthy crop.",
        frequency: "Immediately on detection; weekly field inspection for new symptomatic plants",
        timing: "Act on same day of detection",
        safetyNotes:
          "YVMV has no cure. Infected plants are highly visible — act immediately. Every infected plant is a source for whitefly-mediated spread.",
      },
      {
        name: "Control whiteflies",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Apply neem oil spray (3 ml/L) on healthy plants focusing on leaf undersides. Install yellow sticky traps at 1 per 2 m². Also spray garlic extract (1:10 dilution) as a repellent.",
        frequency: "Every 5–7 days throughout the crop season",
        timing: "Evening for neem spray",
        safetyNotes:
          "YVMV is transmitted within minutes by a single whitefly — aggressive vector control from seedling stage is essential. Combined use of neem spray + yellow traps + resistant variety is the recommended management package.",
      },
      {
        name: "Resistant varieties",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Plant YVMV-resistant ladies finger varieties: Arka Anamika, Arka Abhay, Kashi Pragati or hybrid varieties labelled YVMV-R. Source seeds from verified, certified suppliers.",
        frequency: "One-time variety selection",
        timing: "Before planting",
        safetyNotes:
          "In areas with high YVMV incidence, planting susceptible varieties is high risk — resistant variety selection is the primary and most cost-effective management tool.",
      },
    ],
    seasonalRisk: { summer: "high", sw_monsoon: "moderate" },
    plantsAffected: ["Ladies Finger"],
  },
  {
    id: "cassava_mosaic_disease",
    name: "Cassava Mosaic Disease",
    tamilName: "மரவள்ளி தேமல் நோய்",
    category: "viral",
    emoji: "🧬",
    identification:
      "Chlorotic mosaic pattern on tapioca leaves. Leaf distortion and size reduction. Some leaves almost entirely yellow.",
    damageDescription:
      "Reduces tuber yield by 20–80%. Stunted plants. Spread by whitefly and through infected planting stakes.",
    organicPrevention: [
      "Use certified disease-free planting stakes",
      "Control whitefly population",
    ],
    organicTreatments: [
      {
        name: "Use disease-free stakes",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Source all tapioca planting stakes only from certified disease-free nurseries or from confirmed healthy plants showing no mosaic symptoms. Inspect: healthy stakes come from plants with fully normal leaf size and colour.",
        frequency: "One-time decision at planting — the most important intervention",
        timing: "Before planting",
        safetyNotes:
          "Infected stakes transmit CMD to 100% of plants grown from them. Using certified disease-free planting material is the single most important prevention step for CMD.",
      },
      {
        name: "Remove infected plants early",
        method: "manual",
        effort: "moderate",
        howToApply:
          "Uproot and destroy plants showing mosaic patterns within 2 weeks of detection. Burn or bury deeply. Do not use stakes from infected plants for any future planting.",
        frequency: "Weekly field inspection; remove immediately on detection",
        timing: "Act early — rogueing before whitefly populations build on the infected plant is most effective",
        safetyNotes:
          "CMD spreads by both whitefly (field-to-field) and infected planting material (stake-to-plant) — both routes must be managed simultaneously.",
      },
      {
        name: "Control whiteflies",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Apply neem oil spray (3 ml/L) on crop canopy. Install yellow sticky traps at 1 per 2–3 m². Whitefly (Bemisia tabaci) is the primary vector for CMD spread between fields.",
        frequency: "Every 7 days during whitefly-active periods",
        timing: "Evening for neem spray",
        safetyNotes:
          "CMD is now endemic in many parts of Tamil Nadu — certified planting material combined with vector management is the most practical integrated approach.",
      },
    ],
    seasonalRisk: { summer: "moderate", sw_monsoon: "moderate" },
    plantsAffected: ["Tapioca"],
  },
  {
    id: "bunchy_top_virus",
    name: "Bunchy Top Virus",
    tamilName: "குட்டை நோய்",
    category: "viral",
    emoji: "🧬",
    identification:
      "Leaves become narrow, upright and bunched at top. Dark green streaks on petioles. Plant severely stunted.",
    damageDescription:
      "Infected plants never produce marketable bunches. Disease spreads to neighbouring plants via banana aphid.",
    organicPrevention: [
      "Use virus-free tissue culture suckers",
      "Control banana aphid (Pentalonia nigronervosa)",
    ],
    organicTreatments: [
      {
        name: "Remove and destroy infected plants",
        method: "manual",
        effort: "moderate",
        howToApply:
          "Uproot and destroy infected banana plants immediately including the entire rhizome. Inject kerosene or undiluted bleach into the pseudostem before uprooting to kill quickly and prevent regrowth. Burn all plant material.",
        frequency: "Immediately on detection — do not allow infected plant to remain for even 1–2 days",
        timing: "Act on the same day of detection",
        safetyNotes:
          "Bunchy Top spreads via banana aphid — an infected plant is a continuous inoculum source. Each day of delay results in more neighbouring plants infected. Do NOT compost any infected material.",
      },
      {
        name: "Control banana aphid",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Spray neem oil (3 ml/L) on all remaining healthy banana plants, focusing on pseudostem, petiole bases and suckers where banana aphid (Pentalonia nigronervosa) clusters. Install yellow sticky traps.",
        frequency: "Every 7 days in areas with confirmed Bunchy Top; every 14 days preventively",
        timing: "Evening for neem spray",
        safetyNotes:
          "Banana aphid clusters on pseudostem and leaf bases — thorough spraying of these specific areas is critical. The aphid is small and dark — use a hand lens to confirm presence.",
      },
      {
        name: "Use virus-free suckers",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Source all banana planting material only from certified government tissue culture laboratories or from plots with no Bunchy Top history. Never take suckers from any plant in a Bunchy Top-affected plot.",
        frequency: "One-time sourcing decision at replanting",
        timing: "Before replanting",
        safetyNotes:
          "Bunchy Top is one of the most destructive banana diseases — it spreads rapidly and no suckers from infected mats are safe. Never replant from untested field material in Bunchy Top-endemic areas.",
      },
    ],
    seasonalRisk: { sw_monsoon: "moderate" },
    plantsAffected: ["Banana"],
  },
  {
    id: "papaya_ringspot_virus",
    name: "Papaya Ringspot Virus",
    tamilName: "பப்பாளி வளைய புள்ளி நோய்",
    category: "viral",
    emoji: "🧬",
    identification:
      "Ring-shaped spots on fruit. Oily water-soaked streaks on stems. Mosaic and shoe-string leaves.",
    damageDescription:
      "Fruit quality destroyed. Progressive decline of plant. No cure. Transmitted by aphids.",
    organicPrevention: [
      "Remove infected plants immediately",
      "Control aphid vectors",
    ],
    organicTreatments: [
      {
        name: "Remove infected plants",
        method: "manual",
        effort: "moderate",
        howToApply:
          "Uproot and destroy infected papaya plants including the root stump. Burn or bury deeply. Mark the location to monitor for regrowth from remaining root pieces.",
        frequency: "Immediately on detection",
        timing: "Act immediately",
        safetyNotes:
          "PRSV has no cure. Infected plants become progressively less productive and remain continuous virus sources. Early removal reduces aphid-mediated spread to surrounding healthy plants.",
      },
      {
        name: "Control aphid vectors",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Spray neem oil (3 ml/L) on remaining healthy plants, focusing on new flush where aphids cluster. Install yellow sticky traps. Plant barrier crops of corn or sorghum (2–3 rows) around the papaya border to physically intercept incoming winged aphids.",
        frequency: "Every 7 days on healthy plants",
        timing: "Evening for neem spray",
        safetyNotes:
          "Corn/sorghum barrier crops are very effective at reducing alate aphid ingress carrying PRSV in endemic areas — establish the barrier crop 3–4 weeks before papaya transplanting.",
      },
      {
        name: "Use tolerant varieties",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Plant PRSV-tolerant papaya varieties: CO7, Pusa Nanha (dwarf), Red Lady (hybrid) or Taiwan 786 where available. Source only from certified nurseries with documented disease-free status.",
        frequency: "One-time variety selection",
        timing: "Before planting",
        safetyNotes:
          "In Tamil Nadu, PRSV is ubiquitous. Planting susceptible varieties in an endemic area without vector management is extremely high risk. Tolerant variety + barrier crop + neem spray is the recommended integrated approach.",
      },
    ],
    seasonalRisk: { summer: "moderate" },
    plantsAffected: ["Papaya"],
  },
  {
    id: "greening_disease",
    name: "Greening Disease",
    tamilName: "பசுமை நோய்",
    scientificName: "Candidatus Liberibacter asiaticus",
    category: "viral",
    emoji: "🧬",
    identification:
      "Asymmetric yellowing (blotchy mottle) on leaves. Fruit remains green, small, lopsided and bitter. Tree decline.",
    damageDescription:
      "Fatal disease of citrus. No cure — trees decline over 3–5 years. Transmitted by citrus psylla. Most devastating citrus disease.",
    organicPrevention: [
      "Control citrus psylla vector aggressively",
      "Use disease-free nursery stock",
    ],
    organicTreatments: [
      {
        name: "Remove infected trees",
        method: "manual",
        effort: "moderate",
        howToApply:
          "Remove and destroy confirmed Greening-infected citrus trees immediately. Cut down and burn the entire tree including roots. Bag and dispose of all fruit from infected trees without processing.",
        frequency: "Immediately on confirmation — do not delay",
        timing: "Act on the same day of confirmation",
        safetyNotes:
          "There is NO cure for Citrus Greening (HLB). Tree removal is the only way to prevent further spread. Alert the local horticulture department — HLB is a notifiable disease in India. Every infected tree is a psylla breeding ground.",
      },
      {
        name: "Control citrus psylla",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Apply neem oil spray (3 ml/L) on all healthy citrus at each flush emergence — psylla colonises new growth within days of emergence. Install yellow sticky traps. Remove water shoots and suckers that attract psylla.",
        frequency: "Every 5–7 days during flush periods; maintain year-round monitoring",
        timing: "Evening for neem spray; inspect for psylla nymphs at every new flush",
        safetyNotes:
          "Citrus psylla transmits HLB bacteria within minutes of feeding. Psylla control on healthy trees is the single most important preventive measure — do not neglect it even for one flush period.",
      },
      {
        name: "Use disease-free planting material",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Source all citrus planting material ONLY from certified government nurseries or registered budwood programmes that test for HLB by PCR. Never propagate from field trees in any HLB-affected region.",
        frequency: "One-time sourcing decision",
        timing: "Before planting",
        safetyNotes:
          "Budwood from infected trees produces infected plants from day one — the disease spreads throughout the entire orchard as those trees mature. This is how HLB entered most commercial orchards in India.",
      },
    ],
    seasonalRisk: { summer: "moderate" },
    plantsAffected: ["Lemon", "Lime", "Orange"],
  },
  {
    id: "little_leaf_disease",
    name: "Little Leaf Disease",
    tamilName: "சிறு இலை நோய்",
    category: "viral",
    emoji: "🧬",
    identification:
      "Leaves become abnormally small, narrow and yellow. Shortened internodes give bushy witches'-broom appearance.",
    damageDescription:
      "Stunted plants, no fruit production. Transmitted by leafhoppers. Common in brinjal.",
    organicPrevention: [
      "Remove infected plants immediately",
      "Control leafhopper vectors",
    ],
    organicTreatments: [
      {
        name: "Remove and destroy infected plants",
        method: "manual",
        effort: "moderate",
        howToApply:
          "Uproot plants showing witches'-broom symptoms (abnormally small, bushy growth). Remove the entire plant including roots. Burn all removed material.",
        frequency: "Immediately on detection; weekly field inspection for new symptomatic plants",
        timing: "Act immediately on detection",
        safetyNotes:
          "Little Leaf is caused by phytoplasma — there is no cure. Infected plants are a permanent inoculum source for leafhopper vectors. Do not compost infected plants.",
      },
      {
        name: "Control sap-sucking insects first",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Apply neem oil spray (3 ml/L) on all remaining healthy brinjal plants to control leafhoppers (Amrasca biguttula biguttula — the phytoplasma vector). Install yellow sticky traps at 1 per 2 m².",
        frequency: "Every 5–7 days throughout the crop season",
        timing: "Evening for neem spray",
        safetyNotes:
          "Leafhopper vector control must be maintained continuously throughout the season — even a brief gap allows phytoplasma transmission to healthy plants.",
      },
    ],
    seasonalRisk: { summer: "moderate" },
    plantsAffected: ["Brinjal"],
  },

  // ── Physiological ────────────────────────────────────────────────────────
  {
    id: "nut_fall",
    name: "Nut Fall",
    tamilName: "தேங்காய் உதிர்வு",
    category: "physiological",
    emoji: "🥥",
    identification:
      "Premature dropping of developing coconut nuts at various stages. Buttons, tender nuts or mature nuts fall.",
    damageDescription:
      "Direct yield loss. Can be caused by mite damage, nutrient deficiency (boron), water stress or hormonal imbalance.",
    organicPrevention: [
      "Maintain adequate irrigation",
      "Apply boron (borax) as foliar spray",
      "Control eriophyid mite",
    ],
    organicTreatments: [
      {
        name: "Borax spray during flowering",
        method: "spray",
        effort: "easy",
        howToApply:
          "Dissolve 10 g borax (sodium tetraborate) in 1 L warm water, then dilute to 10 L. Spray on flower spathe and developing buttons at the early nut stage (button stage).",
        frequency: "Twice per year — at spathe emergence and again at early button stage (3–4 months after spathe)",
        timing: "Morning when spathe is open and accessible to the spray",
        safetyNotes:
          "Boron deficiency is a major cause of premature nut fall in this region — this is a nutritional correction, not a pesticide. Do not exceed the recommended dose — excessive boron is toxic to palms.",
      },
      {
        name: "Maintain nutrition",
        method: "cultural",
        effort: "easy",
        howToApply:
          "Apply balanced organic nutrition per palm per year: 5 kg wood ash (potassium), 3 kg bone meal (phosphorus), 5 kg neem cake (nitrogen). Split into 2 applications. Incorporate at drip zone and water thoroughly.",
        frequency: "Twice per year — pre-monsoon (May) and post-NE Monsoon (January)",
        timing: "Apply before rain so nutrients incorporate naturally into soil",
        safetyNotes:
          "Potassium deficiency is a leading cause of nut fall in Kanyakumari coconut areas — wood ash is the most accessible organic potassium source. Adequate potassium improves nut retention significantly.",
      },
      {
        name: "Pest control for mites",
        method: "cultural",
        effort: "moderate",
        howToApply:
          "Apply neem oil (5 ml/L) + wettable sulfur (3 g/L) on developing nut bunches targeting the perianth area where eriophyid mites feed. Refer to the Eriophyid Mite entry in the Pests section for the full treatment protocol.",
        frequency: "Monthly during dry season (March–May) when mite populations peak",
        timing: "Morning or evening",
        safetyNotes:
          "Eriophyid mite damage to the perianth directly triggers button shedding — mite control is essential alongside nutritional management for premature nut fall. Do NOT apply sulfur and oil simultaneously.",
      },
    ],
    seasonalRisk: { summer: "high" },
    plantsAffected: ["Coconut"],
  },
];
