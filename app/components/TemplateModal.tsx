'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type TemplateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
};

export default function TemplateModal({ isOpen, onClose, onUpdate }: TemplateModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    store_name: '',
    amount: '',
    category: 'food',
    paid_by: '',
  });
  const [users, setUsers] = useState<{id: number, name: string}[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        store_name: '',
        amount: '',
        category: 'food',
        paid_by: localStorage.getItem('scan_io_user_name') || '',
      });
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('id, name');
    if (data) setUsers(data);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.amount || !formData.paid_by) {
      alert('タイトル、金額、支払う人は必須です');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('templates')
      .insert({
        title: formData.title,
        store_name: formData.store_name || formData.title,
        amount: Number(formData.amount),
        category: formData.category,
        paid_by: formData.paid_by,
      });

    setSaving(false);

    if (error) {
      alert('登録に失敗しました');
    } else {
      onUpdate();
      onClose();
    }
  };

  if (!isOpen) return null;

  const categories = [
    { id: 'food', label: '食費', icon: '🥦' },
    { id: 'daily', label: '日用品', icon: '🧻' },
    { id: 'eatout', label: '外食', icon: '🍻' },
    { id: 'transport', label: '交通費', icon: '🚃' },
    { id: 'other', label: 'その他', icon: '📦' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-xl animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold mb-6 text-gray-800">よく使う支払いの登録</h3>
        <p className="text-sm text-gray-500 mb-6">ボタンを押すだけで登録できるようになります。</p>
        
        <div className="space-y-6">
          <div>
            <label className="text-sm text-gray-500 block mb-1">ボタンの表示名 (必須)</label>
            <input
              placeholder="例: 家賃, Netflix"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border-b border-gray-100 py-2 font-bold focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">店名 (任意)</label>
            <input
              placeholder="空欄なら表示名と同じになります"
              value={formData.store_name}
              onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
              className="w-full border-b border-gray-100 py-2 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">金額 (必須)</label>
            <div className="flex items-end">
              <span className="text-lg mr-2">¥</span>
              <input
                type="number"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full border-b border-gray-100 py-2 text-2xl font-bold text-blue-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm text-gray-500 block mb-3">カテゴリ</label>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold border transition ${
                    formData.category === cat.id ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-500 block mb-3">支払う人</label>
            <div className="relative">
              <select
                value={formData.paid_by}
                onChange={(e) => setFormData({ ...formData, paid_by: e.target.value })}
                className="w-full p-3 bg-gray-50 border-none rounded-xl font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button onClick={onClose} className="flex-1 py-4 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition">キャンセル</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-4 bg-blue-600 rounded-xl font-bold text-white shadow-md hover:bg-blue-700 transition">
            登録
          </button>
        </div>
      </div>
    </div>
  );
}