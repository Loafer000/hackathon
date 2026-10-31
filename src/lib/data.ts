import type {
  CategoryId,
  HeapSize,
  Lang,
  Partner,
  SlotWindow,
  Stream,
  UnitId,
} from './types'

type L = Partial<Record<Lang, string>> & { en: string; hi: string }

export interface CategoryInfo {
  id: CategoryId
  stream: Stream
  color: string
  name: L
  examples: L
  prep: L
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'organic',
    stream: 'wet',
    color: '#3D7A3A',
    name: { en: 'Food & garden', hi: 'रसोई व बगीचा', bn: 'খাবার ও বাগান' },
    examples: {
      en: 'Peels, leftovers, tea leaves, flowers, dry leaves',
      hi: 'छिलके, बचा खाना, चाय पत्ती, फूल, सूखे पत्ते',
      bn: 'খোসা, বাসি খাবার, চা-পাতা, ফুল, শুকনো পাতা',
    },
    prep: {
      en: 'Drain liquids. No plastic bags inside the bin.',
      hi: 'पानी निकाल दें। डिब्बे में प्लास्टिक की थैली न डालें।',
      bn: 'জল ঝরিয়ে নিন। বিনে প্লাস্টিকের ব্যাগ দেবেন না।',
    },
  },
  {
    id: 'plastic',
    stream: 'dry',
    color: '#2C63C8',
    name: { en: 'Plastic', hi: 'प्लास्टिक', bn: 'প্লাস্টিক' },
    examples: {
      en: 'Bottles, milk pouches, containers, carry bags, wrappers',
      hi: 'बोतलें, दूध की थैली, डिब्बे, कैरी बैग, रैपर',
      bn: 'বোতল, দুধের প্যাকেট, কৌটো, ক্যারি ব্যাগ, র‍্যাপার',
    },
    prep: {
      en: 'Rinse, dry and flatten. Keep chip packets together in one bag.',
      hi: 'धोकर सुखाएँ और दबा दें। चिप्स के पैकेट एक थैली में रखें।',
      bn: 'ধুয়ে, শুকিয়ে চ্যাপ্টা করুন। চিপসের প্যাকেট এক ব্যাগে রাখুন।',
    },
  },
  {
    id: 'paper',
    stream: 'dry',
    color: '#8A6A2F',
    name: { en: 'Paper & cardboard', hi: 'कागज़ व गत्ता', bn: 'কাগজ ও পিচবোর্ড' },
    examples: {
      en: 'Newspaper, books, cartons, boxes, tetra packs',
      hi: 'अखबार, किताबें, डिब्बे, गत्ते, टेट्रा पैक',
      bn: 'খবরের কাগজ, বই, কার্টন, বাক্স, টেট্রা প্যাক',
    },
    prep: {
      en: 'Keep dry and flatten boxes. Greasy paper goes with food waste.',
      hi: 'सूखा रखें, गत्ते चपटे करें। तेल वाला कागज़ गीले कचरे में।',
      bn: 'শুকনো রাখুন, বাক্স চ্যাপ্টা করুন। তেলচিটে কাগজ খাবারের বর্জ্যে।',
    },
  },
  {
    id: 'metal',
    stream: 'dry',
    color: '#5B6470',
    name: { en: 'Metal', hi: 'धातु', bn: 'ধাতু' },
    examples: {
      en: 'Cans, foil trays, old utensils, bottle caps',
      hi: 'डिब्बे, फॉयल, पुराने बर्तन, ढक्कन',
      bn: 'টিনের কৌটো, ফয়েল, পুরনো বাসন, ঢাকনা',
    },
    prep: {
      en: 'Rinse food off. Crush cans if you can.',
      hi: 'खाना धो दें। हो सके तो डिब्बे दबा दें।',
      bn: 'খাবার ধুয়ে ফেলুন। পারলে কৌটো চেপে দিন।',
    },
  },
  {
    id: 'glass',
    stream: 'dry',
    color: '#2E8A86',
    name: { en: 'Glass', hi: 'कांच', bn: 'কাচ' },
    examples: {
      en: 'Bottles, jars',
      hi: 'बोतलें, जार',
      bn: 'বোতল, জার',
    },
    prep: {
      en: 'Do not break. Wrap broken glass in paper and write “glass”.',
      hi: 'तोड़ें नहीं। टूटा कांच कागज़ में लपेटकर “कांच” लिखें।',
      bn: 'ভাঙবেন না। ভাঙা কাচ কাগজে মুড়ে “কাচ” লিখুন।',
    },
  },
  {
    id: 'ewaste',
    stream: 'special',
    color: '#6B4FBB',
    name: { en: 'E-waste', hi: 'ई-कचरा', bn: 'ই-বর্জ্য' },
    examples: {
      en: 'Phones, chargers, cables, LED bulbs, small appliances',
      hi: 'मोबाइल, चार्जर, तार, एलईडी बल्ब, छोटे उपकरण',
      bn: 'মোবাইল, চার্জার, তার, এলইডি বাল্ব, ছোট যন্ত্র',
    },
    prep: {
      en: 'Keep intact. Never burn or break open.',
      hi: 'पूरा रखें। कभी जलाएँ या तोड़ें नहीं।',
      bn: 'অক্ষত রাখুন। পোড়াবেন না, খুলবেন না।',
    },
  },
  {
    id: 'hazardous',
    stream: 'special',
    color: '#C23A2B',
    name: { en: 'Household hazardous', hi: 'घरेलू खतरनाक', bn: 'গৃহস্থালি বিপজ্জনক' },
    examples: {
      en: 'Batteries, tube lights, CFLs, medicines, paint, pesticide',
      hi: 'बैटरी, ट्यूबलाइट, सीएफएल, दवाइयाँ, पेंट, कीटनाशक',
      bn: 'ব্যাটারি, টিউবলাইট, সিএফএল, ওষুধ, রং, কীটনাশক',
    },
    prep: {
      en: 'Separate closed box. Never mix with other waste.',
      hi: 'अलग बंद डिब्बे में रखें। कभी न मिलाएँ।',
      bn: 'আলাদা বন্ধ বাক্সে রাখুন। কখনও মেশাবেন না।',
    },
  },
  {
    id: 'sanitary',
    stream: 'sanitary',
    color: '#2B2B2B',
    name: { en: 'Sanitary', hi: 'सैनिटरी', bn: 'স্যানিটারি' },
    examples: {
      en: 'Diapers, pads, bandages, cotton',
      hi: 'डायपर, पैड, पट्टी, रुई',
      bn: 'ডায়াপার, প্যাড, ব্যান্ডেজ, তুলো',
    },
    prep: {
      en: 'Wrap in newspaper and mark with a red X.',
      hi: 'अखबार में लपेटें और लाल X का निशान लगाएँ।',
      bn: 'খবরের কাগজে মুড়ে লাল X চিহ্ন দিন।',
    },
  },
]

