"use strict";

let messages = module.exports;

function format( str, params ) {
	return str.replace( /\$([a-z]+|\$)/g, function( _, p ) {
		if( p === "$" ) {
			return "$";
		} else {
			return params[p];
		}
	} );
}

messages.implicit_name_error = function( name ) {
	return format(
		"NameError: implicit name $name is not defined.",
		{ name: name }
	);
};

messages.get_missing_property = function( value, property ) {
	return format(
		"PropertyError: $value has no property $property.",
		{ value: value.repr, property: property }
	);
};

messages.set_missing_property = function( value, property ) {
	return format(
		"PropertyError: $value has no property $property.",
		{ value: value.repr, property: property }
	);
};

messages.index_wrong_type = function( context, type, index ) {
	return format(
		"TypeError: $ctxt index must be $type, got $i.",
		{ ctxt: context.repr, type: type.repr, i: index.repr }
	);
};

messages.function_call_not_enough_args = function( function_, parameters, args ) {
	let min = parameters.length;
	while( parameters[ min - 1 ].default ) { min--; }
	return format(
		parameters.length === 1 ? "ArgumentError: $fn takes one parameter, $n given."
		: min === 1 ? "ArgumentError: $fn takes at least one parameter, $n given."
		: min < parameters.length ? "ArgumentError: $fn takes at least $m parameters, $n given."
		: "ArgumentError: $fn takes at $m parameters, $n given.",
		{
			fn: function_.repr,
			m: min,
			n: args.length || "none",
		}
	);
};

messages.function_call_too_many_args = function( function_, parameters, args ) {
	return format(
		parameters.length === 0 ? "ArgumentError: $fn takes no parameters, $n given."
		: parameters.length === 1 ? "ArgumentError: $fn takes at most one parameter, $n given."
		: "ArgumentError: $fn takes at most $p parameters, $n given.",
		{
			fn: function_.repr,
			p: parameters.length,
			n: args.length || "none",
		}
	);
};

messages.function_call_wrong_arg_type = function( function_, parameters, args, i ) {
	return format(
		"ArgumentError: $fn parameter $param should be $type, got $arg.",
		{
			fn: function_.repr,
			param: format(
				parameters[i].name ? "$$$name (#$i)" : "#$i",
				{ name: parameters[i].name, i: i+1 }
			),
			type: parameters[i].type.repr,
			arg: args[i].repr,
		}
	);
};

messages.method_call_not_enough_args = function( context, method, parameters, args ) {
	let min = parameters.length;
	while( parameters[ min - 1 ].default ) { min--; }
	return format(
		parameters.length === 1 ? "ArgumentError: $method takes one parameter, $n given."
		: min === 1 ? "ArgumentError: $method takes at least one parameter, $n given."
		: min < parameters.length ? "ArgumentError: $method takes at least $min parameters, $n given."
		: "ArgumentError: $method takes at $min parameters, $n given.",
		{
			method: context.repr + "." + method,
			min: min,
			n: args.length || "none",
		}
	);
};

messages.method_call_too_many_args = function( context, method, parameters, args ) {
	return format(
		parameters.length === 0 ? "ArgumentError: $method takes no parameters, $n given."
		: parameters.length === 1 ? "ArgumentError: $method takes at most one parameter, $n given."
		: "ArgumentError: $method takes at most $p parameters, $n given.",
		{
			method: context.repr + "." + method,
			p: parameters.length,
			n: args.length || "none",
		}
	);
};

messages.method_call_wrong_arg_type = function( context, method, parameters, args, i ) {
	return format(
		"ArgumentError: $method parameter $param should be $type, got $arg.",
		{
			method: context.repr + "." + method,
			param: format(
				parameters[i].name ? "$$$name (#$i)" : "#$i",
				{ name: parameters[i].name, i: i+1 }
			),
			type: parameters[i].type.repr,
			arg: args[i].repr,
		}
	);
};

messages.include_type_error = function( expr ) {
	return format(
		"TypeError: Include statement takes a String, got $expr.",
		{ expr: expr.repr }
	);
};

messages.import_root_not_found = function( name ) {
	return format(
		"ImportError: Could not find $name.",
		{ name: name }
	);
};

messages.import_get_error = function( fqn, i ) {
	return format(
		"ImportError: Could not import $fqn, $partial has no property $property.",
		{
			fqn: fqn.join( "." ),
			partial: fqn.slice( 0, i ).join( "." ),
			property: fqn[i],
		}
	);
};

messages.eq_undefined = function( l, r ) {
	return format(
		"TypeError: Equivalence of $l and $r is undefined.",
		{ l: l.repr, r: r.repr }
	);
};

messages.ord_undefined = function( l, r ) {
	return format(
		"TypeError: Ordering of $l and $r is undefined.",
		{ l: l.repr, r: r.repr }
	);
};

messages.assert_throws_wrong_type = function( fiber, callable, type, thrown ) {
	return format(
		"AssertionError: $callable was expected to throw $type, but it threw $thrown.",
		{
			callable: callable.repr,
			type: type.toBurnString( fiber ).value,
			thrown: thrown.repr,
		}
	);
};

messages.assert_throws_didnt_throw = function( fiber, callable, type ) {
	return format(
		"AssertionError: $callable was expected to throw $type, but it didn't throw anything.",
		{
			callable: callable.repr,
			type: type.toBurnString( fiber ).value, // TODO catch errors in toBurnString
		}
	);
};
