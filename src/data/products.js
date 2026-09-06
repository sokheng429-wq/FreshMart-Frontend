/* ============================================================
   FRESHMART — SHOP CATALOG (demo data)
   80 products across 7 categories → 10 pages × 8 products.
   All copy is bilingual (en / kh). Prices are numbers.
   ============================================================ */

const img = (id, w = 600, h = 600) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop`

/* Some premium Unsplash photos are served from plus.unsplash.com */
const pmg = (id, w = 600, h = 600) =>
  `https://plus.unsplash.com/${id}?w=${w}&h=${h}&fit=crop`

const IMAGES = {
  COLA: '1629203851122-3726ecdf080e',
  COLA_ZERO: '1553456558-aff63285bdd1',
  ORANGE_SODA: '1624517452488-04869289c4ca',
  LEMON_LIME: '1625772299848-391b6a87d7b3',
  ROOT_BEER: '1615484477778-b15b08380f53',
  GINGER_ALE: '1523362628745-0c100150b504',
  GRAPE_SODA: '1638170352450-ba99a38e30bf',
  ENERGY: '1622543925233-e1bb5b3c78d1',
  SPARKLING: '1605548230624-8c9ca98f1b11',
  ICED_LEMON: '1556679343-c7306c1976bc',
  ICED_PEACH: '1571934811356-5cc065b3d7a4',
  MINERAL: '1616118132534-381148898bb4',
  APPLE_JUICE: '1600271886742-f049cd451bba',
  OJ: '1621506289937-a8e4df240d0b',
  MANGO_JUICE: '1601493812260-1ab4f10dfa42',
  COCONUT: '1581636625402-29b2a704d6e2',
  COLA_PACK: '1558645836-e44122a743ee',
  COLA_BOTTLE: '1527960471264-932f39eb5846',
  SODA_WATER: '1548839140-29a749e1cf4d',
  SPORTS: '1558618666-fcd25c85f82e',
  STRAW: '1464965911861-746a04b4bca6',
  CHERRY_TOM: '1592924357228-91a4daadcfea',
  YOGURT: '1488477181946-6428a0291777',
  SOURDOUGH: '1589367920969-ab8e050bbb04',
  RICE: '1536304993881-ff6e9eefa2a6',
  EGGS: '1506976785307-8732e854ad03',
  OJ_BOTTLE: '1613478223719-2ab802602423',
  BAGUETTE: '1549931319-a545769f3e9c',
  CHERRY_TOM2: '1518977822534-7049a61ee0c2',
  STRAW2: '1565958011703-44f9829ba187',
  APPLE: '1519996529931-28324d5a630e',
  BANANA: '1610832958506-aa56368176cf',
  MANGO: '1550258987-190a2d41a8ba',
  AVOCADO: '1547514701-42782101795e',
  AVOCADO2: '1523049673857-eb18f1d7b578',
  LEMON: '1528825871115-3581a5387919',
  MILK: '1563636619-e9143da7973b',
  MILK_BOTTLE: '1583258292688-d0213dc5a3a8',
  EGGS2: '1550583724-b2692b85b150',
  PASTA: '1586201375761-83865001e31c',
  SUSHI: '1569058242253-92a9c755a0ec',
  STEAK: '1550989460-0adf9ea622e2',
  RIBS: '1544025162-d76694265947',
  FISH: '1607623814075-e51df1bdc82f',
  SALAD: '1546069901-ba9599a7e63c',
  BOWL: '1540189549336-e6e99c3679fe',
  VEG_SALAD: '1512621776951-a57141f2eefd',
  DISHES: '1504674900247-0877df9cc836',
  PIZZA: '1565299624946-b28f40a0ae38',
  BURGER: '1568901346375-23c9450c58cd',
  BREAD: '1509440159596-0249088772ff',
  PLATE: '1482049016688-2d3e1b311543',
  SOUP: '1547592180-85f173990554',
  SALMON: '1467003909585-2f8a72700288',
  TEA: '1544787219-7f47ccb76574',
  COOKIE: '1499636136210-6f4ee915583e',
  CHIPS: '1566478989037-eec170784d0b',
  CHOCOLATE: '1511381939415-e44015466834',
  HONEY: '1587049352851-8d4e89133924',
  OIL: '1474979266404-7eaacbcd87c5',
  SPICES: '1596040033229-a9821ebd058d',
  RAMEN_BOWL: 'premium_photo-1694707235544-c9f6884d77d8',
  CUP_NOODLE: 'premium_photo-1694383412550-996deca23e8d',
  CHEESE: '1552767059-ce182ead6c1b',
  MOZZARELLA: '1522337360788-8b13dee7a37e',
  BUTTER: '1589985270826-4b87bb135bac',
  BAGEL: '1545569341-9eb8b30979d9',
  GRANOLA: '1558730234-d8b2281b3d74',
  POPCORN: '1512149177596-f817c7ef5d4c',
  CROISSANT: '1555507036-ab1f4038808a',
  CHICKEN: '1587593810167-a84920ea0781',
  NUTS: '1599599810769-bcde5a160d32',
}

export const FALLBACK_IMG = img(IMAGES.DISHES)

export const CATEGORIES = [
  { key: 'drinks', icon: '🧃', en: 'Drinks', kh: 'ភេសជ្ជៈ' },
  { key: 'fruits', icon: '🍎', en: 'Fruits & Veg', kh: 'ផ្លែឈើ និងបន្លែ' },
  { key: 'dairy', icon: '🥛', en: 'Dairy & Eggs', kh: 'ទឹកដោះគោ និងស៊ុត' },
  { key: 'bakery', icon: '🥖', en: 'Bakery', kh: 'នំបុ័ង' },
  { key: 'meat', icon: '🥩', en: 'Meat & Seafood', kh: 'សាច់ និងត្រី' },
  { key: 'snacks', icon: '🍿', en: 'Snacks', kh: 'អាហារសម្រន់' },
  { key: 'pantry', icon: '🍚', en: 'Rice & Pantry', kh: 'អង្ករ និងគ្រឿងទេស' },
]

const B = (en, kh) => ({ en, kh })
const U = (en, kh) => ({ en, kh })

