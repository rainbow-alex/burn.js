"use strict";
let fs = require( "fs" );
let path = require( "path" );
let nodefibers = require( "fibers" );
let libburn = require( "libburn" );
let Fiber = require( "./Fiber" );
let rt = require( "./rt" );
let Value = require( "./Value" );
let msg = require( "../messages" );
let errors = require( "libburn/builtin/burn/errors" );

module.exports = CLASS( {
	init: function( path ) {
		let burn = require( "libburn/builtin/burn" );
		this.path = path;
		this._root = {
			burn: burn.exposes,
		};
		this._uncaughtThrowableHandlers = [];
	},
	
	// TODO per fiber!
	onUncaughtThrowable: function( f ) {
		this._uncaughtThrowableHandlers.push( f );
	},
	
	parse: function( origin ) {
		let ast = libburn.lang.parse( libburn.lang.lex( origin ) );
		ast.resolve();
		return ast;
	},
	
	start: function( origin, argv ) {
		let js = this.parse( origin ).compile();
		nodefibers( function() {
			try {
				let fiber = new Fiber( this );
				fiber.stack.push( new Fiber.RootFrame( origin ) );
				this._run( fiber, origin, js );
				if( this.main ) {
					let sys = require( "libburn/builtin/burn/sys" );
					let process = new sys.ProcessInstance( argv );
					this.main.call( fiber, [ process ] );
				}
			} catch( e ) {
				CATCH_IF( e, e instanceof Value );
				this.dispatchUncaughtThrowable( e );
			}
		}.bind( this ) ).run();
	},
	
	fork: function( f ) {
		let forkFiber = new Fiber( this );
		setImmediate( function() {
			try {
				nodefibers( function() {
					f( forkFiber );
				} ).run();
			} catch( e ) {
				CATCH_IF( e, e instanceof Value );
				forkFiber.vm.dispatchUncaughtThrowable( e );
			}
		} );
	},
	
	importRootModule: function( fiber, name ) {
		
		if( this._root[ name ] ) {
			return this._root[ name ];
		}
		
		let module;
		for( let i = 0 ; i < this.path.length ; i++ ) {
			let json = path.join( this.path[i], name, "burn_module.json" );
			if( fs.existsSync( json ) ) {
				module = loadNativeModule.call( this, json );
				break;
			}
			let js = path.join( this.path[i], name, "burn_module.js" );
			if( fs.existsSync( js ) ) {
				module = loadJavascriptModule.call( this, js );
				break;
			}
		}
		
		if( ! module ) {
			throw new errors.ImportErrorInstance(
				msg.import_root_not_found( name ),
				fiber.stack
			);
		}
		
		return module;
		
		function loadNativeModule( descriptionFilename ) {
			
			let description;
			try {
				description = JSON.parse( fs.readFileSync( descriptionFilename ) );
			} catch( e ) {
				CATCH_IF( e, e instanceof SyntaxError );
				throw new errors.ImportErrorInstance(
					"ImportError: [parsing `" + descriptionFilename + "`] " + e.message,
					fiber.stack
				);
			}
			
			let base = path.dirname( descriptionFilename );
			if( typeof description.include === "string" ) {
				description.include = [ description.include ];
			}
			let sources = description.include.map( function( s ) {
				return path.resolve( base, s );
			} );
			
			sources.forEach( function( filename ) {
				if( ! fs.existsSync( filename ) ) {
					throw new errors.ImportErrorInstance(
						"ImportError: Source file `" + filename + "` not found.",
						fiber.stack
					);
				}
			} );
			
			let module = new Value.Module();
			module.suggestName( name );
			this._root[ name ] = module;
			module.set( fiber, "meta:path", new Value.String( base ) );
			
			sources.forEach( function( filename ) {
				let origin = new libburn.origin.Script( filename );
				fiber.stack.push( new Fiber.ImportFrame( origin ) );
				try {
					let code;
					try {
						code = this.parse( origin ).compile();
					} catch( e ) {
						CATCH_IF( e, e instanceof libburn.lang.Error );
						fiber.setLine( e.line );
						throw new errors.ImportErrorInstance(
							"ImportError: Error importing module `" + name + "`.\n" + e.message,
							fiber.stack
						);
					}
					this._run( fiber, origin, code );
				} finally {
					fiber.stack.pop();
				}
			}, this );
			
			return module;
		}
		
		function loadJavascriptModule( js ) {
			let module = require( js ).exposes;
			module.suggestName( name );
			this._root[ name ] = module;
			return module;
		}
	},
	
	include: function( fiber, filename ) {
		
		if( ! fs.existsSync( filename ) ) {
			throw new errors.IncludeErrorInstance(
				"IncludeError: File `" + filename + "` not found.",
				fiber.stack
			);
		}
		
		let includeOrigin = new libburn.origin.Script( filename );
		
		fiber.stack.push( new Fiber.IncludeFrame( includeOrigin ) );
		try {
			
			let code;
			try {
				code = this.parse( includeOrigin ).compile();
			} catch( e ) {
				CATCH_IF( e, e instanceof libburn.lang.Error );
				fiber.setLine( e.line );
				throw new errors.IncludeErrorInstance(
					"IncludeError: Error including \"" + filename + "\".\n" + e.message,
					fiber.stack
				);
			}
			
			this._run( fiber, includeOrigin, code );
			
		} finally {
			fiber.stack.pop();
		}
	},
	
	dispatchUncaughtThrowable: function( e ) {
		if( this._uncaughtThrowableHandlers.length ) {
			this._uncaughtThrowableHandlers.forEach( function( f ) {
				f( e );
			} );
		} else {
			throw e;
		}
	},
	
	_run: function( fiber, origin, js ) {
		rt._fiber = fiber;
		rt._origin = origin;
		eval( js );
	},
} );
