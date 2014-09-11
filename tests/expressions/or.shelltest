or.burn:
	print true or true
	print true or false
	print false or true
	print false and false

$ burn or.burn
	* stdout
		true
		true
		true
		false

or_or.burn:
	print true or true or true
	print true or true or false
	print true or false or true
	print true or false or false
	print false or true or true
	print false or true or false
	print false or false or true
	print false or false or false

$ burn or_or.burn
	* stdout
		true
		true
		true
		true
		true
		true
		true
		false

// Operands need not be booleans, they are tested for truthiness.
// The result is the operand that determines the result.
typed.burn:
	print nothing or 0
	print 1 or 2
	print 0 or 1

$ burn typed.burn
	* stdout
		0
		1
		1

// verify that operands are evaluated left-to-right
order.burn:
	let $p = function( $v ) {
		print $v
		return $v
	}
	$p( nothing ) or $p( false ) or $p( true )

$ burn order.burn
	* stdout
		nothing
		false
		true

// verify that the operator short-circuits
sc.burn:
	let $p = function( $v ) {
		print $v
		return $v
	}
	$p( true ) or $p( false )

$ burn sc.burn
	* stdout
		true

err.burn:
	true or
$ burn err.burn
	* exit status nonzero

err.burn:
	or true
$ burn err.burn
	* exit status nonzero

err.burn:
	or
$ burn err.burn
	* exit status nonzero
