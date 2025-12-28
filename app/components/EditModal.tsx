'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type EditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  expense: any; // 編集対象のデータ
  onUpdate: () => void; // 更新後にリストを再読み込みさせる関数
};

export default function EditModal({ isOpen, onClose, expense, onUpdate }: EditModalProps) {
  const [formData, setFormData] = useState({
    store_name: '',
    purchase_date: '',
    amount: 0,
    category: 'food',
    paid_by: '',
  });
  const [users, setUsers] = useState<{id: number, name: string}[]>([]);
  const [saving, setSaving] = useState(false);

  // モーダルが開いた時に初期値をセット
  useEffect(() => {
    if (isOpen && expense) {
      setFormData({
        store_name: expense.store_name,
        purchase_date: expense.purchase_date,
        amount: expense.amount,
        category: expense.category || 'food',
        paid_by: expense.paid_by,
      });
      fetchUsers();
    }
  }, [isOpen, expense]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('id, name');
    if (data) setUsers(data);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('expenses')
      .update({
        store_name: formData.store_name,
        amount: formData.amount,
        purchase_date: formData.purchase_date,
        category: formData.category,
        paid_by: formData.paid_by,
      })
      .eq('id', expense.id);

    setSaving(false);

    if (error) {
      alert('更新に失敗しました');
    } else {
      onUpdate(); // 親コンポーネントに通知
      onClose();  // 閉じる
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
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold mb-4 text-gray-800">記録の編集</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block">店名</label>
            <input
              value={formData.store_name}
              onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
              className="w-full border-b border-gray-300 py-1 font-bold focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block">日付</label>
            <input
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              className="w-full border-b border-gray-300 py-1 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block">金額</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full border-b border-gray-300 py-1 text-xl font-bold text-blue-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="text-xs text-gray-500 block mb-2">カテゴリ</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className={`px-2 py-1 rounded text-xs font-bold border ${
                    formData.category === cat.id ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-2">支払った人</label>
            <select
              value={formData.paid_by}
              onChange={(e) => setFormData({ ...formData, paid_by: e.target.value })}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded font-bold"
            >
              {users.map((u) => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 bg-gray-100 rounded-lg font-bold text-gray-600">キャンセル</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-blue-600 rounded-lg font-bold text-white shadow-md">
            {saving ? '保存中' : '更新'}
          </button>
        </div>
      </div>
    </div>
  );
}