export const CAT: Record<CategoryId, CategoryInfo> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryInfo>

export const STREAMS: Record<Stream, { color: string; name: L; bin: L }> = {
  wet: {
    color: '#3D7A3A',
    name: { en: 'Wet', hi: 'गीला', bn: 'ভেজা' },
    bin: { en: 'Green bin', hi: 'हरा डिब्बा', bn: 'সবুজ বিন' },
  },
  dry: {
    color: '#2C63C8',
    name: { en: 'Dry', hi: 'सूखा', bn: 'শুকনো' },
    bin: { en: 'Blue bin', hi: 'नीला डिब्बा', bn: 'নীল বিন' },
  },
  special: {
    color: '#C23A2B',
    name: { en: 'Special', hi: 'विशेष', bn: 'বিশেষ' },
    bin: { en: 'Hand over separately', hi: 'अलग से सौंपें', bn: 'আলাদা করে দিন' },
  },
  sanitary: {
    color: '#2B2B2B',
    name: { en: 'Sanitary', hi: 'सैनिटरी', bn: 'স্যানিটারি' },
    bin: { en: 'Wrapped and marked', hi: 'लपेटकर, निशान लगाकर', bn: 'মুড়ে, চিহ্ন দিয়ে' },
  },
}

/**
 * Transparent unit-weight assumptions (kg per unit). These are rough planning
 * figures for estimating before pickup. Only scale weights recorded by the
 * collector are counted as "collected".
 */
