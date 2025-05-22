JSON_DIR = assets/data
JS_DIR   = src/data

JSON_FILES = $(wildcard $(JSON_DIR)/*.json)
JS_FILES   = $(patsubst $(JSON_DIR)/%.json, $(JS_DIR)/%.js, $(JSON_FILES))

.PHONY: all convert clean

all: convert

convert: $(JS_FILES)

$(JS_DIR)/%.js: $(JSON_DIR)/%.json
	@mkdir -p $(JS_DIR)
	@name=`basename $< .json`; \
	node scripts/json2js.js $< $@ "$${name}_data"

format:
	./scripts/format.sh

clean:
	rm -rf $(JS_DIR)/*.js

re:
	make clean
	make all
