"use strict";
let path = require( "path" );
let libburn = require( "libburn" );
let Value = require( "./Value" );
let Fiber = require( "./Fiber" );
let util = require( "./util" );
let msg = require( "../messages" );
let types = require( "libburn/builtin/burn/types" );
let errors = require( "libburn/builtin/burn/errors" );
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

rt.createBytes = function( v ) {
	return new Value.Bytes( v );
};

rt.implicit = function( fiber, name ) {
	if( implicit.exposes.canGet( name ) ) {
		return implicit.exposes.get( fiber, name );
	} else {
		throw new errors.NameErrorInstance( msg.implicit_name_error( name ), fiber.stack );
	}
};

rt.createTuple = function( items ) {
	return new Value.Tuple( items );
};

rt.createList = function( items ) {
	return new Value.List( items );
};

rt.createFunction = function( properties ) {
	return new Value.Function( properties );
};

rt.validateCallArguments = function( fiber, fn, args, nargs, parameters ) {
	util.validateCallArguments( fiber, fn, args, nargs, parameters );
};

rt.validateCallReturnType = function( fiber, fn, value, type ) {
	if( ! types.Type.typeTest( fiber, type ) ) {
		throw new errors.TypeErrorInstance(
			msg.call_return_type_is_not_a_type( fiber, fn, type ),
			fiber.stack
		);
	}
	if( ! type.typeTest( fiber, value ) ) {
		throw new errors.TypeErrorInstance(
			msg.call_wrong_return_type( fiber, fn, value, type ),
			fiber.stack
		);
	}
};

rt.createClass = function( properties, methods ) {
	return new Value.Class( properties, methods );
};

rt.createClassProperty = function( type ) {
	return new Value.Class.Property( type );
};

rt.createClassMethod = function( implementation, options ) {
	return new Value.Class.Method( [], null, implementation );
};

rt.new_ = function( instantiatable ) {
	// TODO typecheck
	return instantiatable.new_();
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

rt.setIndex = function( fiber, value, index, itemValue ) {
	if( value.setIndex ) {
		return value.setIndex( fiber, index, itemValue );
	} else {
		throw new errors.TypeErrorInstance(
			"TypeError: " + value.repr + " is not Indexable.",
			fiber.stack
		);
	}
};

rt.intersection = function( fiber, l, r ) {
	if( types.Type.typeTest( fiber, l ) && types.Type.typeTest( fiber, r ) ) {
		return new Value.TypeIntersection( l, r );
	}
	throw new errors.TypeErrorInstance(
		"TypeError: Can't apply `&` to " + l.repr + " and " + r.repr + ".",
		fiber.stack
	);
};

rt.union = function( fiber, l, r ) {
	if( types.Type.typeTest( fiber, l ) && types.Type.typeTest( fiber, r ) ) {
		return new Value.TypeUnion( l, r );
	}
	throw new errors.TypeErrorInstance(
		"TypeError: Can't apply `|` to " + l.repr + " and " + r.repr + ".",
		fiber.stack
	);
};

rt.mul = function( fiber, l, r ) {
	if( l instanceof Value.Integer ) {
		if( r instanceof Value.Integer ) {
			return new Value.Integer( l.value * r.value );
		} else if( r instanceof Value.Float ) {
			return new Value.Float( l.value * r.value );
		} else if( r instanceof Value.String ) {
			if( l.value < 0 ) {
				throw new errors.TypeErrorInstance(
					"TypeError: Can't apply `*` to " + l.repr + " and <burn.math.StrictlyNegative>",
					fiber.stack
				);
			}
			return new Value.String( repeatString( r.value, l.value ) );
		}
	} else if( l instanceof Value.Float ) {
		if( r instanceof Value.Integer || r instanceof Value.Float ) {
			return new Value.Float( l.value * r.value );
		}
	} else if( l instanceof Value.String ) {
		if( r instanceof Value.Integer ) {
			if( r.value < 0 ) {
				throw new errors.TypeErrorInstance(
					"TypeError: Can't apply `*` to <burn.math.StrictlyNegative> and " + r.repr,
					fiber.stack
				);
			}
			return new Value.String( repeatString( l.value, r.value ) );
		}
	}
	throw new errors.TypeErrorInstance(
		"TypeError: Can't apply `*` to " + l.repr + " and " + r.repr + ".",
		fiber.stack
	);
};

function repeatString( s, n ) {
	let o = "";
	for( let i = 0 ; i < n ; i++ ) {
		o += s;
	}
	return o;
}

rt.div = function( fiber, l, r ) {
	if( ( l instanceof Value.Integer || l instanceof Value.Float ) && ( r instanceof Value.Integer || r instanceof Value.Float ) ) {
		if( r.value === 0 ) {
			throw new errors.TypeErrorInstance( "TypeError: Division by burn.math.Zero.", fiber.stack );
		}
		return new Value.Float( l.value / r.value );
	}
	throw new errors.TypeErrorInstance(
		"TypeError: Can't apply `/` to " + l.repr + " and " + r.repr + ".",
		fiber.stack
	);
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
	} else if( l instanceof Value.String && r instanceof Value.String ) {
		return new Value.String( l.value + r.value );
	} else if( l instanceof Value.Bytes && r instanceof Value.Bytes ) {
		return new Value.Bytes( Buffer.concat( [ l.value, r.value ] ) );
	}
	throw new errors.TypeErrorInstance(
		"TypeError: Can't apply `+` to " + l.repr + " and " + r.repr + ".",
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
		"TypeError: Can't apply `-` to " + l.repr + " and " + r.repr + ".",
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

rt.not = function( fiber, e ) {
	return new Value.Boolean( ! e.isTruthy( fiber ) );
};

rt.and = function( fiber, l, rf ) {
	return l.isTruthy( fiber ) ? rf() : l;
};

rt.or = function( fiber, l, rf ) {
	return l.isTruthy( fiber ) ? l : rf();
};

//
// Statements
//

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

rt.forInIter = function( fiber, iterable ) {
	if( ! types.Iterable.typeTest( fiber, iterable ) ) {
		throw new errors.TypeErrorInstance(
			iterable.repr + " is not Iterable",
			fiber.stack
		);
	}
	return iterable.iter();
};
