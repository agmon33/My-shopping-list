
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Check, Loader2, Search, X } from 'lucide-react';
import { suggestLocations, reverseGeocode } from '../geminiService';

interface LocationSelectorProps {
  currentLocation: string;
  isGps: boolean;
  onLocationChange: (loc: string, isGps: boolean) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ currentLocation, isGps, onLocationChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempLoc, setTempLoc] = useState(currentLocation);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync tempLoc with external state when not editing
  useEffect(() => {
    if (!isEditing) {
      setTempLoc(currentLocation);
    }
  }, [currentLocation, isEditing]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (isEditing && tempLoc.length > 1 && tempLoc !== currentLocation) {
        setIsLoading(true);
        const results = await suggestLocations(tempLoc);
        setSuggestions(results);
        setIsLoading(false);
      } else {
        setSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [tempLoc, isEditing, currentLocation]);

  const handleGps = () => {
    if (!navigator.geolocation) return;
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const readableAddress = await reverseGeocode(latitude, longitude);
      onLocationChange(readableAddress, true);
      setTempLoc(readableAddress);
      setIsLoading(false);
      setIsEditing(false);
    }, () => {
      setIsLoading(false);
      alert("לא ניתן לגשת למיקום GPS. אנא בדוק הגדרות פרטיות.");
    });
  };

  const selectSuggestion = (loc: string) => {
    onLocationChange(loc, false);
    setTempLoc(loc);
    setSuggestions([]);
    setIsEditing(false);
  };

  const handleManualSubmit = () => {
    if (tempLoc.trim()) {
      onLocationChange(tempLoc, false);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsEditing(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-1.5">
        <div className="flex items-center">
          <button 
            onClick={() => { setIsEditing(true); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
              isEditing ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-50' : 'bg-blue-50/40 border-blue-100/50 hover:bg-blue-100'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
            ) : isGps ? (
              <Navigation className="w-3.5 h-3.5 text-blue-600 fill-blue-600/10" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
            )}
            
            {isEditing ? (
              <input 
                autoFocus
                value={tempLoc}
                onChange={(e) => setTempLoc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                onClick={(e) => e.stopPropagation()}
                placeholder="חפש עיר, רחוב או סניף..."
                className="bg-transparent text-[11px] font-black text-blue-900 outline-none w-36"
              />
            ) : (
              <span className="text-[10px] font-black text-blue-900 truncate max-w-[120px]">
                {currentLocation || 'בחר מיקום לקנייה...'}
              </span>
            )}

            {!isEditing && currentLocation && (
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="מיקום מאומת" />
            )}
          </button>
        </div>

        {!isEditing && (
          <button 
            onClick={handleGps}
            title="השתמש במיקום GPS נוכחי"
            className="w-8 h-8 flex items-center justify-center bg-white rounded-xl border border-blue-100 text-blue-500 hover:bg-blue-600 hover:text-white shadow-sm active:scale-90 transition-all"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
        )}
        
        {isEditing && (
          <button onClick={() => setIsEditing(false)} className="bg-gray-100 text-gray-400 hover:text-red-500 p-1.5 rounded-xl">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isEditing && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-white border border-blue-100 rounded-3xl shadow-2xl z-[100] overflow-hidden animate-in slide-in-from-top-2 duration-300">
          <div className="p-2 flex flex-col gap-1">
            {suggestions.map((loc, idx) => (
              <button
                key={idx}
                onClick={() => selectSuggestion(loc)}
                className="flex items-center gap-3 px-4 py-3 text-right hover:bg-blue-50 rounded-2xl transition-all group"
              >
                <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-white">
                  <Search className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500" />
                </div>
                <span className="text-xs font-bold text-blue-950">{loc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
