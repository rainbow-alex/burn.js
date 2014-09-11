This is an implementation of [burn](http://www.github.com/rainbow-alex/burn), a light-weight, general-purpose programming language, in Javascript.
It is intended as a reference implementation. It is also a relatively painless way to experiment with the language's design.

```
node --harmony src/bin/burn.js examples/hello_world.burn
```

There is another, outdated implementation of burn at [rainbow-alex/burn](http://www.github.com/rainbow-alex/burn)
which will (hopefully) reach production quality some day.

## Dependencies ##

You will need node.js (>=0.10) with [fibers](https://github.com/laverdet/node-fibers/) (>=1.0) to run `burn.js`.

You will need python 3 to run the tests.

## Implementation ##

`burn.js` transpiles burn sourcecode to javascript and `eval`s it immediately.
Little effort is made to make this implementation useful or performant.

## Tests ##

The tests in `tests/` verify that the core language and builtin modules work correctly.
Run all these tests by executing `make tests`.
Other implementations of burn should pass this suite.

The tests in `tests_extra/` check additional features that are not required or might differ per implementation.
This includes error message details, stack traces, lint messages, ...
It only makes sense to run this suite for this implementation.

You can run individual parts of either suite with `./shelltest.py --path tests/bin/ [path ...]`.
If you want to run tests against another implementation, use `./shelltest.py --path basedir/`,
where `basedir/` is a directory containg the `burn` executable that should be used.