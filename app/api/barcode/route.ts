import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barcodeNo = searchParams.get('barcodeNo');

  if (!barcodeNo) {
    return NextResponse.json({ error: '바코드 번호가 필요합니다.' }, { status: 400 });
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_FOOD_SAFETY_API_KEY;
    const url = `http://openapi.foodsafetykorea.go.kr/api/${apiKey}/I2570/json/1/5/BRCD_NO=${barcodeNo}`;

    const response = await fetch(url);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'API 요청 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