export const UNIT_KG: Record<CategoryId, Record<UnitId, number>> = {
  organic: { kg: 1, smallbag: 1.5, bucket: 4, sack: 12, items: 0.2 },
  plastic: { kg: 1, smallbag: 0.3, bucket: 0.8, sack: 2.5, items: 0.03 },
  paper: { kg: 1, smallbag: 0.8, bucket: 2, sack: 6, items: 0.1 },
  metal: { kg: 1, smallbag: 1, bucket: 3, sack: 8, items: 0.02 },
  glass: { kg: 1, smallbag: 2, bucket: 5, sack: 15, items: 0.35 },
  ewaste: { kg: 1, smallbag: 1.5, bucket: 3, sack: 10, items: 0.5 },
  hazardous: { kg: 1, smallbag: 0.5, bucket: 2, sack: 5, items: 0.1 },
  sanitary: { kg: 1, smallbag: 0.5, bucket: 2, sack: 5, items: 0.05 },
}

export const UNITS: UnitId[] = ['smallbag', 'bucket', 'sack', 'items', 'kg']

export const HEAP_KG: Record<HeapSize, number> = { small: 25, medium: 150, large: 600 }

/**
 * Indicative greenhouse-gas savings, kg CO2e avoided per kg actually recovered.
 * Round placeholder values inside ranges reported in published life-cycle
 * studies (e.g. US EPA WARM, IPCC 2006 Guidelines, Vol. 5). They must be
 * replaced with locally verified factors before any external claim.
 * `null` = not estimated (composition varies too much to be credible).
 */
export const FACTORS: Record<CategoryId, { mid: number; low: number; high: number } | null> = {
  organic: { mid: 0.4, low: 0.2, high: 0.7 },
  plastic: { mid: 1.2, low: 0.6, high: 1.8 },
  paper: { mid: 0.9, low: 0.5, high: 1.3 },
  metal: { mid: 2.0, low: 1.0, high: 4.0 },
  glass: { mid: 0.3, low: 0.2, high: 0.5 },
  ewaste: null,
  hazardous: null,
  sanitary: null,
}

export interface Ward {
  id: string
  name: string
  rural: boolean
  x: number
  y: number
}

export const WARDS: Ward[] = [
  { id: 'w7', name: 'Sonpur village', rural: true, x: 0, y: 0 },
  { id: 'w1', name: 'Old Market', rural: false, x: 1, y: 0 },
  { id: 'w2', name: 'Station Road', rural: false, x: 2, y: 0 },
  { id: 'w3', name: 'Riverside', rural: false, x: 0, y: 1 },
  { id: 'w4', name: 'Mill Colony', rural: false, x: 1, y: 1 },
  { id: 'w5', name: 'Shanti Nagar', rural: false, x: 2, y: 1 },
  { id: 'w6', name: 'Kheda village', rural: true, x: 3, y: 1 },
]

export const WARD: Record<string, Ward> = Object.fromEntries(WARDS.map((w) => [w.id, w]))

export const SLOT_WINDOWS: SlotWindow[] = ['07-09', '09-11', '17-19']
export const SLOT_LABEL: Record<SlotWindow, string> = {
  '07-09': '7–9 am',
  '09-11': '9–11 am',
  '17-19': '5–7 pm',
}
export const SLOT_START_HOUR: Record<SlotWindow, number> = { '07-09': 7, '09-11': 9, '17-19': 17 }
/** Pickups the ward office can route per ward per window in this pilot. */
export const SLOT_CAPACITY = 4

