JSON_DIR = assets/data
JS_DIR   = src/data

JSON_FILES = $(wildcard $(JSON_DIR)/*.json)
JS_FILES   = $(patsubst $(JSON_DIR)/%.json, $(JS_DIR)/%.js, $(JSON_FILES))
ALL_DATA_JS = $(JS_DIR)/../data.js

.PHONY: all convert combine clean re

all: combine

convert: $(JS_FILES)

$(JS_DIR)/%.js: $(JSON_DIR)/%.json
	@mkdir -p $(JS_DIR)
	@name=`basename $< .json`; \
	node scripts/json2js.js $< $@ "$${name}"

combine: convert
	node scripts/combine-js.js $(JS_FILES) $(ALL_DATA_JS)
	rm -rf $(JS_DIR)

format:
	./scripts/format.sh
