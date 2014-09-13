.PHONY: tests
tests:
	./shelltest.py --path tests/bin/ tests/

.PHONY: tests_extra
tests_extra:
	./shelltest.py --path tests/bin/ tests_extra/

.PHONY: todo
todo:
	grep -HrnIi --color=always "todo" src tests | sed "s/^/    /"

.PHONY: generate_tests
generate_tests:
	PATH=$$PATH:$(realpath tests/bin) etc/generate_precedence_test.py > tmp
	mv tmp tests/expressions/precedence.shelltest
