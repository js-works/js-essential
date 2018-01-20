/**
 * Class as representation of a lazy sequences
 *
 * License: Public Domain
 * 
 * @class Seq
 * @ignore
 */
export default class Seq {
    /**
     * @class Seq
     * @constructor
     * @param {function} generator The generator responsible for the iteration
     */
    constructor(generator) {
        /**
         * @ignore
         * @private
         */
        this.__generator = generator;
    }

    toString() {
        return 'Seq/instance';
    }

    /**
     * Generates a new ECMAScript 6 iterator to enumerate the items of the
     * sequence.
     * This allows the usage of sequences in "for ... of" loops or with
     * the spread operator (...).
     * 
     * @example
     *      let myIterator = mySeq[Symbol.iterator]();
     *
     * @example
     *      for (let item of k) {
     *          console.log(item);
     *      } 
     *
     * @example
     *      let args = Seq.of(arg1, arg2, arg3);
     * 
     *      let result = f(...args);
     */
    [Symbol.iterator]() {
        const iter = this.__generator();
        var ret;

        if (iter && typeof iter.next === 'function') {
            ret = iter;
        } else if (typeof iter === 'function') {
            return function* () {
                let values = iter();

                while (values instanceof Array && values.length > 0) {
                    yield* values;
                    values = iter();
                }
            }();
        } else {
            throw new TypeError();
        }

        return ret;
    };

    /**
     * Maps each value of the seq
     *
     * @method Seq.map
     * @param {function} f Mapping function
     * @return {Seq} Seq of the mapped values
     */
    map(f) {
        if (typeof f !== 'function') {
            throw new TypeError('Seq.map: Alleged mapping function is not really a function')
        }

        const self = this;

        return new Seq(function* () {
            let index = 0;

            for (let x of self) {
                yield f(x, index++);
            }
        });
    }

    /**
     * Filters items of a sequence by a given predicate.
     * 
     * @param {function} pred The predicate function
     * @return {Seq} Sequence of the filtered items
     * 
     * @example
     *   let items = Seq.of(1, 2, 4, 8, 16, 32);
     *   let result = items.filter(x => x < 10);
     *   // 1, 2, 4, 8
     */ 
    filter(pred) {
        if (typeof pred !== 'function') {
            throw new TypeError('Seq.filter: Alleged predicate is not really a function')
        }

        const self = this;

        return new Seq(function* () {
            let index = 0;

            for (let x of self) {
                if (pred(x, index++)) {
                    yield x;
                }
            }
        });
    }

    flatMap(f) {
        return Seq.flatten(this.map(f));
    }

    takeWhile(pred)  {
        if (typeof pred !== 'function') {
            throw new TypeError('Seq.filter: Alleged predicate is not really a function')
        }

        const self = this;

        return new Seq(function* () {
            let index = 0;

            for (let x of self) {
                if (pred(x, index++)) {
                    yield x;
                } else {
                    break;
                }
            }
        });
    }

    skipWhile(pred)  {
        if (typeof pred !== 'function') {
            throw new TypeError('Seq.filter: Alleged predicate is not really a function')
        }

        const self = this;

        return new Seq(function* () {
            let index = 0,
                alreadyStarted = false;

            for (let x of self) {
                if (alreadyStarted || !pred(x, index++)) {
                    yield x;
                    alreadyStarted = true
                }
            }
        });
    }

    take(n) {
        return this.takeWhile((x, index) => index < n);
    }

    skip(n) {
        return this.skipWhile((x, index) => index < n);
    }

    reduce(f, seed) {
        if (typeof f !== 'function') {
            throw new TypeError('Seq.filter: Alleged function is not really a function')
        }

        const dummy = {};
        var ret = dummy;

        this.forEach((value, index) => {
            if (index == 0) {
                if (seed === undefined) {
                    ret = value;
                } else {
                    ret = f(seed, value, 0);
                }
            } else {
                ret = f(ret, value);
            }
        });

        if (ret === dummy) {
            if (seed !== undefined) {
                ret = seed;
            } else {
                new TypeError();
            }
        }

        return ret;
    }

    count() {
        return this.reduce((count, value) => count + 1, 0);
    }

    forEach(action) {
        if (typeof action !== 'function') {
            throw new TypeError('Seq.forEach: Alleged action is not really a function')
        }

        let idx = 0;

        for (let item of this) {
            action(item, idx++)
        }
    }

    toArray() {
        return this.reduce((arr, value) => {
            arr.push(value);
            return arr;
        }, []);
    }

    force() {
        return Seq.from(this.toArray());
    }

    static toString() {
        return 'Seq/class';
    }

    static empty() {
        return Seq.of();
    }

    static of(...items) {
        return Seq.from(items);
    }

    static from(items) {
        var ret;

        if (items instanceof Seq) {
            ret = items;
        } else if (items && typeof items[Symbol.iterator] === 'function') {
            ret = new Seq(() => items[Symbol.iterator]());
        } else if (typeof items === 'function') {
            ret = new Seq(function* () {
                const result = items();

                if (typeof result === 'function') {
                    let items = result();

                    while (Array.isArray(items)) {
                        yield* items;

                        items = result();
                    }
                } else if (result && result.generate) {
                    const { generate, finalize } = result;

                    try {
                        let items = generate();

                        while (Array.isArray(items)) {
                            yield* items;

                            items = generate();
                        }
                    } finally {
                        if (finalize) {
                            finalize();
                        }
                    }
                } else {
                    const iter =
                        typeof result === 'function'
                            ? result
                            : result._invoke.bind(iter);

                    let item;

                    do {
                        item = iter();

                        if (!item.done) {
                            yield item.value;
                        }
                    } while (!item.done);
                }
            })
        } else {
            ret = Seq.empty();
        }

        return ret;
    }

    static concat(...seqs) {
        return Seq.flatten(Seq.from(seqs));
    }

    static flatten(seqOfSeqs) {
        return new Seq(function* () {
            for (const seq of Seq.from(seqOfSeqs)) {
                yield* Seq.from(seq);
            }
        });
    }

    static iterate(initialValues, f) {
        const initVals = initialValues.slice();

        return new Seq(function* () {
            const values = initVals.slice();

            while (true) {
                values.push(f(...values));
                yield values.shift();
            }
        });
    }

    static repeat(value, n = Infinity) {
        return Seq.from(function* () {
            for (let i = 0; i < n; ++i) {
                yield value;
            }
        });
    }

    /**
     * Creates a seq of numeric values from a start value (including) to
     * an end value (excluding).
     *
     * @example
     *     Seq.range(1, 10)      // 1, 2, 3, 4, 5, 6, 7, 8, 9
     *     Seq.range(0, -8, -2)  // 0, -2, -4, -6
     *
     * @method Seq.range
     * @param {Number} start Start value
     * @param {Number} end End value
     * @return {Seq} Seq of iterated values
     */
    static range(start, end = null, step = 1) {
        let ret =  Seq.iterate([start], value => value += step);

        if (end !== undefined && end !== null) {
           const pred = step < 0 ? (n => n > end) : (n => n < end);

            ret = ret.takeWhile(pred);
        }

        return ret;
    }

    static isSeqable(obj) {
        return !!obj && (typeof obj[Symbol.iterator] === 'function');
    }

    static isSeqableObject(obj) {
        return !!obj
            && typeof obj === 'object'
            && typeof obj[Symbol.iterator] === 'function';
    }
}
