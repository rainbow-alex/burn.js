#!/usr/bin/env python3
import os
import sys
import time
import subprocess
from itertools import count
import re

#
# evaluation helpers
#

def eval_burn( source, imports = [] ):
	source = "".join( "import %s\n" % i for i in imports ) + source
	process = subprocess.Popen(
		"../src/bin/burn.js --tolerant -",
		stdin = subprocess.PIPE,
		stdout = subprocess.PIPE,
		stderr = subprocess.PIPE,
		shell = True
	)
	process.stdin.write( source.encode( "utf-8" ) )
	process.stdin.close()
	exit_status = process.wait( 1 )
	assert exit_status == 0
	return process.stdout.read().decode( "utf-8" )

def eval_burn_expressions( expressions, imports = [] ):
	return eval_burn(
		"".join(
			"try { print %s } catch TypeError $e { print \"TypeError\" }\n" % e
			for e in expressions
		),
		imports
	).splitlines()

#
# operator definitions
#

class Op:
	def __init__( self, name, symbol ):
		self.name = name
		self.symbol = symbol

class BinOp (Op): pass
class UnOp (Op): pass

OPS = [
	BinOp( "or", "or" ),
	BinOp( "and", "and" ),
	UnOp( "not", "not" ),
	BinOp( "is", "is" ),
	BinOp( "is_not", "is not" ),
	BinOp( "eq", "==" ),
	BinOp( "neq", "!=" ),
	BinOp( "lt", "<" ),
	BinOp( "gt", ">" ),
	BinOp( "lteq", "<=" ),
	BinOp( "gteq", ">=" ),
	BinOp( "union", "|" ),
	BinOp( "add", "+" ),
	BinOp( "sub", "-" ),
	BinOp( "mul", "*" ),
	BinOp( "div", "/" ),
]

UNARY_OPS = list( filter( lambda op: isinstance( op, UnOp ), OPS ) )
BINARY_OPS = list( filter( lambda op: isinstance( op, BinOp ), OPS ) )

def get_op( name ):
	for op in OPS:
		if op.name == name:
			return op
	else:
		assert False

#
# generating routines
#

os.chdir( os.path.dirname( __file__ ) )
assert len( sys.argv ) == 2

print( "// generated by `" + " ".join( sys.argv ) + "`" )

op = get_op( sys.argv[1] )

values = [
	"nothing",
	"true", "false",
	"0", "2", "-2",
	"0.0", "2.0",  "-0.5",
	"\"\"", "\"apple\"", "\"banana\"",
	"repr", "function(){}",
	"Integer", "Type",
	"types",
]

# extra numbers to expose arithmetic operator edge cases
if op.name in [ "add", "sub", "mul", "div" ]:
	values += [ "3", "8", "0.3", "0.33333333333", "0.7" ]

types = [ "Nothing", "Boolean", "Integer", "Float", "String", "Function", "Module", "Type" ]

special_tests = {
	"Integer | Integer": ( "nothing is not $v", "5 is $v", "Integer is not $v" ),
	"Integer | Type": ( "nothing is not $v", "5 is $v", "Integer is $v" ),
	"Type | Integer": ( "nothing is not $v", "5 is $v", "Integer is $v" ),
	"Type | Type": ( "nothing is not $v", "5 is not $v", "Integer is $v" ),
	"Integer + Integer": ( "nothing is not $v", "5 is $v", "Integer is not $v" ),
	"Integer + Type": ( "nothing is not $v", "5 is not $v", "Integer is not $v" ),
	"Type + Integer": ( "nothing is not $v", "5 is not $v", "Integer is not $v" ),
	"Type + Type": ( "nothing is not $v", "5 is not $v", "Integer is $v" ),
}

if isinstance( op, BinOp ):
	def generate_tests():
		for i, v1 in zip( count(1), values ):
			print( ".", end="", file=sys.stderr )
			sys.stderr.flush()
			name = "%s_result_%s" % ( op.name, i )
			expressions = [ "%s %s %s" % ( v1, op.symbol, v2 ) for v2 in values ]
			yield name, expressions
else:
	assert isinstance( op, UnOp )
	def generate_tests():
		name = "%s_result" % op.name
		expressions = [ "%s %s" % ( op.symbol, v ) for v in values ]
		yield name, expressions

for name, expressions in generate_tests():
	
	print()
	print( "%s.burn:" % name )
	print( "	import burn.types" )
	print( "	import burn.errors" )
	
	value_expressions = expressions
	type_expressions = []
	for e in expressions:
		type_expressions += [ "( %s ) is %s" % ( e, t ) for t in types ]
	
	value_outputs = eval_burn_expressions( value_expressions, [ "burn.types", "burn.errors" ] )
	type_outputs = eval_burn_expressions( type_expressions, [ "burn.types", "burn.errors" ] )
	
	for i in range( len( value_expressions ) ):
		expression = value_expressions[i]
		output = value_outputs[i]
		
		print( "\t" )
		
		if output == "TypeError" or output == "ValueError":
			print( "	assert.throws( function() { %s }, %s )" % ( expression, output ) )
		
		else:
			var = "$v" + str( i )
			type_ = types[ type_outputs[i*len(types):(i+1)*len(types)].index( "true" ) ]
			print( "	let %s = %s" % ( var, expression ) )
			print( "	assert( %s is %s )" % ( var, type_ ) )
			
			if type_ == "Nothing":
				pass
			elif type_ == "Boolean":
				print( "	assert( %s == %s )" % ( var, output ) )
			elif type_ == "Integer":
				print( "	assert( %s == %s )" % ( var, output ) )
			elif type_ == "Float":
				lower_bound = "%.4f" % ( round( float( output ), 4 ) - 0.0001 )
				upper_bound = "%.4f" % ( round( float( output ), 4 ) + 0.0001 )
				print( "	assert( ( %s < %s ) and ( %s < %s ) )" % ( lower_bound, var, var, upper_bound ) )
			elif type_ == "String":
				print( "	assert( %s == \"%s\" )" % ( var, output ) )
			else:
				if output == "<Function 'repr'>":
					print( "	assert( %s == repr )" % var )
				elif output == "<Function>":
					print( "	assert( %s is Function )" % var )
				elif output in ( "Integer", "Type" ):
					print( "	assert( %s == %s )" % ( var, output ) )
				elif output == "<Module 'types'>":
					print( "	assert( %s == types )" % var )
				else:
					for t in special_tests[ expression ]:
						print( "	assert( %s )" % t.replace( "$v", var ) )
	
	print()
	print( "$ $BURN --tolerant %s.burn" % name )

print( file=sys.stderr )
