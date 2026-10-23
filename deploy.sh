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

# 3. Invalidate CloudFront Cache
DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?contains(Origins.Items[].Id, 's3-web-ui')].Id" --output text | awk '{print $1}')
if [ -n "${DIST_ID}" ] && [ "${DIST_ID}" != "None" ]; then
  echo "⚡ [3/3] Invalidating CloudFront cache (${DIST_ID})..."
  aws cloudfront create-invalidation --distribution-id "${DIST_ID}" --paths "/*" > /dev/null
fi

echo "========================================================="
echo "✅ Deployment completed successfully!"
echo "========================================================="
