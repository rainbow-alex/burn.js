andor.burn:
	true and true or true

$ burn andor.burn
	* stderr
		Add parentheses to disambiguate these expressions.
		in andor.burn on line 1
			true and true or true
			              ^
	* exit status nonzero

orand.burn:
	true or true and true

$ burn orand.burn
	* stderr
		Add parentheses to disambiguate these expressions.
		in orand.burn on line 1
			true or true and true
			             ^
	* exit status nonzero

notand.burn:
	not true and false

$ burn notand.burn
	* stderr
		Add parentheses to disambiguate these expressions.
		in notand.burn on line 1
			not true and false
			         ^
	* exit status nonzero

notor.burn:
	not true or false

$ burn notor.burn
	* stderr
		Add parentheses to disambiguate these expressions.
		in notor.burn on line 1
			not true or false
			         ^
	* exit status nonzero

notis.burn:
	not 1 is 1

$ burn notis.burn
	* stderr
		Add parentheses to disambiguate these expressions.
		in notis.burn on line 1
			not 1 is 1
			      ^
	* exit status nonzero

noteq.burn:
	not 1 == 1

$ burn noteq.burn
	* stderr
		Add parentheses to disambiguate these expressions.
		in noteq.burn on line 1
			not 1 == 1
			      ^
	* exit status nonzero

notneq.burn:
	not 1 != 1

$ burn notneq.burn
	* stderr
		Add parentheses to disambiguate these expressions.
		in notneq.burn on line 1
			not 1 != 1
			      ^
	* exit status nonzero

notlt.burn:
	not 1 < 1

$ burn notlt.burn
	* stderr
		Add parentheses to disambiguate these expressions.
		in notlt.burn on line 1
			not 1 < 1
			      ^
	* exit status nonzero

notgt.burn:
	not 1 > 1

$ burn notgt.burn
	* stderr
		Add parentheses to disambiguate these expressions.
		in notgt.burn on line 1
			not 1 > 1
			      ^
	* exit status nonzero

notlteq.burn:
	not 1 <= 1

$ burn notlteq.burn
	* stderr
		Add parentheses to disambiguate these expressions.
		in notlteq.burn on line 1
			not 1 <= 1
			      ^
	* exit status nonzero

notgteq.burn:
	not 1 >= 1

$ burn notgteq.burn
	* stderr
		Add parentheses to disambiguate these expressions.
		in notgteq.burn on line 1
			not 1 >= 1
			      ^
	* exit status nonzero

ok.burn:
	print true and not false
	print false or not false
	print 3 is not String

$ burn ok.burn
	* stdout
		true
		true
		true
