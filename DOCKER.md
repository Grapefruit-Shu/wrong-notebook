# Docker 部署指南

本文档介绍如何使用 Docker 部署错题本项目。

## 目录结构

```
wrong-notebook/
├── Dockerfile                   # 多阶段构建 Dockerfile
├── docker-compose.local.yml     # 本地构建和部署配置
├── docker-compose.dev.yml       # 开发环境配置
├── docker-compose.yml           # 生产环境配置（使用预构建镜像）
├── docker-compose.https.yml     # HTTPS 支持配置
├── .dockerignore               # Docker 构建忽略文件
└── docker-entrypoint.sh        # 容器启动脚本
```

## 快速开始

### 方法 1: 使用预构建镜像（推荐）

从 GitHub Container Registry 拉取预构建的镜像：

```bash
docker compose up -d
```

### 方法 2: 本地构建

使用本地代码构建镜像：

```bash
docker compose -f docker-compose.local.yml build
docker compose -f docker-compose.local.yml up -d
```

### 方法 3: 开发模式

支持代码热重载的开发模式：

```bash
docker compose -f docker-compose.dev.yml up
```

## 配置说明

### 环境变量

在 `docker-compose.local.yml` 中配置以下环境变量：

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `NEXTAUTH_URL` | 应用的访问地址 | `http://localhost:3000` | 是 |
| `NEXTAUTH_SECRET` | NextAuth 密钥 | - | 是 |
| `DATABASE_URL` | SQLite 数据库路径 | `file:/app/data/dev.db` | 否 |
| `AI_PROVIDER` | AI 提供商 | `gemini` | 否 |
| `GOOGLE_API_KEY` | Gemini API Key | - | 否* |
| `OPENAI_API_KEY` | OpenAI API Key | - | 否* |
| `ZHIPU_API_KEY` | 智谱 API Key | - | 否* |

*注：AI API Key 也可以在 Web UI 设置中配置。

### 生成 NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### 数据持久化

以下目录会被挂载到宿主机：

- `./data` - SQLite 数据库文件
- `./config` - 应用配置文件

首次启动时，确保这些目录存在或 Docker 会自动创建。

## 常用命令

### 构建镜像

```bash
# 本地构建
docker compose -f docker-compose.local.yml build

# 重新构建（不使用缓存）
docker compose -f docker-compose.local.yml build --no-cache
```

### 启动服务

```bash
# 后台启动
docker compose -f docker-compose.local.yml up -d

# 前台启动（查看日志）
docker compose -f docker-compose.local.yml up
```

### 查看日志

```bash
# 查看所有日志
docker compose logs -f

# 查看最近 100 行日志
docker compose logs --tail=100

# 查看特定服务的日志
docker compose logs -f wrong-notebook
```

### 停止服务

```bash
# 停止服务
docker compose -f docker-compose.local.yml down

# 停止服务并删除卷
docker compose -f docker-compose.local.yml down -v
```

### 进入容器

```bash
docker compose -f docker-compose.local.yml exec wrong-notebook sh
```

### 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker compose -f docker-compose.local.yml up -d --build
```

## HTTPS 支持

如需启用 HTTPS，使用 `docker-compose.https.yml`：

```bash
docker compose -f docker-compose.https.yml up -d
```

## 健康检查

容器启动后，可以通过以下方式检查服务状态：

```bash
# 检查健康状态
docker compose ps

# 调用健康检查 API
curl http://localhost:3000/api/health
```

## 故障排查

### 容器无法启动

1. 检查日志：
   ```bash
   docker compose logs wrong-notebook
   ```

2. 检查端口占用：
   ```bash
   netstat -ano | findstr :3000
   ```

### 数据库问题

1. 进入容器检查数据库：
   ```bash
   docker compose -f docker-compose.local.yml exec wrong-notebook ls -la /app/data
   ```

2. 重新初始化数据库：
   ```bash
   docker compose -f docker-compose.local.yml down -v
   docker compose -f docker-compose.local.yml up -d
   ```

### 权限问题

Windows 用户可能需要调整文件权限：

```bash
docker compose -f docker-compose.local.yml exec wrong-notebook chown -R nextjs:nodejs /app/data
```

## 生产环境部署

### 安全建议

1. 修改默认的 `NEXTAUTH_SECRET`
2. 使用强密码的数据库
3. 启用 HTTPS
4. 配置防火墙规则
5. 定期更新镜像

### 反向代理

使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 多架构支持

Dockerfile 支持以下架构：

- linux/amd64
- linux/arm64

如需为其他架构构建：

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t wrong-notebook:local .
```

## 资源限制

可在 `docker-compose.local.yml` 中添加资源限制：

```yaml
services:
  wrong-notebook:
    # ...
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 备份和恢复

### 备份数据

```bash
# 备份数据库
docker compose -f docker-compose.local.yml exec wrong-notebook cp /app/data/dev.db /app/data/backup_$(date +%Y%m%d).db

# 备份配置
tar -czf config_backup_$(date +%Y%m%d).tar.gz config/
```

### 恢复数据

```bash
# 恢复数据库
docker compose -f docker-compose.local.yml exec wrong-notebook cp /app/data/backup_YYYYMMDD.db /app/data/dev.db

# 恢复配置
tar -xzf config_backup_YYYYMMDD.tar.gz
```

## 常见问题

**Q: 如何更改端口？**
A: 修改 `docker-compose.local.yml` 中的 `ports` 配置，例如 `"8080:3000"`。

**Q: 如何配置 AI 提供商？**
A: 可以通过环境变量配置，或在启动后在 Web UI 的设置页面配置。

**Q: 数据存储在哪里？**
A: SQLite 数据库存储在宿主机的 `./data` 目录下。

**Q: 如何升级到新版本？**
A: 拉取最新代码后重新构建镜像：`docker compose -f docker-compose.local.yml up -d --build`
