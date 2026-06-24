import { Merchant } from '../models/transaction.model';
import { TAGS } from './tag-taxonomy';

export const MERCHANT_CATALOGUE: Merchant[] = [

  // ── Bubble Tea (8) ───────────────────────────────────────────
  { id: 'gong-cha',   name: 'Gong Cha',        category: 'Food & Beverage', tags: [TAGS.FNB_BUBBLETEA, TAGS.FNB_JUICE], typicalAmount: 5.50, icon: 'cafe-outline' },
  { id: 'liho',       name: 'LiHO',            category: 'Food & Beverage', tags: [TAGS.FNB_BUBBLETEA, TAGS.FNB_JUICE], typicalAmount: 5.00, icon: 'cafe-outline' },
  { id: 'koi',        name: 'KOI',             category: 'Food & Beverage', tags: [TAGS.FNB_BUBBLETEA, TAGS.FNB_JUICE], typicalAmount: 4.50, icon: 'cafe-outline' },
  { id: 'itea',       name: 'iTEA',            category: 'Food & Beverage', tags: [TAGS.FNB_BUBBLETEA, TAGS.FNB_JUICE], typicalAmount: 4.00, icon: 'cafe-outline' },
  { id: 'playmade',   name: 'Playmade',        category: 'Food & Beverage', tags: [TAGS.FNB_BUBBLETEA, TAGS.FNB_JUICE], typicalAmount: 6.00, icon: 'cafe-outline' },
  { id: 'chicha',     name: 'CHICHA San Chen', category: 'Food & Beverage', tags: [TAGS.FNB_BUBBLETEA, TAGS.FNB_JUICE], typicalAmount: 5.50, icon: 'cafe-outline' },
  { id: 'rb-tea',     name: 'R&B Tea',         category: 'Food & Beverage', tags: [TAGS.FNB_BUBBLETEA, TAGS.FNB_JUICE], typicalAmount: 5.00, icon: 'cafe-outline' },
  { id: 'mr-coconut', name: 'Mr Coconut',      category: 'Food & Beverage', tags: [TAGS.FNB_BUBBLETEA, TAGS.FNB_JUICE], typicalAmount: 4.50, icon: 'cafe-outline' },

  // ── Coffee & Cafe (7) ────────────────────────────────────────
  { id: 'starbucks',    name: 'Starbucks',        category: 'Food & Beverage', tags: [TAGS.FNB_COFFEE, TAGS.FNB_CAFE, TAGS.FNB_BREAKFAST], typicalAmount: 7.50, icon: 'cafe-outline' },
  { id: 'ya-kun',       name: 'Ya Kun',           category: 'Food & Beverage', tags: [TAGS.FNB_COFFEE, TAGS.FNB_HAWKER, TAGS.FNB_BREAKFAST, TAGS.FNB_CHINESE], typicalAmount: 3.50, icon: 'cafe-outline' },
  { id: 'toast-box',    name: 'Toast Box',        category: 'Food & Beverage', tags: [TAGS.FNB_COFFEE, TAGS.FNB_HAWKER, TAGS.FNB_BREAKFAST, TAGS.FNB_CHINESE], typicalAmount: 3.50, icon: 'cafe-outline' },
  { id: 'flash-coffee', name: 'Flash Coffee',     category: 'Food & Beverage', tags: [TAGS.FNB_COFFEE, TAGS.FNB_CAFE], typicalAmount: 5.50, icon: 'cafe-outline' },
  { id: 'huggs',        name: 'Huggs Coffee',     category: 'Food & Beverage', tags: [TAGS.FNB_COFFEE, TAGS.FNB_CAFE], typicalAmount: 5.00, icon: 'cafe-outline' },
  { id: 'coffee-bean',  name: 'The Coffee Bean',  category: 'Food & Beverage', tags: [TAGS.FNB_COFFEE, TAGS.FNB_CAFE, TAGS.FNB_BREAKFAST], typicalAmount: 7.00, icon: 'cafe-outline' },
  { id: 'luckin',       name: 'Luckin Coffee',    category: 'Food & Beverage', tags: [TAGS.FNB_COFFEE, TAGS.FNB_CAFE], typicalAmount: 4.50, icon: 'cafe-outline' },

  // ── Fast Food (6) ────────────────────────────────────────────
  { id: 'mcdonalds',  name: "McDonald's", category: 'Food & Beverage', tags: [TAGS.FNB_FASTFOOD, TAGS.FNB_LUNCH, TAGS.FNB_WESTERN], typicalAmount: 9.00,  icon: 'fast-food-outline' },
  { id: 'kfc',        name: 'KFC',        category: 'Food & Beverage', tags: [TAGS.FNB_FASTFOOD, TAGS.FNB_LUNCH, TAGS.FNB_WESTERN], typicalAmount: 10.00, icon: 'fast-food-outline' },
  { id: 'burger-king',name: 'Burger King',category: 'Food & Beverage', tags: [TAGS.FNB_FASTFOOD, TAGS.FNB_LUNCH, TAGS.FNB_WESTERN], typicalAmount: 10.00, icon: 'fast-food-outline' },
  { id: 'subway',     name: 'Subway',     category: 'Food & Beverage', tags: [TAGS.FNB_FASTFOOD, TAGS.FNB_LUNCH, TAGS.FNB_WESTERN], typicalAmount: 9.00,  icon: 'fast-food-outline' },
  { id: 'jollibee',   name: 'Jollibee',  category: 'Food & Beverage', tags: [TAGS.FNB_FASTFOOD, TAGS.FNB_LUNCH], typicalAmount: 10.00, icon: 'fast-food-outline' },
  { id: 'mos-burger', name: 'MOS Burger',category: 'Food & Beverage', tags: [TAGS.FNB_FASTFOOD, TAGS.FNB_LUNCH, TAGS.FNB_JAPANESE], typicalAmount: 11.00, icon: 'fast-food-outline' },

  // ── Western / Casual (4) ─────────────────────────────────────
  { id: 'shake-shack', name: 'Shake Shack', category: 'Food & Beverage', tags: [TAGS.FNB_WESTERN, TAGS.FNB_RESTAURANT, TAGS.FNB_DINNER, TAGS.FNB_LUNCH], typicalAmount: 17.00, icon: 'restaurant-outline' },
  { id: 'astons',      name: 'ASTONS',      category: 'Food & Beverage', tags: [TAGS.FNB_WESTERN, TAGS.FNB_RESTAURANT, TAGS.FNB_DINNER], typicalAmount: 20.00, icon: 'restaurant-outline' },
  { id: 'saizeriya',   name: 'Saizeriya',   category: 'Food & Beverage', tags: [TAGS.FNB_WESTERN, TAGS.FNB_RESTAURANT, TAGS.FNB_DINNER], typicalAmount: 12.00, icon: 'restaurant-outline' },
  { id: 'pastamia',    name: 'PastaMania',  category: 'Food & Beverage', tags: [TAGS.FNB_WESTERN, TAGS.FNB_RESTAURANT, TAGS.FNB_LUNCH], typicalAmount: 11.00, icon: 'restaurant-outline' },

  // ── Japanese (4) ─────────────────────────────────────────────
  { id: 'sushi-tei',     name: 'Sushi Tei',     category: 'Food & Beverage', tags: [TAGS.FNB_JAPANESE, TAGS.FNB_RESTAURANT, TAGS.FNB_DINNER, TAGS.FNB_LUNCH], typicalAmount: 22.00, icon: 'restaurant-outline' },
  { id: 'genki-sushi',   name: 'Genki Sushi',   category: 'Food & Beverage', tags: [TAGS.FNB_JAPANESE, TAGS.FNB_RESTAURANT, TAGS.FNB_LUNCH], typicalAmount: 18.00, icon: 'restaurant-outline' },
  { id: 'sushiro',       name: 'Sushiro',       category: 'Food & Beverage', tags: [TAGS.FNB_JAPANESE, TAGS.FNB_RESTAURANT, TAGS.FNB_DINNER], typicalAmount: 22.00, icon: 'restaurant-outline' },
  { id: 'ramen-keisuke', name: 'Ramen Keisuke', category: 'Food & Beverage', tags: [TAGS.FNB_JAPANESE, TAGS.FNB_RESTAURANT, TAGS.FNB_DINNER], typicalAmount: 16.00, icon: 'restaurant-outline' },

  // ── Korean (2) ───────────────────────────────────────────────
  { id: 'seoul-garden', name: 'Seoul Garden',  category: 'Food & Beverage', tags: [TAGS.FNB_KOREAN, TAGS.FNB_RESTAURANT, TAGS.FNB_DINNER], typicalAmount: 28.00, icon: 'restaurant-outline' },
  { id: 'kko-kko',      name: 'Kko Kko Nara', category: 'Food & Beverage', tags: [TAGS.FNB_KOREAN, TAGS.FNB_RESTAURANT, TAGS.FNB_DINNER], typicalAmount: 18.00, icon: 'restaurant-outline' },

  // ── Local / Hawker (5) ───────────────────────────────────────
  { id: 'old-chang-kee', name: 'Old Chang Kee', category: 'Food & Beverage', tags: [TAGS.FNB_HAWKER, TAGS.FNB_CHINESE], typicalAmount: 3.50, icon: 'storefront-outline' },
  { id: 'kopitiam',      name: 'Kopitiam',      category: 'Food & Beverage', tags: [TAGS.FNB_FOODCOURT, TAGS.FNB_HAWKER, TAGS.FNB_LUNCH, TAGS.FNB_CHINESE], typicalAmount: 5.50, icon: 'storefront-outline' },
  { id: 'koufu',         name: 'Koufu',         category: 'Food & Beverage', tags: [TAGS.FNB_FOODCOURT, TAGS.FNB_LUNCH, TAGS.FNB_CHINESE], typicalAmount: 6.00, icon: 'storefront-outline' },
  { id: 'food-republic', name: 'Food Republic', category: 'Food & Beverage', tags: [TAGS.FNB_FOODCOURT, TAGS.FNB_LUNCH], typicalAmount: 8.00, icon: 'storefront-outline' },
  { id: 'encik-tan',     name: 'Encik Tan',     category: 'Food & Beverage', tags: [TAGS.FNB_HAWKER, TAGS.FNB_MALAY, TAGS.FNB_LUNCH], typicalAmount: 6.50, icon: 'storefront-outline' },

  // ── Shopping — Fashion (6) ───────────────────────────────────
  { id: 'uniqlo',      name: 'Uniqlo',      category: 'Shopping', tags: [TAGS.SHOP_FASHION], typicalAmount: 49.90, icon: 'bag-outline' },
  { id: 'hm',          name: 'H&M',         category: 'Shopping', tags: [TAGS.SHOP_FASHION], typicalAmount: 39.90, icon: 'bag-outline' },
  { id: 'cotton-on',   name: 'Cotton On',   category: 'Shopping', tags: [TAGS.SHOP_FASHION], typicalAmount: 29.90, icon: 'bag-outline' },
  { id: 'love-bonito', name: 'Love Bonito', category: 'Shopping', tags: [TAGS.SHOP_FASHION], typicalAmount: 59.90, icon: 'bag-outline' },
  { id: 'zara',        name: 'Zara',        category: 'Shopping', tags: [TAGS.SHOP_FASHION], typicalAmount: 69.90, icon: 'bag-outline' },
  { id: 'decathlon',   name: 'Decathlon',   category: 'Shopping', tags: [TAGS.SHOP_FASHION, TAGS.SHOP_LIFESTYLE], typicalAmount: 45.00, icon: 'bag-outline' },

  // ── Shopping — Beauty (4) ────────────────────────────────────
  { id: 'sephora',   name: 'Sephora',   category: 'Shopping', tags: [TAGS.SHOP_BEAUTY], typicalAmount: 65.00, icon: 'color-palette-outline' },
  { id: 'watsons',   name: 'Watsons',   category: 'Shopping', tags: [TAGS.SHOP_BEAUTY, TAGS.SHOP_CONVENIENCE], typicalAmount: 22.00, icon: 'color-palette-outline' },
  { id: 'guardian',  name: 'Guardian',  category: 'Shopping', tags: [TAGS.SHOP_BEAUTY, TAGS.SHOP_CONVENIENCE], typicalAmount: 20.00, icon: 'color-palette-outline' },
  { id: 'innisfree', name: 'Innisfree', category: 'Shopping', tags: [TAGS.SHOP_BEAUTY], typicalAmount: 32.00, icon: 'color-palette-outline' },

  // ── Shopping — Electronics (3) ───────────────────────────────
  { id: 'challenger', name: 'Challenger', category: 'Shopping', tags: [TAGS.SHOP_ELECTRONICS], typicalAmount: 89.00,  icon: 'hardware-chip-outline' },
  { id: 'courts',     name: 'Courts',     category: 'Shopping', tags: [TAGS.SHOP_ELECTRONICS], typicalAmount: 199.00, icon: 'hardware-chip-outline' },
  { id: 'apple',      name: 'Apple',      category: 'Shopping', tags: [TAGS.SHOP_ELECTRONICS], typicalAmount: 299.00, icon: 'hardware-chip-outline' },

  // ── Shopping — Groceries / Convenience (5) ───────────────────
  { id: 'fairprice',    name: 'NTUC FairPrice', category: 'Shopping', tags: [TAGS.SHOP_GROCERIES], typicalAmount: 45.00, icon: 'cart-outline' },
  { id: 'sheng-siong',  name: 'Sheng Siong',    category: 'Shopping', tags: [TAGS.SHOP_GROCERIES], typicalAmount: 38.00, icon: 'cart-outline' },
  { id: 'cold-storage', name: 'Cold Storage',   category: 'Shopping', tags: [TAGS.SHOP_GROCERIES], typicalAmount: 55.00, icon: 'cart-outline' },
  { id: 'seven-eleven', name: '7-Eleven',        category: 'Shopping', tags: [TAGS.SHOP_CONVENIENCE], typicalAmount: 8.00, icon: 'cart-outline' },
  { id: 'cheers',       name: 'Cheers',          category: 'Shopping', tags: [TAGS.SHOP_CONVENIENCE], typicalAmount: 7.00, icon: 'cart-outline' },

  // ── Entertainment (6) ────────────────────────────────────────
  { id: 'golden-village', name: 'Golden Village',    category: 'Entertainment', tags: [TAGS.ENT_CINEMA], typicalAmount: 14.00, icon: 'film-outline' },
  { id: 'shaw',           name: 'Shaw Theatres',     category: 'Entertainment', tags: [TAGS.ENT_CINEMA], typicalAmount: 13.00, icon: 'film-outline' },
  { id: 'cathay',         name: 'Cathay Cineplexes', category: 'Entertainment', tags: [TAGS.ENT_CINEMA], typicalAmount: 13.00, icon: 'film-outline' },
  { id: 'timezone',       name: 'Timezone',          category: 'Entertainment', tags: [TAGS.ENT_ARCADE, TAGS.ENT_GAMING], typicalAmount: 20.00, icon: 'game-controller-outline' },
  { id: 'teo-heng',       name: 'Teo Heng KTV',      category: 'Entertainment', tags: [TAGS.ENT_KTV], typicalAmount: 25.00, icon: 'musical-notes-outline' },
  { id: 'zouk',           name: 'Zouk',              category: 'Entertainment', tags: [TAGS.ENT_NIGHTLIFE], typicalAmount: 35.00, icon: 'musical-notes-outline' },

  // ── Fitness (5) ──────────────────────────────────────────────
  { id: 'activesg',        name: 'ActiveSG',         category: 'Fitness', tags: [TAGS.FIT_GYM, TAGS.FIT_SPORTS], typicalAmount: 2.00, icon: 'barbell-outline' },
  { id: 'anytime-fitness', name: 'Anytime Fitness',  category: 'Fitness', tags: [TAGS.FIT_GYM], typicalAmount: 88.00, icon: 'barbell-outline' },
  { id: 'snap-fitness',    name: 'Snap Fitness',     category: 'Fitness', tags: [TAGS.FIT_GYM], typicalAmount: 75.00, icon: 'barbell-outline' },
  { id: 'yoga-movement',   name: 'Yoga Movement',    category: 'Fitness', tags: [TAGS.FIT_YOGA, TAGS.FIT_STUDIO], typicalAmount: 28.00, icon: 'body-outline' },
  { id: 'boulder-movement',name: 'Boulder Movement', category: 'Fitness', tags: [TAGS.FIT_CLIMBING], typicalAmount: 28.00, icon: 'body-outline' },

  // ── Transport (5) ────────────────────────────────────────────
  { id: 'grab',      name: 'Grab',      category: 'Transport', tags: [TAGS.TRN_RIDEHAILING], typicalAmount: 12.00, icon: 'car-outline' },
  { id: 'gojek',     name: 'Gojek',     category: 'Transport', tags: [TAGS.TRN_RIDEHAILING], typicalAmount: 10.00, icon: 'car-outline' },
  { id: 'simplygo',  name: 'SimplyGo',  category: 'Transport', tags: [TAGS.TRN_TRANSIT], typicalAmount: 1.80, icon: 'bus-outline' },
  { id: 'shell',     name: 'Shell',     category: 'Transport', tags: [TAGS.TRN_FUEL], typicalAmount: 80.00, icon: 'car-outline' },
  { id: 'esso',      name: 'Esso',      category: 'Transport', tags: [TAGS.TRN_FUEL], typicalAmount: 75.00, icon: 'car-outline' },

  // ── Education (3) ────────────────────────────────────────────
  { id: 'popular',     name: 'Popular',     category: 'Education', tags: [TAGS.EDU_STATIONERY, TAGS.EDU_BOOKS], typicalAmount: 15.00, icon: 'book-outline' },
  { id: 'kinokuniya',  name: 'Kinokuniya', category: 'Education', tags: [TAGS.EDU_BOOKS], typicalAmount: 28.00, icon: 'book-outline' },
  { id: 'times',       name: 'Times',       category: 'Education', tags: [TAGS.EDU_BOOKS, TAGS.EDU_STATIONERY], typicalAmount: 20.00, icon: 'book-outline' },

  // ── Lifestyle & Services (5) ─────────────────────────────────
  { id: 'spotify',      name: 'Spotify',      category: 'Lifestyle & Services', tags: [TAGS.LST_SUBSCRIPTION], typicalAmount: 9.90,  icon: 'musical-notes-outline' },
  { id: 'netflix',      name: 'Netflix',      category: 'Lifestyle & Services', tags: [TAGS.LST_SUBSCRIPTION], typicalAmount: 15.90, icon: 'tv-outline' },
  { id: 'singtel',      name: 'Singtel',      category: 'Lifestyle & Services', tags: [TAGS.LST_TELCO], typicalAmount: 45.00, icon: 'phone-portrait-outline' },
  { id: 'starhub',      name: 'StarHub',      category: 'Lifestyle & Services', tags: [TAGS.LST_TELCO], typicalAmount: 40.00, icon: 'phone-portrait-outline' },
  { id: 'circles-life', name: "Circles.Life", category: 'Lifestyle & Services', tags: [TAGS.LST_TELCO], typicalAmount: 20.00, icon: 'phone-portrait-outline' },
];

/** Fast lookup by merchant id */
export const MERCHANT_BY_ID = new Map<string, Merchant>(
  MERCHANT_CATALOGUE.map(m => [m.id, m])
);
