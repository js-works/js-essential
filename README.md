## js-prelude 

Note: This library is in alpha status. Do not use it in production yet.

"js-prelude" is a small JavaScript library providing a bunch of useful classes
to make daily JavaScript programming a bit more enjoyable.
This toolkit tries to observe the YAGNI principle ("You ain't gonna need it").
Means, that new features will only be added by the author as soon as he
needs them in daily work.
So, the toolkit will start as a quite "tiny" one and will grow to a "small"
toolkit in future - it will never become a "large" toolkit, as its main
purpose is to provide only really basic functionality.
Additional non-basic functionality will be provided in other projects,
not in this one.


### Current features of "js-prelude" 

- *Class "Seq"*:<br/>
  This class allows to iterate over collections and other iterable things
  in a very convenient way.
  Most stream operation will work lazily, means transforming streams
  does normally not result in copying the underlying data collections.
  This class is quite similar to 'java.util.stream.Seqs' from the Java world,
  seqs in the Clojure world, streams in Scheme and Scala or lazy lists in
  Haskell (although the implementation and behavior details might be different).
  Facebook provides a similar class also called "Seq" in the "Immutable.js" library
  (see [here](http://facebook.github.io/immutable-js/docs/#/Seq))

  With Seqs you can do things like the following:

    ```javascript
     Seq.from([1, 2, 3, 4, 5])
              .takeWhile(n => n < 5)
              .map(n => n * 2)
              .forEach(n => console.log(n))   // will output 2, 4, 6, 8

     Seq.iterate([1, 1], (n1, n2) => n1 + n2) // will calculate the first
              .take(7)                        // seven fibonacci numbers:
              .toArray()                      // [1, 1, 2, 3, 5, 8, 13]
    ```

- *Class "Objects":*<br/>
  Utility class with some static helper functions concerning objects.

- *Class "Strings":*<br/>
  Utility class with some static helper functions concerning strings.

- *Class "Arrays":*<br/>
  Utility class with some static helper functions concerning arrays.

### JavaScript support

"js-prelude" will support all ECMAScript 5 JavaScript engines, in particular all
modern browsers (IE >= 10) and server-side Node.

### Further information

For more information please refer to the "js-prelude" API documentation.<br/>
There you'll find detailed description of the available classes
and methods.<br/>
The API documentation also enables to have a direct look into main source code and
unit tests.
For each method, examples are provide to show the usage.