export const PRODUCTS = [
  /* ── Drinks (1–16) ─────────────────────────────────────── */
  { id: 1, category: 'drinks', name: B('Cola Classic 330ml', 'កូឡាបុរាណ ៣៣០ម.ល'), price: 0.75, oldPrice: null, unit: U('can', 'កំប៉ុង'), weight: '330ml', rating: 4.8, sold: 2300, badge: B('Best Seller', 'លក់ដាច់បំផុត'), image: img(IMAGES.COLA), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('Ice-cold classic cola, the party favourite that never goes flat.', 'កូឡាបុរាណត្រជាក់ៗ ជាទឹកដែលគេចូលចិត្តសម្រាប់គ្រប់ពិធីជប់លៀង។') },
  { id: 2, category: 'drinks', name: B('Cola Zero Sugar 330ml', 'កូឡាគ្មានស្ករ ៣៣០ម.ល'), price: 0.75, oldPrice: null, unit: U('can', 'កំប៉ុង'), weight: '330ml', rating: 4.6, sold: 1800, badge: B('Healthy Pick', 'ជម្រើសសុខភាព'), image: img(IMAGES.COLA_ZERO), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('All the fizz, none of the sugar. Tastes great chilled.', 'ភាពស្រស់ៗដូចគ្នា តែគ្មានស្ករ។ ឆ្ងាញ់នៅពេលត្រជាក់។') },
  { id: 3, category: 'drinks', name: B('Orange Soda 330ml', 'ទឹកក្រូចសូដា ៣៣០ម.ល'), price: 0.70, oldPrice: null, unit: U('can', 'កំប៉ុង'), weight: '330ml', rating: 4.5, sold: 1500, badge: null, image: img(IMAGES.ORANGE_SODA), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('Bright, bubbly orange soda with a burst of citrus.', 'សូដាក្រូចស្រស់ៗ មានរសជាតិក្រូចឆ្មារ។') },
  { id: 4, category: 'drinks', name: B('Lemon Lime Soda 330ml', 'សូដាក្រូចឆ្មារ ៣៣០ម.ល'), price: 0.70, oldPrice: null, unit: U('can', 'កំប៉ុង'), weight: '330ml', rating: 4.4, sold: 980, badge: B('New', 'ថ្មី'), image: img(IMAGES.LEMON_LIME), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('A zesty blend of lemon and lime, crisp and refreshing.', 'លាយឡំរសជាតិក្រូចឆ្មារ ស្រស់ស្រាយមិនធុញ។') },
  { id: 5, category: 'drinks', name: B('Root Beer 330ml', 'ប៊ៀរឫស ៣៣០ម.ល'), price: 0.80, oldPrice: null, unit: U('can', 'កំប៉ុង'), weight: '330ml', rating: 4.3, sold: 720, badge: null, image: img(IMAGES.ROOT_BEER), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('Smooth, sweet and creamy — a classic American soda.', 'ផ្អែមល្មម និងក្រែមៗ — សូដាបុរាណរបស់អាមេរិក។') },
  { id: 6, category: 'drinks', name: B('Ginger Ale 330ml', 'ជីនជើអាល ៣៣០ម.ល'), price: 0.80, oldPrice: null, unit: U('can', 'កំប៉ុង'), weight: '330ml', rating: 4.7, sold: 1100, badge: B('Popular', 'ពេញនិយម'), image: img(IMAGES.GINGER_ALE), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('A gentle ginger kick with a light, clean finish.', 'រសជាតិខ្ញីស្រាលៗ ស្រស់ស្រាយល្អ។') },
  { id: 7, category: 'drinks', name: B('Grape Soda 330ml', 'ទឹកទំពាំងបាយជូរសូដា ៣៣០ម.ល'), price: 0.70, oldPrice: null, unit: U('can', 'កំប៉ុង'), weight: '330ml', rating: 4.2, sold: 640, badge: null, image: img(IMAGES.GRAPE_SODA), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('Deep grape flavour with a lively, sparkling fizz.', 'រសជាតិទំពាំងបាយជូរខ្លាំង និងមានពពុះស្រស់ៗ។') },
  { id: 8, category: 'drinks', name: B('Energy Drink 250ml', 'ភេសជ្ជៈថាមពល ២៥០ម.ល'), price: 1.20, oldPrice: null, unit: U('can', 'កំប៉ុង'), weight: '250ml', rating: 4.9, sold: 3100, badge: B('Best Seller', 'លក់ដាច់បំផុត'), image: img(IMAGES.ENERGY), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('Boost your energy with caffeine, B-vitamins and taurine.', 'ផ្តល់ថាមពលជាមួយកាហ្វេអ៊ីន វីតាមីន B និង Taurine។') },
  { id: 9, category: 'drinks', name: B('Sparkling Water 500ml', 'ទឹកសូដា ៥០០ម.ល'), price: 0.90, oldPrice: null, unit: U('bottle', 'ដប'), weight: '500ml', rating: 4.4, sold: 860, badge: null, image: img(IMAGES.SPARKLING), origin: B('Kampot, Cambodia', 'កំពត, កម្ពុជា'), desc: B('Pure spring water with a clean, crisp sparkle.', 'ទឹកនិទាឃរដូវសុទ្ធ មានពពុះស្រស់ៗ។') },
  { id: 10, category: 'drinks', name: B('Iced Tea Lemon 500ml', 'តែទឹកកកក្រូចឆ្មារ ៥០០ម.ល'), price: 1.00, oldPrice: null, unit: U('bottle', 'ដប'), weight: '500ml', rating: 4.5, sold: 1400, badge: B('Refreshing', 'ស្រស់ស្រាយ'), image: img(IMAGES.ICED_LEMON), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('Chilled black tea with a bright lemon twist.', 'តែខ្មៅត្រជាក់ ជាមួយរសជាតិក្រូចឆ្មារ។') },
  { id: 11, category: 'drinks', name: B('Iced Tea Peach 500ml', 'តែទឹកកកផ្លែប៉េស ៥០០ម.ល'), price: 1.00, oldPrice: null, unit: U('bottle', 'ដប'), weight: '500ml', rating: 4.6, sold: 1200, badge: B('New', 'ថ្មី'), image: img(IMAGES.ICED_PEACH), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('Sweet, peachy iced tea — summer in a bottle.', 'តែទឹកកកផ្លែប៉េសផ្អែមៗ ដូចរដូវក្តៅនៅក្នុងដប។') },
  { id: 12, category: 'drinks', name: B('Mineral Water 500ml', 'ទឹកសុទ្ធ ៥០០ម.ល'), price: 0.50, oldPrice: null, unit: U('bottle', 'ដប'), weight: '500ml', rating: 4.3, sold: 5200, badge: B('Essential', 'ចាំបាច់'), image: img(IMAGES.MINERAL), origin: B('Kampot, Cambodia', 'កំពត, កម្ពុជា'), desc: B('Clean, refreshing mineral water for every day.', 'ទឹកសារធាតុរ៉ែសុទ្ធ ស្រស់ស្រាយសម្រាប់រាល់ថ្ងៃ។') },
  { id: 13, category: 'drinks', name: B('Apple Juice 1L', 'ទឹកផ្លែប៉ោម ១លីត្រ'), price: 2.10, oldPrice: null, unit: U('carton', 'ប្រអប់'), weight: '1L', rating: 4.7, sold: 920, badge: null, image: img(IMAGES.APPLE_JUICE), origin: B('Mondulkiri, Cambodia', 'មណ្ឌលគិរី, កម្ពុជា'), desc: B('100% pressed apple juice, no added sugar.', 'ទឹកផ្លែប៉ោម ១០០% ដោយគ្មានស្ករបន្ថែម។') },
  { id: 14, category: 'drinks', name: B('Orange Juice 1L', 'ទឹកក្រូច ១លីត្រ'), price: 2.10, oldPrice: null, unit: U('carton', 'ប្រអប់'), weight: '1L', rating: 4.8, sold: 1600, badge: B('Fresh', 'ស្រស់'), image: img(IMAGES.OJ), origin: B('Kampong Speu, Cambodia', 'កំពង់ស្ពឺ, កម្ពុជា'), desc: B('Not-from-concentrate orange juice, cold and tangy.', 'ទឹកក្រូចស្រស់ៗមិនមែនពីសារធាតុកំហាប់ ជូរៗស្រស់ៗ។') },
  { id: 15, category: 'drinks', name: B('Mango Juice 1L', 'ទឹកស្វាយ ១លីត្រ'), price: 2.30, oldPrice: 2.80, unit: U('carton', 'ប្រអប់'), weight: '1L', rating: 4.9, sold: 2000, badge: B('Premium', 'ពិសេស'), image: img(IMAGES.MANGO_JUICE), origin: B('Battambang, Cambodia', 'បាត់ដំបង, កម្ពុជា'), desc: B('Thick, golden mango nectar made from real fruit.', 'ទឹកស្វាយក្រាស់ៗពណ៌មាស ធ្វើពីផ្លែឈើពិតប្រាកដ។') },
  { id: 16, category: 'drinks', name: B('Coconut Water 330ml', 'ទឹកដូង ៣៣០ម.ល'), price: 1.10, oldPrice: null, unit: U('bottle', 'ដប'), weight: '330ml', rating: 4.5, sold: 1300, badge: null, image: img(IMAGES.COCONUT), origin: B('Kampot, Cambodia', 'កំពត, កម្ពុជា'), desc: B('Natural electrolytes straight from young coconuts.', 'អេឡិចត្រូលីតធម្មជាតិ ពីដូងខ្ចីស្រស់ៗ។') },

  /* ── Fruits & Veg (17–26) ──────────────────────────────── */
  { id: 17, category: 'fruits', name: B('Fresh Strawberries 250g', 'ផ្លែស្ត្របឺរីស្រស់ ២៥០ក្រាម'), price: 3.50, oldPrice: 4.20, unit: U('box', 'ប្រអប់'), weight: '250g', rating: 4.9, sold: 3800, badge: B('Fresh', 'ស្រស់'), image: img(IMAGES.STRAW), origin: B('Mondulkiri, Cambodia', 'មណ្ឌលគិរី, កម្ពុជា'), desc: B('Juicy, sweet strawberries picked at peak ripeness.', 'ស្ត្របឺរីផ្អែមៗ ទុំពេញល្អ រើសពីចម្ការថ្មីៗ។') },
  { id: 18, category: 'fruits', name: B('Cherry Tomatoes 500g', 'ប៉េងប៉ោះ Cherry ៥០០ក្រាម'), price: 1.90, oldPrice: null, unit: U('box', 'ប្រអប់'), weight: '500g', rating: 4.7, sold: 2100, badge: null, image: img(IMAGES.CHERRY_TOM), origin: B('Kampong Speu, Cambodia', 'កំពង់ស្ពឺ, កម្ពុជា'), desc: B('Sweet, pop-in-your-mouth cherry tomatoes.', 'ប៉េងប៉ោះ cherry ផ្អែមល្មម បែករសជាតិក្នុងមាត់។') },
  { id: 19, category: 'fruits', name: B('Red Apples 1kg', 'ផ្លែប៉ោមក្រហម ១គីឡូ'), price: 2.60, oldPrice: null, unit: U('kg', 'គីឡូ'), weight: '1kg', rating: 4.7, sold: 1800, badge: null, image: img(IMAGES.APPLE), origin: B('Imported · New Zealand', 'នាំចូល · នូវែលសេឡង់'), desc: B('Crisp, crunchy red apples — a healthy snack anytime.', 'ផ្លែប៉ោមក្រហមក្រៀមៗ ជាអាហារសម្រន់សុខភាពល្អ។') },
  { id: 20, category: 'fruits', name: B('Cavendish Bananas 1kg', 'ចេកខ្មី ១គីឡូ'), price: 1.80, oldPrice: null, unit: U('bunch', 'ស្ទង'), weight: '1kg', rating: 4.5, sold: 2600, badge: null, image: img(IMAGES.BANANA), origin: B('Battambang, Cambodia', 'បាត់ដំបង, កម្ពុជា'), desc: B('Naturally sweet bananas, perfect for smoothies.', 'ចេកផ្អែមធម្មជាតិ ល្អសម្រាប់ទឹកស្រេកទឹកផ្លែឈើ។') },
  { id: 21, category: 'fruits', name: B('Fresh Mangoes 1kg', 'ស្វាយស្រស់ ១គីឡូ'), price: 3.20, oldPrice: 3.80, unit: U('kg', 'គីឡូ'), weight: '1kg', rating: 4.8, sold: 2400, badge: B('Hot Deal', 'ការផ្តល់ជូនពិសេស'), image: img(IMAGES.MANGO), origin: B('Battambang, Cambodia', 'បាត់ដំបង, កម្ពុជា'), desc: B('Sun-ripened mangoes — sweet, juicy and golden.', 'ស្វាយទុំពីព្រះអាទិត្យ — ផ្អែម ជូរៗ និងមានពណ៌មាស។') },
  { id: 22, category: 'fruits', name: B('Hass Avocados (2)', 'ផ្លែបឺរ Hass (២)'), price: 2.90, oldPrice: null, unit: U('pack', 'កញ្ចប់'), weight: '2 pcs', rating: 4.6, sold: 1500, badge: null, image: img(IMAGES.AVOCADO), origin: B('Kampong Cham, Cambodia', 'កំពង់ចាម, កម្ពុជា'), desc: B('Creamy Hass avocados, great for toast and salads.', 'ផ្លែបឺរក្រែមៗ ល្អសម្រាប់នំប៉័ង និងសាឡាត់។') },
  { id: 23, category: 'fruits', name: B('Avocado (1 pc)', 'ផ្លែបឺរ (១ផ្លែ)'), price: 1.60, oldPrice: null, unit: U('pc', 'ផ្លែ'), weight: '1 pc', rating: 4.4, sold: 800, badge: null, image: img(IMAGES.AVOCADO2), origin: B('Kampong Cham, Cambodia', 'កំពង់ចាម, កម្ពុជា'), desc: B('Single ripe avocado for your next meal.', 'ផ្លែបឺរទុំល្អមួយផ្លែ សម្រាប់អាហារបន្ទាប់របស់អ្នក។') },
  { id: 24, category: 'fruits', name: B('Fresh Lemons 500g', 'ក្រូចឆ្មារស្រស់ ៥០០ក្រាម'), price: 1.20, oldPrice: null, unit: U('bag', 'ថង់'), weight: '500g', rating: 4.5, sold: 1100, badge: null, image: img(IMAGES.LEMON), origin: B('Kampot, Cambodia', 'កំពត, កម្ពុជា'), desc: B('Bright, fragrant lemons for drinks and cooking.', 'ក្រូចឆ្មារស្រស់ក្រអូប សម្រាប់ភេសជ្ជៈ និងចម្អិនអាហារ។') },
  { id: 25, category: 'fruits', name: B('Baby Cherry Tomatoes 250g', 'ប៉េងប៉ោះ Cherry តូច ២៥០ក្រាម'), price: 1.50, oldPrice: null, unit: U('box', 'ប្រអប់'), weight: '250g', rating: 4.4, sold: 1300, badge: null, image: img(IMAGES.CHERRY_TOM2), origin: B('Kampong Speu, Cambodia', 'កំពង់ស្ពឺ, កម្ពុជា'), desc: B('Bite-size sweet tomatoes, perfect for snacking.', 'ប៉េងប៉ោះតូចៗផ្អែមៗ ងាយស្រួលញ៉ាំជាអាហារសម្រន់។') },
  { id: 26, category: 'fruits', name: B('Strawberries XL 500g', 'ស្ត្របឺរី XL ៥០០ក្រាម'), price: 4.80, oldPrice: 5.50, unit: U('box', 'ប្រអប់'), weight: '500g', rating: 4.9, sold: 900, badge: B('Premium', 'ពិសេស'), image: img(IMAGES.STRAW2), origin: B('Mondulkiri, Cambodia', 'មណ្ឌលគិរី, កម្ពុជា'), desc: B('Extra-large, extra-sweet berries for special days.', 'ស្ត្របឺរីធំៗ ផ្អែមខ្លាំង សម្រាប់ថ្ងៃពិសេស។') },

  /* ── Dairy & Eggs (27–36) ──────────────────────────────── */
  { id: 27, category: 'dairy', name: B('Greek Yogurt 500g', 'យ៉ាហួក្រិច ៥០០ក្រាម'), price: 2.50, oldPrice: 3.00, unit: U('tub', 'ពែង'), weight: '500g', rating: 4.8, sold: 1700, badge: B('Healthy', 'ជម្រើសសុខភាព'), image: img(IMAGES.YOGURT), origin: B('Chaktomuk, Cambodia', 'ចតុមុខ, កម្ពុជា'), desc: B('Thick, creamy Greek-style yogurt packed with protein.', 'យ៉ាហួបែបក្រិច ក្រាស់ ក្រែមៗ សម្បូរប្រូតេអ៊ីន។') },
  { id: 28, category: 'dairy', name: B('Whole Milk 1L', 'ទឹកដោះគោ ១លីត្រ'), price: 2.10, oldPrice: null, unit: U('bottle', 'ដប'), weight: '1L', rating: 4.7, sold: 3100, badge: B('Essential', 'ចាំបាច់'), image: img(IMAGES.MILK), origin: B('Chaktomuk, Cambodia', 'ចតុមុខ, កម្ពុជា'), desc: B('Farm-fresh whole milk, pasteurised daily.', 'ទឹកដោះគោស្រស់ពីកសិដ្ឋាន ឆ្អិនស្អាតរាល់ថ្ងៃ។') },
  { id: 29, category: 'dairy', name: B('Fresh Milk Bottle 500ml', 'ទឹកដោះគោដប ៥០០ម.ល'), price: 1.70, oldPrice: null, unit: U('bottle', 'ដប'), weight: '500ml', rating: 4.6, sold: 1400, badge: null, image: img(IMAGES.MILK_BOTTLE), origin: B('Chaktomuk, Cambodia', 'ចតុមុខ, កម្ពុជា'), desc: B('Glass-bottled fresh milk, creamy and cold.', 'ទឹកដោះគោស្រស់ក្នុងដបកែវ ក្រែមៗ ត្រជាក់ៗ។') },
  { id: 30, category: 'dairy', name: B('Free-range Eggs (12)', 'ស៊ុតសេរី (១២)'), price: 2.80, oldPrice: null, unit: U('tray', 'ថាស'), weight: '12 pcs', rating: 4.8, sold: 3400, badge: B('Essential', 'ចាំបាច់'), image: img(IMAGES.EGGS), origin: B('Kampong Cham, Cambodia', 'កំពង់ចាម, កម្ពុជា'), desc: B('Free-range eggs from happy, healthy hens.', 'ស៊ុតសេរីពីមេមាន់ដែលមានសុខភាពល្អ។') },
  { id: 31, category: 'dairy', name: B('Farm Eggs (10)', 'ស៊ុតកសិដ្ឋាន (១០)'), price: 2.40, oldPrice: 2.90, unit: U('tray', 'ថាស'), weight: '10 pcs', rating: 4.7, sold: 2700, badge: null, image: img(IMAGES.EGGS2), origin: B('Kampong Cham, Cambodia', 'កំពង់ចាម, កម្ពុជា'), desc: B('Fresh farm eggs with rich, golden yolks.', 'ស៊ុតកសិដ្ឋានស្រស់ៗ មានពងមាន់ពណ៌មាស។') },
  { id: 32, category: 'dairy', name: B('Aged Cheddar 200g', 'ឈីស Cheddar ២០០ក្រាម'), price: 4.20, oldPrice: null, unit: U('block', 'ដុំ'), weight: '200g', rating: 4.6, sold: 620, badge: null, image: img(IMAGES.CHEESE), origin: B('Imported · Australia', 'នាំចូល · អូស្ត្រាលី'), desc: B('Sharp, aged cheddar that melts beautifully.', 'ឈីស cheddar ចាស់ រសជាតិខ្លាំង រលាយល្អ។') },
  { id: 33, category: 'dairy', name: B('Greek Yogurt Cup 150g', 'យ៉ាហួក្រិចពែង ១៥០ក្រាម'), price: 1.30, oldPrice: null, unit: U('cup', 'ពែង'), weight: '150g', rating: 4.5, sold: 2200, badge: null, image: img(IMAGES.YOGURT, 600, 800), origin: B('Chaktomuk, Cambodia', 'ចតុមុខ, កម្ពុជា'), desc: B('On-the-go Greek yogurt, thick and protein-rich.', 'យ៉ាហួក្រិចយកតាមខ្លួន ក្រាស់ សម្បូរប្រូតេអ៊ីន។') },
  { id: 34, category: 'dairy', name: B('Chocolate Milk 250ml', 'ទឹកដោះគោសូកូឡា ២៥០ម.ល'), price: 1.10, oldPrice: 1.30, unit: U('carton', 'ប្រអប់'), weight: '250ml', rating: 4.6, sold: 1900, badge: B('Popular', 'ពេញនិយម'), image: img(IMAGES.MILK, 600, 800), origin: B('Chaktomuk, Cambodia', 'ចតុមុខ, កម្ពុជា'), desc: B('Creamy milk with real cocoa — a kid favourite.', 'ទឹកដោះគោក្រែមៗជាមួយកាកាវពិត — ជាទីពេញចិត្តរបស់ក្មេងៗ។') },
  { id: 35, category: 'dairy', name: B('Salted Butter 200g', 'ប៊ឺអំបិល ២០០ក្រាម'), price: 2.60, oldPrice: null, unit: U('block', 'ដុំ'), weight: '200g', rating: 4.7, sold: 1100, badge: null, image: img(IMAGES.BUTTER), origin: B('Chaktomuk, Cambodia', 'ចតុមុខ, កម្ពុជា'), desc: B('Rich, spreadable butter for baking and toast.', 'ប៊ឺឆ្ងាញ់ៗ សម្រាប់ដុតនំ និងលាបនំប៉័ង។') },
  { id: 36, category: 'dairy', name: B('Mozzarella 250g', 'ឈីស Mozzarella ២៥០ក្រាម'), price: 3.50, oldPrice: null, unit: U('bag', 'ថង់'), weight: '250g', rating: 4.5, sold: 780, badge: null, image: img(IMAGES.MOZZARELLA), origin: B('Imported · Italy', 'នាំចូល · អ៊ីតាលី'), desc: B('Soft, milky mozzarella — perfect for pizza night.', 'ឈីស mozzarella ទន់ៗ ល្អសម្រាប់រាត្រីភីហ្សា។') },

  /* ── Bakery (37–44) ────────────────────────────────────── */
  { id: 37, category: 'bakery', name: B('Sourdough Loaf', 'នំប៉័ង Sourdough'), price: 3.20, oldPrice: null, unit: U('loaf', 'ដុំ'), weight: '600g', rating: 4.6, sold: 950, badge: B('New', 'ថ្មី'), image: img(IMAGES.SOURDOUGH), origin: B('Khmer Bakehouse, Phnom Penh', 'រោងដុតនំខ្មែរ, ភ្នំពេញ'), desc: B('Slow-fermented, crusty sourdough baked fresh daily.', 'នំប៉័ង sourdough ក្រៀមៗ ដុតនំស្រស់រាល់ថ្ងៃ។') },
  { id: 38, category: 'bakery', name: B('Baguette', 'នំប៉័ងបារាំង'), price: 1.40, oldPrice: null, unit: U('loaf', 'ដុំ'), weight: '250g', rating: 4.5, sold: 2200, badge: null, image: img(IMAGES.BAGUETTE), origin: B('Khmer Bakehouse, Phnom Penh', 'រោងដុតនំខ្មែរ, ភ្នំពេញ'), desc: B('Crisp on the outside, soft inside — made for sandwiches.', 'ក្រៀមនៅខាងក្រៅ ទន់នៅខាងក្នុង — ល្អសម្រាប់សាំងវិច។') },
  { id: 39, category: 'bakery', name: B('Rustic Farmhouse Bread', 'នំប៉័ងជនបទ'), price: 2.80, oldPrice: 3.20, unit: U('loaf', 'ដុំ'), weight: '700g', rating: 4.6, sold: 640, badge: null, image: img(IMAGES.BREAD), origin: B('Khmer Bakehouse, Phnom Penh', 'រោងដុតនំខ្មែរ, ភ្នំពេញ'), desc: B('Hearty, whole-grain loaf with a rustic crust.', 'នំប៉័ងគ្រាប់ធញ្ញជាតិពេញៗ មានសំបកក្រៀមៗ។') },
  { id: 40, category: 'bakery', name: B('Croissant (4 pcs)', 'ក្រោសង់ (៤)'), price: 2.80, oldPrice: null, unit: U('box', 'ប្រអប់'), weight: '4 pcs', rating: 4.7, sold: 1300, badge: B('New', 'ថ្មី'), image: img(IMAGES.CROISSANT), origin: B('Khmer Bakehouse, Phnom Penh', 'រោងដុតនំខ្មែរ, ភ្នំពេញ'), desc: B('Buttery, flaky croissants baked to golden perfection.', 'ក្រោសង់ប៊ឺរឆ្ងាញ់ ស្រទាប់ស្តើងៗ ដុតពណ៌មាសល្អឥតខ្ចោះ។') },
  { id: 41, category: 'bakery', name: B('Bagel (4 pcs)', 'នំ Bagel (៤)'), price: 2.20, oldPrice: null, unit: U('pack', 'កញ្ចប់'), weight: '4 pcs', rating: 4.4, sold: 820, badge: null, image: img(IMAGES.BAGEL), origin: B('Khmer Bakehouse, Phnom Penh', 'រោងដុតនំខ្មែរ, ភ្នំពេញ'), desc: B('Chewy classic bagels, boiled and baked the right way.', 'នំ bagel បុរាណ ទន់ល្មម ដុតតាមវិធីត្រឹមត្រូវ។') },
  { id: 42, category: 'bakery', name: B('Multigrain Sourdough', 'នំប៉័ង Sourdough គ្រាប់ចម្រុះ'), price: 3.60, oldPrice: 4.00, unit: U('loaf', 'ដុំ'), weight: '650g', rating: 4.7, sold: 540, badge: null, image: img(IMAGES.SOURDOUGH, 600, 800), origin: B('Khmer Bakehouse, Phnom Penh', 'រោងដុតនំខ្មែរ, ភ្នំពេញ'), desc: B('Sourdough loaded with seeds and whole grains.', 'នំប៉័ង sourdough ជាមួយគ្រាប់ និងធញ្ញជាតិពេញៗ។') },
  { id: 43, category: 'bakery', name: B('Banana Bread', 'នំប៉័ងចេក'), price: 3.10, oldPrice: null, unit: U('loaf', 'ដុំ'), weight: '500g', rating: 4.8, sold: 1100, badge: B('Popular', 'ពេញនិយម'), image: img(IMAGES.BREAD, 600, 800), origin: B('Khmer Bakehouse, Phnom Penh', 'រោងដុតនំខ្មែរ, ភ្នំពេញ'), desc: B('Moist banana bread made with ripe local bananas.', 'នំប៉័ងចេកទន់ៗ ធ្វើពីចេកទុំក្នុងស្រុក។') },
  { id: 44, category: 'bakery', name: B('Dinner Rolls (6 pcs)', 'នំប៉័ងតូច (៦)'), price: 2.00, oldPrice: null, unit: U('bag', 'ថង់'), weight: '6 pcs', rating: 4.5, sold: 1600, badge: null, image: img(IMAGES.BREAD, 400, 600), origin: B('Khmer Bakehouse, Phnom Penh', 'រោងដុតនំខ្មែរ, ភ្នំពេញ'), desc: B('Soft, golden dinner rolls for soups and stews.', 'នំប៉័ងតូចៗទន់ៗ ល្អសម្រាប់ស៊ុប និងសម្ល។') },

  /* ── Meat & Seafood (45–52) ────────────────────────────── */
  { id: 45, category: 'meat', name: B('Ribeye Steak 400g', 'សាច់គោ Ribeye ៤០០ក្រាម'), price: 11.50, oldPrice: null, unit: U('pack', 'កញ្ចប់'), weight: '400g', rating: 4.8, sold: 640, badge: B('Premium', 'ពិសេស'), image: img(IMAGES.STEAK), origin: B('Imported · Australia', 'នាំចូល · អូស្ត្រាលី'), desc: B('Well-marbled ribeye for the perfect weekend grill.', 'សាច់គោ ribeye មានខ្លាញ់ហ្មត់ ល្អសម្រាប់អាំងចុងសប្តាហ៍។') },
  { id: 46, category: 'meat', name: B('BBQ Pork Ribs 500g', 'ឆ្អឹងជំនីរជ្រូក ៥០០ក្រាម'), price: 6.80, oldPrice: null, unit: U('pack', 'កញ្ចប់'), weight: '500g', rating: 4.7, sold: 520, badge: null, image: img(IMAGES.RIBS), origin: B('Kampong Speu, Cambodia', 'កំពង់ស្ពឺ, កម្ពុជា'), desc: B('Tender pork ribs, ideal for slow cooking and BBQ.', 'ឆ្អឹងជំនីរជ្រូកទន់ៗ ល្អសម្រាប់ស្ងោរយូរ និងអាំង។') },
  { id: 47, category: 'meat', name: B('Fresh Tilapia 600g', 'ត្រីទីឡាពីស្រស់ ៦០០ក្រាម'), price: 3.40, oldPrice: null, unit: U('pc', 'ក្បាល'), weight: '600g', rating: 4.6, sold: 2100, badge: B('Fresh', 'ស្រស់'), image: img(IMAGES.FISH), origin: B('Tonle Sap, Cambodia', 'បឹងទន្លេសាប, កម្ពុជា'), desc: B('Whole tilapia caught fresh from Tonle Sap.', 'ត្រីទីឡាពីទាំងមូល ចាប់ស្រស់ពីបឹងទន្លេសាប។') },
  { id: 48, category: 'meat', name: B('Salmon Fillet 300g', 'សាច់ត្រីសាលម៉ុន ៣០០ក្រាម'), price: 8.90, oldPrice: 10.50, unit: U('pack', 'កញ្ចប់'), weight: '300g', rating: 4.9, sold: 900, badge: B('Premium', 'ពិសេស'), image: img(IMAGES.SALMON), origin: B('Imported · Norway', 'នាំចូល · ន័រវេស'), desc: B('Fresh Atlantic salmon, rich in omega-3.', 'សាច់ត្រីសាលម៉ុនអាត្លង់ទិកស្រស់ សម្បូរអូមេហ្គា-៣។') },
  { id: 49, category: 'meat', name: B('Chicken Thighs 1kg', 'សាច់មាន់ភ្លៅ ១គីឡូ'), price: 5.20, oldPrice: 5.90, unit: U('pack', 'កញ្ចប់'), weight: '1kg', rating: 4.7, sold: 2800, badge: B('Hot Deal', 'ការផ្តល់ជូនពិសេស'), image: img(IMAGES.CHICKEN), origin: B('Kandal, Cambodia', 'កណ្តាល, កម្ពុជា'), desc: B('Skin-on chicken thighs, juicy and flavourful.', 'សាច់មាន់ភ្លៅមានស្បែក ជូរៗ ឆ្ងាញ់។') },
  { id: 50, category: 'meat', name: B('Pork Belly 500g', 'សាច់ជ្រូកស្ទីក ៥០០ក្រាម'), price: 4.90, oldPrice: null, unit: U('pack', 'កញ្ចប់'), weight: '500g', rating: 4.6, sold: 1500, badge: null, image: img(IMAGES.RIBS, 600, 800), origin: B('Kampong Speu, Cambodia', 'កំពង់ស្ពឺ, កម្ពុជា'), desc: B('Crispy-skinned pork belly, great for roasting.', 'សាច់ជ្រូកស្ទីកស្បែកក្រៀម ល្អសម្រាប់អាំង។') },
  { id: 51, category: 'meat', name: B('Whole Chicken 1.5kg', 'មាន់ទាំងមូល ១.៥គីឡូ'), price: 6.50, oldPrice: null, unit: U('pc', 'ក្បាល'), weight: '1.5kg', rating: 4.6, sold: 1900, badge: null, image: img(IMAGES.CHICKEN, 400, 500), origin: B('Kandal, Cambodia', 'កណ្តាល, កម្ពុជា'), desc: B('Whole free-range chicken for soups and roasts.', 'មាន់សេរីទាំងមូល សម្រាប់សម្ល និងអាំង។') },
  { id: 52, category: 'meat', name: B('Beef Mince 500g', 'សាច់គោបំពង ៥០០ក្រាម'), price: 5.80, oldPrice: null, unit: U('pack', 'កញ្ចប់'), weight: '500g', rating: 4.5, sold: 1200, badge: null, image: img(IMAGES.STEAK, 400, 500), origin: B('Imported · Australia', 'នាំចូល · អូស្ត្រាលី'), desc: B('Lean, fresh beef mince for burgers and stir-fries.', 'សាច់គោបំពងស្រស់ សម្រាប់ប៊ឺហ្គឺ និងឆាកូរ។') },

  /* ── Snacks (53–70) ────────────────────────────────────── */
  { id: 53, category: 'snacks', name: B('Garden Salad Mix 200g', 'សាឡាត់សួន ២០០ក្រាម'), price: 2.30, oldPrice: null, unit: U('bag', 'ថង់'), weight: '200g', rating: 4.5, sold: 1300, badge: null, image: img(IMAGES.SALAD), origin: B('Kampong Speu, Cambodia', 'កំពង់ស្ពឺ, កម្ពុជា'), desc: B('Washed and ready-to-eat salad greens.', 'បន្លែសាឡាត់លាងស្អាត រួចរាល់សម្រាប់ញ៉ាំ។') },
  { id: 54, category: 'snacks', name: B('Veggie Salad Bowl 300g', 'សាឡាត់បន្លែចាន ៣០០ក្រាម'), price: 3.10, oldPrice: 3.60, unit: U('bowl', 'ចាន'), weight: '300g', rating: 4.4, sold: 480, badge: null, image: img(IMAGES.VEG_SALAD), origin: B('Kampong Speu, Cambodia', 'កំពង់ស្ពឺ, កម្ពុជា'), desc: B('A rainbow of crunchy veggies in one bowl.', 'បន្លែចម្រុះពណ៌ស្រស់ៗនៅក្នុងមួយចាន។') },
  { id: 55, category: 'snacks', name: B('Chef Salad 250g', 'សាឡាត់ចុងភៅ ២៥០ក្រាម'), price: 3.40, oldPrice: null, unit: U('bowl', 'ចាន'), weight: '250g', rating: 4.5, sold: 620, badge: null, image: img(IMAGES.SALAD, 600, 800), origin: B('Kampong Speu, Cambodia', 'កំពង់ស្ពឺ, កម្ពុជា'), desc: B('Hearty chef salad with eggs, cheese and dressing.', 'សាឡាត់ចុងភៅជាមួយស៊ុត ឈីស និងទឹកជ្រលក់។') },
  { id: 56, category: 'snacks', name: B('Granola Bar (4 pcs)', 'បារគ្រាប់ធញ្ញជាតិ (៤)'), price: 2.40, oldPrice: null, unit: U('box', 'ប្រអប់'), weight: '4 pcs', rating: 4.6, sold: 980, badge: B('Healthy', 'ជម្រើសសុខភាព'), image: img(IMAGES.GRANOLA), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('Honey-oat granola bars for an energy boost.', 'បារគ្រាប់ធញ្ញជាតិទឹកឃ្មុំ ផ្តល់ថាមពលរហ័ស។') },
  { id: 57, category: 'snacks', name: B('Chocolate Cookies 250g', 'នំគុជសូកូឡា ២៥០ក្រាម'), price: 2.90, oldPrice: null, unit: U('box', 'ប្រអប់'), weight: '250g', rating: 4.8, sold: 1700, badge: B('Popular', 'ពេញនិយម'), image: img(IMAGES.COOKIE), origin: B('Khmer Bakehouse, Phnom Penh', 'រោងដុតនំខ្មែរ, ភ្នំពេញ'), desc: B('Crunchy cookies loaded with chocolate chunks.', 'នំគុជក្រៀមៗ ជាមួយសូកូឡាដុំៗ។') },
  { id: 58, category: 'snacks', name: B('Kettle Chips 150g', 'បន្ទះដំឡូង Kettle ១៥០ក្រាម'), price: 1.80, oldPrice: 2.10, unit: U('bag', 'ថង់'), weight: '150g', rating: 4.4, sold: 1400, badge: null, image: img(IMAGES.CHIPS), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('Thick-cut, kettle-cooked chips with sea salt.', 'បន្ទះដំឡូងក្រាស់ អាំងជាមួយអំបិលសមុទ្រ។') },
  { id: 59, category: 'snacks', name: B('Dark Chocolate 100g', 'សូកូឡាខ្មៅ ១០០ក្រាម'), price: 2.60, oldPrice: null, unit: U('bar', 'ដុំ'), weight: '100g', rating: 4.7, sold: 890, badge: null, image: img(IMAGES.CHOCOLATE), origin: B('Imported · Belgium', 'នាំចូល · បែលហ្ស៊ិក'), desc: B('70% dark chocolate, smooth and intense.', 'សូកូឡាខ្មៅ ៧០% រលោង និងខ្លាំង។') },
  { id: 60, category: 'snacks', name: B('Honey Jar 500g', 'ទឹកឃ្មុំ ៥០០ក្រាម'), price: 4.50, oldPrice: null, unit: U('jar', 'ពាង'), weight: '500g', rating: 4.9, sold: 760, badge: B('Premium', 'ពិសេស'), image: img(IMAGES.HONEY), origin: B('Mondulkiri, Cambodia', 'មណ្ឌលគិរី, កម្ពុជា'), desc: B('Raw wild honey from the highlands of Mondulkiri.', 'ទឹកឃ្មុំព្រៃធម្មជាតិ ពីខ្ពង់រាបមណ្ឌលគិរី។') },
  { id: 61, category: 'snacks', name: B('Assorted Nuts 300g', 'គ្រាប់ចម្រុះ ៣០០ក្រាម'), price: 3.90, oldPrice: null, unit: U('bag', 'ថង់'), weight: '300g', rating: 4.7, sold: 1050, badge: null, image: img(IMAGES.NUTS), origin: B('Imported · Vietnam', 'នាំចូល · វៀតណាម'), desc: B('Roasted almonds, cashews and peanuts.', 'គ្រាប់ស្វាយចន្ទី គ្រាប់អាល់ម៉ុន និងសណ្តែកដីអាំង។') },
  { id: 62, category: 'snacks', name: B('Butter Popcorn 100g', 'ពោតលីងប៊ឺ ១០០ក្រាម'), price: 2.10, oldPrice: null, unit: U('box', 'ប្រអប់'), weight: '100g', rating: 4.4, sold: 820, badge: null, image: img(IMAGES.POPCORN), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('Movie-night popcorn with real butter.', 'ពោតលីងប៊ឺពិត សម្រាប់រាត្រីមើលកុន។') },
  { id: 63, category: 'snacks', name: B('Fruit Yogurt Snack', 'យ៉ាហួផ្លែឈើ'), price: 1.20, oldPrice: null, unit: U('cup', 'ពែង'), weight: '120g', rating: 4.5, sold: 1500, badge: B('Healthy', 'ជម្រើសសុខភាព'), image: img(IMAGES.YOGURT, 400, 500), origin: B('Chaktomuk, Cambodia', 'ចតុមុខ, កម្ពុជា'), desc: B('Creamy yogurt with real fruit pieces.', 'យ៉ាហួក្រែមៗ ជាមួយផ្លែឈើពិតៗ។') },
  { id: 64, category: 'snacks', name: B('Cheesy Crackers 150g', 'នំក្រែកឈីស ១៥០ក្រាម'), price: 1.60, oldPrice: null, unit: U('box', 'ប្រអប់'), weight: '150g', rating: 4.3, sold: 940, badge: null, image: img(IMAGES.CHIPS, 400, 500), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('Light, crispy crackers with a cheesy kick.', 'នំក្រែកស្រាលៗ មានរសជាតិឈីស។') },
  { id: 65, category: 'snacks', name: B('Veggie Chips 150g', 'បន្ទះបន្លែ ១៥០ក្រាម'), price: 2.30, oldPrice: null, unit: U('bag', 'ថង់'), weight: '150g', rating: 4.5, sold: 1100, badge: B('Healthy', 'ជម្រើសសុខភាព'), image: img(IMAGES.CHIPS, 600, 400), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('Colourful chips made from real vegetables.', 'បន្ទះបន្លែចម្រុះពណ៌ ធ្វើពីបន្លែពិតៗ។') },
  { id: 66, category: 'snacks', name: B('Chocolate Chip Cookies 200g', 'នំគុជសូកូឡាចំណិត ២០០ក្រាម'), price: 3.20, oldPrice: null, unit: U('box', 'ប្រអប់'), weight: '200g', rating: 4.7, sold: 760, badge: null, image: img(IMAGES.COOKIE, 600, 800), origin: B('Khmer Bakehouse, Phnom Penh', 'រោងដុតនំខ្មែរ, ភ្នំពេញ'), desc: B('Soft-baked cookies with melty chocolate chips.', 'នំគុជទន់ៗ ជាមួយសូកូឡារលាយក្នុងមាត់។') },
  { id: 67, category: 'snacks', name: B('Hazelnut Spread 350g', 'ក្រែមហាហ្សែលណាត់ ៣៥០ក្រាម'), price: 3.80, oldPrice: null, unit: U('jar', 'ពាង'), weight: '350g', rating: 4.8, sold: 1250, badge: null, image: img(IMAGES.CHOCOLATE, 600, 800), origin: B('Imported · Belgium', 'នាំចូល · បែលហ្ស៊ិក'), desc: B('Chocolate-hazelnut spread for toast and baking.', 'ក្រែមសូកូឡា-ហាហ្សែលណាត់ សម្រាប់នំប៉័ង និងដុតនំ។') },
  { id: 68, category: 'snacks', name: B('Potato Sticks 100g', 'ដំឡូងស្តើង ១០០ក្រាម'), price: 1.40, oldPrice: null, unit: U('bag', 'ថង់'), weight: '100g', rating: 4.2, sold: 690, badge: null, image: img(IMAGES.CHIPS, 500, 400), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('Thin, salty potato sticks — dangerously snackable.', 'ដំឡូងស្តើងៗប្រៃៗ — ញ៉ាំហើយឈប់មិនបាន។') },
  { id: 69, category: 'snacks', name: B('Trail Mix 200g', 'គ្រាប់លាយថាមពល ២០០ក្រាម'), price: 2.80, oldPrice: null, unit: U('bag', 'ថង់'), weight: '200g', rating: 4.6, sold: 830, badge: null, image: img(IMAGES.NUTS, 600, 800), origin: B('Imported · Vietnam', 'នាំចូល · វៀតណាម'), desc: B('Nuts, seeds and dried fruit for active days.', 'គ្រាប់ គ្រាប់តូចៗ និងផ្លែឈើស្ងួត សម្រាប់ថ្ងៃសកម្ម។') },
  { id: 70, category: 'snacks', name: B('Waffle Cookies 250g', 'នំក្រឡាចត្រង្គ ២៥០ក្រាម'), price: 2.20, oldPrice: null, unit: U('box', 'ប្រអប់'), weight: '250g', rating: 4.4, sold: 580, badge: null, image: img(IMAGES.COOKIE, 400, 500), origin: B('Khmer Bakehouse, Phnom Penh', 'រោងដុតនំខ្មែរ, ភ្នំពេញ'), desc: B('Crunchy waffle cookies, great with coffee.', 'នំក្រឡាចត្រង្គក្រៀមៗ ឆ្ងាញ់ជាមួយកាហ្វេ។') },

  /* ── Rice & Pantry (71–80) ─────────────────────────────── */
  { id: 71, category: 'pantry', name: B('Jasmine Rice 5kg', 'អង្ករផ្កាម្លិះ ៥គីឡូ'), price: 6.20, oldPrice: null, unit: U('bag', 'កាបូប'), weight: '5kg', rating: 4.9, sold: 4300, badge: B('Best Seller', 'លក់ដាច់បំផុត'), image: img(IMAGES.RICE), origin: B('Battambang, Cambodia', 'បាត់ដំបង, កម្ពុជា'), desc: B('Fragrant premium jasmine rice for every meal.', 'អង្ករផ្កាម្លិះក្រអូបថ្នាក់ល្អ សម្រាប់រាល់អាហារ។') },
  { id: 72, category: 'pantry', name: B('Instant Noodles (5 pcs)', 'មីស្ងោររហ័ស (៥កញ្ចប់)'), price: 2.50, oldPrice: 2.90, unit: U('pack', 'កញ្ចប់'), weight: '5 pcs', rating: 4.5, sold: 3600, badge: B('Hot Deal', 'ការផ្តល់ជូនពិសេស'), image: pmg(IMAGES.RAMEN_BOWL), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('Quick and tasty instant noodles, ready in minutes.', 'មីស្ងោររហ័សឆ្ងាញ់ ស្ងោររួចរាល់ក្នុងប៉ុន្មាននាទី។') },
  { id: 73, category: 'pantry', name: B('Olive Oil 500ml', 'ប្រេងអូលីវ ៥០០ម.ល'), price: 7.80, oldPrice: null, unit: U('bottle', 'ដប'), weight: '500ml', rating: 4.8, sold: 720, badge: B('Premium', 'ពិសេស'), image: img(IMAGES.OIL), origin: B('Imported · Spain', 'នាំចូល · អេស្ប៉ាញ'), desc: B('Extra virgin olive oil, cold-pressed.', 'ប្រេងអូលីវ Extra Virgin ច្របាច់ត្រជាក់។') },
  { id: 74, category: 'pantry', name: B('Tomato Soup 400g', 'ស៊ុបប៉េងប៉ោះ ៤០០ក្រាម'), price: 1.90, oldPrice: null, unit: U('can', 'កំប៉ុង'), weight: '400g', rating: 4.3, sold: 880, badge: null, image: img(IMAGES.SOUP), origin: B('Imported · Italy', 'នាំចូល · អ៊ីតាលី'), desc: B('Velvety tomato soup, ready to warm up.', 'ស៊ុបប៉េងប៉ោះរលោង កម្តៅហើយញ៉ាំបានភ្លាម។') },
  { id: 75, category: 'pantry', name: B('Mixed Spices Set', 'គ្រឿងទេសចម្រុះ'), price: 3.30, oldPrice: null, unit: U('set', 'ឈុត'), weight: '6 x 40g', rating: 4.6, sold: 540, badge: null, image: img(IMAGES.SPICES), origin: B('Kampot, Cambodia', 'កំពត, កម្ពុជា'), desc: B('Six essential spices for your kitchen.', 'គ្រឿងទេសសំខាន់ៗចំនួនប្រាំមួយសម្រាប់ផ្ទះបាយរបស់អ្នក។') },
  { id: 76, category: 'pantry', name: B('Penne Pasta 500g', 'ប៉ាស្តា Penne ៥០០ក្រាម'), price: 1.90, oldPrice: null, unit: U('box', 'ប្រអប់'), weight: '500g', rating: 4.3, sold: 1200, badge: null, image: img(IMAGES.PASTA), origin: B('Imported · Italy', 'នាំចូល · អ៊ីតាលី'), desc: B('Al dente penne for hearty sauces.', 'ប៉ាស្តា penne ល្អជាមួយទឹកជ្រលក់ឆ្ងាញ់ៗ។') },
  { id: 77, category: 'pantry', name: B('Coconut Milk 400ml', 'ទឹកដោះគោដូង ៤០០ម.ល'), price: 1.60, oldPrice: null, unit: U('can', 'កំប៉ុង'), weight: '400ml', rating: 4.6, sold: 2000, badge: null, image: img(IMAGES.COCONUT, 600, 800), origin: B('Kampot, Cambodia', 'កំពត, កម្ពុជា'), desc: B('Rich coconut milk for curries and desserts.', 'ទឹកដោះគោដូងក្រែមៗ សម្រាប់ការី និងបង្អែម។') },
  { id: 78, category: 'pantry', name: B('Rice Vermicelli 1kg', 'នំបញ្ចុកស្ងួត ១គីឡូ'), price: 2.20, oldPrice: null, unit: U('bag', 'កាបូប'), weight: '1kg', rating: 4.5, sold: 1700, badge: null, image: img(IMAGES.RICE, 600, 800), origin: B('Battambang, Cambodia', 'បាត់ដំបង, កម្ពុជា'), desc: B('Fine rice vermicelli for soups and stir-fries.', 'នំបញ្ចុកស្ងួតល្អិតៗ សម្រាប់សម្ល និងឆា។') },
  { id: 79, category: 'pantry', name: B('Cup Noodle Instant', 'មីពែងរហ័ស'), price: 1.10, oldPrice: null, unit: U('cup', 'ពែង'), weight: '75g', rating: 4.4, sold: 2500, badge: B('Popular', 'ពេញនិយម'), image: pmg(IMAGES.CUP_NOODLE, 600, 800), origin: B('Phnom Penh, Cambodia', 'ភ្នំពេញ, កម្ពុជា'), desc: B('Just add hot water for a quick meal.', 'ចាក់ទឹកក្តៅចូល ទទួលទានបានភ្លាមៗ។') },
  { id: 80, category: 'pantry', name: B('Corn Soup 400g', 'ស៊ុបពោត ៤០០ក្រាម'), price: 1.70, oldPrice: null, unit: U('can', 'កំប៉ុង'), weight: '400g', rating: 4.2, sold: 460, badge: null, image: img(IMAGES.SOUP, 600, 800), origin: B('Imported · Thailand', 'នាំចូល · ថៃ'), desc: B('Sweet corn soup, creamy and comforting.', 'ស៊ុបពោតផ្អែមៗ ក្រែមៗ កក់ក្តៅ។') },
]

