import { NextResponse } from 'next/server';
import { getUploadsBucket } from '../../../../lib/uploads';

export async function GET(request, { params }) {
  const bucket = await getUploadsBucket();
  const key = Array.isArray(params.key) ? params.key.join('/') : params.key;

  if (!key) {
    return NextResponse.json({ error: 'Missing key.' }, { status: 400 });
  }

  const object = await bucket.get(key);
  if (!object) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  return new NextResponse(object.body, { headers });
}
