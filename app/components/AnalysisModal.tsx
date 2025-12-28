'use client';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  analysis: string;
  loading: boolean;
};

export default function AnalysisModal({ isOpen, onClose, analysis, loading }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white/90 backdrop-blur-xl w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-white/50">
        
        {/* ヘッダー */}
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-slate-50 to-gray-100">
          <h3 className="text-xl font-black text-slate-700 flex items-center gap-2">
            <span className="text-2xl">📊</span> AI家計診断レポート
          </h3>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
              <p className="text-slate-600 font-bold animate-pulse">データを分析中...</p>
              <p className="text-xs text-slate-400">FPのAIが支出の傾向をチェックしています</p>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {/* AIのテキストをそのまま表示 */}
              {analysis}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-4 border-t border-gray-200/50 bg-white/50">
          <button 
            onClick={onClose} 
            className="w-full py-3 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-500/20"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}