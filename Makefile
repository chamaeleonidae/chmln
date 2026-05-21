.PHONY: help release

BUMP ?= patch

help: ## Show available make targets
	@grep -hE '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36mmake %-20s\033[0m \t%s\n", $$1, $$2}'

release: ## Bump version, publish to npm, and push tags
	@[ -z "$$(git status --porcelain)" ] || { echo "Error: working tree is not clean"; exit 1; }
	@[ "$$(git rev-parse --abbrev-ref HEAD)" = "main" ] || { echo "Error: must be on main branch"; exit 1; }
	@npm whoami >/dev/null 2>&1 || { echo "Error: not logged in — run npm login first"; exit 1; }
	npm version $(BUMP)
	npm publish --access public
	git push && git push --tags
	@echo "Published $$(node -p "require('./package.json').version")"
