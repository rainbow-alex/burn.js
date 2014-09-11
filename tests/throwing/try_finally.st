pass.burn:
	try {
		print "try"
	} finally {
		print "finally"
	}
	print "main"

$ burn pass.burn
	* stdout
		try
		finally
		main

catch.burn:
	try {
		print "try 1"
		3 + "3"
		print "try 2"
	} catch $e {
		print "catch"
	} finally {
		print "finally"
	}
	print "main"

$ burn catch.burn
	* stdout
		try 1
		catch
		finally
		main

fail.burn:
	try {
		print "try 1"
		3 + "3"
		print "try 2"
	} finally {
		print "finally"
	}
	print "main"

$ burn fail.burn
	* stdout
		try 1
		finally
	* exit status nonzero
