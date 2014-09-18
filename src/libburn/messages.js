"use strict";
let Value = require( "./vm/Value" );

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

function toString( fiber, value ) {
	try {
		let s = value.toBurnString( fiber );
		console.assert( s instanceof Value.String );
		return s.value;
	} catch( e ) {
		return value.repr + " [toString failed]";
	}
}

function calleeToString( callee ) {
	if( callee instanceof Value.Function ) {
		return callee.name || callee.repr;
	} else if( callee instanceof Value.BoundMethod ) {
		return callee.value.repr + "." + callee.method;
	} else {
		return callee.repr;
	}
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

messages.call_not_enough_args = function( fiber, callee, args, parameters ) {
	let min = parameters.length;
	while( parameters[ min - 1 ].default ) { min--; }
	return format(
		parameters.length === 1 ? "ArgumentError: $callee takes one parameter, $n given."
		: min === 1 ? "ArgumentError: $callee takes at least one parameter, $n given."
		: min < parameters.length ? "ArgumentError: $callee takes at least $min parameters, $n given."
		: "ArgumentError: $callee takes $min parameters, $n given.",
		{
			callee: calleeToString( callee ),
			min: min,
			n: args.length || "none",
		}
	);
};

messages.call_too_many_args = function( fiber, callee, args, parameters ) {
	return format(
		parameters.length === 0 ? "ArgumentError: $callee takes no parameters, $n given."
		: parameters.length === 1 ? "ArgumentError: $callee takes at most one parameter, $n given."
		: "ArgumentError: $callee takes at most $p parameters, $n given.",
		{
			callee: calleeToString( callee ),
			p: parameters.length,
			n: args.length || "none",
		}
	);
};

messages.call_wrong_arg_type = function( fiber, callee, args, parameters, i ) {
	return format(
		"ArgumentError: $callee parameter $param should be $type, got $arg.",
		{
			callee: calleeToString( callee ),
			param: format(
				parameters[i].name ? "$$$name (#$i)" : "#$i",
				{ name: parameters[i].name, i: i+1 }
			),
			type: toString( fiber, parameters[i].type ),
			arg: args[i].repr,
		}
	);
};

messages.call_return_type_is_not_a_type = function( fiber, callee, type ) {
	return format(
		"TypeError: return type for $callee is not Type, but $actual.",
		{
			callee: calleeToString( callee ),
			actual: type.repr,
		}
	);
};

messages.call_wrong_return_type = function( fiber, callee, value, type ) {
	return format(
		"TypeError: $fn returned $value, which is not $type.",
		{
			fn: calleeToString( callee ),
			type: type.repr,
			value: value.repr,
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
			type: toString( fiber, type ),
			thrown: thrown.repr,
		}
	);
};

messages.assert_throws_didnt_throw = function( fiber, callable, type ) {
	return format(
		"AssertionError: $callable was expected to throw $type, but it didn't throw anything.",
		{
			callable: callable.repr,
			type: toString( fiber, type ),
		}
	);
};
