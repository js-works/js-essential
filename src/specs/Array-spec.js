import {describe, it} from 'mocha';
import {expect} from 'chai';
import Arrays from '../../src/main/Arrays';

/**
 * @test {Arrays.selectValue}
 */
describe('Testing static function Arrays.select', () => {
    it('should select a given value from an array', () =>
        expect(Arrays.selectValue(['value1', 'value2', 'value3'], 'value2'))
                .to.eql('value2')
    );

    it('should return undefined when tying to select an non-given value from an array', () =>
        expect(Arrays.selectValue(['value1', 'value2', 'value3'], 'value4'))
                .to.eql(undefined)
    );

    it('should return a given default value when tying to select an non-given value from an array', () =>
        expect(Arrays.selectValue(['value1', 'value2', 'value3'], 'value4', 'the-default-value'))
                .to.eql('the-default-value')
    );
});
