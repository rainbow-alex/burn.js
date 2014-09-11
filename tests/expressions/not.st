not.burn:
	print not true
	print not false

$ burn not.burn
	* stdout
		false
		true

// Non-boolean operands are tested for truthiness.
typed.burn:
	print not nothing
	print not 1

$ burn typed.burn
	* stdout
		true
		false

err.burn:
	not
$ burn err.burn
	* exit status nonzero
