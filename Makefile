.PHONY: tests
tests:
	./shelltest.py --path tests/bin/ tests/

.PHONY: tests_extra
tests_extra:
	./shelltest.py --path tests/bin/ tests_extra/

.PHONY: todo
todo:
	grep -HrnIi --color=always "todo" src tests | sed "s/^/    /"

.PHONY: operator_tests
operator_tests: operator_result_tests operator_type_error_tests operator_precedence_tests

.PHONY: operator_result_tests
operator_result_tests:
	@mkdir -p tests/expressions/result/
	etc/generate_operator_test.py result or > tests/expressions/result/or.shelltest
	etc/generate_operator_test.py result and > tests/expressions/result/and.shelltest
	etc/generate_operator_test.py result not > tests/expressions/result/not.shelltest
	etc/generate_operator_test.py result is > tests/expressions/result/is.shelltest
	etc/generate_operator_test.py result eq > tests/expressions/result/eq.shelltest
	etc/generate_operator_test.py result neq > tests/expressions/result/neq.shelltest
	etc/generate_operator_test.py result lt > tests/expressions/result/lt.shelltest
	etc/generate_operator_test.py result gt > tests/expressions/result/gt.shelltest
	etc/generate_operator_test.py result lteq > tests/expressions/result/lteq.shelltest
	etc/generate_operator_test.py result gteq > tests/expressions/result/gteq.shelltest
	etc/generate_operator_test.py result add > tests/expressions/result/add.shelltest
	etc/generate_operator_test.py result sub > tests/expressions/result/sub.shelltest

.PHONY: operator_type_error_tests
operator_type_error_tests:
	@mkdir -p tests/expressions/type_error/
	etc/generate_operator_test.py type_error or > tests/expressions/type_error/or.shelltest
	etc/generate_operator_test.py type_error and > tests/expressions/type_error/and.shelltest
	etc/generate_operator_test.py type_error not > tests/expressions/type_error/not.shelltest
	etc/generate_operator_test.py type_error is > tests/expressions/type_error/is.shelltest
	etc/generate_operator_test.py type_error eq > tests/expressions/type_error/eq.shelltest
	etc/generate_operator_test.py type_error neq > tests/expressions/type_error/neq.shelltest
	etc/generate_operator_test.py type_error lt > tests/expressions/type_error/lt.shelltest
	etc/generate_operator_test.py type_error gt > tests/expressions/type_error/gt.shelltest
	etc/generate_operator_test.py type_error lteq > tests/expressions/type_error/lteq.shelltest
	etc/generate_operator_test.py type_error gteq > tests/expressions/type_error/gteq.shelltest
	etc/generate_operator_test.py type_error add > tests/expressions/type_error/add.shelltest
	etc/generate_operator_test.py type_error sub > tests/expressions/type_error/sub.shelltest

.PHONY: operator_precedence_tests
operator_precedence_tests:
	@mkdir -p tests/expressions/precedence/
	etc/generate_operator_test.py precedence or > tests/expressions/precedence/or.shelltest
	etc/generate_operator_test.py precedence and > tests/expressions/precedence/and.shelltest
	etc/generate_operator_test.py precedence not > tests/expressions/precedence/not.shelltest
	etc/generate_operator_test.py precedence is > tests/expressions/precedence/is.shelltest
	etc/generate_operator_test.py precedence eq > tests/expressions/precedence/eq.shelltest
	etc/generate_operator_test.py precedence neq > tests/expressions/precedence/neq.shelltest
	etc/generate_operator_test.py precedence lt > tests/expressions/precedence/lt.shelltest
	etc/generate_operator_test.py precedence gt > tests/expressions/precedence/gt.shelltest
	etc/generate_operator_test.py precedence lteq > tests/expressions/precedence/lteq.shelltest
	etc/generate_operator_test.py precedence gteq > tests/expressions/precedence/gteq.shelltest
	etc/generate_operator_test.py precedence add > tests/expressions/precedence/add.shelltest
	etc/generate_operator_test.py precedence sub > tests/expressions/precedence/sub.shelltest
