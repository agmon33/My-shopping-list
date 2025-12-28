
import { StoreName } from './types';

export const STORES: StoreName[] = ['שופרסל', 'רמי לוי', 'ויקטורי', 'אושר עד', 'חצי חינם'];

export const SHIPPING_FEES: Record<StoreName, number> = {
  'שופרסל': 30,
  'רמי לוי': 25,
  'ויקטורי': 28,
  'אושר עד': 35,
  'חצי חינם': 30
};

export const UNITS = ['יח\'', 'ק"ג', 'גרם', 'חב\'', 'ליטר'];

// Logic: Map common Hebrew keyword roots to emojis with specific priority
const KEYWORD_MAP: { keywords: string[], emoji: string }[] = [
  { keywords: ['מלפפון חמוץ', 'חמוצים', 'במלח', 'בחומץ'], emoji: '🥒' }, 
  { keywords: ['מלפפון', 'מלפפונים'], emoji: '🥒' },
  { keywords: ['עגבני', 'עגבניות', 'שרי'], emoji: '🍅' },
  { keywords: ['חלב', 'יוגורט', 'קוטג', 'גבינ', 'מעדן'], emoji: '🥛' },
  { keywords: ['ביצ', 'ביצים'], emoji: '🥚' },
  { keywords: ['לחם', 'פיתה', 'לחמני', 'חלה'], emoji: '🍞' },
  { keywords: ['בשר', 'סטייק', 'צלעות', 'בקר', 'טחון'], emoji: '🥩' },
  { keywords: ['עוף', 'שניצל', 'כרעיים', 'פרגיות'], emoji: '🍗' },
  { keywords: ['דג', 'טונה', 'סלמון'], emoji: '🐟' },
  { keywords: ['תפוח', 'בננה', 'תפוז', 'ענבים', 'אבטיח', 'פירות'], emoji: '🍎' },
  { keywords: ['גזר', 'בצל', 'תפוח אדמה', 'חסה', 'פלפל', 'ירקות'], emoji: '🥦' },
  { keywords: ['שוקולד', 'ממתק', 'חטיף', 'במבה', 'ביסלי', 'וופל'], emoji: '🍫' },
  { keywords: ['קולה', 'מיץ', 'מים', 'סודה', 'שתייה'], emoji: '🥤' },
  { keywords: ['נייר', 'טואלט', 'מגבונים', 'חיתול'], emoji: '🧻' },
  { keywords: ['סבון', 'שמפו', 'מרכך', 'דאודורנט', 'משחה'], emoji: '🧼' },
  { keywords: ['שמן', 'זית', 'קנולה'], emoji: '🧴' },
  { keywords: ['אורז', 'פסטה', 'קמח', 'סוכר', 'מלח', 'פתיתים'], emoji: '🌾' },
  { keywords: ['קפה', 'תה', 'נס'], emoji: '☕' }
];

export const getEmoji = (name: string): string => {
  const normalized = name.toLowerCase().trim();
  
  const match = KEYWORD_MAP.find(group => 
    group.keywords.some(keyword => normalized.includes(keyword))
  );

  return match ? match.emoji : '📦';
};

export const INITIAL_BASICS = [];
