import {describe, it} from 'mocha';
import {expect} from 'chai';
import ConfigError from '../../src/main/ConfigError';

import Objects from '../../src/main/Objects';

const testObj = {
    value1: 'abc'
};

describe('Testing static method Objects.transform', () => {
    // TODO
    it('should work properly', () => {
        expect(Objects.transform(testObj, {
            value1: {$set: 'abc'}
        }).value1)
        .to.eql('abc');

        expect(Objects.transform(testObj, {
            value1: {$update: s => s + 'def'}
        }).value1)
        .to.eql('abcdef');
    });
});