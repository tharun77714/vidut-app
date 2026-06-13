import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, BUCKET_NAME } from '@/lib/r2/client';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 });
    }

    // In a real app, you would get the user ID from the session.
    // Since we don't have auth enforced yet, we generate a mock or anonymous user ID.
    const userId = 'anon_user'; 
    const projectId = uuidv4();
    const fileExtension = filename.split('.').pop() || 'mp4';
    const s3Key = `${userId}/${projectId}/raw.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    return NextResponse.json({
      url: presignedUrl,
      key: s3Key,
      projectId: projectId,
    });
  } catch (error: unknown) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
