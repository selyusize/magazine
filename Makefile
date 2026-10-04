SHELL := /bin/bash

COMPOSE := docker compose -f devops/docker-compose.yml
APP_SERVICES := backend-migrate backend backend-worker frontend
# Лок next dev: держит процесс на любом порту (напр. -p 3123) и не даёт запустить второй в frontend/
NEXT_DEV_KILL = pid=$$(sed -n 's/.*"pid":\([0-9]*\).*/\1/p' frontend/.next/dev/lock 2>/dev/null); \
	[ -n "$$pid" ] && kill $$(ps -o ppid= -p $$pid) $$pid 2>/dev/null; true
# Все dev-процессы Medusa и Next этого репозитория (по пути к node_modules), а не только слушающий порт:
# `medusa develop` — наблюдатель и перезапускает убитый сервер. [m]/[n] — чтобы pkill не нашёл собственную команду
DEV_PROCS = $(CURDIR)/backend/node_modules/.*[m]edusajs.cli|$(CURDIR)/frontend/node_modules/.*[n]ext/dist/bin/next
# Сначала TERM и до 10 с на корректное завершение, затем KILL оставшимся и тем, кто ещё держит :9000/:3000
DEV_KILL = pkill -f '$(DEV_PROCS)' 2>/dev/null; \
	$(NEXT_DEV_KILL); \
	for i in $$(seq 1 20); do pgrep -f '$(DEV_PROCS)' >/dev/null || break; sleep 0.5; done; \
	pkill -9 -f '$(DEV_PROCS)' 2>/dev/null; \
	for port in 9000 3000; do lsof -ti tcp:$$port -sTCP:LISTEN | xargs kill -9 2>/dev/null; done; true

# --- Прод (Ansible): окружение = inventories/<INVENTORY>, TAG — тег образов (sha-<commit>), TAGS — теги ролей
INVENTORY ?= production
BOOTSTRAP_USER ?= root
TAG ?=
TAGS ?=
# Выгрузка с прода: EXCLUDE — ещё таблицы без данных, TABLES — только эти таблицы (через запятую)
EXCLUDE ?=
TABLES ?=
# prod-up / prod-down / prod-restart: только эти сервисы (traefik,postgres,redis,rabbitmq,backend,frontend)
SERVICES ?=
STACK = $(PLAYBOOK) playbooks/stack.yml $(if $(SERVICES),-e services=$(SERVICES))
PULL_ARGS = $(if $(EXCLUDE),-e exclude=$(EXCLUDE)) $(if $(TABLES),-e tables=$(TABLES))
ANSIBLE_DIR := devops/ansible
# Пароль Vault: $$ANSIBLE_VAULT_PASSWORD или devops/ansible/.vault_pass (без них ansible спросит сам)
ANSIBLE_VAULT := $(if $(or $(ANSIBLE_VAULT_PASSWORD),$(wildcard $(ANSIBLE_DIR)/.vault_pass)),ANSIBLE_VAULT_PASSWORD_FILE=vault-pass.sh,)
PLAYBOOK = cd $(ANSIBLE_DIR) && $(ANSIBLE_VAULT) ansible-playbook -i inventories/$(INVENTORY) $(if $(TAGS),--tags $(TAGS))

.DEFAULT_GOAL := help
.PHONY: help dev-install dev-key dev-reset dev-up dev-down dev-restart api-generate test prod-up prod-down prod-restart \
	infra-deps infra-vault infra-vault-edit infra-bootstrap infra-site infra-server infra-traefik infra-data \
	deploy deploy-backend deploy-frontend pull pull-db pull-files infra-lint

help: ## Список команд
	@grep -hE '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  \033[36m%-17s\033[0m %s\n", $$1, $$2}'

dev-install: ## Первичная настройка: .env, зависимости, Postgres/Redis/Mailpit, миграции, publishable key
	@test -f devops/.env || cp devops/.env.example devops/.env
	@test -f backend/.env || cp backend/.env.template backend/.env
	@test -f frontend/.env.local || cp frontend/.env.example frontend/.env.local
	cd backend && pnpm install
	cd frontend && pnpm install
	$(COMPOSE) up -d --wait postgres redis mailpit
	cd backend && pnpm db:migrate
	@$(MAKE) --no-print-directory api-generate
	@$(MAKE) --no-print-directory dev-key
	@echo "Готово. Админ Medusa: cd backend && pnpm user:create -e admin@example.com -p <пароль>"

