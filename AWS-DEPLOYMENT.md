# AWS前端部署指南

本指南将帮你把前端从Cloudflare Pages迁移到AWS S3 + CloudFront。

## 🔄 从Cloudflare迁移到AWS

### 当前Cloudflare部署
- **平台**: Cloudflare Pages
- **域名**: https://order.omnilaze.co
- **项目**: omnilaze-universal-frontend
- **API地址**: https://omnilaze-universal-api.stevenxxzg.workers.dev

### 新的AWS架构
- **存储**: AWS S3（静态网站托管）
- **CDN**: AWS CloudFront
- **API地址**: https://backend.omnilaze.co (NestJS后端)

## 🚀 部署步骤

### 1. 准备AWS环境

确保安装并配置了AWS CLI：
```bash
# 安装AWS CLI (如果未安装)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# 配置AWS凭证
aws configure
```

### 2. 首次基础设施设置

运行一次性设置脚本：
```bash
cd omnilaze-frontend
./infra/setup-aws-frontend.sh
```

此脚本会：
- 创建S3存储桶 `omnilaze-frontend`
- 配置静态网站托管
- 设置公共访问策略
- 创建CloudFront分配
- 配置SPA路由支持

### 3. 部署前端

```bash
cd omnilaze-frontend
./deploy-aws.sh
```

此脚本会：
- 安装依赖
- 构建前端（使用NestJS API地址）
- 上传到S3
- 清除CloudFront缓存

### 4. 自动化部署

GitHub Actions已配置完成，当你推送到main分支时会自动部署前端。

需要在GitHub Secrets中设置：
- `AWS_ROLE_ARN`: AWS IAM角色ARN（用于GitHub Actions）
- `REACT_APP_AMAP_KEY`: 高德地图API密钥

## 📋 环境配置

### 构建脚本配置

package.json中已添加新的构建脚本：
```json
{
  "scripts": {
    "build:aws": "REACT_APP_API_URL=https://backend.omnilaze.co expo export -p web --output-dir dist"
  }
}
```

### 环境变量对比

| 环境 | API地址 | 用途 |
|------|---------|------|
| AWS | https://backend.omnilaze.co | NestJS后端 |
| Cloudflare | https://omnilaze-universal-api.stevenxxzg.workers.dev | Workers后端 |

## 🌐 访问地址

部署完成后，你的应用将可通过以下地址访问：

1. **CloudFront分配域名**: `https://d1234567890.cloudfront.net`
2. **S3静态网站**: `http://omnilaze-frontend.s3-website-us-east-1.amazonaws.com`

## 🔧 常见问题

### Q: 如何设置自定义域名？
A: 在CloudFront分配中添加备用域名(CNAME)，并在DNS中添加CNAME记录指向CloudFront域名。

### Q: 部署后看到旧内容？
A: CloudFront有缓存，可能需要5-15分钟更新。也可以手动清除缓存：
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Q: 如何回滚到Cloudflare？
A: 更新DNS记录即可，两套部署可以并存。

## 📊 成本估算

AWS前端托管成本（每月）：
- **S3存储**: ~$1-5（取决于文件大小）
- **CloudFront**: ~$1-10（取决于流量）
- **数据传输**: 按使用量计费

总计：通常每月 $5-20

## 🛠️ 维护

### 日常部署
推送到main分支会自动部署，或手动运行：
```bash
cd omnilaze-frontend && ./deploy-aws.sh
```

### 监控
- **S3**: AWS控制台查看存储使用情况
- **CloudFront**: 监控请求数量和缓存命中率
- **成本**: AWS Billing Dashboard查看月度费用