
import React, { useMemo } from 'react';
import { ShoppingItem, CalcMode, StoreName } from '../types';
import { STORES, SHIPPING_FEES } from '../constants';
import { Zap, ShoppingCart, Truck } from 'lucide-react';

interface StatsFooterProps {
  items: ShoppingItem[];
  mode: CalcMode;
  selectedStore: StoreName | null;
  onSetMode: (mode: CalcMode, store?: StoreName) => void;
}

const StatsFooter: React.FC<StatsFooterProps> = ({ items, mode, selectedStore, onSetMode }) => {
  // Calculate totals including shipping
  const totals = useMemo(() => {
    const storeResults: Record<string, { total: number; spent: number; shipping: number }> = {};
    
    STORES.forEach(store => {
      let productsSum = 0;
      let spentSum = 0;
      const hasProducts = items.length > 0;
      
      items.forEach(item => {
        const p = item.prices.find(price => price.store === store);
        const itemPrice = p ? p.price : (item.prices.length > 0 ? item.prices[0].price : 0);
        const cost = itemPrice * item.quantity;
        
        productsSum += cost;
        if (item.isBought) spentSum += cost;
      });
      
      const shipping = hasProducts ? SHIPPING_FEES[store] : 0;
      storeResults[store] = { 
        total: productsSum + shipping, 
        spent: spentSum,
        shipping: shipping
      };
    });

    // Cheapest overall (usually means pickup from multiple places, so shipping is 0)
    let cheapestTotal = 0;
    let cheapestSpent = 0;
    items.forEach(item => {
      if (item.prices.length > 0) {
        const minPrice = Math.min(...item.prices.map(p => p.price));
        const cost = minPrice * item.quantity;
        cheapestTotal += cost;
        if (item.isBought) cheapestSpent += cost;
      }
    });

    return { stores: storeResults, cheapest: { total: cheapestTotal, spent: cheapestSpent, shipping: 0 } };
  }, [items]);

  const currentData = mode === 'CHEAPEST_OVERALL' 
    ? totals.cheapest 
    : (selectedStore ? totals.stores[selectedStore] : { total: 0, spent: 0, shipping: 0 });

  const progressWidth = currentData.total > 0 ? (currentData.spent / (currentData.total - currentData.shipping)) * 100 : 0;

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-8 pointer-events-none">
      <div className="max-w-md mx-auto relative">
        {/* Main Footer Container */}
        <div className="bg-white/98 backdrop-blur-2xl border border-blue-50/50 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] pointer-events-auto overflow-hidden">
          
          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-gray-100/50">
            <div 
              className="h-full bg-blue-500 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
              style={{ width: `${Math.min(100, progressWidth)}%` }}
            />
          </div>

          <div className="p-3 flex items-center justify-between gap-2">
            
            {/* Store Scroller */}
            <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              <button 
                onClick={() => onSetMode('CHEAPEST_OVERALL')} 
                className={`flex-shrink-0 flex flex-col items-center justify-center px-4 py-2.5 rounded-2xl border transition-all ${
                  mode === 'CHEAPEST_OVERALL' 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                    : 'bg-white text-blue-500 border-blue-100'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 mb-1 ${mode === 'CHEAPEST_OVERALL' ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-black leading-none">הסל הזול</span>
                <span className="text-[9px] font-bold opacity-80 mt-1 tabular-nums">₪{totals.cheapest.total.toFixed(0)}</span>
              </button>

              {STORES.map(store => (
                <button 
                  key={store} 
                  onClick={() => onSetMode('SINGLE_STORE', store)} 
                  className={`flex-shrink-0 flex flex-col items-center justify-center px-4 py-2.5 rounded-2xl border transition-all ${
                    mode === 'SINGLE_STORE' && selectedStore === store 
                      ? 'bg-blue-50 text-blue-900 border-blue-400 shadow-sm' 
                      : 'bg-gray-50/50 text-gray-400 border-gray-100'
                  }`}
                >
                  <span className="text-[10px] font-black leading-none">{store}</span>
                  <span className="text-[9px] font-bold opacity-70 mt-1.5 tabular-nums">₪{totals.stores[store].total.toFixed(0)}</span>
                </button>
              ))}
            </div>

            {/* Total Section */}
            <div className="flex flex-col items-end pl-2 min-w-[125px] border-r border-gray-100">
              <div className="flex items-center gap-1.5 mb-0.5">
                {mode === 'SINGLE_STORE' ? <Truck className="w-3 h-3 text-blue-500" /> : <ShoppingCart className="w-3 h-3 text-blue-400" />}
                <span className="text-blue-500 text-[9px] font-black uppercase tracking-wider">
                  {mode === 'SINGLE_STORE' ? 'סה"כ משלוח' : 'שווי הסל'}
                </span>
              </div>
              <div className="text-2xl font-black text-blue-950 leading-none tabular-nums">
                ₪{currentData.total.toFixed(1)}
              </div>
              <div className="mt-1 flex flex-col items-end">
                <div className="flex items-center gap-1">
                   <span className="text-[10px] font-black text-green-600 bg-green-50 px-1.5 rounded-md tabular-nums">₪{currentData.spent.toFixed(1)}</span>
                   <span className="text-[8px] font-bold text-gray-400">בסל</span>
                </div>
                {mode === 'SINGLE_STORE' && (
                  <div className="text-[8px] font-black text-blue-400 mt-0.5">
                    (כולל ₪{currentData.shipping} דמי משלוח)
                  </div>
                )}
                {mode === 'CHEAPEST_OVERALL' && (
                  <div className="text-[8px] font-black text-gray-300 mt-0.5">
                    * באיסוף עצמי (פיצול סל)
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsFooter;
