'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, User, Loader2, ArrowRight } from 'lucide-react';

type User = {
  id: number;
  name: string;
};

export default function LoginPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ユーザー一覧を取得
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('users').select('*').order('id');
    if (error) {
      console.error(error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 新規ユーザー登録（最大2名まで）
  const handleRegister = async () => {
    if (!newName.trim()) return;
    
    const { error } = await supabase.from('users').insert({ name: newName });
    if (error) {
      alert('登録に失敗しました（同じ名前は使えません）');
    } else {
      setNewName('');
      fetchUsers();
    }
  };

  // ログイン処理（ローカルストレージに名前を保存）
  const handleLogin = (user: User) => {
    localStorage.setItem('scan_io_user_id', user.id.toString());
    localStorage.setItem('scan_io_user_name', user.name);
    router.push('/'); // トップページへ移動
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-gray-200 flex items-center justify-center p-4 relative overflow-hidden text-gray-800">
      {/* 背景の装飾 */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-slate-200/40 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-white/40 w-full max-w-md relative overflow-hidden relative z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/60 to-transparent pointer-events-none"></div>
        
        {/* ロゴブロック */}
        <div className="flex flex-col items-center justify-center mb-8 relative z-10">
          <img 
            src="/icon-512.png" 
            alt="Kurasel Icon" 
            className="w-20 h-20 rounded-3xl shadow-lg mb-4 object-cover" 
          />
          <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">
            Kurasel
          </h1>
          <p className="text-sm font-bold text-slate-400 tracking-widest">
            暮らしと精算
          </p>
        </div>

        <div className="relative z-10">
          <h2 className="text-center font-bold text-slate-500 mb-4 text-sm">利用者を選択してください</h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
          ) : (
            <div className="space-y-3">
              {/* 登録済みのユーザーボタン */}
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleLogin(user)}
                  className="w-full py-4 px-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      <User size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-lg font-bold text-slate-700 group-hover:text-slate-900">{user.name}</span>
                  </div>
                  <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}

              {/* 2名未満なら登録フォームを表示 */}
              {users.length < 2 && (
                <div className="mt-8 pt-6 border-t border-slate-200/60">
                  <p className="text-xs font-bold text-slate-400 mb-3 text-center">
                    {users.length === 0 ? 'まずは1人目を登録' : 'パートナーを登録'}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="名前 (例: Taro)"
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-3 bg-white/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 font-bold text-slate-700 text-sm transition-all"
                    />
                    <button
                      onClick={handleRegister}
                      disabled={!newName.trim()}
                      className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-lg shadow-slate-200"
                    >
                      <UserPlus size={18} />
                      <span className="text-sm">登録</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}