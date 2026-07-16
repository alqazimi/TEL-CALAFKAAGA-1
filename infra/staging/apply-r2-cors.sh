#!/usr/bin/env bash
# Apply browser CORS to all Hel R2 buckets (view images + registration/EVC PUT uploads).
#
# Usage:
#   set -a && source TEL-CALAFKAAGA-1.env && set +a
#   ./infra/staging/apply-r2-cors.sh
#
# Optional: CORS_ORIGIN=https://tel-calafkaaga-1-api-one.vercel.app

set -euo pipefail

: "${S3_ENDPOINT:?Set S3_ENDPOINT}"
: "${S3_ACCESS_KEY_ID:?Set S3_ACCESS_KEY_ID}"
: "${S3_SECRET_ACCESS_KEY:?Set S3_SECRET_ACCESS_KEY}"

ORIGIN="${CORS_ORIGIN:-https://tel-calafkaaga-1-api-one.vercel.app}"

export CORS_ORIGIN="$ORIGIN"
export CORS_BUCKETS="${S3_BUCKET_PROFILE:-hel-profile},${S3_BUCKET_PROFILE_PRIVATE:-hel-profile-private},${S3_BUCKET_CHAT:-hel-chat},${S3_BUCKET_SUPPORT:-hel-support},${S3_BUCKET_EVC:-hel-evc}"

node --input-type=module <<'EOF'
import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const origin = process.env.CORS_ORIGIN;
const buckets = process.env.CORS_BUCKETS.split(",").filter(Boolean);

const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? "auto",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
});

const CORSRules = [
  {
    AllowedOrigins: [origin],
    AllowedMethods: ["GET", "HEAD", "PUT"],
    AllowedHeaders: ["*"],
    ExposeHeaders: ["ETag", "Content-Type", "Content-Length"],
    MaxAgeSeconds: 3600,
  },
];

for (const bucket of buckets) {
  await client.send(new PutBucketCorsCommand({ Bucket: bucket, CORSConfiguration: { CORSRules } }));
  console.log(`CORS applied: ${bucket} -> ${origin}`);
}
EOF

echo "Done."
