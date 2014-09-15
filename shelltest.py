#!/usr/bin/env python3
import sys
import os
import subprocess
import tempfile
import shutil
import re
from difflib import Differ

COLOR_RESET = "\033[0m"
COLOR_BOLD = "\033[1m"
COLOR_RED = "\033[31m"
COLOR_YELLOW = "\033[33m"
COLOR_BLUE = "\033[34m"
COLOR_GREEN = "\033[32m"
COLOR_GRAY = "\033[37m"

def main():
	try:
		global n_passed
		global n_failed
		n_passed = 0
		n_failed = 0
		
		for arg in sys.argv[1:]:
			scan( arg )
		
	except KeyboardInterrupt:
		print( "*** INTERRUPTED ***" )
	
	print()
	print( "%s%s%s/%s%s" % ( COLOR_RED if n_failed else COLOR_GREEN, COLOR_BOLD, n_passed, n_passed + n_failed, COLOR_RESET ) )
	print()

def scan( x ):
	if os.path.isdir( x ):
		for f in sorted( os.listdir( x ) ):
			scan( os.path.join( x, f ) )
	elif x.endswith( ".shelltest" ):
		run( x )

def run( filename ):
	
	wd = tempfile.mkdtemp()
	
	global n_passed, n_failed
	
	try:
		
		print()
		print( "%s%s%s" % ( COLOR_BOLD, filename, COLOR_RESET ) )
		
		lines = [ line.rstrip( "\n" ) for line in open( filename ).readlines() ]
		
		i = 0
		while i < len( lines ):
			line = lines[i]
			i += 1
			
			if line.strip() == "" or line.startswith( "//" ):
				continue
			
			statement = line
			statement_lineno = i
			
			body = []
			while i < len( lines ) and lines[i].startswith( "\t" ):
				body.append( lines[i][1:] )
				i += 1
			
			if statement.startswith( "$" ):
				
				command = statement[1:].strip()
				print( "    %s$ %s%s" % ( COLOR_GRAY, command, COLOR_RESET ) )
				
				process = subprocess.Popen(
					command,
					stdout = subprocess.PIPE,
					stderr = subprocess.PIPE,
					shell = True,
					executable = "/bin/bash",
					cwd = wd
				)
				
				exit_status = process.wait( 5 )
				stdout = process.stdout.read().decode( "utf-8" )
				stderr = process.stderr.read().decode( "utf-8" )
				
				passed = True
				exit_status_checked = False
				
				j = 0
				while j < len( body ):
					line = body[j]
					j += 1
					
					if line == "* exit status nonzero":
						ok = exit_status != 0
						if not ok:
							print( " "*8 + "%s%s%s" % ( COLOR_RED, line, COLOR_RESET ) )
						passed = passed and ok
						exit_status_checked = True
					
					elif re.match( "^\* stdout$", line ):
						expected = ""
						while j < len( body ) and body[j].startswith( "\t" ):
							expected += body[j][1:] + "\n"
							j += 1
						ok = expected == stdout
						if not ok:
							print( " "*8 + "%s* stdout%s" % ( COLOR_RED, COLOR_RESET ) )
							for line in Differ().compare( expected.splitlines(), stdout.splitlines() ):
								if line[0] != "?":
									print( " "*12 + line )
						passed = passed and ok
					
					elif re.match( "^\* stderr$", line ):
						expected = ""
						while j < len( body ) and body[j].startswith( "\t" ):
							expected += body[j][1:] + "\n"
							j += 1
						ok = expected == stderr
						if not ok:
							print( " "*8 + "%s* stderr%s" % ( COLOR_RED, COLOR_RESET ) )
							for line in Differ().compare( expected.splitlines(), stderr.splitlines() ):
								if line[0] != "?":
									print( " "*12 + line )
						passed = passed and ok
					
					elif re.match( "^\? exit status", line ):
						print( " "*8 + "%s? exit status%s" % ( COLOR_BLUE + COLOR_BOLD, COLOR_RESET ) )
						print( " "*12 + "%s" % exit_status )
					
					elif re.match( "^\? stdout", line ):
						print( " "*8 + "%s? stdout%s" % ( COLOR_BLUE + COLOR_BOLD, COLOR_RESET ) )
						for line in stdout.splitlines():
							print( " "*12 + line )
					
					elif re.match( "^\? stderr", line ):
						print( " "*8 + "%s? stderr%s" % ( COLOR_BLUE + COLOR_BOLD, COLOR_RESET ) )
						for line in stderr.splitlines():
							print( " "*12 + line )
					
					else:
						print( "%s: error parsing assertion/query at line %s" % ( sys.argv[0], statement_lineno+j ), file=sys.stderr )
						sys.exit( 1 )
				
				if not exit_status_checked:
					ok = exit_status == 0
					if not ok:
						print( " "*8 + "%s! exit status is %s%s" % ( COLOR_RED, exit_status, COLOR_RESET ) )
						for line in stderr.splitlines():
							print( " "*12 + line )
					passed = passed and ok
				
				n_passed += passed
				n_failed += not passed
			
			elif re.match( ".+:", statement ):
				filename = statement[:-1]
				assert not os.path.exists( filename )
				path = os.path.join( wd, statement[:-1] )
				if not os.path.exists( os.path.dirname( path ) ):
					os.makedirs( os.path.dirname( path ) )
				open( path, "w" ).write( "\n".join( body ) + "\n" )
			
			else:
				print( "%s: error parsing statement at line %s" % ( sys.argv[0], statement_lineno ), file=sys.stderr )
				sys.exit( 1 )
		
	finally:
		shutil.rmtree( wd )

main()
