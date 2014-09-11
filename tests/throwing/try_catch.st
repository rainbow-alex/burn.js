caught.burn:
	try {
		3 + "3"
	} catch $e {
		print "caught"
	}

$ burn caught.burn
	* stdout
		caught

caught_type.burn:
	try {
		3 + "3"
	} catch TypeError $e {
		print "caught"
	}

$ burn caught_type.burn
	* stdout
		caught

caught_types.burn:
	try {
		3 + "3"
	} catch ArgumentError $e {
		print "ArgumentError"
	} catch TypeError $e {
		print "TypeError"
	}

$ burn caught_types.burn
	* stdout
		TypeError

uncaught_type.burn:
	try {
		3 + "3"
	} catch ArgumentError $e {
		print "ArgumentError"
	}

$ burn uncaught_type.burn
	* exit status nonzero

// syntax errors

err.burn:
	try {
	} catch {
	}
$ burn err.burn
	* exit status nonzero

err.burn:
	try {
	} catch TypeError {
	}
$ burn err.burn
	* exit status nonzero
