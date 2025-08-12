#!/bin/bash

echo "🏗️ 设置AWS前端基础架构（S3 + CloudFront）"
echo "参照后端配置: 使用与后端相同的AWS区域和凭证配置"

# 使用与后端相同的配置
S3_BUCKET="omnilaze-frontend" 
# 注意：从环境变量或secrets获取AWS_REGION，与后端保持一致
AWS_REGION=${AWS_REGION:-"ap-southeast-1"}

# 检查AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI未安装"
    echo "💡 请安装AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI未配置"
    echo "💡 请配置AWS凭证，确保与后端使用相同的配置"
    exit 1
fi

echo "✅ AWS配置检查通过"
echo "📍 使用AWS区域: $AWS_REGION"

# 检查存储桶是否已存在
if aws s3 ls "s3://$S3_BUCKET" &> /dev/null 2>&1; then
    echo "✅ S3存储桶 $S3_BUCKET 已存在"
else
    # 创建S3存储桶
    echo "🪣 创建S3存储桶..."
    if [ "$AWS_REGION" = "us-east-1" ]; then
        # us-east-1不需要LocationConstraint
        aws s3 mb "s3://$S3_BUCKET"
    else
        aws s3 mb "s3://$S3_BUCKET" --region "$AWS_REGION"
    fi
    
    if [ $? -ne 0 ]; then
        echo "❌ S3存储桶创建失败"
        exit 1
    fi
    
    # 配置静态网站托管
    echo "🌐 配置静态网站托管..."
    aws s3 website "s3://$S3_BUCKET" --index-document index.html --error-document index.html
    
    # 设置存储桶策略前先解除公共访问阻止
    echo "🔐 解除公共访问阻止并设置存储桶策略..."
    
    # 解除公共访问阻止
    aws s3api put-public-access-block \
        --bucket $S3_BUCKET \
        --public-access-block-configuration \
        "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
    
    # 等待设置生效
    sleep 5
    
    cat > bucket-policy.json << EOF
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
EOF

    aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file://bucket-policy.json
    rm bucket-policy.json
fi

# 检查CloudFront分配是否已存在
EXISTING_DISTRIBUTION=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Origins.Items[0].DomainName=='$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com'].Id" \
    --output text)

if [ -n "$EXISTING_DISTRIBUTION" ] && [ "$EXISTING_DISTRIBUTION" != "None" ]; then
    echo "✅ CloudFront分配已存在: $EXISTING_DISTRIBUTION"
    DOMAIN_NAME=$(aws cloudfront get-distribution \
        --id $EXISTING_DISTRIBUTION \
        --query 'Distribution.DomainName' \
        --output text)
    echo "🌍 CloudFront域名: https://$DOMAIN_NAME"
else
    # 创建CloudFront分配
    echo "☁️ 创建CloudFront分配..."
    cat > cloudfront-config.json << EOF
{
    "CallerReference": "omnilaze-frontend-$(date +%s)",
    "Comment": "OmniLaze Frontend Distribution - 与后端在同一AWS区域", 
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-omnilaze-frontend",
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {"Forward": "none"}
        },
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "Compress": true
    },
    "Origins": {
        "Quantity": 1,
        "Items": [{
            "Id": "S3-omnilaze-frontend",
            "DomainName": "$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com",
            "CustomOriginConfig": {
                "HTTPPort": 80,
                "HTTPSPort": 443,
                "OriginProtocolPolicy": "http-only"
            }
        }]
    },
    "DefaultRootObject": "index.html",
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [{
            "ErrorCode": 404,
            "ResponsePagePath": "/index.html", 
            "ResponseCode": "200",
            "ErrorCachingMinTTL": 300
        }]
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
}
EOF

    DISTRIBUTION_ID=$(aws cloudfront create-distribution \
        --distribution-config file://cloudfront-config.json \
        --query 'Distribution.Id' \
        --output text)

    if [ $? -eq 0 ]; then
        DOMAIN_NAME=$(aws cloudfront get-distribution \
            --id $DISTRIBUTION_ID \
            --query 'Distribution.DomainName' \
            --output text)
        
        echo "🎉 AWS前端基础架构设置完成！"
        echo ""
        echo "📋 资源信息："
        echo "S3存储桶: $S3_BUCKET"
        echo "AWS区域: $AWS_REGION (与后端一致)"
        echo "CloudFront分配ID: $DISTRIBUTION_ID" 
        echo "CloudFront域名: https://$DOMAIN_NAME"
        echo "后端API: https://backend.omnilaze.co"
        echo ""
        echo "⚠️  注意：CloudFront部署需要15-20分钟"
        echo ""
        echo "🚀 下一步：运行 ./deploy-aws.sh 来部署前端"
    else
        echo "❌ CloudFront创建失败"
        exit 1
    fi

    rm cloudfront-config.json
fi

echo ""
echo "🔄 与后端的集成："
echo "- 后端域名: https://backend.omnilaze.co"
echo "- 前端将连接到同一AWS区域的后端服务"
echo "- 使用相同的AWS凭证和区域配置"