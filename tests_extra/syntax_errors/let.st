err.burn:
	let

$ burn err.burn
	* stderr
		Expected <variable>.
		in err.burn on line 1
			let
			   ^
	* exit status nonzero

err.burn:
	let = 3

$ burn err.burn
	* stderr
		Expected <variable>.
		in err.burn on line 1
			let = 3
			    ^
	* exit status nonzero

err.burn:
	let $foo 3
	baz

$ burn err.burn
	* stderr
		Expected `=`.
		in err.burn on line 1
			let $foo 3
			         ^
	* exit status nonzero
