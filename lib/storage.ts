import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";

const S3_ENABLED = process.env.S3_ENABLED === "true";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads/sales";
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "micropulse-data-lake";
const AWS_REGION = process.env.AWS_REGION || "ap-south-1";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: AWS_REGION,
      credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
    });
  }
  return s3Client;
}

function ensureUploadDir(): void {
  if (!S3_ENABLED && !fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export interface StorageResult {
  key: string;
  url?: string;
  isS3: boolean;
}

export async function saveFile(
  sessionId: string,
  filename: string,
  content: Buffer
): Promise<StorageResult> {
  ensureUploadDir();

  const key = `raw-data/sales/${sessionId}/${filename}`;

  if (S3_ENABLED) {
    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: "text/csv",
    });
    await client.send(command);
    return { key, isS3: true };
  } else {
    const localPath = path.join(UPLOAD_DIR, `${sessionId}_${filename}`);
    fs.writeFileSync(localPath, content);
    return { key, url: localPath, isS3: false };
  }
}

export async function getPresignedUploadUrl(
  sessionId: string,
  filename: string
): Promise<{ url: string; key: string }> {
  const key = `raw-data/sales/${sessionId}/${filename}`;

  if (S3_ENABLED) {
    const client = getS3Client();
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      ContentType: "text/csv",
    });
    const url = await getSignedUrl(client, command, { expiresIn: 3600 });
    return { url, key };
  } else {
    ensureUploadDir();
    const localPath = path.join(UPLOAD_DIR, `${sessionId}_${filename}`);
    return { url: localPath, key };
  }
}

export async function getFile(sessionId: string, filename: string): Promise<Buffer> {
  const key = `raw-data/sales/${sessionId}/${filename}`;

  if (S3_ENABLED) {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });
    const response = await client.send(command);
    if (!response.Body) {
      throw new Error("Empty response from S3");
    }
    const stream = response.Body as AsyncIterable<Uint8Array>;
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } else {
    const localPath = path.join(UPLOAD_DIR, `${sessionId}_${filename}`);
    return fs.readFileSync(localPath);
  }
}

export async function deleteFile(sessionId: string, filename: string): Promise<void> {
  const key = `raw-data/sales/${sessionId}/${filename}`;

  if (S3_ENABLED) {
    const client = getS3Client();
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    });
    await client.send(command);
  } else {
    const localPath = path.join(UPLOAD_DIR, `${sessionId}_${filename}`);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  }
}

export function isUsingS3(): boolean {
  return S3_ENABLED;
}
