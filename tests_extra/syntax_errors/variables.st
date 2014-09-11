invalid.burn:
	let $
$ burn invalid.burn
	* stderr
		Invalid variable.
		in invalid.burn on line 1
			let $
			    ^
	* exit status nonzero

invalid.burn:
	let $0
$ burn invalid.burn
	* stderr
		Invalid variable.
		in invalid.burn on line 1
			let $0
			    ^
	* exit status nonzero

invalid.burn:
	let $:
$ burn invalid.burn
	* stderr
		Invalid variable.
		in invalid.burn on line 1
			let $:
			    ^
	* exit status nonzero

invalid.burn:
	let $:foo
$ burn invalid.burn
	* stderr
		Invalid variable.
		in invalid.burn on line 1
			let $:foo
			    ^
	* exit status nonzero

invalid.burn:
	let $foo:
$ burn invalid.burn
	* stderr
		Invalid variable.
		in invalid.burn on line 1
			let $foo:
			    ^
	* exit status nonzero

invalid.burn:
	let $foo::bar
$ burn invalid.burn
	* stderr
		Invalid variable.
		in invalid.burn on line 1
			let $foo::bar
			    ^
	* exit status nonzero
