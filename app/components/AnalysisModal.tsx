import { X, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  analysis: string;
  loading: boolean;
};

export default function AnalysisModal({ isOpen, onClose, analysis, loading }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* ヘッダー */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <Sparkles className="text-yellow-500 fill-yellow-500" size={20} />
            <h2 className="font-black text-lg">AI家計診断レポート</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 size={40} className="animate-spin text-blue-500" />
              <p className="text-sm font-bold animate-pulse">Geminiが分析中...</p>
            </div>
          ) : (
            <div className="text-slate-600 leading-relaxed">
              {/* ▼ ReactMarkdownで整形して表示 */}
              <ReactMarkdown
                components={{
                  h2: ({...props}) => <h2 className="text-xl font-black text-slate-800 mt-6 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2" {...props} />,
                  h3: ({...props}) => <h3 className="text-lg font-bold text-slate-700 mt-5 mb-2" {...props} />,
                  p: ({...props}) => <p className="mb-4 text-sm sm:text-base" {...props} />,
                  ul: ({...props}) => <ul className="list-disc list-inside mb-4 space-y-1 bg-slate-50 p-4 rounded-xl" {...props} />,
                  li: ({...props}) => <li className="text-sm" {...props} />,
                  strong: ({...props}) => <strong className="font-black text-slate-800 bg-yellow-100/50 px-1 rounded" {...props} />,
                }}
              >
                {analysis}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center">
          <button 
            onClick={onClose}
            className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-2xl shadow-lg hover:bg-slate-700 transition-all active:scale-95"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}