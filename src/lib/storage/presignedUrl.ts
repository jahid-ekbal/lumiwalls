import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { serverEnv } from "../env/serverEnv";
import { s3Client } from "./b2Client";

export const generatePresignedUploadUrl = async (
  key: string,
  mimeType: string,
): Promise<{ url: string; key: string }> => {
  // Browser PUTs to this URL need a bucket CORS rule allowing the app
  // origin, the PUT method, and headers Content-Type, x-amz-checksum-crc32,
  // and x-amz-sdk-checksum-algorithm. Without it the upload fails in
  // finalize with a CORS preflight error and the wallpaper row stays
  // unfinalized.
  const command = new PutObjectCommand({
    Bucket: serverEnv.S3_BUCKET_NAME,
    Key: key,
    ContentType: mimeType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return { url, key };
};
