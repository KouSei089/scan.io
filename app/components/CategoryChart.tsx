'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

type Expense = {
  amount: number;
  category: string | null;
};

type Props = {
  expenses: Expense[];
};

export default function CategoryChart({ expenses }: Props) {
  const categoryTotals: Record<string, number> = {
    food: 0,
    daily: 0,
    eatout: 0,
    transport: 0,
    other: 0,
  };

  expenses.forEach((item) => {
    const cat = item.category || 'other';
    if (categoryTotals[cat] !== undefined) {
      categoryTotals[cat] += item.amount;
    } else {
      categoryTotals['other'] += item.amount;
    }
  });

  const data = [
    { name: '食費', value: categoryTotals['food'], color: '#10B981', icon: '🥦' },
    { name: '日用品', value: categoryTotals['daily'], color: '#F59E0B', icon: '🧻' },
    { name: '外食', value: categoryTotals['eatout'], color: '#EF4444', icon: '🍻' },
    { name: '交通費', value: categoryTotals['transport'], color: '#3B82F6', icon: '🚃' },
    { name: 'その他', value: categoryTotals['other'], color: '#6B7280', icon: '📦' },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return <div className="text-center text-gray-400 text-sm py-8 bg-white rounded-2xl shadow-sm mb-8">データがありません</div>;
  }

  return (
    <div className="w-full h-80 bg-white rounded-2xl shadow-sm p-8 mb-8 flex flex-col items-center justify-center">
      <h3 className="text-base font-bold text-gray-700 mb-4 w-full text-left">カテゴリ別支出</h3>
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              stroke="#fff"
              strokeWidth={3}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => `${Number(value).toLocaleString()}円`}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="circle"
              formatter={(value: string, entry: any) => {
                const { payload } = entry;
                return (
                  <span className="text-xs text-gray-600 ml-2">
                    {value} <span className="font-bold">{payload.value.toLocaleString()}</span>
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}