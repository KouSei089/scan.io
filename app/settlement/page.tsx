'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Modal from '../components/Modal';
import EditModal from '../components/EditModal';
import CategoryChart from '../components/CategoryChart';
import AnalysisModal from '../components/AnalysisModal';

type Expense = {
  id: number;
  store_name: string;
  amount: number;
  purchase_date: string;
  paid_by: string;
  category: string | null;
};

export default function SettlementPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [myUserName, setMyUserName] = useState<string>('');

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'confirm' as 'alert' | 'confirm',
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const closeModal = () => setModalConfig((prev) => ({ ...prev, isOpen: false }));

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Expense | null>(null);

  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem('scan_io_user_name');
    if (!storedName) {
      router.push('/login');
    } else {
      setMyUserName(storedName);
    }
  }, [router]);

  const getCategoryIcon = (cat: string | null) => {
    switch(cat) {
      case 'food': return '🥦';
      case 'daily': return '🧻';
      case 'eatout': return '🍻';
      case 'transport': return '🚃';
      case 'other': return '📦';
      default: return '📄';
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const firstDayStr = toYMD(new Date(year, month, 1));
    const lastDayStr = toYMD(new Date(year, month + 1, 0));

    const { data, error } = await supabase.from('expenses').select('*').gte('purchase_date', firstDayStr).lte('purchase_date', lastDayStr).order('purchase_date', { ascending: false });
    if (error) console.error(error);
    else setExpenses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, [currentMonth]);

  const changeMonth = (amount: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + amount);
    setCurrentMonth(newDate);
  };

  const handleDeleteClick = (id: number) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: '記録の削除',
      message: 'この記録を削除してもよろしいですか？',
      onConfirm: () => handleDelete(id),
    });
  };

  const handleDelete = async (id: number) => {
    closeModal();
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) {
      setExpenses(expenses.filter(e => e.id !== id));
    } else {
      alert('削除に失敗しました');
    }
  };

  const handleEditClick = (item: Expense) => {
    setEditingItem(item);
    setIsEditOpen(true);
  };

  const handleUpdateComplete = () => {
    fetchExpenses();
  };

  // ★修正: テキストのインデントを削除して左に詰めました
  const handleAnalyze = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      setAnalysisResult(`🚧 準備中 (Coming Soon)

AI家計診断機能は、次回のアップデートで公開予定です！

💡 どんな機能？
プロのFP役のAIが、あなたの今月の家計簿データを分析します。
「外食が多すぎるかも？」「先月より節約できてる！」といったアドバイスをくれるようになります。

実装をお楽しみに！`);
      setIsAnalysisOpen(true);
      setIsAnalyzing(false);
    }, 500);
  };

  const totalMe = expenses.filter(e => e.paid_by === myUserName).reduce((sum, e) => sum + e.amount, 0);
  const totalPartner = expenses.filter(e => e.paid_by !== myUserName).reduce((sum, e) => sum + e.amount, 0);
  const totalAmount = totalMe + totalPartner;
  const splitAmount = Math.round(totalAmount / 2);
  const balance = totalMe - splitAmount;
  const monthLabel = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;

  if (!myUserName) return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100"></div>;

  return (
    <div className="p-8 max-w-md mx-auto min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 text-gray-700 relative pb-32 font-medium">
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        confirmText="削除する"
      />

      <EditModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        expense={editingItem}
        onUpdate={handleUpdateComplete}
      />

      <AnalysisModal 
        isOpen={isAnalysisOpen} 
        onClose={() => setIsAnalysisOpen(false)} 
        analysis={analysisResult}
        loading={isAnalyzing}
      />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-700 drop-shadow-sm">精算</h1>
        <button onClick={() => window.location.href = '/'} className="text-sm font-bold text-slate-600 bg-white/80 backdrop-blur-md border border-white/40 px-4 py-2 rounded-full hover:bg-white hover:-translate-y-0.5 transition-all shadow-sm">← 入力に戻る</button>
      </div>

      <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/40 mb-8 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
        <button onClick={() => changeMonth(-1)} className="p-4 hover:bg-white/50 rounded-full transition text-gray-500 relative z-10">◀︎ 先月</button>
        <span className="font-black text-2xl text-gray-700 relative z-10">{monthLabel}</span>
        <button onClick={() => changeMonth(1)} className="p-4 hover:bg-white/50 rounded-full transition text-gray-500 relative z-10">次月 ▶︎</button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-600 font-bold animate-pulse">読み込み中...</div>
      ) : (
        <>
          <CategoryChart expenses={expenses} />

          <button 
            onClick={handleAnalyze}
            className="w-full mb-8 py-4 bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-sm text-slate-600 font-bold hover:bg-white hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🤖</span>
            <span>AI家計診断を受ける</span>
          </button>

          <div className={`p-8 rounded-3xl text-white shadow-[0_10px_40px_rgb(0,0,0,0.15)] border border-white/20 mb-10 transition-all relative overflow-hidden ${balance === 0 ? 'bg-gradient-to-br from-gray-500 to-gray-600' : balance > 0 ? 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-500/20' : 'bg-gradient-to-br from-rose-400 to-rose-500 shadow-rose-500/20'}`}>
            <div className="absolute inset-0 bg-white/10 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-white/30 to-transparent blur-xl opacity-30 pointer-events-none"></div>
            <p className="text-sm font-bold opacity-90 mb-2 relative z-10">{monthLabel}の精算</p>
            <h2 className="text-4xl font-black mb-4 relative z-10 drop-shadow-sm">
              {balance === 0 ? '精算なし' : (
                <>相手{balance > 0 ? 'から' : 'へ'}<span className="mx-3 underline underline-offset-8 decoration-white/50">{Math.abs(balance).toLocaleString()}</span>円{balance > 0 ? 'もらう' : '払う'}</>
              )}
            </h2>
            <p className="text-sm font-bold opacity-80 text-right relative z-10">(合計: {totalAmount.toLocaleString()}円 / 2 = {splitAmount.toLocaleString()}円ずつ)</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/40 mb-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
            <h3 className="font-bold mb-6 pb-3 text-gray-700 border-b border-gray-200/50 relative z-10">内訳</h3>
            <div className="flex justify-between mb-4 relative z-10">
              <span className="flex items-center text-gray-700 font-bold"><span className="w-4 h-4 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full mr-4 shadow-sm"></span>あなた ({myUserName})</span>
              <span className="font-black text-xl">{totalMe.toLocaleString()}円</span>
            </div>
            <div className="flex justify-between pt-4 relative z-10">
              <span className="flex items-center text-gray-700 font-bold"><span className="w-4 h-4 bg-gradient-to-br from-rose-400 to-rose-500 rounded-full mr-4 shadow-sm"></span>相手</span>
              <span className="font-black text-xl text-rose-600">{totalPartner.toLocaleString()}円</span>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-6 text-gray-700 ml-2">{monthLabel}の履歴 ({expenses.length}件)</h3>
            {expenses.length === 0 ? (
              <p className="text-center text-gray-500 font-bold text-sm py-12 bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/40">データがありません</p>
            ) : (
              <ul className="space-y-4">
                {expenses.map((item, index) => {
                  const isMe = item.paid_by === myUserName;
                  return (
                    <li key={item.id} className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-white/60 flex justify-between items-center hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all">
                      <div className="flex items-center gap-5">
                        <span className="text-4xl bg-gray-100/80 p-3 rounded-2xl shadow-inner">{getCategoryIcon(item.category)}</span>
                        <div>
                          <p className="font-black text-gray-800 text-lg mb-1">{item.store_name || '店名なし'}</p>
                          <p className="text-gray-500 text-xs font-bold">{item.purchase_date.replace(/-/g, '/')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-black text-xl mb-1">¥{item.amount.toLocaleString()}</p>
                          <span className={`text-xs px-3 py-1.5 rounded-full font-bold shadow-sm ${isMe ? 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700' : 'bg-gradient-to-r from-rose-50 to-rose-100 text-rose-700'}`}>{item.paid_by}</span>
                        </div>
                        
                        {isMe && (
                          <div className="flex gap-2">
                            <button onClick={() => handleEditClick(item)} className="text-slate-500 bg-slate-100/50 hover:bg-slate-200 p-3 rounded-full transition-all shadow-sm hover:-translate-y-0.5">✏️</button>
                            <button onClick={() => handleDeleteClick(item.id)} className="text-rose-500 bg-rose-50/50 hover:bg-rose-100 p-3 rounded-full transition-all shadow-sm hover:-translate-y-0.5">🗑️</button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}