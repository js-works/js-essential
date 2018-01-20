/**
 * Class as representation of a lazy sequence
 *
 * IMPORTANT: This implementation has been abandoned! It is based heavily
 *            on ES2015 generator functions, which turned out to be very
 *            slow. That's why this implementation has been replaced by
 *            a different, non-generator implementation of class Seq.
 * 
 * License: Public Domain
 * 
 * @class Seq
 * @ignore
 */
export default class Seq {
    /**
     * @ignore
     */
    constructor(generator) {
        throw new Error('[Seq.constructor] Constructor is not callable '
            + '- use static factory methods instead');
    }

    toString() {
        return 'Seq/instance';
    }

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

        return Seq.from(function* () {
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

        return Seq.from(function* () {
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

        return Seq.from(function* () {
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

        return Seq.from(function* () {
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
        } else if (typeof items === 'string' || items instanceof Array) {
            ret = Seq.from(function* () {
                for (let i = 0; i < items.length; ++i) {
                    yield items[i];
                }
            });
        } else if (items && typeof items[iteratorSymbol] === 'function') {
            ret = Seq.from(() => items[iteratorSymbol]());
        } else if (typeof items === 'function') {
            ret = Object.create(Seq.prototype);
            ret[iteratorSymbol] = createGeneratorFunction(items);
        } else {
            ret = emptySeq;
        }

        return ret;
    }

    static concat(...seqs) {
        return Seq.flatten(Seq.from(seqs));
    }

    static flatten(seqOfSeqs) {
        const outerSeqs = Seq.from(seqOfSeqs);

        return Seq.from(function* () {
            for (const seq of outerSeqs) {
                yield* Seq.from(seq);
            }
        });
    }

    static iterate(initialValues, f) {
        const initVals = initialValues.slice();

        return Seq.from(function* () {
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
        const typeOfObj = typeof obj;

        return !!obj
            && (typeOfObj === 'object' || typeOfObj === 'string')
            && (typeof obj[iteratorSymbol] === 'function'
                || obj instanceof Array);
    }

    static isSeqableObject(obj) {
        return !!obj
            && typeof obj === 'object'
            && (typeof obj[iteratorSymbol] === 'function'
                || obj instanceof Array);
    }
}

function createGeneratorFunction(generator) {
    return function* () {
        let result = generator();

        const
            typeOfResult = typeof result,
            resultIsObject = typeOfResult === 'object',
            resultIsFunction = typeOfResult === 'function';

        if (resultIsObject && typeof result.next === 'function') {
            const next = () => result.next();

            let item = next();

            while (item && !item.done) {
                yield item.value;

                item = next();
            }
        } else if (resultIsFunction) {
            const generate = result;
            let values = generate();

            while (values instanceof Array && values.length > 0) {
                yield* values;
                values = generate();
            }
        } else if (typeof result.generate === 'function') {
            const
                generate = result.generate,
                finalize = result.finalize;

            try {
                let values = generate();

                while (values instanceof Array) {
                    yield* values;
                    values = generate();
                }
            } finally {
                if (typeof finalize === 'function') {
                    finalize();
                }
            }
        }
    };
}

// --- locals -------------------------------------------------------

const
    iteratorSymbol = typeof Symbol === 'function' && Symbol.iterator
        ? Symbol.iterator
        : '@@iterator',

    emptySeq = Seq.from(function* () {});