dev-key: ## Ключ витрины магазина olisa из БД → frontend/.env.local и devops/.env
	@key=$$($(COMPOSE) exec -T postgres sh -c 'psql -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" -tAc "select token from api_key where type = '\''publishable'\'' and revoked_at is null and title = '\''Витрина olisa'\'' order by created_at desc limit 1"'); \
	if [ -z "$$key" ]; then \
		echo "Ключ магазина olisa не найден — сид не отработал? (cd backend && pnpm db:migrate)"; \
	else \
		for f in frontend/.env.local devops/.env; do \
			if grep -q '^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=' $$f; then \
				sed -i.bak "s|^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*|NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$$key|" $$f && rm -f $$f.bak; \
			else \
				echo "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$$key" >> $$f; \
			fi; \
			echo "Publishable key записан в $$f"; \
		done; \
	fi

dev-reset: ## Dev с нуля: стоп серверов, БД и Redis пересоздаются, миграции + сид + демо-товары, ключ olisa (данные удаляются!)
	@$(DEV_KILL)
	$(COMPOSE) up -d --wait postgres redis mailpit
	$(COMPOSE) exec -T postgres sh -c 'dropdb -U "$$POSTGRES_USER" --if-exists --force "$$POSTGRES_DB" && createdb -U "$$POSTGRES_USER" "$$POSTGRES_DB"'
	@# Кэш Query, очереди событий и workflows Medusa в Redis относятся к старой БД — без сброса Store API отдаёт старые ответы
	$(COMPOSE) exec -T redis redis-cli FLUSHALL
	cd backend && pnpm db:migrate
	cd backend && pnpm seed
	@$(MAKE) --no-print-directory dev-key
	@echo "Готово. Админ: cd backend && pnpm user:create -e admin@example.com -p <пароль>; затем make dev-up"

dev-up: ## Postgres/Redis/Mailpit + генерация API + backend (:9000) и frontend (:3000); Ctrl+C — остановить
	@$(COMPOSE) --profile app stop $(APP_SERVICES) 2>/dev/null || true
	@$(DEV_KILL)
	$(COMPOSE) up -d --wait postgres redis mailpit
	@$(MAKE) --no-print-directory api-generate
	@trap 'kill 0' INT TERM EXIT; \
	(cd backend && pnpm dev 2>&1 | awk '{ print "\033[35m[backend]\033[0m  " $$0; fflush() }') & \
	(for i in $$(seq 1 90); do curl -sf http://localhost:9000/health >/dev/null && break; sleep 1; done; \
	 cd frontend && pnpm exec next dev 2>&1 | awk '{ print "\033[36m[frontend]\033[0m " $$0; fflush() }') & \
	wait

api-generate: ## OpenAPI Medusa (Store API + свои роуты с @oas) → клиент и хуки Orval во фронте
	@cd backend && pnpm -s openapi:generate \
		|| echo "⚠ Не удалось обновить backend/openapi/store.oas.json (нужна сеть) — используется текущий"
	cd frontend && pnpm -s api:generate

test: ## Тесты фронта: unit + integration против Medusa (поднимается на время прогона, если не запущена)
	$(COMPOSE) up -d --wait postgres redis mailpit
	@$(MAKE) --no-print-directory api-generate
	@if curl -sf http://localhost:9000/health >/dev/null; then \
		cd frontend && pnpm exec vitest run; \
	else \
		echo "Запускаю Medusa для тестов…"; \
		(cd backend && pnpm dev >/dev/null 2>&1 &); \
		for i in $$(seq 1 90); do curl -sf http://localhost:9000/health >/dev/null && break; sleep 1; done; \
		(cd frontend && pnpm exec vitest run); status=$$?; \
		$(DEV_KILL); \
		exit $$status; \
	fi

dev-down: ## Остановить контейнеры и dev-серверы :9000/:3000 (данные в volume сохраняются)
	$(COMPOSE) --profile app down
	@$(DEV_KILL)

dev-restart: ## dev-down + dev-up
	@$(MAKE) --no-print-directory dev-down
	@$(MAKE) --no-print-directory dev-up

prod-up: ## Прод: поднять стек (SERVICES=backend,frontend — только эти)
	$(STACK) -e stack_action=up

prod-down: ## Прод: остановить стек, данные сохраняются (SERVICES=… — только эти; спросит подтверждение)
	@read -r -p "Остановить прод ($(INVENTORY)$(if $(SERVICES),: $(SERVICES))) — сайт станет недоступен. Продолжить? [y/N] " ok; [ "$$ok" = y ]
	$(STACK) -e stack_action=down

prod-restart: ## Прод: перезапустить контейнеры, короткий простой (SERVICES=… — только эти)
	$(STACK) -e stack_action=restart

# --- Прод: Ansible (devops/ansible/README.md)

infra-deps: ## Ansible: коллекции из requirements.yml
	cd $(ANSIBLE_DIR) && ansible-galaxy collection install -r requirements.yml

infra-vault: ## Ansible: vault.yml со случайными секретами + .vault_pass (INVENTORY=production)
	$(ANSIBLE_DIR)/scripts/vault-init.sh $(INVENTORY)

infra-vault-edit: ## Ansible: редактировать секреты окружения
	cd $(ANSIBLE_DIR) && $(ANSIBLE_VAULT) ansible-vault edit inventories/$(INVENTORY)/group_vars/all/vault.yml

infra-bootstrap: ## Чистый сервер, вход от root (BOOTSTRAP_USER): пользователь деплоя, SSH, UFW, Docker
	$(PLAYBOOK) playbooks/server.yml -e ansible_user=$(BOOTSTRAP_USER)

infra-site: ## Весь стек: сервер, traefik, БД и брокер, backend, frontend (TAG=sha-xxxxxxx)
	$(PLAYBOOK) playbooks/site.yml $(if $(TAG),-e backend_image_tag=$(TAG) -e frontend_image_tag=$(TAG))

infra-server: ## Пакеты, пользователи, SSH, firewall, Docker
	$(PLAYBOOK) playbooks/server.yml

infra-traefik: ## Traefik: HTTPS (Let's Encrypt), заголовки, дашборд
	$(PLAYBOOK) playbooks/traefik.yml

infra-data: ## PostgreSQL, Redis, RabbitMQ (один сервис: TAGS=rabbitmq)
	$(PLAYBOOK) playbooks/data.yml

deploy: ## Деплой backend + frontend (TAG=sha-xxxxxxx, по умолчанию latest)
	$(PLAYBOOK) playbooks/deploy.yml $(if $(TAG),-e backend_image_tag=$(TAG) -e frontend_image_tag=$(TAG))

deploy-backend: ## Деплой backend: миграции + выкат без простоя (TAG=sha-xxxxxxx)
	$(PLAYBOOK) playbooks/backend.yml $(if $(TAG),-e backend_image_tag=$(TAG))

deploy-frontend: ## Деплой витрины без простоя (TAG=sha-xxxxxxx)
	$(PLAYBOOK) playbooks/frontend.yml $(if $(TAG),-e frontend_image_tag=$(TAG))

pull: ## Прод → локально: БД (без данных pull_excluded_tables) + загрузки, импорт (EXCLUDE=…, TABLES=…)
	$(PLAYBOOK) playbooks/pull.yml $(PULL_ARGS)
	devops/scripts/db-import.sh
	devops/scripts/files-import.sh

pull-db: ## Прод → локально: только БД и импорт в локальный postgres (EXCLUDE=order,cart  TABLES=product)
	$(PLAYBOOK) playbooks/pull.yml --tags db $(PULL_ARGS)
	devops/scripts/db-import.sh

pull-files: ## Прод → локально: загрузки Medusa (картинки товаров) в backend/static
	$(PLAYBOOK) playbooks/pull.yml --tags files
	devops/scripts/files-import.sh

infra-lint: ## ansible-lint
	cd $(ANSIBLE_DIR) && ansible-lint
