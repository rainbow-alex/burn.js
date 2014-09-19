BURN = $(realpath $(dir $(lastword $(MAKEFILE_LIST)))src/bin/burn.js)

$(shell find tests tests_extra): .FORCE
	BURN=$(BURN) ./shelltest.py $@
$(patsubst %, %/, $(shell find tests tests_extra -type d)): .FORCE
	BURN=$(BURN) ./shelltest.py $@
.PHONY: .FORCE

.PHONY: todo
todo:
	grep -HrnIi --color=always "todo" src tests | sed "s/^/    /"

OPERATORS = or and not is is_not eq neq lt gt lteq gteq add sub mul div union intersection

.PHONY: generate_operator_tests
generate_operator_tests: $(patsubst %, generate_operator_test_%, $(OPERATORS))
generate_operator_test_%:
	@mkdir -p tests/generated/operators/
	etc/generate_operator_test.py $* > tests/generated/operators/$*.shelltest

.PHONY: generate_precedence_tests
generate_precedence_tests: $(patsubst %, generate_precedence_test_%, $(OPERATORS))
generate_precedence_test_%:
	@mkdir -p tests/generated/precedence/
	etc/generate_precedence_test.py $* > tests/generated/precedence/$*.shelltest

.PHONY: clean_generated_tests
clean_generated_tests:
	rm -Rf tests/generated/

.PHONY: check_generated_test_coverage
check_generated_test_coverage:
	@grep -rh GREP_ME tests/generated/ | sort > generated.lst
	@grep -rh GREP_ME tests/expressions/ | sort > handwritten.lst
	@diff -w generated.lst handwritten.lst || true
	@rm generated.lst handwritten.lst
