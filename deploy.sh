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

# 2. Deploy Infrastructure via Pulumi
echo "☁️  [2/2] Running Pulumi deployment..."
cd "${ROOT_DIR}/infra"

# Automatically bridge AWS CLI login credentials to Pulumi
eval "$(aws configure export-credentials --format env)"
export PULUMI_CONFIG_PASSPHRASE=""

pulumi up --yes

echo "========================================================="
echo "✅ Deployment completed successfully!"
echo "========================================================="
