#!/bin/bash

echo "🎨 开始部署前端到 AWS S3 + CloudFront"
echo "🔗 连接到后端: https://backend.omnilaze.co"

# 与后端保持一致的配置
S3_BUCKET=${S3_BUCKET:-"omnilaze-frontend"}
AWS_REGION=${AWS_REGION:-"ap-southeast-1"}

# 检查必要工具
if ! command -v npm &> /dev/null; then
    echo "❌ 未检测到 npm，请先安装 Node.js"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo "❌ 未检测到 AWS CLI，请先安装"
    echo "💡 安装方法: https://aws.amazon.com/cli/"
    exit 1
fi

# 检查AWS配置
echo "🔐 检查AWS配置..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI未配置，请先配置"
    echo "💡 确保使用与后端相同的AWS凭证"
    echo "💡 运行: aws configure"
    exit 1
fi

CURRENT_REGION=$(aws configure get region 2>/dev/null || echo "us-east-1")
echo "✅ AWS配置正常"
echo "📍 当前AWS区域: $CURRENT_REGION"
echo "🏗️ 目标区域: $AWS_REGION"

# 安装依赖
echo "📦 安装前端依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

# 构建前端项目（连接到后端API）
API_URL=${REACT_APP_API_URL:-${API_URL:-"https://backend.omnilaze.co"}}
echo "🔨 构建前端项目..."
echo "🌐 API地址: $API_URL"
REACT_APP_API_URL="$API_URL" npm run build:aws

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 前端构建完成"

# 检查并创建S3存储桶
echo "☁️ 检查S3存储桶..."
if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
    echo "🪣 创建S3存储桶 $S3_BUCKET..."
    
    if [ "$AWS_REGION" = "us-east-1" ]; then
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
    
    # 设置公共访问策略
    echo "🔐 解除公共访问阻止并设置公共访问策略..."
    
    # 解除公共访问阻止
    aws s3api put-public-access-block \
        --bucket $S3_BUCKET \
        --public-access-block-configuration \
        "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
    
    # 等待设置生效
    sleep 3
    
    cat > bucket-policy-temp.json << EOF
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
    
    aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file://bucket-policy-temp.json
    rm bucket-policy-temp.json
    
    echo "✅ S3存储桶配置完成"
else
    echo "✅ S3存储桶已存在"
fi

# 部署到S3
echo "📤 正在部署到S3..."
echo "🎯 存储桶: $S3_BUCKET"
echo "📍 区域: $AWS_REGION"

# 上传静态资源（长缓存）
aws s3 sync dist/ s3://$S3_BUCKET/ \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" \
    --exclude "*.json"

# 上传HTML文件（短缓存，适合SPA）
aws s3 sync dist/ s3://$S3_BUCKET/ \
    --cache-control "public, max-age=0, must-revalidate" \
    --include "*.html" \
    --include "*.json"

if [ $? -eq 0 ]; then
    echo "✅ S3 部署完成！"
    
    # 查找CloudFront分配
    echo "🌍 查找CloudFront分配..."
    DISTRIBUTION_ID=${DISTRIBUTION_ID:-$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?Origins.Items[0].DomainName=='$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com'].Id" \
        --output text)}
    
    if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
        echo "🔄 清除CloudFront缓存..."
        aws cloudfront create-invalidation \
            --distribution-id $DISTRIBUTION_ID \
            --paths "/*"
        
        # 获取分配域名
        DOMAIN_NAME=$(aws cloudfront get-distribution \
            --id $DISTRIBUTION_ID \
            --query 'Distribution.DomainName' \
            --output text)
        
        echo ""
        echo "🎉 前端部署成功！"
        echo ""
        echo "🌐 访问地址："
        echo "https://$DOMAIN_NAME"
        echo ""
        echo "📊 部署信息："
        echo "- 前端: AWS S3 + CloudFront"
        echo "- 后端: https://backend.omnilaze.co"
        echo "- S3存储桶: $S3_BUCKET"
        echo "- AWS区域: $AWS_REGION"
        echo "- CloudFront分配: $DISTRIBUTION_ID"
        echo ""
        echo "💡 CloudFront缓存更新可能需要5-15分钟"
    else
        echo ""
        echo "🎉 前端部署成功！"
        echo ""
        echo "🌐 S3静态网站地址："
        echo "http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
        echo ""
        echo "📊 部署信息："
        echo "- 前端: AWS S3静态网站"
        echo "- 后端: https://backend.omnilaze.co"
        echo "- S3存储桶: $S3_BUCKET"
        echo "- AWS区域: $AWS_REGION"
        echo ""
        echo "💡 建议运行 ./infra/setup-aws-frontend.sh 来设置CloudFront"
    fi
else
    echo "❌ S3 部署失败，请检查错误信息"
    exit 1
fi

echo ""
echo "🔧 当前环境配置："
echo "REACT_APP_API_URL=https://backend.omnilaze.co"
echo ""
echo "🔄 与后端的集成："
echo "- 使用相同的AWS区域和凭证"
echo "- 连接到已部署的NestJS后端"
echo "- 支持WebSocket实时功能"
echo ""
echo "📱 测试你的应用："
echo "访问部署后的URL并测试完整的注册和下单流程"
