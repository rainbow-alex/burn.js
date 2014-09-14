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

class BurnEvalError (Exception): pass

def create_test( expression, catch_type_error = True ):
	if catch_type_error:
		return "try { print %s } catch TypeError $e { print \"TypeError\" }\n" % expression
	else:
		return "print %s\n" % expression

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
	if exit_status != 0:
		raise BurnEvalError()
	stdout = process.stdout.read().decode( "utf-8" )
	return stdout

def eval_burn_expressions( expressions, imports ):
	return eval_burn( "".join( map( create_test, expressions ) ), imports ).splitlines()

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
	BinOp( "eq", "==" ),
	BinOp( "neq", "!=" ),
	BinOp( "lt", "<" ),
	BinOp( "gt", ">" ),
	BinOp( "lteq", "<=" ),
	BinOp( "gteq", ">=" ),
	BinOp( "add", "+" ),
	BinOp( "sub", "-" ),
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
# output helpers
#

stderr_newline = True

def stderr_print( text ):
	stderr_end_line()
	print( text, end="", file=sys.stderr )
	sys.stderr.flush()
	global stderr_newline
	stderr_newline = False

def stderr_tick():
	print( ".", end="", file=sys.stderr )
	sys.stderr.flush()
	global stderr_newline
	stderr_newline = False

def stderr_end_line():
	global stderr_newline
	if not stderr_newline:
		print( file=sys.stderr )
	stderr_newline = True

def print_test( name, source, stdout=None ):
	assert source
	print()
	print( "%s.burn:" % name )
	for l in source.splitlines():
		print( "\t%s" % l )
	print()
	print( "$ $BURN --tolerant %s.burn" % name )
	if stdout:
		print( "	* stdout" )
		for l in stdout.splitlines():
			print( "\t\t%s" % l )

#
# generating routines
#

class Break (Exception): pass

os.chdir( os.path.dirname( __file__ ) )
assert len( sys.argv ) >= 2

print( "// generated by `" + " ".join( sys.argv ) + "`" )

if sys.argv[1] == "result":
	assert len( sys.argv ) == 3
	
	op = get_op( sys.argv[2] )
	values = [
		"nothing",
		"true", "false",
		"0", "2", "-2",
		"0.0", "2.0",  "-0.5",
		"\"\"", "\"apple\"", "\"banana\"",
		"repr", "function(){}",
		"Something", "Type",
		"types", "errors",
	]
	
	# extra numbers to expose arithmetic operator edge cases
	if op.name in [ "add", "sub", "mul", "div" ]:
		values += [ "3", "8", "0.3", "0.33333333333", "0.7" ]
	
	types = [ "Nothing", "Boolean", "Integer", "Float", "String", "Function", "Module", "Type" ]
	
	if isinstance( op, BinOp ):
		def generate_tests():
			for i, v1 in zip( count(1), values ):
				stderr_tick()
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
		value_expressions = expressions
		type_expressions = []
		for e in expressions:
			type_expressions += [ "( %s ) is %s" % ( e, t ) for t in types ]
		value_outputs = eval_burn_expressions( value_expressions, [ "burn.types", "burn.errors" ] )
		type_outputs = eval_burn_expressions( type_expressions, [ "burn.types", "burn.errors" ] )
		source = "import burn.types\nimport burn.errors\n"
		for i in range( len( value_expressions ) ):
			expression = value_expressions[i]
			output = value_outputs[i]
			source += "\n"
			if output == "TypeError":
				source += "try { %s }\ncatch TypeError $e {}\nelse { assert( false ) }\n" % expression
			else:
				var = "$" + chr( 97 + i )
				type_ = types[ type_outputs[i*len(types):(i+1)*len(types)].index( "true" ) ]
				source += "let %s = %s\n" % ( var, expression )
				source += "assert( %s is %s )\n" % ( var, type_ )
				if type_ == "Nothing":
					pass
				elif type_ == "Boolean":
					source += "assert( %s == %s )\n" % ( var, output )
				elif type_ == "Integer":
					source += "assert( %s == %s )\n" % ( var, output )
				elif type_ == "Float":
					lower_bound = "%.4f" % ( round( float( output ), 4 ) - 0.0001 )
					upper_bound = "%.4f" % ( round( float( output ), 4 ) + 0.0001 )
					source += "assert( ( %s < %s ) and ( %s < %s ) )\n" % ( lower_bound, var, var, upper_bound )
				else:
					pass # TODO
		print_test( name, source )
	stderr_end_line()
	
elif sys.argv[1] == "precedence":
	assert len( sys.argv ) == 3
	
	op1 = get_op( sys.argv[2] )
	values = [ "true", "false", "0", "2", "4", "Something" ]
	
	if isinstance( op1, BinOp ):
		def generate_expressions( op1, op2 ):
			for v1 in values:
				for v2 in values:
					for v3 in values:
						e1 = "( %s %s %s ) %s %s" % ( v1, op1.symbol, v2, op2.symbol, v3 )
						e2 = "%s %s ( %s %s %s )" % ( v1, op1.symbol, v2, op2.symbol, v3 )
						e = "%s %s %s %s %s" % ( v1, op1.symbol, v2, op2.symbol, v3 )
						yield ( e1, e2, e )
	else:
		assert isinstance( op1, UnOp )
		def generate_expressions( op1, op2 ):
			for v1 in values:
				for v2 in values:
					e1 = "( %s %s ) %s %s" % ( op1.symbol, v1, op2.symbol, v2 )
					e2 = "%s ( %s %s %s )" % ( op1.symbol, v1, op2.symbol, v2 )
					e = "%s %s %s %s" % ( op1.symbol, v1, op2.symbol, v2 )
					yield ( e1, e2, e )
	
	for op2 in BINARY_OPS:
		stderr_print( "%s VS %s " % ( op1.symbol, op2.symbol ) )
		combinable = False
		for e1, e2, e in generate_expressions( op1, op2 ):
			stderr_tick()
			try:
				r1, r2, r = eval_burn_expressions( ( e1, e2, e ) )
			except BurnEvalError:
				pass
			else:
				combinable = True
				if r1 != r2:
					t1 = create_test( e1, catch_type_error = r1 == "TypeError" )
					t2 = create_test( e2, catch_type_error = r2 == "TypeError" )
					t = create_test( e, catch_type_error = r == "TypeError" )
					print_test(
						"%s_%s" % ( op1.name, op2.name ),
						t1 + t2 + t,
						"%s\n%s\n%s\n" % ( r1, r2, r )
					)
					break
		else:
			stderr_print( "no test found for %s and %s" % ( op1.symbol, op2.symbol ) )
		stderr_end_line()
	
else:
	assert False
