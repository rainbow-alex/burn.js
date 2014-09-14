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
generate_operator_tests: $(patsubst %, generate_operator_test_%, $(OPERATORS))
generate_operator_test_%:
	@mkdir -p tests/exprs/operators/
	etc/generate_operator_test.py result $* > tests/exprs/operators/$*.shelltest

.PHONY: precedence_tests
generate_precedence_tests: $(patsubst %, generate_precedence_test_%, $(OPERATORS))
generate_precedence_test_%:
	@mkdir -p tests/exprs/precedence/
	etc/generate_operator_test.py precedence $* > tests/exprs/precedence/$*.shelltest

.PHONY: clean_operator_tests
clean_operator_tests:
	rm -Rf tests/exprs/operators/

.PHONY: clean_precedence_tests
clean_precedence_tests:
	rm -Rf tests/exprs/precedence/
