/**
 * Tag taxonomy — hierarchical tag system for the NETS DNA engine.
 * Every tag is namespaced as "category:subtag" (e.g. "fnb:bubbletea").
 * Merchants carry tags; transactions inherit them at pay-time.
 */

export const TAGS = {
  // Food & Beverage
  FNB_BREAKFAST:    'fnb:breakfast',
  FNB_LUNCH:        'fnb:lunch',
  FNB_DINNER:       'fnb:dinner',
  FNB_SUPPER:       'fnb:supper',
  FNB_BRUNCH:       'fnb:brunch',
  FNB_BUBBLETEA:    'fnb:bubbletea',
  FNB_COFFEE:       'fnb:coffee',
  FNB_JUICE:        'fnb:juice',
  FNB_CHINESE:      'fnb:chinese',
  FNB_WESTERN:      'fnb:western',
  FNB_JAPANESE:     'fnb:japanese',
  FNB_KOREAN:       'fnb:korean',
  FNB_MALAY:        'fnb:malay',
  FNB_INDIAN:       'fnb:indian',
  FNB_THAI:         'fnb:thai',
  FNB_FASTFOOD:     'fnb:fastfood',
  FNB_HAWKER:       'fnb:hawker',
  FNB_FOODCOURT:    'fnb:foodcourt',
  FNB_CAFE:         'fnb:cafe',
  FNB_RESTAURANT:   'fnb:restaurant',

  // Shopping
  SHOP_FASHION:     'shopping:fashion',
  SHOP_BEAUTY:      'shopping:beauty',
  SHOP_ELECTRONICS: 'shopping:electronics',
  SHOP_GROCERIES:   'shopping:groceries',
  SHOP_CONVENIENCE: 'shopping:convenience',
  SHOP_LIFESTYLE:   'shopping:lifestyle',

  // Entertainment
  ENT_CINEMA:       'ent:cinema',
  ENT_ARCADE:       'ent:arcade',
  ENT_KTV:          'ent:ktv',
  ENT_GAMING:       'ent:gaming',
  ENT_LIVEEVENTS:   'ent:liveevents',
  ENT_NIGHTLIFE:    'ent:nightlife',
  ENT_MUSEUM:       'ent:museum',
  ENT_BOWLING:      'ent:bowling',
  ENT_ESCAPEROO:    'ent:escaperoom',

  // Fitness
  FIT_GYM:          'fit:gym',
  FIT_STUDIO:       'fit:studio',
  FIT_SPORTS:       'fit:sports',
  FIT_CLIMBING:     'fit:climbing',
  FIT_YOGA:         'fit:yoga',

  // Education
  EDU_BOOKS:        'edu:books',
  EDU_COURSES:      'edu:courses',
  EDU_STATIONERY:   'edu:stationery',

  // Transport
  TRN_RIDEHAILING:  'trn:ridehailing',
  TRN_TRANSIT:      'trn:transit',
  TRN_FUEL:         'trn:fuel',

  // Lifestyle & Services
  LST_TELCO:        'lst:telco',
  LST_SUBSCRIPTION: 'lst:subscription',
  LST_WELLNESS:     'lst:wellness',
} as const;

export type Tag = typeof TAGS[keyof typeof TAGS];

/** Persona definitions — maps top affinities to a named identity */
import { Persona } from '../models/transaction.model';

export const PERSONA_LIBRARY: Persona[] = [
  {
    id: 'bubbletea-royalty',
    name: 'Bubble Tea Royalty',
    emoji: '🧋',
    description: 'Your order is ready before you even sit down.',
    color: '#7C3AED',
    triggerTags: [TAGS.FNB_BUBBLETEA],
  },
  {
    id: 'hawker-regular',
    name: 'Hawker Regular',
    emoji: '🍜',
    description: 'You know every auntie by name.',
    color: '#D97706',
    triggerTags: [TAGS.FNB_HAWKER, TAGS.FNB_FOODCOURT, TAGS.FNB_CHINESE, TAGS.FNB_MALAY],
  },
  {
    id: 'cafe-dweller',
    name: 'Cafe Dweller',
    emoji: '☕',
    description: 'Laptop open, oat latte in hand, vibes immaculate.',
    color: '#92400E',
    triggerTags: [TAGS.FNB_COFFEE, TAGS.FNB_CAFE],
  },
  {
    id: 'cinema-hopper',
    name: 'Cinema Hopper',
    emoji: '🎬',
    description: 'First in line. Every. Single. Time.',
    color: '#1D4ED8',
    triggerTags: [TAGS.ENT_CINEMA],
  },
  {
    id: 'fitness-junkie',
    name: 'Fitness Junkie',
    emoji: '💪',
    description: 'Rest day? Never heard of it.',
    color: '#059669',
    triggerTags: [TAGS.FIT_GYM, TAGS.FIT_STUDIO, TAGS.FIT_CLIMBING, TAGS.FIT_YOGA],
  },
  {
    id: 'fashion-forward',
    name: 'Fashion Forward',
    emoji: '🛍️',
    description: 'Outfit checked before leaving the house. Always.',
    color: '#DB2777',
    triggerTags: [TAGS.SHOP_FASHION, TAGS.SHOP_BEAUTY],
  },
  {
    id: 'tech-enthusiast',
    name: 'Tech Enthusiast',
    emoji: '💻',
    description: 'The newest drop? Already on your wishlist.',
    color: '#0EA5E9',
    triggerTags: [TAGS.SHOP_ELECTRONICS],
  },
  {
    id: 'foodie-explorer',
    name: 'Foodie Explorer',
    emoji: '🍣',
    description: 'The world is your menu — one cuisine at a time.',
    color: '#EA0029',
    triggerTags: [TAGS.FNB_JAPANESE, TAGS.FNB_KOREAN, TAGS.FNB_WESTERN, TAGS.FNB_THAI],
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    emoji: '🦉',
    description: 'The city is yours after midnight.',
    color: '#4F46E5',
    triggerTags: [TAGS.ENT_NIGHTLIFE, TAGS.ENT_KTV, TAGS.FNB_SUPPER],
  },
  {
    id: 'bookworm',
    name: 'Bookworm',
    emoji: '📚',
    description: 'One more chapter. Just one more.',
    color: '#0D9488',
    triggerTags: [TAGS.EDU_BOOKS, TAGS.EDU_STATIONERY, TAGS.EDU_COURSES],
  },
  {
    id: 'fast-food-fan',
    name: 'Fast Food Fan',
    emoji: '🍟',
    description: 'You could navigate any drive-through blindfolded.',
    color: '#F59E0B',
    triggerTags: [TAGS.FNB_FASTFOOD],
  },
  {
    id: 'grocery-guru',
    name: 'Grocery Guru',
    emoji: '🛒',
    description: 'Meal prepped, fridge stocked, life sorted.',
    color: '#16A34A',
    triggerTags: [TAGS.SHOP_GROCERIES, TAGS.SHOP_CONVENIENCE],
  },
];
