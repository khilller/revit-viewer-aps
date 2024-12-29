import { NextResponse } from 'next/server';
import { listObjects, uploadObject, translateObject, urnify, getTranslationStatus } from '@/lib/aps';

export async function GET(request: Request) {
  try {
    // Extract the URN from the URL if it exists
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    // Remove 'status' from the end if it exists
    const urn = pathParts[pathParts.length - 1] === 'status' 
      ? pathParts[pathParts.length - 2]
      : pathParts[pathParts.length - 1];

    // If there's a URN in the path, return translation status
    if (urn && urn !== 'models') {
      const status = await getTranslationStatus(urn);
      console.log('Translation status:', status);
      return NextResponse.json(status);
    }

    // Otherwise return list of models (existing functionality)
    const objects = await listObjects();
    return NextResponse.json(
      objects.map(o => ({
        name: o.objectKey,
        urn: urnify(o.objectId!)
      }))
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to get model information' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('model-file') as File;
    const entrypoint = formData.get('model-zip-entrypoint') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const obj = await uploadObject(file.name, buffer);
    await translateObject(urnify(obj.objectId!), entrypoint || undefined);
    
    return NextResponse.json({
      name: obj.objectKey,
      urn: urnify(obj.objectId!)
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to upload model' }, { status: 500 });
  }
}