'use strict';

import Objects from '../main/Objects';
import Storage from '../main/Storage';
import {expect} from 'chai';


const
    modificationEvents = [],
    notificationEvents = [];

class Storage1 extends Storage {
    get initialState() {
        return {
            param1: 111,
            param2: 222
        };
    }

    getParam1() {
        return this.state.param1;
    }

    getParam2() {
        return this.state.param2;
    }

    getState() {
        return this.state;
    }

    setParam1(value) {
        this.notify('Calling setParam1');

        this.state = Objects.transform(this.state, {
            param1: {$set: value}
        });
    }

    setParam2(value) {
        this.notify('Calling setParam2');

        this.state = Objects.transform(this.state, {
            param2: {$set: value}
        });
    }

    *doSomethingAsync() {
        const
            a = yield Promise.resolve(21),
            b = yield Promise.resolve(11),
            c = yield Promise.resolve(10);

        return a + b + c;
    }

    reset() {
        this.state = this.initialState;
    }
}


const
    storage1 = new Storage1(),
    store1 = storage1.store,
    ctrl1 = storage1.controller;

store1.modificationEvents.subscribe(event => {
    modificationEvents.push(event);
});

store1.notificationEvents.subscribe(event => {
    notificationEvents.push(event);
});

describe("Testing class StoreManager", _ => {
    beforeEach(done => {
        return ctrl1.reset()
            .then(_ => {
                modificationEvents.length = 0;
                notificationEvents.length = 0;
                done();
            });
    });

    /**
     * @test {Store.create}
     */
    describe('Testing method Store.create', () => {
        it('should create new store without additional initialization parameters', () => {

            return ctrl1.setParam1(333)
                .then(_ => {
                    expect(modificationEvents.length).to.eql(1);
                    expect(notificationEvents).to.eql(['Calling setParam1']);
                    expect(ctrl1.getParam1()).to.eql(333);
                });
        });
    });

    /**
     * @test {Store.createSnapshot}
     */
    describe('Testing method Store.createSnapshot', () => {
        it('should create a store snapshot by copying the store and freezing the state', () => {
            let oldParam1, snapshot;

            return (
                ctrl1.setParam1(123)
                    .then(_ => { oldParam1 = store1.getParam1(); })
                    .then(_ => snapshot = store1.createSnapshot())
                    .then(_ => ctrl1.setParam1(234))
                    .then(_ => {
                        expect(snapshot.getParam1()).to.eql(oldParam1);
                    })
            );
        });
    });

    describe('Testing method handling', () => {
        it('should handle generator-based asynchronous methods', () => {
            return (
                ctrl1.doSomethingAsync()
                    .then(result => expect(result).to.eql(42))
            );
        });
    });
});