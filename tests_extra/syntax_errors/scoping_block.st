scope.burn:
	if true {
		let $foo
	}
	print $foo

$ burn scope.burn
	* stderr
		Variable $foo not found.
		in scope.burn on line 4
			print $foo
			      ^
	* exit status nonzero

