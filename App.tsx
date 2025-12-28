
import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingItem, CalcMode, StoreName, HistoryEntry, StorePrice } from './types';
import { fetchPricesForItem } from './geminiService';
import AddForm from './components/AddForm';
import ItemCard from './components/ItemCard';
import StatsFooter from './components/StatsFooter';
import LocationSelector from './components/LocationSelector';
import { getEmoji } from './constants';
import { ShoppingBag, AlertTriangle, RefreshCw, Users, Check, RotateCcw } from 'lucide-react';

// Cache configuration
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface PriceCacheEntry {
  prices: StorePrice[];
  timestamp: number;
}

const App: React.FC = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [mode, setMode] = useState<CalcMode>('CHEAPEST_OVERALL');
  const [selectedStore, setSelectedStore] = useState<StoreName | null>(null);
  const [location, setLocation] = useState<string>(''); 
  const [isGps, setIsGps] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  const [itemStats, setItemStats] = useState<Record<string, number>>({});
  const [priceCache, setPriceCache] = useState<Record<string, PriceCacheEntry>>({});
  const [hiddenSuggestions, setHiddenSuggestions] = useState<string[]>([]);
  
  const [duplicateConflict, setDuplicateConflict] = useState<{name: string, quantity: number, unit: string, isPriority: boolean} | null>(null);
  const [familyId, setFamilyId] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const syncWithCloud = useCallback(async (dataToSync?: any) => {
    if (!familyId) return;
    setIsSyncing(true);
    try {
      const url = `https://kvdb.io/K6U2YV9pYpYpYpYpYpYpYp/${familyId}`;
      if (dataToSync) {
        await fetch(url, { method: 'POST', body: JSON.stringify(dataToSync) });
      } else {
        const res = await fetch(url);
        if (res.ok) {
          const cloudData = await res.json();
          if (cloudData && cloudData.items) {
            setItems(cloudData.items);
            setLocation(cloudData.location || 'מרכז תל אביב');
            setIsGps(cloudData.isGps || false);
          }
        }
      }
    } catch (e) { console.error("Sync failed"); }
    finally { setIsSyncing(false); }
  }, [familyId]);

  useEffect(() => {
    const initialize = () => {
      const saved = localStorage.getItem('shopping_list_v8');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setItems(parsed.items || []);
          setMode(parsed.mode || 'CHEAPEST_OVERALL');
          setSelectedStore(parsed.selectedStore || null);
          setItemStats(parsed.itemStats || {});
          setPriceCache(parsed.priceCache || {});
          setHiddenSuggestions(parsed.hiddenSuggestions || []);
          setLocation(parsed.location || '');
          setIsGps(parsed.isGps || false);
          setFamilyId(parsed.familyId || '');
        } catch (e) { console.error("Load failed"); }
      }
      setIsLoaded(true);
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const dataToSave = { items, mode, selectedStore, itemStats, priceCache, location, isGps, familyId, hiddenSuggestions };
    localStorage.setItem('shopping_list_v8', JSON.stringify(dataToSave));
    
    if (familyId) {
      const timer = setTimeout(() => syncWithCloud(dataToSave), 2000);
      return () => clearTimeout(timer);
    }
  }, [items, mode, selectedStore, itemStats, priceCache, location, isGps, familyId, isLoaded, syncWithCloud, hiddenSuggestions]);

  const saveToHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(-10), { items: [...items], mode, selectedStore }]);
  }, [items, mode, selectedStore]);

  const performAddItem = async (name: string, quantity: number, unit: string, isPriority: boolean) => {
    saveToHistory();
    const currentLoc = location || 'מרכז תל אביב';
    const normalizedName = name.trim().toLowerCase();
    const cacheKey = `${normalizedName}_${currentLoc.trim().toLowerCase()}`;
    
    const newItemId = crypto.randomUUID();
    
    // Check if we have valid cached prices
    const cachedEntry = priceCache[cacheKey];
    const isCacheValid = cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL);
    
    const newItem: ShoppingItem = {
      id: newItemId,
      name,
      emoji: getEmoji(name), 
      quantity,
      unit,
      isPriority,
      isBought: false,
      prices: isCacheValid ? cachedEntry.prices : [],
      addedAt: Date.now()
    };
    
    setItems(prev => [newItem, ...prev]);

    // Update stats
    setItemStats(prev => ({
      ...prev,
      [name.trim()]: (prev[name.trim()] || 0) + 1
    }));
    setHiddenSuggestions(prev => prev.filter(s => s !== name.trim()));

    // If not in cache, fetch and update cache
    if (!isCacheValid) {
      try {
        const prices = await fetchPricesForItem(name, currentLoc);
        setItems(prev => prev.map(item => item.id === newItemId ? { ...item, prices } : item));
        
        // Update price cache
        setPriceCache(prev => ({
          ...prev,
          [cacheKey]: {
            prices,
            timestamp: Date.now()
          }
        }));
      } catch (error) { 
        console.error("Fetch price error:", error); 
      }
    }
  };

  const addItem = (name: string, quantity: number, unit: string, isPriority: boolean) => {
    const existing = items.find(i => i.name.trim().toLowerCase() === name.trim().toLowerCase() && !i.isBought);
    if (existing) {
      setDuplicateConflict({ name, quantity, unit, isPriority });
    } else {
      performAddItem(name, quantity, unit, isPriority);
    }
  };

  const removeSuggestion = (name: string) => {
    setHiddenSuggestions(prev => [...prev, name]);
  };

  const frequentItems = Object.entries(itemStats)
    .filter(([name, count]) => count >= 5 && !hiddenSuggestions.includes(name))
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .slice(0, 10);

  const resolveConflict = (action: 'update' | 'add') => {
    if (!duplicateConflict) return;
    if (action === 'update') {
      const existing = items.find(i => i.name.trim().toLowerCase() === duplicateConflict.name.trim().toLowerCase());
      if (existing) updateItem(existing.id, { quantity: existing.quantity + duplicateConflict.quantity });
    } else {
      performAddItem(duplicateConflict.name, duplicateConflict.quantity, duplicateConflict.unit, duplicateConflict.isPriority);
    }
    setDuplicateConflict(null);
  };

  const updateItem = (id: string, updates: Partial<ShoppingItem>) => {
    saveToHistory();
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteItem = (id: string) => {
    saveToHistory();
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const overrideStore = (id: string, store: StoreName | undefined) => {
    saveToHistory();
    setItems(prev => prev.map(i => i.id === id ? { ...i, manualStoreOverride: store } : i));
  };

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setItems(last.items);
    setMode(last.mode);
    setSelectedStore(last.selectedStore);
    setHistory(prev => prev.slice(0, -1));
  }, [history]);

  const handleSetMode = (newMode: CalcMode, store?: StoreName) => {
    setMode(newMode);
    if (store) setSelectedStore(store);
  };

  const handleShare = async () => {
    if (!familyId) {
      const newId = prompt("הכנס קוד משפחתי לסנכרון:");
      if (newId) setFamilyId(newId);
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}?family=${familyId}`;
    try { await navigator.clipboard.writeText(url); alert('קישור הועתק!'); } catch (e) { prompt("העתק:", url); }
  };

  const handleLocationChange = (newLoc: string, isGpsLoc: boolean) => {
    setLocation(newLoc);
    setIsGps(isGpsLoc);
    saveToHistory();
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a.isBought !== b.isBought) return a.isBought ? 1 : -1;
    if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
    return b.addedAt - a.addedAt;
  });

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center text-blue-600 font-black">טוען...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFF] pb-44 text-blue-950 antialiased overflow-x-hidden">
      <header className="sticky top-0 z-[60] px-4 pt-4 pb-2 bg-[#F8FAFF]/95 backdrop-blur-md border-b border-blue-50 shadow-sm">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-black text-blue-900 leading-none">הקנייה שלנו</h1>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full border ${familyId ? 'text-green-600 bg-green-50 border-green-100' : 'text-gray-400 bg-gray-50 border-gray-200'}`}>
                {isSyncing ? <RefreshCw className="w-2 h-2 animate-spin" /> : <Check className="w-2 h-2" />}
                {familyId ? `${familyId}` : 'מקומי'}
              </div>
              <LocationSelector currentLocation={location} isGps={isGps} onLocationChange={handleLocationChange} />
            </div>
          </div>
          <div className="flex gap-1.5">
            {history.length > 0 && (
              <button 
                onClick={handleUndo} 
                className="flex items-center gap-1.5 bg-white border border-red-50 text-red-500 px-3 py-1.5 rounded-xl shadow-sm hover:bg-red-50 active:scale-95 transition-all animate-in slide-in-from-left-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black">בטל</span>
              </button>
            )}
            <button onClick={handleShare} title="סנכרון משפחתי" className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-md active:scale-90 transition-all"><Users className="w-4 h-4" /></button>
            <button onClick={() => confirm('לנקות את כל הרשימה?') && (saveToHistory(), setItems([]))} title="ניקוי רשימה" className="w-9 h-9 flex items-center justify-center bg-white border border-blue-100 text-blue-200 rounded-xl active:scale-90 hover:text-red-400 transition-all"><RefreshCw className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        <AddForm onAdd={addItem} frequentItems={frequentItems} onRemoveFrequent={removeSuggestion} />

        {duplicateConflict && (
          <div className="fixed inset-0 bg-blue-950/20 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl">
              <AlertTriangle className="text-yellow-500 w-10 h-10 mx-auto mb-4" />
              <h2 className="text-base font-black text-center mb-4">"{duplicateConflict.name}" כבר רשום</h2>
              <div className="space-y-2">
                <button onClick={() => resolveConflict('update')} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-sm shadow-lg shadow-blue-100">עדכן כמות (+{duplicateConflict.quantity})</button>
                <button onClick={() => resolveConflict('add')} className="w-full bg-gray-50 text-gray-700 py-3 rounded-xl font-black text-sm">הוסף כשורה חדשה</button>
                <button onClick={() => setDuplicateConflict(null)} className="w-full text-gray-300 py-2 text-xs font-bold">ביטול</button>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 space-y-3 mt-4">
          {sortedItems.map(item => (
            <ItemCard key={item.id} item={item} onDelete={deleteItem} onUpdateItem={updateItem} onOverrideStore={overrideStore} activeStore={mode === 'SINGLE_STORE' ? selectedStore : null} />
          ))}
          {items.length === 0 && (
            <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-blue-50/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-blue-100" />
              </div>
              <p className="text-sm font-black text-blue-200">הרשימה שלך ריקה ומחכה להתמלא</p>
            </div>
          )}
        </div>
      </main>

      <StatsFooter items={items} mode={mode} selectedStore={selectedStore} onSetMode={handleSetMode} />
    </div>
  );
};

export default App;
