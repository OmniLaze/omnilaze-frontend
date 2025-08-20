# 前端 CI/CD 配置文档

## GitHub Actions 工作流

### 必需 Secrets

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中设置：

#### AWS 基础配置
- `AWS_ROLE_ARN` - GitHub OIDC 角色 ARN（例：`arn:aws:iam::123456789012:role/GitHubActionsRole`）
- `AWS_REGION` - AWS 区域（默认：`ap-southeast-1`）

#### 部署资源
- `FRONTEND_S3_BUCKET` - S3 桶名（默认：`omnilaze-frontend`）
- `CLOUDFRONT_DISTRIBUTION_ID` - CloudFront 分配 ID（可选，用于缓存失效）

#### 应用配置（可选）
- `REACT_APP_API_URL` - 后端 API 地址（默认：`https://backend.omnilaze.co`）
- `REACT_APP_AMAP_KEY` - 高德地图 API Key

### 触发条件
- 推送到 `main` 或 `master` 分支且修改了 `omnilaze-frontend/**` 路径
- 手动触发（`workflow_dispatch`）

## 本地部署脚本

### 使用方法

```bash
# 基本使用（使用默认配置）
./deploy-frontend-aws.sh

# 指定 S3 桶和区域
./deploy-frontend-aws.sh -b my-frontend-bucket -r us-east-1

# 完整配置
./deploy-frontend-aws.sh \
  -b omnilaze-frontend \
  -r ap-southeast-1 \
  -d E1ABCDEFG123456 \
  -a https://backend.omnilaze.co \
  -p production
```

### 参数说明
- `-b, --bucket` - S3 桶名
- `-r, --region` - AWS 区域
- `-d, --dist-id` - CloudFront 分配 ID（可选，会自动检测）
- `-a, --api-url` - 后端 API 地址
- `-p, --profile` - AWS 配置文件名
- `-h, --help` - 显示帮助信息

## AWS 权限要求

GitHub Actions 角色需要的最小权限：

### S3 权限
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::omnilaze-frontend",
        "arn:aws:s3:::omnilaze-frontend/*"
      ]
    }
  ]
}
```

### CloudFront 权限（可选）
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetDistribution",
        "cloudfront:ListDistributions"
      ],
      "Resource": "*"
    }
  ]
}
```

## 部署流程

1. **构建阶段**
   - 检出代码
   - 设置 Node.js 20
   - 安装依赖 (`npm ci`)
   - 构建前端 (`npm run build`)

2. **部署阶段**
   - 静态资源上传（长缓存：1年）
   - HTML/JSON 上传（无缓存）
   - CloudFront 缓存失效（如果配置）

3. **缓存策略**
   - 静态资源（CSS、JS、图片）：`max-age=31536000`（1年）
   - HTML/JSON：`max-age=0, must-revalidate`（无缓存）

## 故障排除

### 常见问题

1. **AWS 权限错误**
   - 检查 `AWS_ROLE_ARN` 是否正确
   - 确认角色有足够的 S3 和 CloudFront 权限
   - 验证 OIDC 提供商配置

2. **构建失败**
   - 检查 Node.js 版本兼容性
   - 确认 `package-lock.json` 存在
   - 验证环境变量配置

3. **S3 部署失败**
   - 确认 S3 桶名唯一且符合命名规则
   - 检查 AWS 区域配置
   - 验证桶策略配置

4. **CloudFront 失效失败**
   - 确认 `CLOUDFRONT_DISTRIBUTION_ID` 正确
   - 检查分配状态是否为 "Deployed"
   - 验证权限配置

### 调试命令

```bash
# 验证 AWS 凭证
aws sts get-caller-identity

# 检查 S3 桶
aws s3 ls s3://omnilaze-frontend/

# 查看 CloudFront 分配
aws cloudfront list-distributions \
  --query "DistributionList.Items[?contains(Origins.Items[*].DomainName, 'omnilaze-frontend')][Id,DomainName]"
```

## 安全注意事项

1. **最小权限原则**
   - 仅授予必需的 AWS 权限
   - 限制资源范围到特定 S3 桶

2. **密钥管理**
   - 所有敏感信息使用 GitHub Secrets
   - 定期轮换 AWS 访问密钥

3. **网络安全**
   - 考虑使用 CloudFront OAC 代替公共 S3 桶
   - 启用 HTTPS 和安全标头