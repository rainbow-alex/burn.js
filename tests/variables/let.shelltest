var.burn:
	let $foo = 3
	print $foo

$ burn var.burn
	* stdout
		3

var2.burn:
	let $foo
	print $foo

$ burn var2.burn
	* stdout
		nothing

// semantic errors

dup.burn:
	let $foo
	let $foo

$ burn dup.burn
	* exit status nonzero

// syntax errors

err.burn:
	let
$ burn err.burn
	* exit status nonzero

err.burn:
	let = 3
$ burn err.burn
	* exit status nonzero

err.burn:
	let $foo 3
	baz
$ burn err.burn
	* exit status nonzero
