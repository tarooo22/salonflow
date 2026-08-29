import { GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();

  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 storage config missing: set R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY");
  }

  return { accountId, bucket, accessKeyId, secretAccessKey };
}

function getR2Client() {
  const config = getR2Config();
  return {
    config,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }),
  };
}

export async function putR2Object(key: string, data: Buffer | Uint8Array | string, contentType: string) {
  const { config, client } = getR2Client();
  const normalizedKey = key.replace(/^\/+/, "");
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: normalizedKey,
      Body: data,
      ContentType: contentType,
    }),
  );
  return { key: normalizedKey };
}

export async function getR2SignedUrl(key: string, expiresIn = 900) {
  const { config, client } = getR2Client();
  const normalizedKey = key.replace(/^\/+/, "");
  return getSignedUrl(client, new GetObjectCommand({ Bucket: config.bucket, Key: normalizedKey }), { expiresIn });
}

export async function listR2Objects(options: { maxKeys?: number } = {}) {
  const { config, client } = getR2Client();
  await client.send(
    new ListObjectsV2Command({
      Bucket: config.bucket,
      MaxKeys: Math.min(Math.max(options.maxKeys ?? 1, 1), 10),
    }),
  );
  return { ok: true as const };
}
