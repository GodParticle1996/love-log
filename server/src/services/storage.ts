import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config.js';
import { v4 as uuidv4 } from 'uuid';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: config.r2.endpoint,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

export async function uploadPhoto(
  buffer: Buffer,
  mimeType: string,
  folder: string
): Promise<{ url: string; key: string }> {
  const ext = mimeType.split('/')[1] || 'jpg';
  const key = `${folder}/${uuidv4()}.${ext}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  const url = `${config.r2.publicUrl}/${key}`;
  return { url, key };
}

export async function deletePhoto(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
    })
  );
}

