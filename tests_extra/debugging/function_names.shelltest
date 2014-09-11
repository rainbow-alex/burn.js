anon.burn:
	let $foo = ( function() {} )
	print $foo

$ burn anon.burn
	* stdout
		<Function>

var.burn:
	let $foo = function() {}
	print $foo

$ burn var.burn
	* stdout
		<Function:$foo>

@todo property assign

reassigned.burn:
	let $foo = function() {}
	let $bar = $foo
	print $bar

$ burn reassigned.burn
	* stdout
		<Function:$foo>
