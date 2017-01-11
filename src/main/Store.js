'use strict';

import Storage from './Storage.js';

export default class Store {
    constructor(storage) {
        if (!(storage instanceof Storage)) {
            throw new TypeError(
                "[Store.constructor] First argument 'storeMgr' must must be a StroreMgr");
        }


        this.__storage = storage;

        this.__modificationEvents = storage.modificationEvents.map(event => ({
            type: 'modification'
        }));
    }

    get modificationEvents() {
        return this.__storage.modificationEvents;
    }

    get notificationEvents() {
        return this.__storage.notificationEvents;
    }

    createSnapshot() {
        const
            storageClone = Object.create(Object.getPrototypeOf(this.__storage)),
            snapshot = Object.create(Object.getPrototypeOf(this));

        snapshot.__storage = storageClone;
        storageClone.__state = this.__storage.__state;
        storageClone.__oldState = undefined;

        return snapshot;
    }
}
