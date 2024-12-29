import { NextResponse } from 'next/server';
import { getManifest } from '@/lib/aps';

export async function GET(
  request: Request,
  context: { params: Promise<{ urn: string }> }
) {
  try {
    const { urn } = await context.params;
    const manifest = await getManifest(urn);
    
    if (!manifest) {
      return NextResponse.json({ status: 'n/a' });
    }

    interface Message {
      type?: string;
      message?: string | string[];
      code?: string;
      severity?: number;
    }

    let messages: Message[] = [];
    if (manifest.derivatives) {
      for (const derivative of manifest.derivatives) {
        messages = messages.concat(derivative.messages || []);
        if (derivative.children) {
          for (const child of derivative.children) {
            messages = messages.concat(child.messages || []);
          }
        }
      }
    }

    return NextResponse.json({
      status: manifest.status,
      progress: manifest.progress,
      messages
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get model status' }, { status: 500 });
  }
}