/* Featured promotion deals (referenced by product id) */
export const PROMOS = [
  { id: 'p1', productId: 48, code: 'SALMON15', badge: B('Ends tonight', 'បញ្ចប់រាត្រីនេះ') },
  { id: 'p2', productId: 72, code: 'NOODLE20', badge: B('Limited time', 'មានកំណត់') },
  { id: 'p3', productId: 26, code: 'BERRY15', badge: B('Weekend only', 'តែចុងសប្តាហ៍') },
  { id: 'p4', productId: 49, code: 'MEAT10', badge: B('Hot deal', 'ក្តៅៗ') },
  { id: 'p5', productId: 15, code: 'JUICE20', badge: B('New', 'ថ្មី') },
  { id: 'p6', productId: 17, code: 'FRESH25', badge: B('Almost gone', 'ជិតអស់') },
]

/* Sample reviews shown on the product detail page (picked by product id) */
export const REVIEWS = [
  { author: B('Sokha N.', 'សុខា ន.'), rating: 5, date: '2 days ago', text: B('Fresh and delivered fast. My new go-to item!', 'ស្រស់ និងដឹកជញ្ជូនលឿន។ ក្លាយជារបស់ដែលខ្ញុំទិញរាល់លើក!') },
  { author: B('Dara P.', 'ដារ៉ា ព.'), rating: 5, date: '5 days ago', text: B('Great quality, exactly as pictured.', 'គុណភាពល្អ ដូចក្នុងរូបភាពដែរ។') },
  { author: B('Leakhena V.', 'លក្ខិណា វ.'), rating: 4, date: '1 week ago', text: B('Good value for the price. Would recommend.', 'តម្លៃសមរម្យ សូមណែនាំឲ្យសាកល្បង។') },
  { author: B('Rithy M.', 'រិទ្ធី ម.'), rating: 4, date: '1 week ago', text: B('Packaging was neat and the item was cold.', 'ការវេចខ្ចប់ស្អាត ហើយទំនិញនៅត្រជាក់។') },
  { author: B('Chanthou S.', 'ចន្ធូ ស.'), rating: 5, date: '2 weeks ago', text: B('Ordered again — consistent quality every time.', 'បញ្ជាទិញម្តងទៀត — គុណភាពល្អរាល់ដង។') },
  { author: B('Vichea T.', 'វិជ្ជា ទ.'), rating: 5, date: '3 weeks ago', text: B('B\'Groceries never disappoints. Highly recommend!', 'B\'Groceries មិនដែលធ្វើឲ្យខកចិត្តទេ។ ណែនាំខ្លាំង!') },
]

