"use strict";
let burn = require( "../" );
let vm = require( "./" );
let types = require( "libburn/builtin/burn/types" );
let errors = require( "libburn/builtin/burn/errors" );
let list = require( "libburn/builtin/burn/list" );

let runtime = exports;

runtime.createNothing = function() {
	return new vm.Nothing();
};

runtime.createBoolean = function( v ) {
	return new vm.Boolean( v );
};

runtime.createInteger = function( v ) {
	return new vm.Integer( v );
};

runtime.createFloat = function( v ) {
	return new vm.Float( v );
};

runtime.createString = function( v ) {
	return new vm.String( v );
};

runtime.createFunction = function( implementation, options ) {
	return new vm.Function( implementation, options );
};

runtime.createList = function( items ) {
	return new list.JsListInstance( items );
};

runtime.add = function( fiber, l, r ) {
	if( l instanceof vm.Integer ) {
		if( r instanceof vm.Integer ) {
			return new vm.Integer( l.value + r.value );
		} else if( r instanceof vm.Float ) {
			return new vm.Float( l.value + r.value );
		}
	} else if( l instanceof vm.Float ) {
		if( r instanceof vm.Integer || r instanceof vm.Float ) {
			return new vm.Float( l.value + r.value );
		}
	}
	throw new errors.TypeErrorInstance(
		"TypeError: Can't add " + l.repr + " and " + r.repr + ".",
		fiber.stack
	);
};

runtime.subtract = function( fiber, l, r ) {
	if( l instanceof vm.Integer ) {
		if( r instanceof vm.Integer ) {
			return new vm.Integer( l.value - r.value );
		} else if( r instanceof vm.Float ) {
			return new vm.Float( l.value - r.value );
		}
	} else if( l instanceof vm.Float ) {
		if( r instanceof vm.Integer || r instanceof vm.Float ) {
			return new vm.Float( l.value - r.value );
		}
	}
	throw new errors.TypeErrorInstance(
		"TypeError: Can't subtract " + l.repr + " and " + r.repr + ".",
		fiber.stack
	);
};

runtime.is = function( fiber, l, r ) {
	if( ! types.Type.typeTest( fiber, r ) ) {
		throw new errors.TypeErrorInstance(
			"TypeError: " + r.repr + " is not a type",
			fiber.stack
		);
	}
	return new vm.Boolean( r.typeTest( fiber, l ) );
};

runtime.is_not = function( fiber, l, r ) {
	return new vm.Boolean( ! runtime.is( fiber, l, r ).value );
};

runtime.eq = function( fiber, l, r ) {
	if( ! l.canEq( r ) ) {
		throw new errors.TypeErrorInstance(
			"TypeError: Equivalence of " + l.repr + " and " + r.repr + " is undefined.",
			fiber.stack
		);
	}
	return new vm.Boolean( l.eq( fiber, r ) );
};

runtime.neq = function( fiber, l, r ) {
	return new vm.Boolean( ! runtime.eq( fiber, l, r ).value );
};

runtime.lt = function( fiber, l, r ) {
	if( ! l.canOrd( r ) ) {
		throw new errors.TypeErrorInstance(
			"TypeError: Ordering of " + l.repr + " and " + r.repr + " is undefined.",
			fiber.stack
		);
	}
	return new vm.Boolean( l.lt( fiber, r ) );
};

runtime.gt = function( fiber, l, r ) {
	return runtime.lt( fiber, r, l );
};

runtime.lteq = function( fiber, l, r ) {
	return ! runtime.lt( fiber, r, l );
};

runtime.gteq = function( fiber, l, r ) {
	return ! runtime.lt( fiber, l, r );
};

runtime.and = function( fiber, l, rf ) {
	return l.isTruthy( fiber ) ? rf() : l;
};

runtime.or = function( fiber, l, rf ) {
	return l.isTruthy( fiber ) ? l : rf();
};

runtime.not = function( fiber, e ) {
	return new vm.Boolean( ! e.isTruthy( fiber ) );
};

function importRootModule( fiber, name ) {
	if( fiber.vm._root[ name ] ) {
		return fiber.vm._root[ name ];
	} else {
		let fs = require( "fs" );
		let path = require( "path" );
		let burn = require( "./" );
		for( let i = 0 ; i < fiber.vm.path.length ; i++ ) {
			let base = path.join( fiber.vm.path[i], name );
			let json = path.join( base, "burn_module.json" );
			if( fs.existsSync( json ) ) {
				let description = JSON.parse( fs.readFileSync( json ) );
				let module = fiber.vm._root[ name ] = new vm.Module();
				module.suggestName( name );
				module.setProperty( fiber, "meta:path", new vm.String( base ) );
				description.sources.forEach( function( filename ) {
					importSource( path.join( base, filename ) ); // TODO
				} );
				return module;
			}
			let js = path.join( base, "burn_module.js" );
			if( fs.existsSync( js ) ) {
				let module = fiber.vm._root[ name ] = require( js ).exposes;
				module.suggestName( name );
				return module;
			}
		}
		throw new errors.ImportErrorInstance(
			"ImportError: Module " + name + " not found.",
			fiber.stack
		);
	}
	function importSource( filename ) {
		let importOrigin = new burn.vm.origin.ScriptOrigin( filename );
		fiber.stack.push( new vm.Fiber.ImportFrame( importOrigin ) );
		try {
			let code;
			try {
				code = fiber.vm.compile( importOrigin );
			} catch( e ) { if( e instanceof lang.Error ) {
				fiber.setLine( e.line );
				throw new errors.ImportErrorInstance(
					"ImportError: Error importing module `" + name + "`.\n" + e.message,
					fiber.stack
				);
			} else { throw e; } }
			fiber.vm._run( fiber, importOrigin, code );
		} finally {
			fiber.stack.pop();
		}
	}
};

runtime.import = function( fiber, fqn ) {
	let x = importRootModule( fiber, fqn[0] );
	fqn.slice(1).forEach( function( p ) {
		x = x.getProperty( fiber, p );
	} );
	return x;
};

runtime.include = function( fiber, origin, filename ) {
	// TODO resolve relative to origin
	let includeOrigin = new burn.vm.origin.ScriptOrigin( filename.value );
	fiber.stack.push( new vm.Fiber.IncludeFrame( includeOrigin ) );
	try {
		let code;
		try {
			code = fiber.vm.compile( includeOrigin );
		} catch( e ) { if( e instanceof lang.Error ) {
			fiber.setLine( e.line );
			throw new errors.IncludeErrorInstance(
				"IncludeError: Error including \"" + filename + "\".\n" + e.message,
				fiber.stack
			);
		} else { throw e; } }
		fiber.vm._run( fiber, includeOrigin, code );
	} finally {
		fiber.stack.pop();
	}
};

runtime.implicit = function( fiber, name ) {
	return runtime.import( fiber, [ "burn", "implicit", name ] );
};
