#!/usr/bin/env python3
import sys
import subprocess

BINARY_OPS = [ "or", "and" ]
UNARY_OPS = [ "not" ]
VALUES = [ "true", "false", "0", "2", "4" ]

class EvalError (Exception):
	pass

def burn_eval( expressions ):
	source = "\n".join( "print " + e for e in expressions )
	process = subprocess.Popen(
		"burn --tolerant -",
		stdin = subprocess.PIPE,
		stdout = subprocess.PIPE,
		stderr = subprocess.PIPE,
		shell = True
	)
	process.stdin.write( source.encode( "utf-8" ) )
	process.stdin.close()
	exit_status = process.wait( 1 )
	stdout = process.stdout.read().decode( "utf-8" )
	if exit_status:
		raise EvalError()
	else:
		return stdout.strip().splitlines()

test_no = 0
def print_test( expressions, results ):
	global test_no
	test_no += 1
	if test_no > 1:
		print()
	print( "test%s.burn:" % test_no )
	for e in expressions:
		print( "	print %s" % e )
	print()
	print( "$ burn --tolerant test%s.burn" % test_no )
	print( "	* stdout" )
	for r in results:
		print( "		%s" % r )

class Break (Exception): pass

for op1 in BINARY_OPS:
	for op2 in BINARY_OPS:
		try:
			for v1 in VALUES:
				for v2 in VALUES:
					for v3 in VALUES:
						e1 = "( %s %s %s ) %s %s" % ( v1, op1, v2, op2, v3 )
						e2 = "%s %s ( %s %s %s )" % ( v1, op1, v2, op2, v3 )
						e = "%s %s %s %s %s" % ( v1, op1, v2, op2, v3 )
						r1, r2, r = burn_eval( ( e1, e2, e ) )
						if r1 != r2:
							print_test( (e1, e2, e), (r1, r2, r) )
							raise Break()
			else:
				assert op1 == op2
		except Break:
			continue

for op1 in UNARY_OPS:
	for op2 in BINARY_OPS:
		try:
			for v1 in VALUES:
				for v2 in VALUES:
					e1 = "( %s %s ) %s %s" % ( op1, v1, op2, v2 )
					e2 = "%s ( %s %s %s )" % ( op1, v1, op2, v2 )
					e = "%s %s %s %s" % ( op1, v1, op2, v2 )
					r1, r2, r = burn_eval( ( e1, e2, e ) )
					if r1 != r2:
						print_test( (e1, e2, e), (r1, r2, r) )
						raise Break()
			else:
				assert False
		except Break:
			continue
