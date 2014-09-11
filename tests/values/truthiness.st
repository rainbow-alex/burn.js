nothing.burn:
	import burn.types.Falsy
	print nothing is Falsy

$ burn nothing.burn
	* stdout
		true

bool.burn:
	import burn.types.Truthy
	import burn.types.Falsy
	print true is Truthy
	print false is Falsy

$ burn bool.burn
	* stdout
		true
		true

int.burn:
	import burn.types.Truthy
	import burn.types.Falsy
	print 0 is Falsy
	print 1 is Truthy
	print 2 is Truthy
	print -1 is Truthy

$ burn int.burn
	* stdout
		true
		true
		true
		true

float.burn:
	import burn.types.Truthy
	import burn.types.Falsy
	print 0.0 is Falsy
	print 1.1 is Truthy
	print 2.3 is Truthy
	print -1.4 is Truthy

$ burn float.burn
	* stdout
		true
		true
		true
		true

string.burn:
	import burn.types.Truthy
	import burn.types.Falsy
	print "" is Falsy
	print "foo" is Truthy
	print "0" is Truthy
	print "false" is Truthy

$ burn string.burn
	* stdout
		true
		true
		true
		true

function.burn:
	import burn.types.Truthy
	print function() {} is Truthy
	print main is Truthy

$ burn function.burn
	* stdout
		true
		true

type.burn:
	import burn
	import burn.types.Truthy
	print burn is Truthy

$ burn type.burn
	* stdout
		true