/* ---- Helpers ---- */
export const formatPrice = (n) => `$${Number(n).toFixed(2)}`

export const formatSold = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n))

export const discountPct = (oldPrice, price) =>
  oldPrice ? Math.round((1 - price / oldPrice) * 100) : 0

export const getProduct = (id) => PRODUCTS.find((p) => p.id === Number(id))

export const catLabel = (cat) => CATEGORIES.find((c) => c.key === cat) || CATEGORIES[0]

export const storageFor = (cat) => {
  const map = {
    drinks: B('Store chilled for best taste', 'ទុកក្នុងទូរទឹកកកសម្រាប់រសជាតិល្អ'),
    fruits: B('Refrigerate, consume within 3 days', 'ដាក់ទូរទឹកកក ទទួលទានក្នុង ៣ថ្ងៃ'),
    dairy: B('Keep refrigerated at 2–5°C', 'រក្សាទុកក្នុងទូរទឹកកក ២–៥°C'),
    bakery: B('Best enjoyed fresh, store in a bread box', 'គួរទទួលទានស្រស់ៗ ទុកក្នុងប្រអប់នំប៉័ង'),
    meat: B('Keep frozen or refrigerated below 4°C', 'ទុកក្លាសេ ឬក្នុងទូរទឹកកកក្រោម ៤°C'),
    snacks: B('Store in a cool, dry place', 'ទុកកន្លែងត្រជាក់ និងស្ងួត'),
    pantry: B('Store in a cool, dry place away from sunlight', 'ទុកកន្លែងត្រជាក់ស្ងួត ឆ្ងាយពីពន្លឺព្រះអាទិត្យ'),
  }
  return map[cat] || map.pantry
}

/* Gallery variants for the product detail page (crops of the same shot) */
export const buildGallery = (product) => {
  const url = product?.image || FALLBACK_IMG
  const base = url.replace(/\?.*$/, '')
  return [
    `${base}?w=900&h=900&fit=crop`,
    `${base}?w=400&h=600&fit=crop`,
    `${base}?w=600&h=400&fit=crop`,
    `${base}?w=400&h=400&fit=crop`,
  ]
}
