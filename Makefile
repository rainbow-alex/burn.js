BURN = $(realpath $(dir $(lastword $(MAKEFILE_LIST)))src/bin/burn.js)

tests*: .FORCE
	BURN=$(BURN) ./shelltest.py $@
tests*/*: .FORCE
	BURN=$(BURN) ./shelltest.py $@
tests*/*/*: .FORCE
	BURN=$(BURN) ./shelltest.py $@
tests*/*/*/*: .FORCE
	BURN=$(BURN) ./shelltest.py $@
tests*/*/*/*/*: .FORCE
	BURN=$(BURN) ./shelltest.py $@
.PHONY: .FORCE

.PHONY: todo
todo:
	grep -HrnIi --color=always "todo" src tests | sed "s/^/    /"

OPERATORS = or and not is eq neq lt gt lteq gteq add sub

.PHONY: operator_tests
operator_tests: $(patsubst %, tests/exprs/operators/%.shelltest, $(OPERATORS))
tests/exprs/operators/%.shelltest:
	@mkdir -p $(shell dirname $@)
	etc/generate_operator_test.py result $* > $@

.PHONY: precedence_tests
precedence_tests: $(patsubst %, tests/exprs/precedence/%.shelltest, $(OPERATORS))
tests/exprs/precedence/%.shelltest:
	@mkdir -p $(shell dirname $@)
	etc/generate_operator_test.py precedence $* > $@

.PHONY: clean_operator_tests
clean_operator_tests:
	rm -Rf tests/exprs/operators/

.PHONY: clean_precedence_tests
clean_precedence_tests:
	rm -Rf tests/exprs/precedence/
