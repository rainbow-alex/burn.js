pass.burn:
	try {
		print "try"
	} catch $e {
		print "catch"
	} else {
		print "else"
	}
	print "main"

$ burn pass.burn
	* stdout
		try
		else
		main

catch.burn:
	try {
		print "try 1"
		3 + "3"
		print "try 2"
	} catch $e {
		print "catch"
	} else {
		print "else"
	}
	print "main"

$ burn catch.burn
	* stdout
		try 1
		catch
		main

fail.burn:
	try {
		print "try 1"
		3 + "3"
		print "try 2"
	} else {
		print "else"
	}
	print "main"

$ burn fail.burn
	* stdout
		try 1
	* exit status nonzero
