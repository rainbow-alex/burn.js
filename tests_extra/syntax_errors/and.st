err.burn:
	true and

$ burn err.burn
	* stderr
		Expected expression.
		in err.burn on line 1
			true and
			        ^
	* exit status nonzero

err.burn:
	and true

$ burn err.burn
	* stderr
		Expected expression.
		in err.burn on line 1
			and true
			^
	* exit status nonzero

err.burn:
	and

$ burn err.burn
	* stderr
		Expected expression.
		in err.burn on line 1
			and
			^
	* exit status nonzero
