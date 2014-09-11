.PHONY: tests
tests:
	./shelltest.py --path tests/bin/ tests/

.PHONY: tests_extra
tests_extra:
	./shelltest.py --path tests/bin/ tests_extra/

.PHONY: todo
todo:
	grep -HrnIi --color=always "TODO" src tests | sed "s/^/    /"
