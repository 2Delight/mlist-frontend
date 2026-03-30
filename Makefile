.PHONY: build
build:
	npm install
	npm run build

.PHONY: compose
compose:
	docker image rm olegdayo/mlist-backend:latest || true
	docker compose up --build -d

.PHONY: decompose
decompose:
	docker compose down
