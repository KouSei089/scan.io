'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Webcam from 'react-webcam';
import { useRouter } from 'next/navigation';
import { supabase } from './lib/supabase';
import Modal from './components/Modal';
import TemplateModal from './components/TemplateModal';

type User = {
  id: number;
  name: string;
};

type Template = {
  id: number;
  title: string;
  store_name: string;
  amount: number;
  category: string;
  paid_by: string;
};

export default function Home() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [myUserId, setMyUserId] = useState<string>('');
  const [myUserName, setMyUserName] = useState<string>('');
  const [userList, setUserList] = useState<User[]>([]);
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const [payer, setPayer] = useState<string>(''); 
  const [category, setCategory] = useState<string>('food');
  const [showCamera, setShowCamera] = useState(false);
  const webcamRef = useRef<Webcam>(null);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'alert' as 'alert' | 'confirm' | 'prompt',
    title: '',
    message: '',
    defaultValue: '',
    onConfirm: (val?: string) => {},
  });

  const openModal = (config: any) => setModalConfig({ ...config, isOpen: true });
  const closeModal = () => setModalConfig((prev) => ({ ...prev, isOpen: false }));

  const fetchUserList = async () => {
    const { data } = await supabase.from('users').select('id, name').order('id');
    if (data) setUserList(data);
  };

  const fetchTemplates = async () => {
    const { data } = await supabase.from('templates').select('*').order('id');
    if (data) setTemplates(data);
  };

  useEffect(() => {
    const storedId = localStorage.getItem('scan_io_user_id');
    const storedName = localStorage.getItem('scan_io_user_name');
    if (!storedId || !storedName) {
      router.push('/login');
    } else {
      setMyUserId(storedId);
      setMyUserName(storedName);
      setPayer(storedName);
      fetchUserList();
      fetchTemplates();
    }
  }, [router]);

  const handleUseTemplate = (tpl: Template) => {
    openModal({
      type: 'confirm',
      title: '固定費の登録',
      message: `「${tpl.title} (${tpl.amount.toLocaleString()}円)」\nを今日の日付で記録しますか？`,
      onConfirm: async () => {
        closeModal();
        setLoading(true);

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const { error } = await supabase.from('expenses').insert({
          store_name: tpl.store_name,
          amount: tpl.amount,
          purchase_date: dateStr,
          paid_by: tpl.paid_by,
          category: tpl.category,
        });

        setLoading(false);

        if (error) {
          alert('保存に失敗しました');
        } else {
          openModal({ type: 'alert', title: '保存完了', message: `${tpl.title} を記録しました！`, onConfirm: closeModal });
        }
      }
    });
  };

  const handleDeleteTemplate = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if(!confirm('このテンプレートを削除しますか？')) return;

    const { error } = await supabase.from('templates').delete().eq('id', id);
    if (!error) {
      fetchTemplates();
    }
  };

  const handleRenameClick = () => {
    openModal({
      type: 'prompt',
      title: '名前の変更',
      message: '新しい名前を入力してください',
      defaultValue: myUserName,
      onConfirm: (newName: string) => handleRename(newName),
    });
  };

  const handleRename = async (newName?: string) => {
    if (!newName || newName === myUserName) {
      closeModal();
      return;
    }
    closeModal(); 
    setLoading(true);

    try {
      const { error: userError } = await supabase.from('users').update({ name: newName }).eq('id', myUserId);
      if (userError) throw userError;
      const { error: expenseError } = await supabase.from('expenses').update({ paid_by: newName }).eq('paid_by', myUserName);
      if (expenseError) throw expenseError;

      localStorage.setItem('scan_io_user_name', newName);
      setMyUserName(newName);
      setPayer(newName);
      await fetchUserList();
      setTimeout(() => {
        openModal({ type: 'alert', title: '変更完了', message: `名前を「${newName}」に変更しました`, onConfirm: closeModal });
      }, 300);
    } catch (err) {
      alert("名前の変更に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = () => {
    openModal({
      type: 'confirm',
      title: 'ログアウト',
      message: '本当にログアウトしますか？',
      confirmText: 'ログアウト',
      onConfirm: () => {
        localStorage.clear();
        router.push('/login');
      },
    });
  };

  const handleManualInput = () => {
    setShowCamera(false);
    setLoading(false);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setResult({
      store: '',
      date: `${yyyy}-${mm}-${dd}`,
      amount: '',
    });
  };

  const analyzeImage = async (base64Data: string, mimeType: string) => {
    setLoading(true);
    setResult(null);
    setShowCamera(false);
    try {
      const response = await fetch('/api/analyze-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data, mimeType: mimeType }),
      });
      const data = await response.json();
      if (data.error) {
        openModal({ type: 'alert', title: 'エラー', message: data.error, onConfirm: closeModal });
      } else {
        setResult(data);
      }
    } catch (err) {
      openModal({ type: 'alert', title: '通信エラー', message: '解析に失敗しました', onConfirm: closeModal });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      await analyzeImage(reader.result as string, file.type);
    };
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) analyzeImage(imageSrc, 'image/jpeg');
  }, [webcamRef]);

  const handleSave = async () => {
    if (!result || !result.amount) {
      openModal({ type: 'alert', title: '入力エラー', message: '金額を入力してください', onConfirm: closeModal });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('expenses').insert({
      store_name: result.store || '店名なし',
      amount: result.amount,
      purchase_date: result.date,
      paid_by: payer,
      category: category,
    });
    setSaving(false);
    if (error) {
      console.error(error);
      openModal({ type: 'alert', title: 'エラー', message: '保存に失敗しました', onConfirm: closeModal });
    } else {
      setResult(null);
      openModal({ type: 'alert', title: '保存しました！', message: '記録を保存しました。', confirmText: '閉じる', onConfirm: closeModal });
    }
  };

  const categories = [
    { id: 'food', label: '食費', icon: '🥦' },
    { id: 'daily', label: '日用品', icon: '🧻' },
    { id: 'eatout', label: '外食', icon: '🍻' },
    { id: 'transport', label: '交通費', icon: '🚃' },
    { id: 'other', label: 'その他', icon: '📦' },
  ];

  if (!myUserName) return <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100"></div>;

  return (
    // 全体の背景をリッチなグラデーションに変更
    <div className="p-8 max-w-md mx-auto min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 text-gray-800 relative pb-32">
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        defaultValue={modalConfig.defaultValue}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.type === 'confirm' ? modalConfig.title : 'OK'}
      />

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onUpdate={fetchTemplates}
      />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-indigo-900 drop-shadow-sm">Scan.io</h1>
        <div className="flex gap-3 items-center">
          <Link href="/settlement" className="text-sm font-bold text-blue-700 bg-white/80 backdrop-blur-md border border-white/40 px-4 py-2 rounded-full hover:bg-white hover:-translate-y-0.5 transition-all shadow-sm">
            💰 精算
          </Link>
          <button onClick={handleLogoutClick} className="text-sm font-bold text-gray-500 hover:text-gray-700 transition">ログアウト</button>
        </div>
      </div>
      
      <div className="mb-8 flex items-center gap-3">
        <p className="text-sm font-bold text-gray-600">
          こんにちは、<span className="text-blue-600 text-xl font-black">{myUserName}</span> さん
        </p>
        <button onClick={handleRenameClick} className="text-xs bg-white/70 backdrop-blur-md border border-white/40 hover:bg-white hover:-translate-y-0.5 px-3 py-1.5 rounded-full text-gray-600 font-bold transition-all shadow-sm">✏️変更</button>
      </div>

      {/* カードをすりガラス風の3Dデザインに変更 */}
      <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/40 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
        <h2 className="block mb-6 font-bold text-gray-800 text-xl">支出を記録</h2>
        {!showCamera ? (
          <div className="space-y-4 relative z-10">
            {/* ボタンをグラデーションと強いシャドウで立体的に */}
            <button onClick={() => setShowCamera(true)} className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              <span className="text-xl">📸</span> カメラを起動する
            </button>
            <div className="relative group">
              <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
              <div className="w-full py-4 bg-white/80 backdrop-blur-md text-gray-600 font-bold rounded-2xl border-2 border-dashed border-gray-300/60 group-hover:border-blue-400/60 group-hover:bg-blue-50/50 group-hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 shadow-sm">
                <span className="text-xl">📂</span> ファイルを選択 / スマホカメラ
              </div>
            </div>
            <button onClick={handleManualInput} className="w-full py-4 bg-white/80 backdrop-blur-md text-gray-700 font-bold rounded-2xl border border-white/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex items-center justify-center gap-2">
              <span className="text-xl">✏️</span> 手入力で記録する
            </button>
          </div>
        ) : (
          <div className="space-y-4 relative z-10">
            <div className="rounded-2xl overflow-hidden shadow-lg relative bg-black border-4 border-white/20">
              <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "environment" }} className="w-full h-auto" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowCamera(false)} className="flex-1 py-4 bg-white/80 backdrop-blur-md border border-white/60 text-gray-700 font-bold rounded-2xl hover:bg-white hover:-translate-y-0.5 transition-all shadow-sm">キャンセル</button>
              <button onClick={capture} className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all">撮影する</button>
            </div>
          </div>
        )}
        {loading && <p className="text-center text-blue-600 font-bold mt-6 animate-pulse relative z-10">AIが解析中...</p>}
      </div>

      {!result && !showCamera && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="font-bold text-gray-700 text-lg">よく使う登録</h2>
            <button 
              onClick={() => setIsTemplateModalOpen(true)} 
              className="text-sm bg-white/70 backdrop-blur-md border border-white/40 hover:bg-white hover:-translate-y-0.5 px-4 py-2 rounded-full text-blue-600 font-bold shadow-sm transition-all"
            >
              ＋ 追加
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {templates.map((tpl) => (
              // テンプレートボタンも立体的に
              <button
                key={tpl.id}
                onClick={() => handleUseTemplate(tpl)}
                className="bg-white/70 backdrop-blur-xl p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-white/40 hover:shadow-[0_8px_25px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all text-left relative group overflow-hidden"
              >
                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
                <div className="font-black text-gray-800 text-xl mb-2 relative z-10">{tpl.title}</div>
                <div className="text-sm font-bold text-gray-500 flex justify-between relative z-10">
                  <span className="text-blue-600">{tpl.amount.toLocaleString()}円</span>
                  <span>{tpl.paid_by}</span>
                </div>
                <div 
                  onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                  className="absolute top-3 right-3 text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all z-20 hover:bg-red-50 rounded-full"
                >
                  ✕
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {result && (
        // 結果表示カードも3Dデザインに
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-white/40 animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
          <h2 className="text-2xl font-black mb-8 relative z-10">内容の確認・編集</h2>
          <div className="space-y-8 mb-10 relative z-10">
            <div>
              <label className="text-sm font-bold text-gray-500 block mb-2">店名</label>
              <input value={result.store} onChange={(e) => setResult({...result, store: e.target.value})} placeholder="店名を入力" className="w-full text-xl font-bold bg-white/50 border border-white/60 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-500 block mb-2">日付</label>
              <input value={result.date} type="date" onChange={(e) => setResult({...result, date: e.target.value})} className="w-full text-xl font-bold bg-white/50 border border-white/60 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-500 block mb-2">金額</label>
              <div className="flex items-center bg-white/50 border border-white/60 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <span className="text-2xl mr-2 font-bold text-gray-400">¥</span>
                <input value={result.amount} type="number" placeholder="0" onChange={(e) => setResult({...result, amount: Number(e.target.value)})} className="w-full text-3xl font-black text-blue-600 bg-transparent focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-500 block mb-3">カテゴリ</label>
              <div className="flex flex-wrap gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`px-5 py-3 rounded-full text-sm font-bold border transition-all shadow-sm hover:-translate-y-0.5 ${category === cat.id ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-transparent shadow-md' : 'bg-white/70 border-white/60 text-gray-600 hover:bg-white'}`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-500 block mb-3">支払った人</label>
              <div className="relative">
                <select value={payer} onChange={(e) => setPayer(e.target.value)} className="w-full p-4 bg-white/50 border border-white/60 rounded-xl text-gray-700 font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm">
                  {userList.map((user) => (
                    <option key={user.id} value={user.name}>{user.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                  <svg className="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-2xl font-bold text-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none relative z-10">
            {saving ? '保存中...' : '記録する'}
          </button>
        </div>
      )}
    </div>
  );
}