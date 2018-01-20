/**
 * Class as representation of a lazy sequences
 *
 * License: Public Domain
 * 
 * @class Seq
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
        let ret = dummy;

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

        const [next, finalize] = iterate(this);

        try {
            let item;

            do {
                item = next();

                if (item !== endOfSeq) {
                    action(item, idx++)
                }
            } while (item !== endOfSeq);
        } finally {
            finalize();
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
        let ret;

        if (items instanceof Seq) {
            ret = items;
        } else if (typeof items === 'string' || items instanceof Array) {
            ret = createSeq(() => {
                let index = 0;

                return () => index < items.length ? items[index++] : endOfSeq;
            });
        } else if (items && typeof items[iteratorSymbol] === 'function') {
            ret = Seq.from(() => items[iteratorSymbol]());
        } else if (typeof items === 'function') {
            ret = createSeq(() => {
                const
                    result = items(),
                    typeofResult = typeof result,
                    
                    resultIsObject =
                        result !== null && typeofResult === 'object',

                    isEcmaScriptIterator = resultIsObject
                        && typeof result.next === 'function',

                    isSimpleIterator = typeof result === 'function',

                    isAdvancedIterator =
                        resultIsObject
                            && !isEcmaScriptIterator
                            && typeof result.generate === 'function';

                let
                    itemQueue = null,
                    generate = null,
                    finalize = null;

                if (isEcmaScriptIterator) {
                    generate = () => result.next();
                } else if (isSimpleIterator) {
                    generate = result;
                } else if (isAdvancedIterator) {
                    generate = result.generate;

                    if (typeof result.finalize === 'function') {
                        finalize = result.finalize;
                    }
                }

                function next() {
                    let item;

                    if (isEcmaScriptIterator) {
                        const token = generate();

                        item = token.done ? endOfSeq : token.value;
                    } else if (!isSimpleIterator && !isAdvancedIterator) {
                        item = endOfSeq;
                    } else {
                        if (itemQueue !== null) {
                            item = itemQueue.shift();

                            if (itemQueue.length === 0) {
                                itemQueue = null;
                            }
                        } else {
                            do {
                                itemQueue = generate();
                            } while (itemQueue instanceof Array
                                && itemQueue.length === 0);

                            if (!(itemQueue instanceof Array)) {
                                itemQueue = null;
                                item = endOfSeq;
                            } else {
                                if (itemQueue.length === 1) {
                                    item = itemQueue[0];
                                    itemQueue = null;
                                } else {
                                    item = itemQueue.shift();
                                }
                            }
                        }
                    }

                    return item;
                };

                return [next, finalize];
            });
        } else {
            ret = emptySeq;
        }

        return ret;
    }

    static concat(...seqs) {
        return Seq.flatten(Seq.from(seqs));
    }

    static flatten(seqOfSeqs) {
        return createSeq(() => {
            const [outerGenerate, outerFinalize] =
                iterate(Seq.from(seqOfSeqs));

            let
                innerGenerate = null,
                innerFinalize = null;

            function next() {
                let innerResult = endOfSeq;

                while (innerResult === endOfSeq) {
                    if (innerGenerate === null) {
                        let outerResult = outerGenerate();
                        
                        if (outerResult === endOfSeq) {
                            return endOfSeq;
                        }

                        [innerGenerate, innerFinalize] =
                            iterate(Seq.from(outerResult));
                    }

                    innerResult = innerGenerate();

                    if (innerResult === endOfSeq) {
                        innerFinalize();

                        innerGenerate = null;
                        innerFinalize = null;
                    }
                }

                return innerResult;
            };

            function finalize() {
                if (innerFinalize) {
                    innerFinalize();
                }

                if (outerFinalize) {
                    outerFinalize();
                }
            }

            return [next, finalize];
        });
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
        return !!obj && typeof obj[iteratorSymbol] === 'function';
    }

    static isSeqableObject(obj) {
        return !!obj
            && typeof obj === 'object'
            && typeof obj[iteratorSymbol] === 'function';
    }
}

// --- locals -------------------------------------------------------

const
    endOfSeq = Object.freeze({}),
    doNothing = () => {},
    endSequencing = () => endOfSeq,

    iteratorSymbol = typeof Symbol === 'function' && Symbol.iterator
        ? Symbol.iterator
        : '@@iterator',
    
    emptySeq = createSeq(() => [endSequencing, doNothing]);
    

Seq.prototype[iteratorSymbol] = function () {
    const [generate, finalize] = iterate(this);

    let done = false;

    return {
        next() {
            if (done) {
                return { value: undefined, done: true};
            }

            let item;

            try {
                item = generate();
            } catch(e) {
                finalize();
                throw e;
            }

            if (item === endOfSeq) {
                done = true;
                finalize();
            }
            
            return item === endOfSeq
                ? { value: undefined, done: true }
                : { value: item, done: false };
        }
    };
};


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
        const result = seq.__generator();
        
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
