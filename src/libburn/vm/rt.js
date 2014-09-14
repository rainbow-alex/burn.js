"use strict";
let path = require( "path" );
let libburn = require( "libburn" );
let Value = require( "./Value" );
let Fiber = require( "./Fiber" );
let util = require( "./util" );
let msg = require( "../messages" );
let types = require( "libburn/builtin/burn/types" );
let errors = require( "libburn/builtin/burn/errors" );
let list = require( "libburn/builtin/burn/list" );
let implicit = require( "libburn/builtin/burn/implicit" );

let rt = exports;

rt.createNothing = function() {
	return new Value.Nothing();
};

rt.createBoolean = function( v ) {
	return new Value.Boolean( v );
};

rt.createInteger = function( v ) {
	return new Value.Integer( v );
};

rt.createFloat = function( v ) {
	return new Value.Float( v );
};

rt.createString = function( v ) {
	return new Value.String( v );
};

rt.createFunction = function( implementation, options ) {
	return new Value.Function( implementation, options );
};

rt.validateFunctionCallArguments = function( fiber, fn, parameters, args ) {
	util.validateFunctionCallArguments( fiber, fn, parameters, args );
};

rt.validateFunctionCallReturnType = function( fiber, fn, type, value ) {
	if( ! types.Type.typeTest( fiber, type ) ) {
		throw new errors.TypeErrorInstance(
			msg.function_call_return_type_is_not_a_type( fn, type ),
			fiber.stack
		);
	}
	if( ! type.typeTest( fiber, value ) ) {
		throw new errors.TypeErrorInstance(
			msg.function_call_wrong_return_type( fiber, fn, type, value ),
			fiber.stack
		);
	}
};

rt.createList = function( items ) {
	return new list.JsListInstance( items );
};

rt.get = function( fiber, value, property ) {
	if( value.canGet( property ) ) {
		return value.get( fiber, property );
	} else {
		throw new errors.PropertyErrorInstance(
			msg.get_missing_property( value, property ),
			fiber.stack
		);
	}
};

rt.set = function( fiber, value, property, propertyValue ) {
	if( value.canSet( property ) ) {
		value.set( fiber, property, propertyValue );
	} else {
		throw new errors.PropertyErrorInstance(
			msg.set_missing_property( value, property ),
			fiber.stack
		);
	}
};

rt.getIndex = function( fiber, value, index ) {
	if( value.getIndex ) {
		return value.getIndex( fiber, index );
	} else {
		throw new errors.TypeErrorInstance(
			"TypeError: " + value.repr + " is not Indexable.",
			fiber.stack
		);
	}
};

rt.add = function( fiber, l, r ) {
	if( l instanceof Value.Integer ) {
		if( r instanceof Value.Integer ) {
			return new Value.Integer( l.value + r.value );
		} else if( r instanceof Value.Float ) {
			return new Value.Float( l.value + r.value );
		}
	} else if( l instanceof Value.Float ) {
		if( r instanceof Value.Integer || r instanceof Value.Float ) {
			return new Value.Float( l.value + r.value );
		}
	}
	throw new errors.TypeErrorInstance(
		"TypeError: Can't add " + l.repr + " and " + r.repr + ".",
		fiber.stack
	);
};

rt.sub = function( fiber, l, r ) {
	if( l instanceof Value.Integer ) {
		if( r instanceof Value.Integer ) {
			return new Value.Integer( l.value - r.value );
		} else if( r instanceof Value.Float ) {
			return new Value.Float( l.value - r.value );
		}
	} else if( l instanceof Value.Float ) {
		if( r instanceof Value.Integer || r instanceof Value.Float ) {
			return new Value.Float( l.value - r.value );
		}
	}
	throw new errors.TypeErrorInstance(
		"TypeError: Can't subtract " + l.repr + " and " + r.repr + ".",
		fiber.stack
	);
};

rt.is = function( fiber, l, r ) {
	if( ! types.Type.typeTest( fiber, r ) ) {
		throw new errors.TypeErrorInstance(
			"TypeError: " + r.repr + " is not a type",
			fiber.stack
		);
	}
	return new Value.Boolean( r.typeTest( fiber, l ) );
};

rt.is_not = function( fiber, l, r ) {
	return new Value.Boolean( ! rt.is( fiber, l, r ).value );
};

rt.eq = function( fiber, l, r ) {
	if( ! l.canEq( r ) ) {
		throw new errors.TypeErrorInstance( msg.eq_undefined( l, r ), fiber.stack );
	}
	return new Value.Boolean( l.eq( fiber, r ) );
};

rt.neq = function( fiber, l, r ) {
	return new Value.Boolean( ! rt.eq( fiber, l, r ).value );
};

rt.lt = function( fiber, l, r ) {
	if( ! l.canOrd( r ) ) {
		throw new errors.TypeErrorInstance( msg.ord_undefined( l, r ), fiber.stack );
	}
	return new Value.Boolean( l.lt( fiber, r ) );
};

rt.gt = function( fiber, l, r ) {
	return rt.lt( fiber, r, l );
};

rt.lteq = function( fiber, l, r ) {
	return new Value.Boolean( ! rt.lt( fiber, r, l ).value );
};

rt.gteq = function( fiber, l, r ) {
	return new Value.Boolean( ! rt.lt( fiber, l, r ).value );
};

rt.and = function( fiber, l, rf ) {
	return l.isTruthy( fiber ) ? rf() : l;
};

rt.or = function( fiber, l, rf ) {
	return l.isTruthy( fiber ) ? l : rf();
};

rt.not = function( fiber, e ) {
	return new Value.Boolean( ! e.isTruthy( fiber ) );
};

rt.import = function( fiber, fqn ) {
	let x = fiber.vm.importRootModule( fiber, fqn[0] );
	fqn.slice(1).forEach( function( p, i ) {
		if( x.canGet( p ) ) {
			x = x.get( fiber, p );
		} else {
			throw new errors.ImportErrorInstance( msg.import_get_error( fqn, i+1 ), fiber.stack );
		}
	} );
	return x;
};

rt.include = function( fiber, origin, filename ) {
	if( !( filename instanceof Value.String ) ) {
		throw new errors.TypeErrorInstance(
			msg.include_type_error( filename ),
			fiber.stack
		);
	}
	if( origin.filename ) {
		filename = path.resolve( process.cwd(), path.dirname( origin.filename ), filename.value );
	} else {
		filename = path.resolve( process.cwd(), filename.value );
	}
	fiber.vm.include( fiber, filename );
};

rt.implicit = function( fiber, name ) {
	if( implicit.exposes.canGet( name ) ) {
		return implicit.exposes.get( fiber, name );
	} else {
		throw new errors.NameErrorInstance( msg.implicit_name_error( name ), fiber.stack );
	}
};
