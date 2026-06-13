import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, BUCKET_NAME } from '@/lib/r2/client';

export async function POST(request: Request) {
  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json({ error: 'Missing key' }, { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    return NextResponse.json({ url });
  } catch (error: unknown) {
    console.error('Error generating video URL:', error);
    return NextResponse.json({ error: 'Failed to generate video URL' }, { status: 500 });
  }
}
