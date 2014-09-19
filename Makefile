BURN = $(realpath $(dir $(lastword $(MAKEFILE_LIST)))src/bin/burn.js)

$(shell find tests tests_extra): .FORCE
	BURN=$(BURN) ./shelltest.py $@
$(patsubst %, %/, $(shell find tests tests_extra -type d)): .FORCE
	BURN=$(BURN) ./shelltest.py $@
.PHONY: .FORCE

.PHONY: todo
todo:
	grep -HrnIi --color=always "todo" src tests | sed "s/^/    /"

OPERATORS = or and not is is_not eq neq lt gt lteq gteq union intersection add sub mul div

.PHONY: generate_operator_tests
generate_operator_tests: $(patsubst %, generate_operator_test_%, $(OPERATORS))
generate_operator_test_%:
	@mkdir -p tests/expressions/operators/
	etc/generate_operator_test.py $* > tests/expressions/operators/$*.shelltest

.PHONY: clean_operator_tests
clean_operator_tests:
	rm -Rf tests/expressions/operators/
