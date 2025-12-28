
export type StoreName = 'שופרסל' | 'רמי לוי' | 'ויקטורי' | 'אושר עד' | 'חצי חינם';
export type LocationName = string;

export interface StorePrice {
  store: StoreName;
  branchName?: string;
  price: number;
  isSale?: boolean;
  saleDescription?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  emoji: string; // Store emoji at creation
  quantity: number;
  unit: string;
  isPriority: boolean;
  isBought: boolean;
  prices: StorePrice[]; 
  manualStoreOverride?: StoreName;
  addedAt: number;
}

export type CalcMode = 'CHEAPEST_OVERALL' | 'SINGLE_STORE';

export interface AppState {
  items: ShoppingItem[];
  mode: CalcMode;
  selectedStore: StoreName | null;
  location: string;
  isGpsLocation: boolean; // Indicator if location came from GPS
  familyId?: string;
}

export interface HistoryEntry {
  items: ShoppingItem[];
  mode: CalcMode;
  selectedStore: StoreName | null;
}
