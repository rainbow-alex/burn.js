strings.burn:
	print "foo"
	print "ぎ"

$ burn strings.burn
	* stdout
		foo
		ぎ

escape.burn:
	print "foo\\bar"
	print "foo\nbar"
	print "foo\tbar"
@todo more escape codes, unicode etc.

$ burn escape.burn
	* stdout
		foo\bar
		foo
		bar
		foo	bar