export const PARTNERS: Partner[] = [
  {
    id: 'c1',
    kind: 'collector',
    name: 'Ravi Kumar',
    org: 'Saathi Waste Pickers’ Cooperative',
    phone: '98190 33417',
    baseWard: 'w2',
    wards: ['w1', 'w2', 'w4'],
    categories: ['plastic', 'paper', 'metal', 'glass'],
    status: 'verified',
    credential: 'ULB waste-picker ID SWP-0231',
    capacity: 8,
  },
  {
    id: 'c2',
    kind: 'collector',
    name: 'Lata Pawar',
    org: 'Swachh Sakhi Self-Help Group',
    phone: '97302 81145',
    baseWard: 'w3',
    wards: ['w3', 'w4', 'w7'],
    categories: ['organic', 'plastic', 'paper', 'metal', 'glass', 'sanitary'],
    status: 'verified',
    credential: 'NRLM SHG reg. MH-SHG-11872',
    capacity: 6,
  },
  {
    id: 'c3',
    kind: 'collector',
    name: 'Green Cart Services',
    org: 'Private operator',
    phone: '90040 55210',
    baseWard: 'w5',
    wards: ['w1', 'w2', 'w5'],
    categories: ['organic', 'plastic', 'paper', 'metal', 'glass', 'ewaste', 'hazardous', 'sanitary'],
    status: 'verified',
    credential: 'SPCB authorisation WM/2025/0417',
    capacity: 12,
  },
  {
    id: 'c4',
    kind: 'collector',
    name: 'Imran Shaikh',
    org: 'Kheda Gram Panchayat',
    phone: '94221 70384',
    baseWard: 'w6',
    wards: ['w6', 'w5'],
    categories: ['organic', 'plastic', 'paper', 'metal', 'glass'],
    status: 'verified',
    credential: 'GP resolution 14/2025',
    capacity: 5,
  },
  {
    id: 'c5',
    kind: 'collector',
    name: 'Sunil Patil',
    org: 'Independent scrap dealer',
    phone: '98605 12093',
    baseWard: 'w2',
    wards: ['w2', 'w5'],
    categories: ['paper', 'metal', 'plastic'],
    status: 'pending',
    credential: 'ULB registration submitted, ID check pending',
    capacity: 6,
  },
  {
    id: 'f1',
    kind: 'facility',
    name: 'Shakti Polymers',
    org: 'Plastic recycler',
    phone: '0233 2645120',
    baseWard: 'w4',
    wards: [],
    categories: ['plastic'],
    status: 'verified',
    credential: 'SPCB consent + EPR reg. PWP/2024/1182',
    capacity: 2000,
    mode: 'recovery',
    method: 'Washing, shredding, granules',
    rates: { plastic: 14 },
  },
  {
    id: 'f2',
    kind: 'facility',
    name: 'Mill Colony Compost Yard',
    org: 'Municipal facility',
    phone: '0233 2641002',
    baseWard: 'w4',
    wards: [],
    categories: ['organic'],
    status: 'verified',
    credential: 'ULB facility no. CMP-04',
    capacity: 3000,
    mode: 'recovery',
    method: 'Windrow composting',
    rates: { organic: 0 },
  },
  {
    id: 'f3',
    kind: 'facility',
    name: 'Gopal Paper & Metal Mart',
    org: 'Dry waste aggregator',
    phone: '98222 40917',
    baseWard: 'w1',
    wards: [],
    categories: ['paper', 'metal', 'glass', 'plastic'],
    status: 'verified',
    credential: 'Trade licence TL-55120, GST registered',
    capacity: 1500,
    mode: 'recovery',
    method: 'Sorting and baling for mills',
    rates: { paper: 9, metal: 28, glass: 2, plastic: 10 },
  },
  {
    id: 'f4',
    kind: 'facility',
    name: 'Metro E-Recyclers',
    org: 'Authorised e-waste recycler',
    phone: '0233 2690455',
    baseWard: 'w5',
    wards: [],
    categories: ['ewaste'],
    status: 'verified',
    credential: 'CPCB e-waste reg. EW/2023/339',
    capacity: 800,
    mode: 'recovery',
    method: 'Authorised dismantling',
    rates: { ewaste: 20 },
  },
  {
    id: 'f5',
    kind: 'facility',
    name: 'District Common Treatment Facility',
    org: 'Hazardous & biomedical TSDF',
    phone: '0233 2600311',
    baseWard: 'w6',
    wards: [],
    categories: ['hazardous', 'sanitary'],
    status: 'verified',
    credential: 'SPCB TSDF authorisation HW/112',
    capacity: 1000,
    mode: 'disposal',
    method: 'Secure treatment / incineration',
    rates: {},
  },
  {
    id: 'f6',
    kind: 'facility',
    name: 'Kheda Biogas Unit',
    org: 'Panchayat biogas plant',
    phone: '94220 18833',
    baseWard: 'w6',
    wards: [],
    categories: ['organic'],
    status: 'pending',
    credential: 'Commissioning inspection pending',
    capacity: 500,
    mode: 'recovery',
    method: 'Anaerobic digestion',
    rates: { organic: 0 },
  },
]

