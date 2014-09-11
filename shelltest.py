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
	
	global passed
	global failed
	passed = 0
	failed = 0
	
	i = 1
	while i < len( sys.argv ):
		arg = sys.argv[i]
		if arg == "--path":
			i += 1
			try:
				path = sys.argv[i]
				i += 1
			except IndexError:
				print( "%s: missing argument to --path" % sys.argv[0], file=sys.stderr )
				sys.exit( 1 )
			os.environ[ "PATH" ] = os.path.realpath( path ) + ":" + os.environ[ "PATH" ]
		else:
			break
	
	while i < len( sys.argv ):
		scan( sys.argv[i] )
		i += 1
	
	print()
	print( "%s%s%s/%s%s" % ( COLOR_GREEN if not failed else COLOR_RED, COLOR_BOLD, passed, passed + failed, COLOR_RESET ) )
	print()

def scan( x ):
	if os.path.isdir( x ):
		for f in sorted( os.listdir( x ) ):
			scan( os.path.join( x, f ) )
	elif x.endswith( ".shelltest" ):
		run( x )

def run( filename ):
	
	wd = tempfile.mkdtemp()
	
	global passed, failed
	
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
					cwd = wd
				)
				
				exit_status = process.wait( 5 )
				stdout = process.stdout.read().decode( "utf-8" )
				stderr = process.stderr.read().decode( "utf-8" )
				
				exit_status_checked = False
				
				j = 0
				while j < len( body ):
					line = body[j]
					j += 1
					
					if line == "* exit status zero":
						ok = exit_status == 0
						print( " "*8 + "%s%s%s" % ( COLOR_GREEN if ok else COLOR_RED, line, COLOR_RESET ) )
						passed += ok
						failed += not ok
						exit_status_checked = True
					
					elif line == "* exit status nonzero":
						ok = exit_status != 0
						print( " "*8 + "%s%s%s" % ( COLOR_GREEN if ok else COLOR_RED, line, COLOR_RESET ) )
						passed += ok
						failed += not ok
						exit_status_checked = True
					
					elif re.match( "^\* stdout$", line ):
						expected = ""
						while j < len( body ) and body[j].startswith( "\t" ):
							expected += body[j][1:] + "\n"
							j += 1
						ok = expected == stdout
						print( " "*8 + "%s* stdout%s" % ( COLOR_GREEN if ok else COLOR_RED, COLOR_RESET ) )
						if not ok:
							for line in Differ().compare( expected.splitlines(), stdout.splitlines() ):
								if line[0] != "?":
									print( " "*12 + line )
						passed += ok
						failed += not ok
					
					elif re.match( "^\* stderr$", line ):
						expected = ""
						while j < len( body ) and body[j].startswith( "\t" ):
							expected += body[j][1:] + "\n"
							j += 1
						ok = expected == stderr
						print( " "*8 + "%s* stderr%s" % ( COLOR_GREEN if ok else COLOR_RED, COLOR_RESET ) )
						if not ok:
							for line in Differ().compare( expected.splitlines(), stderr.splitlines() ):
								if line[0] != "?":
									print( " "*12 + line )
						passed += ok
						failed += not ok
					
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
				
				if not exit_status_checked and exit_status != 0:
					print( " "*8 + "%s! exit status is %s%s" % ( COLOR_RED, exit_status, COLOR_RESET ) )
					for line in stderr.splitlines():
						print( " "*12 + line )
					failed += 1
			
			elif re.match( ".+:", statement ):
				filename = statement[:-1]
				path = os.path.join( wd, statement[:-1] )
				if not os.path.exists( os.path.dirname( path ) ):
					os.makedirs( os.path.dirname( path ) )
				open( path, "w" ).write( "\n".join( body ) + "\n" )
			
			elif statement.startswith( "@todo " ):
				print( "    %s@todo %s%s" % ( COLOR_YELLOW, statement[6:], COLOR_RESET ) )
			
			else:
				print( "%s: error parsing statement at line %s" % ( sys.argv[0], statement_lineno ), file=sys.stderr )
				sys.exit( 1 )
		
	finally:
		shutil.rmtree( wd )

main()