import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    // APIキーがない場合のチェックを追加
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not defined');
    }

    const { expenses, monthLabel } = await req.json();

    const expensesText = expenses.map((e: any) => 
      `- ${e.purchase_date}: ${e.store_name} (${e.category}) ${e.amount}円`
    ).join('\n');

    const totalAmount = expenses.reduce((sum: any, e: any) => sum + e.amount, 0);

    const prompt = `
      あなたはプロのファイナンシャルプランナーです。
      あるカップル/夫婦の「${monthLabel}」の家計簿データ（合計: ${totalAmount.toLocaleString()}円）を分析し、以下のフォーマットでアドバイスを行ってください。
      口調は「分析的で、論理的で、丁寧な」トーンでお願いします。

      【分析データ】
      ${expensesText}

      【出力フォーマット】
      ## 📊 全体の傾向
      (分析)

      ## ✅ 良かった点
      (褒める点)

      ## ⚠️ 気になる点
      (改善点)

      ## 💡 来月のアドバイス
      (具体的な提案)
    `;

    // ★ここを gemini-1.5-flash に戻します
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ analysis: text });
  } catch (error: any) {
    console.error('Error analyzing spending:', error);
    // エラーの詳細を返すように変更
    return NextResponse.json({ error: error.message || '分析中にエラーが発生しました' }, { status: 500 });
  }
}