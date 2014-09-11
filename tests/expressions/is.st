is.burn:
	print 3 is Integer
	print 3 is String

$ burn is.burn
	* stdout
		true
		false

is_non_type.burn:
	try {
		3 is 3
	} catch TypeError $e {
		print "TypeError"
	}

$ burn is_non_type.burn
	* stdout
		TypeError

err.burn:
	is Integer
$ burn err.burn
	* exit status nonzero

err.burn:
	3 is
$ burn err.burn
	* exit status nonzero

err.burn:
	is
$ burn err.burn
	* exit status nonzero
