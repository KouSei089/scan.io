'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Modal from '../components/Modal';
import EditModal from '../components/EditModal';
import CategoryChart from '../components/CategoryChart';
import AnalysisModal from '../components/AnalysisModal';
import { Smile } from 'lucide-react';

type Expense = {
  id: number;
  store_name: string;
  amount: number;
  purchase_date: string;
  paid_by: string;
  category: string | null;
  reactions: { [key: string]: string } | null;
};

const REACTION_TYPES = [
  { 
    id: 'heart', 
    src: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Red%20Heart.png',
    bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600'
  },
  { 
    id: 'good', 
    src: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Thumbs%20Up.png',
    bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600'
  },
  { 
    id: 'party', 
    src: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Party%20Popper.png',
    bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600'
  },
  { 
    id: 'please', 
    src: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Folded%20Hands.png',
    bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600'
  },
];

export default function SettlementPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [myUserName, setMyUserName] = useState<string>('');
  const [activePickerId, setActivePickerId] = useState<number | null>(null);
  
  const [modalConfig, setModalConfig] = useState({
    isOpen: false, type: 'confirm' as 'alert' | 'confirm', title: '', message: '', onConfirm: () => {},
  });
  const closeModal = () => setModalConfig((prev) => ({ ...prev, isOpen: false }));
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Expense | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const storedName = localStorage.getItem('scan_io_user_name');
    if (!storedName) router.push('/login');
    else setMyUserName(storedName);
  }, [router]);

  useEffect(() => {
    const handleClickOutside = () => setActivePickerId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

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
    if (error) console.error(error); else setExpenses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, [currentMonth]);

  const changeMonth = (amount: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + amount);
    setCurrentMonth(newDate);
  };

  const handleDeleteClick = (id: number) => {
    setModalConfig({ isOpen: true, type: 'confirm', title: '記録の削除', message: 'この記録を削除してもよろしいですか？', onConfirm: () => handleDelete(id), });
  };

  const handleDelete = async (id: number) => {
    closeModal();
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) setExpenses(expenses.filter(e => e.id !== id));
    else alert('削除に失敗しました');
  };

  const handleEditClick = (item: Expense) => { setEditingItem(item); setIsEditOpen(true); };
  const handleUpdateComplete = () => { fetchExpenses(); };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalysisResult(`## 🚧 準備中 (Coming Soon)\n\nAI家計診断機能は、次回のアップデートで公開予定です！\n\n実装をお楽しみに！`);
      setIsAnalysisOpen(true); setIsAnalyzing(false);
    }, 500);
  };

  const handleReaction = async (item: Expense, reactionId: string) => {
    const currentReactions = item.reactions || {};
    const myCurrentReactionId = currentReactions[myUserName];
    let newReactions = { ...currentReactions };

    if (myCurrentReactionId === reactionId) {
      delete newReactions[myUserName];
    } else {
      newReactions[myUserName] = reactionId;
    }

    setActivePickerId(null);
    const updatedExpenses = expenses.map(e => e.id === item.id ? { ...e, reactions: newReactions } : e);
    setExpenses(updatedExpenses);
    await supabase.from('expenses').update({ reactions: newReactions }).eq('id', item.id);
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
      <Modal isOpen={modalConfig.isOpen} onClose={closeModal} type={modalConfig.type} title={modalConfig.title} message={modalConfig.message} onConfirm={modalConfig.onConfirm} confirmText="削除する" />
      <EditModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} expense={editingItem} onUpdate={handleUpdateComplete} />
      <AnalysisModal isOpen={isAnalysisOpen} onClose={() => setIsAnalysisOpen(false)} analysis={analysisResult} loading={isAnalyzing} />

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

          <button onClick={handleAnalyze} className="w-full mb-8 py-4 bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-sm text-slate-600 font-bold hover:bg-white hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🤖</span>
            <span>AI家計診断を受ける</span>
          </button>

          <div className={`p-8 rounded-3xl text-white shadow-[0_10px_40px_rgb(0,0,0,0.15)] border border-white/20 mb-10 transition-all relative overflow-hidden ${balance === 0 ? 'bg-gradient-to-br from-gray-500 to-gray-600' : balance > 0 ? 'bg-gradient-to-br from-slate-500 to-slate-600 shadow-slate-500/20' : 'bg-gradient-to-br from-rose-400 to-rose-500 shadow-rose-500/20'}`}>
            <div className="absolute inset-0 bg-white/10 mix-blend-overlay pointer-events-none"></div>
            <p className="text-sm font-bold opacity-90 mb-2 relative z-10">{monthLabel}の精算</p>
            <h2 className="text-4xl font-black mb-4 relative z-10 drop-shadow-sm">
              {balance === 0 ? '精算なし' : (
                <>相手{balance > 0 ? 'から' : 'へ'}<span className="mx-3 underline underline-offset-8 decoration-white/50">{Math.abs(balance).toLocaleString()}</span>円{balance > 0 ? 'もらう' : '払う'}</>
              )}
            </h2>
            <p className="text-sm font-bold opacity-80 text-right relative z-10">(合計: {totalAmount.toLocaleString()}円 / 2 = {splitAmount.toLocaleString()}円ずつ)</p>
          </div>

          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/40 mb-10 relative overflow-hidden">
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
                {expenses.map((item) => {
                  const isMe = item.paid_by === myUserName;
                  const reactions = item.reactions || {};
                  const reactionEntries = Object.entries(reactions);

                  return (
                    <li key={item.id} className="bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-white/60 hover:bg-white transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl bg-gray-100/80 p-3 rounded-2xl shadow-inner">{getCategoryIcon(item.category)}</span>
                          <div>
                            <p className="font-black text-gray-800 text-lg mb-0.5">{item.store_name || '店名なし'}</p>
                            <p className="text-gray-400 text-xs font-bold">{item.purchase_date.replace(/-/g, '/')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-xl mb-1 text-slate-700">¥{item.amount.toLocaleString()}</p>
                          <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${isMe ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-600'}`}>{item.paid_by}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2 relative min-h-[32px] flex-wrap">
                        
                        {/* 3D絵文字リアクションチップ (スタイル修正) */}
                        {reactionEntries.map(([user, reactionId]) => {
                          const isMyReaction = user === myUserName;
                          const reactionType = REACTION_TYPES.find(r => r.id === reactionId);
                          if (!reactionType) return null;

                          return (
                            <button
                              key={user}
                              onClick={(e) => { e.stopPropagation(); handleReaction(item, reactionId); }}
                              // ★修正ポイント: py-1.5 -> py-1 に変更し、leading-none を追加
                              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm leading-none shadow-sm transition-all border group relative overflow-hidden ${
                                isMyReaction 
                                  ? `${reactionType.bg} ${reactionType.border} ${reactionType.text} ring-1 ring-white`
                                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 grayscale hover:grayscale-0'
                              }`}
                            >
                              {/* ★修正ポイント: block クラスを追加 */}
                              <img src={reactionType.src} alt="reaction" className="w-5 h-5 object-contain block drop-shadow-sm transition-transform active:scale-90" />
                              <span className="text-[10px] font-bold">{user}</span>
                            </button>
                          );
                        })}

                        <div className="relative">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActivePickerId(activePickerId === item.id ? null : item.id); }}
                            // ★修正ポイント: こちらも leading-none を追加して高さを合わせる
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors leading-none"
                          >
                            <Smile size={18} strokeWidth={2.5} />
                          </button>

                          {activePickerId === item.id && (
                            <div className="absolute left-0 bottom-full mb-2 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 p-2 flex gap-2 z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
                              {REACTION_TYPES.map((type) => (
                                <button
                                  key={type.id}
                                  onClick={(e) => { e.stopPropagation(); handleReaction(item, type.id); }}
                                  className="w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:scale-125 active:scale-95 hover:bg-slate-50"
                                >
                                  <img src={type.src} alt={type.id} className="w-8 h-8 object-contain drop-shadow-sm" />
                                </button>
                              ))}
                              <div className="absolute left-3 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white"></div>
                            </div>
                          )}
                        </div>

                        {isMe && (
                          <div className="ml-auto flex gap-3">
                            <button onClick={() => handleEditClick(item)} className="text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors">編集</button>
                            <button onClick={() => handleDeleteClick(item.id)} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">削除</button>
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