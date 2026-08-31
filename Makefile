.PHONY: help fetch sync check build serve verify-quotes verify-quotes-live check-en-terms

help: ## 列出所有命令
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

fetch: ## 按 PROJECT/SOURCES.md 登记的抓取方式取页到 .cache/ ；用法: make fetch EX=<id>
	python3 tools/fetch.py $(EX)

sync: ## 重生成所有 GENERATED 文档块 + docs/data/ 构建产物（幂等）
	python3 tools/sync.py

check: ## 一致性 + 生成块新鲜度 + quote 支持性等全部校验
	python3 tools/validate.py
	python3 tools/verify_quotes.py
	python3 tools/check_ui_i18n.py

check-en-terms: ## en 值术语漂移**建议清单**（只读，进不了 make check：漂移与官方用语需人工逐案判断）
	python3 tools/check_en_terms.py

verify-quotes: ## 离线 verbatim-quote 反查（仅查 .cache 落盘来源）
	python3 tools/verify_quotes.py

verify-quotes-live: ## verbatim-quote 反查 + 现场抓取 sources（JS 页/未缓存来源用此查）
	python3 tools/verify_quotes.py --live

build: sync check ## sync 后立即 check，构建产物 + 校验一遍过

serve: ## 本地预览站点（默认 8000 端口）
	python3 -m http.server 8000 -d docs
