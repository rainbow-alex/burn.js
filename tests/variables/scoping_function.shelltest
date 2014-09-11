bind.burn:
	let $foo = 1
	function() {
		$foo = 2
	}()
	print $foo

$ burn bind.burn
	* stdout
		2

bind2.burn:
	let $foo = 1
	let $p = function() {
		print $foo
	}
	$p()
	$foo = 2
	$p()

$ burn bind2.burn
	* stdout
		1
		2

nest.burn:
	let $foo = 1
	function() {
		function() {
			$foo = 2
		}()
	}()
	print $foo

$ burn nest.burn
	* stdout
		2
