'use client';
import { useState } from 'react';
import { supabase } from './lib/supabase';

export default function Home() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // ★追加: 支払った人の状態管理（初期値は 'me' = 自分）
  const [payer, setPayer] = useState<'me' | 'partner'>('me');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      
      try {
        const response = await fetch('/api/analyze-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageBase64: base64,
            mimeType: file.type 
          }),
        });

        const data = await response.json();
        if (data.error) {
          alert("エラー: " + data.error);
        } else {
          setResult(data);
        }
      } catch (err) {
        alert("通信エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);

    const { error } = await supabase
      .from('expenses')
      .insert({
        store_name: result.store,
        amount: result.amount,
        purchase_date: result.date,
        paid_by: payer, // ★追加: 選択された人を保存
      });

    setSaving(false);

    if (error) {
      console.error(error);
      alert('保存に失敗しました: ' + error.message);
    } else {
      alert('保存しました！');
      setResult(null);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Scan.io</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <label className="block mb-4 font-bold text-gray-700">レシートをスキャン</label>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {loading && <p className="text-center text-blue-500 mt-4 animate-pulse">AIが解析中...</p>}
      </div>

      {result && (
        <div className="mt-6 bg-white p-6 rounded-xl shadow-lg border-2 border-blue-100">
          <h2 className="text-xl font-bold mb-4 text-gray-800">読み取り結果</h2>
          <div className="space-y-3 mb-6">
            <div>
              <label className="text-xs text-gray-500 block">店名</label>
              <input 
                value={result.store} 
                onChange={(e) => setResult({...result, store: e.target.value})}
                className="w-full text-lg font-bold border-b border-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block">日付</label>
              <input 
                value={result.date} 
                type="date"
                onChange={(e) => setResult({...result, date: e.target.value})}
                className="w-full text-lg border-b border-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block">金額</label>
              <div className="flex items-end">
                <span className="text-lg mr-1">¥</span>
                <input 
                  value={result.amount} 
                  type="number"
                  onChange={(e) => setResult({...result, amount: Number(e.target.value)})}
                  className="w-full text-2xl font-bold text-blue-600 border-b border-gray-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* ★追加: 支払った人の選択エリア */}
            <div className="pt-4">
              <label className="text-xs text-gray-500 block mb-2">支払った人</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPayer('me')}
                  className={`py-3 rounded-lg font-bold border-2 transition ${
                    payer === 'me' 
                      ? 'border-blue-500 bg-blue-50 text-blue-600' 
                      : 'border-gray-200 text-gray-400'
                  }`}
                >
                  自分
                </button>
                <button
                  onClick={() => setPayer('partner')}
                  className={`py-3 rounded-lg font-bold border-2 transition ${
                    payer === 'partner' 
                      ? 'border-pink-500 bg-pink-50 text-pink-600' 
                      : 'border-gray-200 text-gray-400'
                  }`}
                >
                  パートナー
                </button>
              </div>
            </div>

          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition disabled:bg-gray-400 shadow-md"
          >
            {saving ? '保存中...' : '記録する'}
          </button>
        </div>
      )}
    </div>
  );
}