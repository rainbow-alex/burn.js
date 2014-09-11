stack1.burn:
	let $foo = function() {
		3 + "3"
	}
	$foo()

$ burn stack1.burn
	* stderr
		TypeError: Can't add <Integer> and <String>.
		in function $foo (stack1.burn:1) on line 2
		called from stack1.burn on line 4
	* exit status nonzero

stack2.burn:
	let $foo = function() {
		let $bar = function() {
			3 + "3"
		}
		$bar()
	}
	$foo()

$ burn stack2.burn
	* stderr
		TypeError: Can't add <Integer> and <String>.
		in function $bar (stack2.burn:2) on line 3
		called from function $foo (stack2.burn:1) on line 5
		called from stack2.burn on line 7
	* exit status nonzero

@todo import, include
