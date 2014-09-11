fork.burn:
	import burn.fiber
	fiber.fork( function() {
		print "fork"
	} )
	print "main"

$ burn fork.burn
	* stdout
		main
		fork

order.burn:
	import burn.fiber
	fiber.fork( function() {
		print "a"
	} )
	fiber.fork( function() {
		print "b"
	} )

$ burn order.burn
	* stdout
		a
		b

nest.burn:
	import burn.fiber
	fiber.fork( function() {
		fiber.fork( function() {
			print 3
		} )
		print 2
	} )
	print 1

$ burn nest.burn
	* stdout
		1
		2
		3

throw.burn:
	import burn.fiber
	try {
		fiber.fork( function() {
			3 + "3"
		} )
	} catch $e {
		"caught"
	}
	print "not thrown in main"

$ burn throw.burn
	* stdout
		not thrown in main
	* exit status nonzero
