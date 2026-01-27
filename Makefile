.PHONY: help build dev up down restart logs ps exec clean backup restore health

# 默认目标
help:
	@echo "错题本 Docker 管理命令"
	@echo ""
	@echo "使用方法: make [目标]"
	@echo ""
	@echo "可用目标:"
	@echo "  build      - 构建本地 Docker 镜像"
	@echo "  dev        - 启动开发环境（带热重载）"
	@echo "  up         - 启动生产环境"
	@echo "  down       - 停止并删除容器"
	@echo "  restart    - 重启服务"
	@echo "  logs       - 查看服务日志"
	@echo "  ps         - 查看服务状态"
	@echo "  exec       - 进入容器 Shell"
	@echo "  clean      - 清理容器和卷"
	@echo "  backup     - 备份数据和配置"
	@echo "  restore    - 从备份恢复数据"
	@echo "  health     - 检查服务健康状态"
	@echo ""
	@echo "示例:"
	@echo "  make build        # 构建镜像"
	@echo "  make up           # 启动服务"
	@echo "  make logs         # 查看日志"

# 构建本地镜像
build:
	@echo "构建本地 Docker 镜像..."
	docker compose -f docker-compose.local.yml build

# 构建镜像（无缓存）
build-no-cache:
	@echo "构建本地 Docker 镜像（无缓存）..."
	docker compose -f docker-compose.local.yml build --no-cache

# 开发模式
dev:
	@echo "启动开发环境..."
	docker compose -f docker-compose.dev.yml up

# 开发模式（后台）
dev-bg:
	@echo "启动开发环境（后台）..."
	docker compose -f docker-compose.dev.yml up -d

# 生产模式
up:
	@echo "启动生产环境..."
	docker compose -f docker-compose.local.yml up -d

# 停止服务
down:
	@echo "停止服务..."
	docker compose -f docker-compose.local.yml down

# 停止开发环境
down-dev:
	@echo "停止开发环境..."
	docker compose -f docker-compose.dev.yml down

# 重启服务
restart:
	@echo "重启服务..."
	docker compose -f docker-compose.local.yml restart

# 查看日志
logs:
	docker compose -f docker-compose.local.yml logs -f

# 查看日志（最近 100 行）
logs-tail:
	docker compose -f docker-compose.local.yml logs --tail=100 -f

# 查看服务状态
ps:
	docker compose -f docker-compose.local.yml ps

# 进入容器
exec:
	docker compose -f docker-compose.local.yml exec wrong-notebook sh

# 清理容器和卷
clean:
	@echo "清理容器和卷..."
	docker compose -f docker-compose.local.yml down -v
	@echo "清理完成"

# 清理开发环境
clean-dev:
	@echo "清理开发环境..."
	docker compose -f docker-compose.dev.yml down -v
	@echo "清理完成"

# 备份数据
backup:
	@echo "备份数据..."
	@mkdir -p backups
	@docker compose -f docker-compose.local.yml exec -T wrong-notebook cp /app/data/dev.db /app/data/backup_$$(date +%Y%m%d_%H%M%S).db || true
	@tar -czf backups/config_backup_$$(date +%Y%m%d_%H%M%S).tar.gz config/ || true
	@cp -r data backups/data_backup_$$(date +%Y%m%d_%H%M%S) || true
	@echo "备份完成，保存在 backups/ 目录"

# 健康检查
health:
	@echo "检查服务健康状态..."
	@curl -s http://localhost:3000/api/health || echo "服务未响应"
	@docker compose -f docker-compose.local.yml ps

# 重新构建并启动
rebuild: build down up

# 拉取最新代码并重新构建
update:
	@echo "更新应用..."
	@git pull
	@$(MAKE) rebuild

# 查看资源使用情况
stats:
	docker stats wrong-notebook-local

# 查看容器详细信息
inspect:
	docker inspect wrong-notebook-local

# 查看数据库文件
db-ls:
	docker compose -f docker-compose.local.yml exec wrong-notebook ls -lah /app/data

# 运行 Prisma 迁移
migrate:
	docker compose -f docker-compose.local.yml exec wrong-notebook npx prisma migrate deploy

# 重置数据库（危险操作）
db-reset:
	@echo "警告：此操作将删除所有数据！"
	@read -p "确认重置数据库？[y/N] " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker compose -f docker-compose.local.yml exec wrong-notebook npx prisma migrate reset --force; \
	else \
		echo "操作已取消"; \
	fi