/* ---------- Rule-based sorting helper ---------- */

export interface SortRule {
  keys: string[]
  category: CategoryId
  tip?: L
}

export const RULES: SortRule[] = [
  {
    category: 'organic',
    keys: [
      'food', 'leftover', 'peel', 'banana', 'vegetable', 'fruit', 'tea leaves', 'tea', 'coffee', 'flower',
      'garden', 'leaves', 'egg shell', 'eggshell', 'bones', 'rice', 'roti', 'coconut', 'sabzi', 'sabji',
      'chilka', 'chhilka', 'khana', 'phool', 'patta', 'chai patti', 'सब्ज़ी', 'सब्जी', 'छिलका', 'खाना',
      'फूल', 'पत्ते', 'चाय', 'সবজি', 'খোসা', 'খাবার', 'ফুল', 'পাতা', 'চা',
    ],
  },
  {
    category: 'organic',
    keys: ['tissue', 'paper napkin', 'pizza box', 'greasy paper', 'टिशू', 'টিস্যু'],
    tip: {
      en: 'Food-soiled paper is composted, not recycled.',
      hi: 'खाने से गंदा कागज़ खाद बनता है, रीसायकल नहीं होता।',
      bn: 'খাবারে নোংরা কাগজ সার হয়, রিসাইকেল হয় না।',
    },
  },
  {
    category: 'plastic',
    keys: ['milk pouch', 'milk packet', 'doodh', 'dudh', 'thaili', 'दूध की थैली', 'दूध', 'দুধের প্যাকেট', 'দুধ'],
    tip: {
      en: 'Cut open fully, rinse and dry. High recycling value.',
      hi: 'पूरा काटकर धोएँ और सुखाएँ। अच्छी कीमत मिलती है।',
      bn: 'পুরো কেটে ধুয়ে শুকিয়ে নিন। ভালো দাম মেলে।',
    },
  },
  {
    category: 'plastic',
    keys: ['chips', 'wrapper', 'multilayer', 'kurkure', 'namkeen', 'biscuit packet', 'chocolate', 'चिप्स', 'रैपर', 'চিপস', 'র‍্যাপার'],
    tip: {
      en: 'Multi-layer packaging has low recycling value. It is usually sent for co-processing in cement kilns.',
      hi: 'मल्टी-लेयर पैकेट की रीसाइक्लिंग कम होती है; अक्सर सीमेंट भट्टी में भेजे जाते हैं।',
      bn: 'মাল্টি-লেয়ার প্যাকেট খুব কম রিসাইকেল হয়; সাধারণত সিমেন্ট ভাটিতে যায়।',
    },
  },
  {
    category: 'plastic',
    keys: ['thermocol', 'styrofoam', 'foam', 'थर्मोकोल', 'থার্মোকল'],
    tip: {
      en: 'Rarely recycled locally. Keep it separate and dry.',
      hi: 'स्थानीय स्तर पर कम रीसायकल होता है। अलग और सूखा रखें।',
      bn: 'স্থানীয়ভাবে কম রিসাইকেল হয়। আলাদা ও শুকনো রাখুন।',
    },
  },
  {
    category: 'plastic',
    keys: [
      'plastic', 'bottle', 'pet', 'container', 'tub', 'carry bag', 'polythene', 'panni', 'bucket', 'straw',
      'shampoo', 'detergent', 'प्लास्टिक', 'बोतल', 'पन्नी', 'थैली', 'প্লাস্টিক', 'বোতল', 'প্যাকেট',
    ],
  },
  {
    category: 'paper',
    keys: ['tetra', 'tetra pak', 'juice carton', 'टेट्रा', 'টেট্রা'],
    tip: {
      en: 'Rinse and flatten. Goes to a specialised carton recycler.',
      hi: 'धोकर चपटा करें। विशेष रीसाइक्लर के पास जाता है।',
      bn: 'ধুয়ে চ্যাপ্টা করুন। বিশেষ রিসাইক্লারের কাছে যায়।',
    },
  },
  {
    category: 'paper',
    keys: [
      'newspaper', 'paper', 'cardboard', 'carton', 'box', 'book', 'notebook', 'magazine', 'akhbar', 'raddi',
      'gatta', 'अखबार', 'कागज़', 'कागज', 'रद्दी', 'गत्ता', 'কাগজ', 'খবরের কাগজ', 'পিচবোর্ড', 'বই',
    ],
  },
  {
    category: 'metal',
    keys: [
      'can', 'tin', 'foil', 'aluminium', 'aluminum', 'steel', 'iron', 'utensil', 'nail', 'cap', 'loha',
      'bartan', 'लोहा', 'बर्तन', 'टिन', 'টিন', 'লোহা', 'বাসন',
    ],
  },
  {
    category: 'glass',
    keys: ['glass', 'jar', 'glass bottle', 'beer bottle', 'kanch', 'कांच', 'काँच', 'কাচ'],
  },
  {
    category: 'ewaste',
    keys: [
      'phone', 'mobile', 'charger', 'cable', 'wire', 'laptop', 'computer', 'earphone', 'headphone', 'remote',
      'mixer', 'led bulb', 'keyboard', 'mouse', 'tv', 'मोबाइल', 'चार्जर', 'तार', 'মোবাইল', 'চার্জার', 'তার',
    ],
  },
  {
    category: 'hazardous',
    keys: [
      'battery', 'cell', 'tubelight', 'tube light', 'cfl', 'medicine', 'tablet', 'syringe', 'needle', 'paint',
      'pesticide', 'thermometer', 'dawai', 'davai', 'acid', 'दवाई', 'दवा', 'बैटरी', 'ट्यूबलाइट',
      'ওষুধ', 'ব্যাটারি', 'টিউবলাইট',
    ],
  },
  {
    category: 'sanitary',
    keys: [
      'diaper', 'pad', 'sanitary', 'sanitary napkin', 'bandage', 'cotton', 'condom', 'डायपर', 'पैड', 'पट्टी',
      'ডায়াপার', 'প্যাড', 'ব্যান্ডেজ',
    ],
  },
]

export interface RuleMatch {
  category: CategoryId
  keyword: string
  tip?: L
  score: number
}

export function matchRules(query: string): RuleMatch[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  const best = new Map<CategoryId, RuleMatch>()
  for (const rule of RULES) {
    for (const key of rule.keys) {
      const k = key.toLowerCase()
      let score = 0
      if (q === k) score = 100 + k.length
      else if (q.includes(k)) score = 50 + k.length
      else if (q.length >= 3 && k.startsWith(q)) score = 20 + q.length
      if (score === 0) continue
      const prev = best.get(rule.category)
      if (!prev || score > prev.score) best.set(rule.category, { category: rule.category, keyword: key, tip: rule.tip, score })
    }
  }
  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, 3)
}
