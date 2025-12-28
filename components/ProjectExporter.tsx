
import React, { useState } from 'react';
import { Copy, Download, Code, Check, Box } from 'lucide-react';

const PROJECT_FILES = [
  'index.html',
  'index.tsx',
  'App.tsx',
  'types.ts',
  'constants.ts',
  'geminiService.ts',
  'components/AddForm.tsx',
  'components/ItemCard.tsx',
  'components/StatsFooter.tsx',
  'components/LocationSelector.tsx',
  'metadata.json',
  'package.json',
  'tsconfig.json',
  'vite.config.ts'
];

interface ProjectExporterProps {
  onClose: () => void;
}

const ProjectExporter: React.FC<ProjectExporterProps> = ({ onClose }) => {
  const [bundle, setBundle] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateBundle = async () => {
    setIsGenerating(true);
    try {
      const fileContents: Record<string, string> = {};
      
      for (const filePath of PROJECT_FILES) {
        try {
          const response = await fetch(`/${filePath}`);
          if (response.ok) {
            fileContents[filePath] = await response.text();
          }
        } catch (e) {
          console.warn(`Could not bundle ${filePath}`);
        }
      }

      const jsonString = JSON.stringify({
        version: "1.0",
        timestamp: Date.now(),
        files: fileContents
      });

      const base64Bundle = btoa(unescape(encodeURIComponent(jsonString)));
      setBundle(base64Bundle);
    } catch (err) {
      alert('שגיאה ביצירת הצרור');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bundle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-blue-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden border border-blue-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
              <Box className="text-white w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-blue-950">ייצוא פרויקט מלא</h2>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Project Bundle Generator (Base64)</p>
            </div>
          </div>

          {!bundle ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 leading-relaxed">
                לחיצה על הכפתור תאסוף את כל קבצי המקור של האפליקציה (קוד, עיצוב והגדרות) ותהפוך אותם למחרוזת Base64 אחת שניתן לייבא במערכות תואמות.
              </p>
              <button 
                onClick={generateBundle}
                disabled={isGenerating}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? 'מייצר צרור...' : 'צור מחרוזת ייצוא (Base64)'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <textarea 
                  readOnly 
                  value={bundle}
                  className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-[10px] font-mono text-gray-400 break-all resize-none focus:outline-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-50/80 to-transparent pointer-events-none rounded-2xl" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-blue-100 active:scale-95 transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'הועתק!' : 'העתק קוד'}
                </button>
                <button 
                  onClick={() => {
                    const blob = new Blob([bundle], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `shopping-list-project-${Date.now()}.txt`;
                    a.click();
                  }}
                  className="flex items-center justify-center gap-2 bg-gray-50 text-blue-900 py-3.5 rounded-2xl font-black text-sm active:scale-95 transition-all border border-gray-100"
                >
                  <Download className="w-4 h-4" />
                  הורד קובץ
                </button>
              </div>
              <button 
                onClick={() => setBundle('')}
                className="w-full text-blue-400 text-[11px] font-bold py-2"
              >
                ייצר מחדש
              </button>
            </div>
          )}
        </div>
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-center">
          <button onClick={onClose} className="text-gray-400 text-xs font-bold hover:text-blue-600 transition-colors">סגור חלונית</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectExporter;
