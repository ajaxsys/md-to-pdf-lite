#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================================="
echo "🚀 Building & Deploying md-to-pdf Studio to AWS"
echo "========================================================="

# 1. Build Web Frontend (TipTap Editor)
echo "📦 [1/2] Building Web Frontend assets..."
cd "${ROOT_DIR}/web"
npm run build

cd "${ROOT_DIR}/infra"
# Automatically bridge AWS CLI login credentials to Pulumi
eval "$(aws configure export-credentials --format env)"
export PULUMI_CONFIG_PASSPHRASE=""

pulumi up --yes

# 3. Synchronize S3 static assets with explicit Cache-Control headers
BUCKET_NAME=$(pulumi stack output webUiBucketName 2>/dev/null || echo "md-to-pdf-web-bucket-5178c71")
if [ -n "${BUCKET_NAME}" ]; then
  echo "📦 Syncing static assets to S3 with cache-control..."
  aws s3 sync "${ROOT_DIR}/web/dist/assets" "s3://${BUCKET_NAME}/assets" \
    --cache-control "public, max-age=31536000, immutable" \
    --delete
  aws s3 cp "${ROOT_DIR}/web/dist/index.html" "s3://${BUCKET_NAME}/index.html" \
    --cache-control "max-age=0, no-cache, no-store, must-revalidate" \
    --content-type "text/html"
fi

# 4. Invalidate CloudFront Cache
DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Origins.Items[].Id, 's3-web-ui')].Id" --output text | awk '{print $1}')
if [ -n "${DIST_ID}" ] && [ "${DIST_ID}" != "None" ]; then
  echo "⚡ Invalidating CloudFront cache (${DIST_ID})..."
  INVALIDATION_ID=$(aws cloudfront create-invalidation --distribution-id "${DIST_ID}" --paths "/*" --query "Invalidation.Id" --output text)
  echo "⏳ Invalidation created: ${INVALIDATION_ID}"
fi

echo "========================================================="
echo "✅ Deployment completed successfully!"
echo "========================================================="
