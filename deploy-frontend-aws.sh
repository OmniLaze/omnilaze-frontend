#!/usr/bin/env bash
set -euo pipefail

# One-click deploy for omnilaze-frontend to AWS S3 + CloudFront
# Usage:
#   ./deploy-frontend-aws.sh [OPTIONS]
#
# Options:
#   -b, --bucket BUCKET       S3 bucket name (default: omnilaze-frontend)
#   -r, --region REGION       AWS region (default: ap-southeast-1)
#   -d, --dist-id ID          CloudFront distribution ID (optional)
#   -a, --api-url URL         Backend API URL (default: https://backend.omnilaze.co)
#   -p, --profile PROFILE     AWS profile to use (optional)
#   -h, --help               Show this help message

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Default values
S3_BUCKET="omnilaze-frontend"
AWS_REGION="ap-southeast-1"
API_URL="https://backend.omnilaze.co"
DISTRIBUTION_ID=""
AWS_PROFILE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -b|--bucket) S3_BUCKET="$2"; shift 2;;
    -r|--region) AWS_REGION="$2"; shift 2;;
    -d|--dist-id) DISTRIBUTION_ID="$2"; shift 2;;
    -a|--api-url) API_URL="$2"; shift 2;;
    -p|--profile) AWS_PROFILE="$2"; shift 2;;
    -h|--help) 
      echo "One-click deploy for omnilaze-frontend to AWS S3 + CloudFront"
      echo ""
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -b, --bucket BUCKET       S3 bucket name (default: omnilaze-frontend)"
      echo "  -r, --region REGION       AWS region (default: ap-southeast-1)"
      echo "  -d, --dist-id ID          CloudFront distribution ID (optional)"
      echo "  -a, --api-url URL         Backend API URL (default: https://backend.omnilaze.co)"
      echo "  -p, --profile PROFILE     AWS profile to use (optional)"
      echo "  -h, --help               Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0"
      echo "  $0 -b my-frontend-bucket -r us-east-1"
      echo "  $0 -d E1ABCDEFG123456 -a https://api.example.com"
      exit 0;;
    *) echo "Unknown option: $1"; exit 1;;
  esac
done

# Set AWS profile if provided
if [[ -n "$AWS_PROFILE" ]]; then
  export AWS_PROFILE
fi

export AWS_REGION

echo "🚀 Frontend One-Click Deploy (S3 + CloudFront)"
echo "📦 Bucket: $S3_BUCKET | 🌐 Region: $AWS_REGION"
echo "🔗 API URL: $API_URL"
[[ -n "$DISTRIBUTION_ID" ]] && echo "☁️ CloudFront ID: $DISTRIBUTION_ID"

# Check dependencies
require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "❌ Missing dependency: $1"
    exit 1
  fi
}

require_command aws
require_command npm

# Verify AWS credentials
echo "🔐 Verifying AWS credentials..."
aws sts get-caller-identity >/dev/null
echo "✅ AWS credentials OK"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build frontend
echo "🔨 Building frontend..."
REACT_APP_API_URL="$API_URL" npm run build
echo "✅ Build complete: $SCRIPT_DIR/dist"

# Check if bucket exists, create if not
bucket_exists() {
  aws s3 ls "s3://$S3_BUCKET" >/dev/null 2>&1
}

create_bucket() {
  echo "🪣 Creating S3 bucket: $S3_BUCKET"
  if [[ "$AWS_REGION" == "us-east-1" ]]; then
    aws s3 mb "s3://$S3_BUCKET"
  else
    aws s3 mb "s3://$S3_BUCKET" --region "$AWS_REGION"
  fi

  echo "🌐 Enabling static website hosting..."
  aws s3 website "s3://$S3_BUCKET" --index-document index.html --error-document index.html

  echo "🔓 Configuring public access..."
  # Remove public access block
  aws s3api put-public-access-block \
    --bucket "$S3_BUCKET" \
    --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false

  # Set public read policy
  cat > .bucket-policy.json <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$S3_BUCKET/*"
    }
  ]
}
JSON
  
  aws s3api put-bucket-policy --bucket "$S3_BUCKET" --policy file://.bucket-policy.json
  rm -f .bucket-policy.json
  echo "✅ Bucket created and configured"
}

if bucket_exists; then
  echo "✅ Bucket exists: $S3_BUCKET"
else
  create_bucket
fi

# Deploy to S3
echo "📤 Deploying to S3..."

# Upload static assets with long cache
echo "  ⏳ Uploading static assets (long cache)..."
aws s3 sync dist/ "s3://$S3_BUCKET/" \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --exclude "*.json"

# Upload HTML/JSON with no cache
echo "  ⏳ Uploading HTML/JSON (no cache)..."
aws s3 sync dist/ "s3://$S3_BUCKET/" \
  --cache-control "public, max-age=0, must-revalidate" \
  --include "*.html" \
  --include "*.json" \
  --exclude "*"

echo "✅ S3 deployment complete"

# Handle CloudFront invalidation
if [[ -z "$DISTRIBUTION_ID" ]]; then
  # Try to auto-detect CloudFront distribution
  echo "🔎 Auto-detecting CloudFront distribution..."
  WEBSITE_ORIGIN="$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
  REST_ORIGIN="$S3_BUCKET.s3.$AWS_REGION.amazonaws.com"
  
  DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?contains(Origins.Items[*].DomainName, '$WEBSITE_ORIGIN') || contains(Origins.Items[*].DomainName, '$REST_ORIGIN')].Id" \
    --output text 2>/dev/null || true)
fi

if [[ -n "$DISTRIBUTION_ID" && "$DISTRIBUTION_ID" != "None" ]]; then
  echo "🔄 Invalidating CloudFront cache: $DISTRIBUTION_ID"
  aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" >/dev/null
  
  DOMAIN_NAME=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query 'Distribution.DomainName' --output text)
  
  echo ""
  echo "🎉 Deployment Complete!"
  echo ""
  echo "🌐 Frontend URL: https://$DOMAIN_NAME"
  echo "🔗 Backend API: $API_URL"
  echo "📦 S3 Bucket: $S3_BUCKET ($AWS_REGION)"
  echo "☁️ CloudFront: $DISTRIBUTION_ID"
  echo ""
  echo "💡 CloudFront cache updates may take 5-15 minutes"
else
  S3_WEBSITE_URL="http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
  
  echo ""
  echo "🎉 Deployment Complete!"
  echo ""
  echo "🌐 Frontend URL: $S3_WEBSITE_URL"
  echo "🔗 Backend API: $API_URL"
  echo "📦 S3 Bucket: $S3_BUCKET ($AWS_REGION)"
  echo ""
  echo "💡 For HTTPS and better performance, consider setting up CloudFront"
fi

echo "✅ Frontend deployment finished"