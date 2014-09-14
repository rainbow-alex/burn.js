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

messages.index_wrong_type = function( context, type, index ) {
	return format(
		"TypeError: $c index must be $t, got $i.",
		{ c: context.repr, t: type.repr, i: index.repr }
	);
};

messages.function_call_not_enough_args = function( function_, parameters, args ) {
	let min = parameters.length;
	while( parameters[ min - 1 ].default ) { min--; }
	return format(
		parameters.length === 1 ? "ArgumentError: $c takes one parameter, $n given."
		: min === 1 ? "ArgumentError: $c takes at least one parameter, $n given."
		: min < parameters.length ? "ArgumentError: $c takes at least $m parameters, $n given."
		: "ArgumentError: $c takes at $m parameters, $n given.",
		{
			c: function_.repr,
			m: min,
			n: args.length || "none",
		}
	);
};

messages.function_call_too_many_args = function( function_, parameters, args ) {
	return format(
		parameters.length === 0 ? "ArgumentError: $c takes no parameters, $n given."
		: parameters.length === 1 ? "ArgumentError: $c takes at most one parameter, $n given."
		: "ArgumentError: $c takes at most $p parameters, $n given.",
		{
			c: function_.repr,
			p: parameters.length,
			n: args.length || "none",
		}
	);
};

messages.function_call_wrong_arg_type = function( function_, parameters, args, i ) {
	return format(
		"ArgumentError: $c parameter $p should be $t, got $a.",
		{
			c: function_.repr,
			p: format(
				parameters[i].name ? "$$$name (#$i)" : "#$i",
				{ name: parameters[i].name, i: i+1 }
			),
			t: parameters[i].type.repr,
			a: args[i].repr,
		}
	);
};

messages.method_call_not_enough_args = function( context, method, parameters, args ) {
	let min = parameters.length;
	while( parameters[ min - 1 ].default ) { min--; }
	return format(
		parameters.length === 1 ? "ArgumentError: $c takes one parameter, $n given."
		: min === 1 ? "ArgumentError: $c takes at least one parameter, $n given."
		: min < parameters.length ? "ArgumentError: $c takes at least $m parameters, $n given."
		: "ArgumentError: $c takes at $m parameters, $n given.",
		{
			c: context.repr + "." + method,
			m: min,
			n: args.length || "none",
		}
	);
};

messages.method_call_too_many_args = function( context, method, parameters, args ) {
	return format(
		parameters.length === 0 ? "ArgumentError: $c takes no parameters, $n given."
		: parameters.length === 1 ? "ArgumentError: $c takes at most one parameter, $n given."
		: "ArgumentError: $c takes at most $p parameters, $n given.",
		{
			c: context.repr + "." + method,
			p: parameters.length,
			n: args.length || "none",
		}
	);
};

messages.method_call_wrong_arg_type = function( context, method, parameters, args, i ) {
	return format(
		"ArgumentError: $c parameter $p should be $t, got $a.",
		{
			c: context.repr + "." + method,
			p: format(
				parameters[i].name ? "$$$name (#$i)" : "#$i",
				{ name: parameters[i].name, i: i+1 }
			),
			t: parameters[i].type.repr,
			a: args[i].repr,
		}
	);
};
