
import React from 'react';
import { ShoppingItem, StoreName } from '../types';
import { Star, Trash2, CheckCircle2, Circle, Plus, Minus, Zap, Loader2 } from 'lucide-react';

interface ItemCardProps {
  item: ShoppingItem; 
  onDelete: (id: string) => void;
  onUpdateItem: (id: string, updates: Partial<ShoppingItem>) => void;
  onOverrideStore: (id: string, store: StoreName | undefined) => void;
  activeStore: StoreName | null;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onDelete, onUpdateItem, onOverrideStore, activeStore }) => {
  const emoji = item.emoji || '📦';
  const availablePrices = item.prices.filter(p => p.price > 0);
  const minPrice = availablePrices.length > 0 ? Math.min(...availablePrices.map(p => p.price)) : 0;
  const isUpdating = availablePrices.length === 0 && !item.isBought;

  return (
    <div className={`group bg-white rounded-[24px] p-3 shadow-sm border border-gray-100 transition-all ${item.isBought ? 'opacity-40 grayscale-[0.5]' : 'hover:border-blue-100 shadow-blue-900/5'}`}>
      <div className="flex flex-col gap-3">
        
        {/* Main Row: [Check (Right)] | [Name (Center)] | [Quantity (Left)] */}
        <div className="flex items-center gap-3">
          
          {/* Status Checkbox */}
          <button 
            onClick={() => onUpdateItem(item.id, { isBought: !item.isBought })} 
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all active:scale-90 ${
              item.isBought 
                ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100' 
                : 'bg-white border-gray-200 text-gray-200 hover:border-blue-300'
            }`}
          >
            {item.isBought ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5 stroke-[1.5px]" />}
          </button>

          {/* Name and Emoji Section */}
          <div className="flex-1 flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-blue-50/50 flex items-center justify-center text-lg flex-shrink-0 border border-blue-50/50 shadow-sm">
              {emoji}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                {item.isPriority && <Star className="w-3 h-3 fill-yellow-400 text-yellow-500 flex-shrink-0" />}
                <h3 className={`font-black text-[13px] text-blue-950 truncate ${item.isBought ? 'line-through text-gray-400' : ''}`}>
                  {item.name}
                </h3>
              </div>
              {isUpdating && (
                <div className="flex items-center gap-1.5 mt-0.5 animate-pulse">
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-blue-400" />
                  <span className="text-[9px] font-black text-blue-300">סורק מחירים בסניפים...</span>
                </div>
              )}
            </div>
          </div>

          {/* Controls: Quantity & Trash */}
          <div className="flex items-center gap-1.5">
            {!item.isBought && (
              <button 
                onClick={() => onDelete(item.id)} 
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 p-1.5 transition-all hidden md:block"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="flex items-center bg-gray-50/80 rounded-full p-0.5 border border-gray-100 shadow-inner">
              <button 
                onClick={() => onUpdateItem(item.id, { quantity: item.quantity + 0.5 })} 
                className="w-6 h-6 flex items-center justify-center text-blue-600 hover:bg-white rounded-full transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
              <span className="w-7 text-center text-[10px] font-black text-blue-950 tabular-nums">
                {item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(1)}
              </span>
              <button 
                onClick={() => onUpdateItem(item.id, { quantity: Math.max(0.5, item.quantity - 0.5) })} 
                className="w-6 h-6 flex items-center justify-center text-blue-600 hover:bg-white rounded-full transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>
            {!item.isBought && (
              <button 
                onClick={() => onDelete(item.id)} 
                className="text-gray-200 hover:text-red-400 p-1.5 md:hidden"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Price Options Row */}
        {!item.isBought && availablePrices.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {availablePrices.map((p) => {
              const isCheapest = p.price === minPrice;
              const isSelected = item.manualStoreOverride === p.store || (!item.manualStoreOverride && activeStore === p.store) || (!item.manualStoreOverride && !activeStore && isCheapest);

              return (
                <button 
                  key={p.store} 
                  onClick={() => onOverrideStore(item.id, p.store)} 
                  className={`flex-shrink-0 flex flex-col items-start px-3 py-1.5 rounded-2xl border transition-all ${
                    isSelected 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100 scale-[1.02]' 
                      : 'bg-white border-gray-50 text-gray-400 hover:border-blue-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    {isCheapest && <Zap className={`w-2.5 h-2.5 ${isSelected ? 'text-yellow-300' : 'text-blue-400'} fill-current`} />}
                    <span className="text-[10px] font-black">{p.store}</span>
                    <span className="text-[10px] font-bold tabular-nums">₪{(p.price * item.quantity).toFixed(1)}</span>
                  </div>
                  <div className={`text-[8px] truncate max-w-[80px] font-bold mt-0.5 ${isSelected ? 'text-white/70' : 'text-gray-300'}`}>
                    {p.branchName || 'סניף קרוב'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemCard;
