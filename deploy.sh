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

# Load local .env if present (never committed to git)
if [ -f "${ROOT_DIR}/.env" ]; then
  set -a
  source "${ROOT_DIR}/.env"
  set +a
fi

cd "${ROOT_DIR}/infra"
# Automatically bridge AWS CLI login credentials to Pulumi
eval "$(aws configure export-credentials --format env)"
export PULUMI_CONFIG_PASSPHRASE=""

# If custom S3/self-hosted backend is configured in .env, connect to it
if [ -n "${PULUMI_BACKEND_URL:-}" ]; then
  pulumi login "${PULUMI_BACKEND_URL}"
fi
pulumi stack select "${PULUMI_STACK:-dev}" 2>/dev/null || true

pulumi up --yes

# 3. Synchronize S3 static assets with explicit Cache-Control headers
BUCKET_NAME=$(pulumi stack output webUiBucketName 2>/dev/null || echo "${S3_WEB_BUCKET_NAME:-}")
if [ -n "${BUCKET_NAME}" ]; then
  echo "📦 Syncing static assets to S3 with cache-control (${BUCKET_NAME})..."
  aws s3 sync "${ROOT_DIR}/web/dist/assets" "s3://${BUCKET_NAME}/assets" \
    --cache-control "public, max-age=31536000, immutable" \
    --delete
  aws s3 cp "${ROOT_DIR}/web/dist/index.html" "s3://${BUCKET_NAME}/index.html" \
    --cache-control "max-age=0, no-cache, no-store, must-revalidate" \
    --content-type "text/html"
else
  echo "⚠️ webUiBucketName not detected from Pulumi stack output. Skipping static asset sync."
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
