
import React, { useState, useRef } from 'react';
import { Plus, Minus, Star, X, Loader2 } from 'lucide-react';
import { UNITS } from '../constants';
import { resolveItemVarieties } from '../geminiService';

interface AddFormProps {
  onAdd: (name: string, quantity: number, unit: string, isPriority: boolean) => void;
  frequentItems: string[];
  onRemoveFrequent: (name: string) => void;
}

const AddForm: React.FC<AddFormProps> = ({ onAdd, frequentItems, onRemoveFrequent }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isPriority, setIsPriority] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [varieties, setVarieties] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent, overrideName?: string) => {
    e?.preventDefault();
    const finalName = (overrideName || name).trim();
    if (!finalName) return;

    // If it's a new vague search and not a variety selection, try to find varieties
    if (!overrideName && finalName.split(' ').length === 1) {
      setIsResolving(true);
      const suggestions = await resolveItemVarieties(finalName);
      if (suggestions && suggestions.length > 0) {
        setVarieties(suggestions);
        setName(finalName); 
        setIsResolving(false);
        return; 
      }
      setIsResolving(false);
    }

    // Capture values before reset
    const itemToAdd = finalName;
    const qtyToAdd = quantity;
    const priorityToAdd = isPriority;

    // Reset UI
    setName('');
    setQuantity(1);
    setIsPriority(false);
    setVarieties([]);

    onAdd(itemToAdd, qtyToAdd, 'יח\'', priorityToAdd);
    inputRef.current?.focus();
  };

  return (
    <div className="bg-white/90 backdrop-blur-md px-3 py-3 border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-md mx-auto relative space-y-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-inner">
          <button
            type="button"
            onClick={() => setIsPriority(!isPriority)}
            className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
              isPriority ? 'bg-yellow-100 text-yellow-600' : 'text-gray-300'
            }`}
          >
            <Star className={`w-5 h-5 ${isPriority ? 'fill-yellow-400' : ''}`} />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => { 
              setName(e.target.value); 
              if(varieties.length > 0 && e.target.value === '') setVarieties([]); 
            }}
            placeholder="מה להוסיף לרשימה?"
            className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-blue-950 px-2"
          />

          <div className="flex items-center bg-white rounded-lg px-1 border border-gray-100">
            <button type="button" onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))} className="p-1 text-blue-500"><Minus className="w-3 h-3" /></button>
            <span className="text-[11px] font-black min-w-[20px] text-center tabular-nums">{quantity}</span>
            <button type="button" onClick={() => setQuantity(quantity + 0.5)} className="p-1 text-blue-500"><Plus className="w-3 h-3" /></button>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || isResolving}
            className="w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-xl shadow-md active:scale-90 disabled:opacity-20 transition-all"
          >
            {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
          </button>
        </form>

        {varieties.length > 0 && (
          <div className="bg-white border border-blue-100 rounded-2xl shadow-xl p-2.5 animate-in slide-in-from-top-2 relative border-t-4 border-t-blue-500">
            <button onClick={() => setVarieties([])} className="absolute top-2 left-2 text-gray-300 hover:text-red-400 p-1"><X className="w-3.5 h-3.5" /></button>
            <p className="text-[10px] font-black text-blue-500 mb-2 px-1">בחר סוג ספציפי לקנייה מדויקת:</p>
            <div className="flex flex-wrap gap-1.5">
              {varieties.map(v => (
                <button
                  key={v}
                  onClick={() => handleSubmit(undefined, v)}
                  className="bg-blue-50 text-blue-700 px-3 py-2 rounded-xl text-[11px] font-bold hover:bg-blue-100 transition-colors flex items-center"
                >
                  {v}
                </button>
              ))}
              <button 
                onClick={() => { 
                  const n = name;
                  onAdd(n, quantity, 'יח\'', isPriority); 
                  setVarieties([]); 
                  setName(''); 
                }} 
                className="text-[10px] text-gray-400 font-bold px-2 py-1 bg-gray-50 rounded-lg"
              >
                הוסף כפי שכתבתי ("{name}")
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {frequentItems.map(item => (
            <div key={item} className="flex-shrink-0 flex items-center bg-white border border-gray-100 rounded-full pl-1 pr-3 py-1.5 hover:border-blue-200 transition-colors group shadow-sm">
              <button onClick={() => handleSubmit(undefined, item)} className="text-[11px] font-bold text-gray-700 flex items-center px-1">
                {item}
              </button>
              <button 
                type="button"
                onClick={(e) => { 
                  e.stopPropagation();
                  onRemoveFrequent(item); 
                }}
                className="mr-1.5 p-0.5 text-gray-300 hover:text-red-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddForm;
