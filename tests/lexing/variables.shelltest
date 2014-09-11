vars.burn:
	let $a
	let $abc123
	let $foo_bar
	let $foo:bar

$ burn vars.burn

invalid.burn:
	let $
$ burn invalid.burn
	* exit status nonzero

invalid.burn:
	let $0
$ burn invalid.burn
	* exit status nonzero

invalid.burn:
	let $:
$ burn invalid.burn
	* exit status nonzero

invalid.burn:
	let $:foo
$ burn invalid.burn
	* exit status nonzero

invalid.burn:
	let $foo:
$ burn invalid.burn
	* exit status nonzero

invalid.burn:
	let $foo::bar
$ burn invalid.burn
	* exit status nonzero
