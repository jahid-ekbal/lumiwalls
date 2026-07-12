import { S3Client } from "@aws-sdk/client-s3";
import { serverEnv } from "../env/serverEnv";

export const s3Client = new S3Client({
  endpoint: serverEnv.S3_ENDPOINT,
  region: serverEnv.S3_REGION,
  credentials: {
    accessKeyId: serverEnv.S3_ACCESS_KEY_ID,
    secretAccessKey: serverEnv.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});
