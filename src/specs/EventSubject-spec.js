'use strict';

import {describe, it} from 'mocha';
import {expect} from 'chai';
import EventSubject from '../../src/main/EventSubject';


/**
 * @test {EventSubject.subscribe}
 */
describe('Testing method EventSubject.subscribe', () => {
    it('should emit events to subscribers', () => {
        const
            values = [],
            subject = new EventSubject();
            
        subject.subscribe(value => values.push(value));
       
        subject.next(42);
        subject.next(43);
        subject.next(44);
        subject.complete();
        subject.next(45);
       
        expect(values)
            .to.eql([42, 43, 44]);   
    });
});