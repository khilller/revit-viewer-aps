import { NextResponse } from 'next/server';
import { getViewerToken } from '@/lib/aps';

export async function GET() {
  try {
    const token = await getViewerToken();
    return NextResponse.json(token);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get token' }, { status: 500 });
  }
}
