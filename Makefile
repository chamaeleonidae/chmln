.PHONY: help release

BUMP ?= patch

help: ## Show available make targets
	@grep -hE '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36mmake %-20s\033[0m \t%s\n", $$1, $$2}'

release: ## Bump the version for a release PR (BUMP=patch|minor|major); merging the PR to main publishes it to npm
	@[ -z "$$(git status --porcelain)" ] || { echo "Error: working tree is not clean"; exit 1; }
	npm version $(BUMP) --no-git-tag-version
	@echo "Bumped to $$(node -p 'require("./package.json").version'). Add a CHANGELOG.md entry, commit package.json and package-lock.json on a branch, and open a PR to main. Merging it publishes to npm and tags <version>."
