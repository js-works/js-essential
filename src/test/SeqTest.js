// License: Public domain

import { describe, it } from 'mocha';
import { expect } from 'chai';
//import Seq from '../../src/main/Seq';
import Seq from '../../src/main/Seq-generator-based';

/**
 * @test {Seq.empty}
 */
describe('Testing static factory method Seq.empty', () => {
    it('should return an empty seq', () =>
        expect(Seq.empty().toArray())
                .to.eql([])
    );
});

/**
 * @test {Seq.of}
 */
describe('Testing static factory method Seq.of', () => {
    it('should create a seq from a some given items', () =>
        expect(Seq.of(2, 4, 6)
                .toArray())
                .to.eql([2, 4, 6])
    );

    it('should return an empty seq if no item is provided', () =>
        expect(Seq.of()
                .toArray())
                .to.eql([])
    );
});

/**
 * @test {Seq.empty}
 */
describe('Testing static factory method Seq.from', () => {
    it('should create a seq from an iterable object (=> object[Symbol.iterator])', () =>
        expect(Seq.from([2, 4, 6])
                .toArray())
                .to.eql([2, 4, 6])
    );

    it('should return a seq of characters if a string is given as input', () =>
        expect(Seq.from('Hello').toArray())
                .to.eql(['H', 'e', 'l', 'l', 'o'])
    );

    it('should return the same seq if a seq is given as input', () => {
        const seq = Seq.of(2, 4, 6);

        expect(Seq.from(seq))
                .to.equal(seq);
    });

    it('should return an empty seq if the input is not seqable', () =>
        [undefined, null, true, false, {prop: 42}].forEach(value =>
                expect(Seq.from(value).count()).to.eql(0))
    );

    it('should create a Seq from a generator function', () => {
        const seq = Seq.from(function * () {
            yield 1;
            yield 2;
            yield 3;
        });

        expect(seq.toArray()).to.eql([1, 2, 3]);
    });
    
    it('should create a Seqs using non-generator iterators (variant 1)', () => {
        const seq = Seq.from(() => {
            let counter = 0;

            return () => counter < 5 ? [counter, counter++] : null;
        });

        expect(seq.toArray()).to.eql([0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
    });

    it('should create a Seqs using non-generator iterators (variant 2)', () => {
        let isFinalized = false;

        const seq = Seq.from(endOfSeq => {
            let counter = 0;

            return {
                generate: () => counter < 5 ? [counter++] : null,
                finalize: () => isFinalized = true
            };
        });

        expect(seq.toArray()).to.eql([0, 1, 2, 3, 4]);
        expect(isFinalized).to.equal(true);
    });
});

/**
 * @test {Seq.concat}
 */
describe('Testing static method Seq.concat', () => {
    it ('should concatenate multiple seqs', () =>
        expect(Seq.concat(Seq.of(1, 2, 3), Seq.of(44, 55, 66)).toArray())
                .to.eql([1, 2, 3, 44, 55, 66])
    );

    it ('should concatenate multiple seqables', () =>
        expect(Seq.concat([1, 2, 3], Seq.of(44, 55, 66)).toArray())
                .to.eql([1, 2, 3, 44, 55, 66])
    );

    it ('should concatenate empty seqs to an empty seq', () =>
        expect(Seq.concat(Seq.empty(), Seq.from([])).toArray())
                .to.eql([])
    );

    it ('should concatenate empty seqables to an empty seq', () =>
        expect(Seq.concat([], Seq.from([])).toArray())
                .to.eql([])
    );
});

/**
 * @test {Seq.flatten}
 */
describe('Testing static method Seq.flatten', () => {
    it ('should flatten a seq of seqs to a concatenated seq', () =>
        expect(Seq.flatten(Seq.of(Seq.of(1, 2, 3), Seq.of(44, 55, 66))).toArray())
                .to.eql([1, 2, 3, 44, 55, 66])
    );

    it ('should flatten a seq of seqables to a concatenated seq', () =>
        expect(Seq.flatten(Seq.of([1, 2, 3], [44, 55, 66])).toArray())
                .to.eql([1, 2, 3, 44, 55, 66])
    );

    it ('should flatten a seqable of seqables to a concatenated seq', () =>
        expect(Seq.flatten([[1, 2, 3], [44, 55, 66]]).toArray())
                .to.eql([1, 2, 3, 44, 55, 66])
    );

    it ('should flatten an empty seq to an empty seq', () =>
        expect(Seq.flatten(Seq.empty()).count())
                .to.eql(0)
    );

    it ('should fllatten an empty seqable to an empty seq', () =>
        expect(Seq.flatten([]).toArray())
                .to.eql([])
    );
})
/**
 * @test {Seq.iterate}
 */
describe('Testing static factory method Seq.iterate', () => {
    it('should build seq of natural numbers', () =>
        expect(Seq.iterate([1], (n) => n + 1)
                .take(5)
                .toArray())
                .to.eql([1, 2, 3, 4, 5])
    );

    it('should build seq of fibonacci numbers', () =>
        expect(Seq.iterate([1, 1], (n1, n2) => n1 + n2)
                .take(7)
                .toArray())
                .to.eql([1, 1, 2, 3, 5, 8, 13])
    );
});

/**
 * @test {Seq.repeat}
 */
describe('Testing static factory method Seq.repeat', () => {
    it('should generate a seq 4 zeros', () =>
        expect(Seq.repeat(0, 4)
                .toArray())
                .to.eql([0, 0, 0, 0])
    );
});

/**
 * @test {Seq.range}
 */
describe('Testing static factory method Seq.range', () => {
    it('should generate a seq of the first five natural numbers', () =>
        expect(Seq.range(1, 5)
                .toArray())
                .to.eql([1, 2, 3, 4])
    );

    it('should generate a seq of some succeeding even negative natural numbers', () =>
        expect(Seq.range(-2, -10, -2)
                .toArray())
                .to.eql([-2, -4, -6, -8])
    );

    it('should support infinite ranges of positive number', () =>
        expect(Seq.range(1)
                .take(2000)
                .count())
                .to.eql(2000)
    );

    it('should support infinite ranges of negative number', () =>
        expect(Seq.range(-1, -Infinity, -1)
                .take(2000)
                .count())
                .to.eql(2000)
    );
});

/**
 * @test {Seq.isSeqable}
 */
describe('Testing static method Seq.isSeqable', () => {
    it('should determine whether or not an object is seqable', () => {
        const f = Seq.isSeqable;

        expect([f(undefined), f(null), f(true), f(42), f([]), f([1, 2]), f('some text'), f(Seq.empty())])
                .to.eql([false, false, false, false, true, true, true, true]);
    });
});

/**
 * @test {Seq.isSeqableObject}
 */
describe('Testing static method Seq.isSeqableObject', () => {
    it('should determine whether or not an object is seqable and not a string', () => {
        const f = Seq.isSeqableObject;

        expect([f(undefined), f(null), f(true), f(42), f([]), f([1, 2]), f('some text'), f(Seq.empty())])
                .to.eql([false, false, false, false, true, true, false, true]);
    });
});
/**
 * @test {Seq#map}
 */
describe('Testing method Seq#map', () => {
    it('should map integer values to their square numbers', () =>
        expect(Seq.of(1, 2, 3)
                .map(n => n * n)
                .toArray())
                .to.eql([1, 4, 9])
    );

    it('should map empty Seqs to empty seqs', () =>
        expect(Seq.of()
                .map(n => n * 2)
                .toArray()
                .length)
                .to.equal(0)
    );

    it('should map empty Seqs to empty seqs', () =>
        expect(Seq.empty()
                .map(n => n * 2)
                .toArray()
                .length)
                .to.equal(0)
    );

    it('should throw a TypeError if alleged function is not really a function', () =>
        expect(() => Seq.empty().map('invalid!!!'))
                .to.throw(TypeError)
    );
});

/**
 * @test {Seq#filter}
 */
describe('Testing method Seq#filter', () => {
    it('should filter even numbers from seq of numbers', () =>
        expect(Seq.range(1, 9)
                .filter(n => n % 2 == 0)
                .toArray())
                .to.eql([2, 4, 6, 8])
    );

    it('should map empty seq to empty seq', () =>
        expect(Seq.empty()
                .filter(n => n % 2 == 0)
                .toArray())
                .to.eql([])
    );

    it('should throw a TypeError if alleged function is not really a function', () =>
        expect(() => Seq.empty().filter('invalid!!!'))
                .to.throw(TypeError)
    );
});

/**
 * @test {Seq#flatMap}
 */
describe('Testing method Seq#flatMap', () => {
    it('should map seq to seq of seqs and flatten the result afterwards', () =>
        expect(Seq.of(1, 2, 3)
                .flatMap(item => Seq.of([item, item * 10]))
                .toArray())
                .to.eql([[1, 10], [2, 20], [3, 30]])
    );

    it('should allow list comprehension with seqs', () =>
        expect(Seq.of('A', 'B')
                .flatMap(a => Seq.of(1, 2, 3)
                                    .flatMap(b => Seq.of('' + a + b)))
                .toArray())
                .to.eql(['A1', 'A2', 'A3', 'B1', 'B2', 'B3'])
    );
});

/**
 * @test {Seq#takeWhile}
 */
describe('Testing method Seq#takeWhile', () => {
    it('should select the first 10 natural numbers', () =>
        expect(Seq.range(1, 20)
                .takeWhile(n => n <= 10)
                .toArray())
                .to.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    );

    it('should return an empty seq if the first item is not matching the predicate yet', () =>
        expect(Seq.range(1, 5)
                .takeWhile(n => n > 10)
                .toArray())
                .to.eql([])
    );

    it('should map empty seq to empty seq', () =>
        expect(Seq.empty()
                .takeWhile(n => n < 10)
                .toArray())
                .to.eql([])
    );

    it('should throw a TypeError if alleged predicate is not really a function', () =>
        expect(() => Seq.empty().takeWhile('invalid!!!'))
                .to.throw(TypeError)
    );
});

/**
 * @test {Seq#skipWhile}
 */
describe('Testing method Seq#skipWhile', () => {
    it('should skip the first 10 natural numbers', () =>
        expect(Seq.range(1, 20)
                .skipWhile(n => n <= 10)
                .toArray())
                .to.eql([11, 12, 13, 14, 15, 16, 17, 18, 19])
    );

    it('should return an empty seq none of the item is not matching the predicate', () =>
        expect(Seq.range(1, 5)
                .skipWhile(n => n < 10)
                .toArray())
                .to.eql([])
    );

    it('should map empty seq to empty seq', () =>
        expect(Seq.empty()
                .skipWhile(n => n < 10)
                .toArray())
                .to.eql([])
    );

    it('should throw a TypeError if alleged predicate is not really a function', () =>
        expect(() => Seq.empty().skipWhile('invalid!!!'))
                .to.throw(TypeError)
    );
});

/**
 * @test {Seq#take}
 */
describe('Testing method Seq#take', () => {
    it('should return a seq the first 5 items of a seq of length 10', () =>
        expect(Seq.range(0, 10)
                .take(5)
                .toArray())
                .to.eql([0, 1, 2, 3, 4,])
    );

    it('should return an empty seq if the number of items to select is zero', () =>
        expect(Seq.range(0, 5)
                .take(0)
                .toArray())
                .to.eql([])
    );

    it('should return an empty seq if the number of items to select is negative', () =>
        expect(Seq.range(0, 5)
                .take(-10)
                .toArray())
                .to.eql([])
    );
});

/**
 * @test {Seq#skip}
 */
describe('Testing method Seq#skip', () => {
    it('should skip the first 5 items of a seq of length 10', () =>
        expect(Seq.range(0, 10)
                .skip(5)
                .toArray())
                .to.eql([5, 6, 7, 8, 9])
    );

    it('should return an equal seq if the number of items to skip is zero', () =>
        expect(Seq.range(0, 5)
                .skip(0)
                .toArray())
                .to.eql([0, 1, 2, 3, 4])
    );

    it('should return an empty seq if the number of  items to skip is negative', () =>
        expect(Seq.range(0, 5)
                .take(-10)
                .toArray())
                .to.eql([])
    );
});

/**
 * @test {Seq#reduce}
 */
describe('Testing method Seq#reduce', () => {
    it('should return the seed if applied on empty seqs', () =>
        expect(Seq.empty()
                .reduce((a, b) => '' + a + b, 'seed'))
                .to.eql('seed')
    );

    it('should determine the sum of the first 5 natural numbers', () =>
        expect(Seq.range(1, 6)
                .reduce((a, b) => a + b, 0))
                .to.eql(15)
    );
});

/**
 * @test {Seq#count}
 */
describe('Testing method Seq#count', () => {
    it('should determine the length of an empty seq as zero', () =>
        expect(Seq.empty()
                .count())
                .to.eql(0)
    );

    it('should determine the length of a non-empty seq', () =>
        expect(Seq.range(0, 5)
                .count(5))
                .to.eql(5)
    );
});

/**
 * @test {Seq#forEach}
 */
describe('Testing method Seq#forEach', () => {
    it('should do nothing if applied on an empty seq', () =>
        expect(() => Seq.empty()
                .forEach(item => { throw 'error' }))
                .to.not.throw('error')
    );

    it('should run a given action on each element of an non-empty seq', () => {
        const result = [];

        Seq.range(0, 5)
                .forEach(item => result.push(item));

        expect(result).to.eql([0, 1, 2, 3, 4]);
    });
});

/**
 * @test {Seq#toArray}
 */
describe('Testing method Seq#toArray', () => {
    it('should convert an empty seq to an empty array', () =>
        expect(Seq.empty()
                .toArray())
                .to.eql([])
    );

    it('should convert a non-empty seq to a corresponding non-empty array', () =>
        expect(Seq.of(2, 4, 42)
                .toArray())
                .to.eql([2, 4, 42])
    );
});

/**
 * @test {Seq#force}
 */
describe('Testing method Seq#force', () => {
    it('should convert an empty seq to an empty seq', () =>
        expect(Seq.empty()
                .force()
                .toArray())
                .to.eql([])
    );

    it('should iterate and cache a given seq immediately', () => {
        let counter = 0;

        const seq = Seq.of(2, 4, 42)
                .map(item => { ++counter; return item; })
                .force();

        const counter1 = counter;

        // Try another force the make sure items have been cached before (= counter will not increase any longer)
        seq.force();

        const counter2 = counter;

        expect(counter1).to.eql(3)
                && expect(counter2).to.eql(3)
                && expect(seq.toArray()).to.eql([2, 4, 42]);
    });
});
