yield.burn:
	import burn.fiber
	fiber.fork( function() {
		print "fork"
	} )
	print "main 1"
	fiber.yield()
	print "main 2"

$ burn yield.burn
	* stdout
		main 1
		fork
		main 2
