#
# Directories
#
ROOT_SLASH	:= $(dir $(realpath $(firstword $(MAKEFILE_LIST))))
ROOT		:= $(patsubst %/,%,$(ROOT_SLASH))
LIB		:= $(ROOT)/lib
TEST		:= $(ROOT)/test
TOOLS		:= $(ROOT)/tools
GITHOOKS_SRC	:= $(TOOLS)/githooks
GITHOOKS_DEST	:= $(ROOT)/.git/hooks


#
# Generated Files & Directories
#
NODE_MODULES	:= $(ROOT)/node_modules
NODE_BIN	:= $(NODE_MODULES)/.bin
COVERAGE	:= $(ROOT)/.nyc_output
COVERAGE_RES	:= $(ROOT)/coverage
YARN_LOCK	:= $(ROOT)/yarn.lock
PACKAGE_LOCK	:= $(ROOT)/package-lock.json


#
# Tools and binaries
#
DOCUMENT	:= $(NODE_BIN)/documentation
NPM		:= npm
YARN		:= yarn
ESLINT		:= $(NODE_BIN)/eslint
MOCHA		:= $(NODE_BIN)/mocha
NYC		:= $(NODE_BIN)/nyc
PRETTIER	:= $(NODE_BIN)/prettier
UNLEASH		:= $(NODE_BIN)/unleash
CONVENTIONAL_RECOMMENDED_BUMP := $(NODE_BIN)/conventional-recommended-bump
COVERAGE_BADGE	:= $(TOOLS)/coverageBadge.js


#
# Files and globs
#
PACKAGE_JSON	:= $(ROOT)/package.json
API_MD		:= $(ROOT)/api.md
GITHOOKS	:= $(wildcard $(GITHOOKS_SRC)/*)
TEST_ENTRY	:= $(ROOT)/test/index.js
ALL_FILES	:= $(shell find $(ROOT) \
			-not \( -path $(NODE_MODULES) -prune \) \
			-not \( -path $(COVERAGE) -prune \) \
			-not \( -path $(COVERAGE_RES) -prune \) \
			-name '*.js' -type f)
TEST_FILES	:= $(shell find $(TEST) -name '*.js' -type f)

#
# Targets
#

$(NODE_MODULES): $(PACKAGE_JSON) ## Install node_modules
	@$(YARN)
	@touch $(NODE_MODULES)


.PHONY: authors
authors:
	@ ./scripts/generate-authors.sh

.PHONY: docs
docs: $(DOCUMENT) $(ALL_FILES)
	@$(DOCUMENT) build $(LIB) -f md -o $(API_MD)


.PHONY: help
help:
	@perl -nle'print $& if m{^[a-zA-Z_-]+:.*?## .*$$}' $(MAKEFILE_LIST) \
		| sort | awk 'BEGIN {FS = ":.*?## "}; \
		{printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'


.PHONY: githooks
githooks: $(GITHOOKS) ## Symlink githooks
	@$(foreach hook,\
		$(GITHOOKS),\
		ln -sf $(hook) $(GITHOOKS_DEST)/$(hook##*/);\
	)


.PHONY: release-dry
release-dry: $(NODE_MODULES) ## Dry run of `release` target
	$(UNLEASH) -d --type=$(shell $(CONVENTIONAL_RECOMMENDED_BUMP) -p angular)


.PHONY: release
release: $(NODE_MODULES) ## Versions, tags, and updates changelog based on commit messages
	$(UNLEASH) --type=$(shell $(CONVENTIONAL_RECOMMENDED_BUMP) -p angular)


.PHONY: lint
lint: $(NODE_MODULES) $(ESLINT) $(ALL_FILES) ## Run lint checker (eslint).
	@$(ESLINT) $(ALL_FILES)


.PHONY: lint-fix
lint-fix: $(NODE_MODULES) $(PRETTIER) $(ALL_FILES) ## Reprint code (prettier, eslint).
	@$(PRETTIER) --write $(ALL_FILES)
	@$(ESLINT) --fix $(ALL_FILES)


.PHONY: security
security: $(NODE_MODULES) ## Check for dependency vulnerabilities.
	@$(NPM) install --package-lock-only
	@$(NPM) audit


.PHONY: prepush
prepush: $(NODE_MODULES) lint coverage security ## Git pre-push hook task. Run before committing and pushing.


.PHONY: test
test: $(NODE_MODULES) $(MOCHA) ## Run unit tests.
	@$(MOCHA) -R spec --full-trace --no-exit --no-timeouts $(TEST_FILES)


.PHONY: coverage
coverage: $(NODE_MODULES) $(NYC) $(COVERAGE_BADGE) ## Run unit tests with coverage reporting. Generates reports into /coverage.
	@$(NYC) --reporter=json-summary --reporter=html --reporter=text make test
	@$(COVERAGE_BADGE)


.PHONY: clean
clean: ## Cleans unit test coverage files and node_modules.
	@rm -rf $(NODE_MODULES) $(COVERAGE) $(COVERAGE_RES) $(YARN_LOCK) $(PACKAGE_LOCK)


#
## Debug -- print out a a variable via `make print-FOO`
#
print-%  : ; @echo $* = $($*)
