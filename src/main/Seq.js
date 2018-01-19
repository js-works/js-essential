// poor and simply Symbol polyfill
if (typeof Symbol !== 'function' || !Symbol.iterator) {
    Symbol = { iterator: '@@iterator' };
}

/**
 * Class as representation of a lazy sequences
 *
 * License: Public Domain
 * 
 * @class Seq
 */
export default class Seq {
    /**
     * @class Seq
     * @constructor
     * @param {function} generator The generator responsible for the iteration
     */
    constructor(generator) {
        throw new Error('[Seq.constructor] Constructor is private '
            + '- clas Seq is final');
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
        const [next, finalize] = iterate(this);

        return {
            next() {
                let ret, item;

                try {
                    item = next();
                } catch (e) {
                    finalize();
                    throw e;
                }

                if (item === endOfSeq) {
                    ret = { value: undefined, done: true};
                } else {
                    ret = { value: item, done: false };
                    finalize();
                }

                return ret;
            }
        };
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

        return createSeq(() => {
            const [generate, finalize] = iterate(this);
          
            let idx = -1;
          
            const next = () => {
                let item = generate();
              
                return item === endOfSeq
                    ? endOfSeq
                    : f(item, ++idx);
            };
            
            return [next, finalize];
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

        return createSeq(() => {
            const [generate, finalize] = iterate(this);
          
            let idx = -1;
          
            const next = () => {
                let item = generate();

                while (item !== endOfSeq && !pred(item, ++idx)) {
                    item = generate();
                }

                return item;
            };

            return [next, finalize];
        });
    }

    flatMap(f) {
        return Seq.flatten(this.map(f));
    }

    takeWhile(pred)  {
        if (typeof pred !== 'function') {
            throw new TypeError('Seq.filter: Alleged predicate is not really a function')
        }

        return createSeq(() => {
            const [generate, finalize] = iterate(this);

            let idx = -1;

            const next = () => {
                const item = generate();

                return item === endOfSeq || pred(item, ++idx) 
                    ? item
                    : endOfSeq;
            };

            return  [next, finalize];
        });
    }

    skipWhile(pred)  {
        if (typeof pred !== 'function') {
            throw new TypeError('Seq.filter: Alleged predicate is not really a function')
        }

        return createSeq(() => {
            const [generate, finalize] = iterate(this);

            let
                idx = -1,
                hasStarted = false;

            const next = () => {
                let ret;

                let item = generate();

                if (!hasStarted) {
                    while (item !== endOfSeq && pred(item, ++idx)) {
                        item = generate();
                    }

                    hasStarted = item !== endOfSeq;
                }

                return item;
            };

            return  [next, finalize];
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
        const ret = [];

        this.forEach(item => ret.push(item));

        return ret;
    }

    force() {
        return Seq.from(this.toArray());
    }

    static toString() {
        return 'Seq/class';
    }

    static empty() {
        return emptySeq;
    }

    static of(...items) {
        return Seq.from(items);
    }

    static from(items) {
        var ret;

        if (items instanceof Seq) {
            ret = items;
        } else if (Array.isArray(items) || typeof items === 'string') {
            ret = createSeq(() => {
                let index = 0;

                return () => index < items.length ? items[index++] : endOfSeq;
            });
        } else if (items && typeof items[Symbol.iterator] === 'function') {
            let generator = items[Symbol.iterator];


            ret = createSeq(() => {
                let generate = generator();

                if (generate
                    && typeof generate === 'object'
                    && typeof generate._invoke === 'function') {

                    generate = generate._invoke;
                }

                const next = () => {
                        const item = generate();

                        return item.done ? endOfSeq : item.value;
                    };

                return [next, doNothing];
            });
        } else if (isGeneratorFunction(items)) {
            ret = Seq.from({ [Symbol.iterator]: items });
        } else if (typeof items === 'function') {
            ret = createSeq(() => {
                let
                    generate = items(),
                    finalize = doNothing,
                    nextItems = null;

                if (typeof generate === 'object') {
                    if (generate.finalize !== undefined
                        && generate.finalize !== null) {
                        
                        finalize = generate.finalize;
                    }

                    generate = generate.generate;
                }

                if (typeof generate !== 'function'
                    && typeof finalize !== 'function') {
                
                    throw new Error('[Seq] Invalid sequencer');
                }

                const next = () => {
                    let itemsReceived = false;

                    if (nextItems === null) {

                        do {
                            nextItems = generate();

                            if (nextItems !== null && !(nextItems instanceof Array)) {
                                throw new Error('[Seq] Invalid sequencer return value');
                            }

                            if (nextItems === null) {
                                return endOfSeq;
                            } else if (nextItems.length > 0) {
                                itemsReceived = true;
                            }
                        } while (!itemsReceived);
                    }

                    if (nextItems.length === 1) {
                        const item = nextItems[0];
                        nextItems = null;
                        return item;
                    } else {
                        const item = nextItems.shift();
                        return item;
                    }
                }

                return [next, finalize]
            });
        } else {
            ret = Seq.empty();
        }

        return ret;
    }

    static concat(...seqs) {
        return Seq.flatten(Seq.from(seqs));
    }

    static flatten(seqOfSeqs) {
        return new Seq.from(function* () {
            for (const seq of Seq.from(seqOfSeqs)) {
                for (const item of Seq.from(seq)) {
                    yield item;
                }
            }
        });
/*
        return createSeq(() => {
            const [outerGenerate, outerFinalize] = iterate(this);

            let
                outerSeq = null,
                innerSeq = null,

            function next() {
                if (outerSeq === null) {
                    const outerItem = outerGenerate();

                    if (outerItem === endOfSeq) {
                        return endOfSeq;
                    }
                   
                    outerSeq = Seq.from(outerItem);
                }

                if (innerSeq === null) {

                }
                
            };

            return [next, finalize];
        });
*/
    }

    static iterate(initialValues, f) {
        const initVals = initialValues.slice();

        return createSeq(() => {
            const values = initVals.slice();

            return () => {
                values.push(f.apply(null, values));
                return values.shift();
            }
        });
    }

    static repeat(value, n = Infinity) {
        return Seq.iterate([value], value => value).take(n);
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

    static isNonStringSeqable(obj) {
        return (typeof obj !== 'string'
            && !(obj instanceof String) && Seq.isSeqable(obj));
    }
}

// --- locals -------------------------------------------------------

const
    endOfSeq = Object.freeze({}),
    GeneratorFunction = Object.getPrototypeOf(function* () {}).constructor,
    doNothing = () => {},
    endSequencing = () => endOfSeq,
    emptySeq = createSeq(() => [endSequencing, doNothing]);

function isGeneratorFunction(fn) {
    return fn instanceof GeneratorFunction;
}

function createSeq(generator) {
    const ret = Object.create(Seq.prototype);
    ret.__generator = generator;
    return ret;
}

function iterate(seq) {
    let ret;

    if (!seq || typeof seq.__generator !== 'function') {
        ret = [endSequencing, doNothing];
    } else {
        const result = seq.__generator(endOfSeq);
        
        if (Array.isArray(result)) {
            const
                next = result[0] || endSequencing,
                finalize = result[1] || doNothing;

            ret = [next, finalize];
        } else if (typeof result === 'function') {
            ret = [result, doNothing];
        } else {
            ret = [endSequencing, doNothing];
        }
    }

    return ret;
}
