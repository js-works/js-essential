'use strict';

import Functions from './Functions';
import Store from './Store';
import EventSubject from './EventSubject';
import Types from './Types';

const storageMeta = new WeakMap();
const GETTER_NAME_REGEX = /^(get|find)[A-Z]|^[a-z]*s[A-Z]/;

export default class Storage {
    constructor(params = null) {
        this.__meta = determineStorageMeta(Object.getPrototypeOf(this).constructor);
        this.__params = params === undefined ? null : params;

        this.__modificationSubject = new EventSubject();
        this.__notificationSubject = new EventSubject();

        this.__store = new this.__meta.storeClass(this);
        this.__controller = new this.__meta.controllerClass(this);

        this.dispatcher = createDispatcher(this);
        this.disposer = createDisposer(this);

        defineReadWriteProperty(this, '__state', this.initialState);
        defineReadWriteProperty(this, '__oldState', undefined);
        defineReadWriteProperty(this, '__modificationTransmissionTimeoutId', null);

        Object.freeze(this.__params);
        Object.freeze(this);
    }

    get initialState() {
        return null;
    }

    get params() {
        return this.__paramms;
    }

    get state() {
        return this.__state;
    }

    set state(newState) {
        if (newState === undefined) {
            throw new TypeError(
                "[Storage#set-state] First argument 'newState' must not be  undefined");
        }

        this.__state = newState;

        if (this.__modificationTransmissionTimeoutId === null) {
            this.__modificationTransmissionTimeoutId = setTimeout(() => {
                const oldState = this.__oldState;

                this.__oldState = newState;
                this.__modificationTransmissionTimeoutId = null;

                this.__modificationSubject.next({
                    type: 'modification',
                    newState,
                    oldState
                });
            }, 0);
        }

    }

    get modificationEvents() {
        return this.__modificationSubject.asEventStream();
    }

    get notificationEvents() {
        return this.__notificationSubject.asEventStream();
    }

    get store() {
        return this.__store;
    }

    get controller() {
        return this.__controller;
    }

    notify(...args) {
        const notification =
            args.length > 1
            ? args
            : args[0];

        if (Types.isSomething(notification)) {
            setTimeout(() => {
                this.__notificationSubject.next(notification);
            });
        }
    }
}

Object.defineProperty(Storage, 'storeClass', {
    get() {
        let meta = storageMeta.get(this);

        if (!meta) {
            meta = determineStorageMeta(this);
            storageMeta.set(this, meta);
        }

        return meta.storeClass;
    }
});

function determineStorageMeta(storageClass) {
    const
        getterNames = new Set(),
        actionNames = new Set();

    let prototype = storageClass.prototype;

    while (prototype !== Storage.prototype) {
        for (let propName of Object.getOwnPropertyNames(prototype)) {
            if (typeof propName === 'string'
                && propName !== 'constructor'
                && propName[0] !== '_'
                && typeof prototype[propName] === 'function'
                && Storage[propName] === undefined) {

                if (propName.match(GETTER_NAME_REGEX)) {
                    getterNames.add(propName);
                } else {
                    actionNames.add(propName);
                }
            }
        }

        prototype = Object.getPrototypeOf(prototype);
    }

    const
        storeClass = createStoreClass(storageClass, getterNames),
        controllerClass = createControllerClass(storageClass, storeClass, actionNames);

    return {
        getterNames,
        actionNames,
        storeClass,
        controllerClass
    };
}

function createStoreClass(storageClass, getterNames) {
    const
        storeClass = function (storage) {
            Store.call(this, storage);
            this.__storage = storage;
        },

        proto = Object.create(Store.prototype);

    storeClass.prototype = proto;

    for (let getterName of getterNames) {
        proto[getterName] = function (...args) {
           return storageClass.prototype[getterName].apply(this.__storage, args);
        };
    }

    return storeClass;
}

function createControllerClass(storageClass, storeClass, actionNames) {
    const
        controllerClass = function (storage) {
             storeClass.call(this, storage);
             this.__storage = storage;
        },

        proto = Object.create(storeClass.prototype);

    controllerClass.prototype = proto;

    for (let actionName of actionNames) {
        let method = buildControllerActionMethod(
            storageClass.prototype[actionName]
        );

        proto[actionName] = method;
    }

    return controllerClass;
}

function createDispatcher(storage) {
    return (actionName, payload) => {
        if (typeof actionName !== 'string' || actionName === '') {
            throw new TypeError(`[Storage#dispatch] First argument 'actionName' must be a non-empty string`);
        }

        const actionNames = storage.__meta.actionNames;

        let methodName = null;

        if (actionNames.has(actionName)) {
            methodName = actionName;
        }

        if (!methodName) {
            const alternativeMethodName =
                'on' + actionName[0] + actionName.substr(1);

            if (actionNames.has(alternativeMethodName)) {
                methodName = alternativeMethodName;
            }
        }

        if (!methodName) {
            throw new Error(`Illegal action name '${actionName}'`);
        }

        storage.controller[methodName]();

        return;
    };
}

function createDisposer(storage) {
    return () => {
        // TODO: implement
    };
}

function buildControllerActionMethod(fn) {
    let ret;

    if (!Functions.isGeneratorFunction(fn)) {
        ret = function (...args) {
            let ret2;

            const
                result = fn.apply(this.__storage, args);

            if (result instanceof Promise) {
                ret2 = new Promise(function (resolve, reject) {
                    result.then(value => {
                        setTimeout(() => resolve(value), 0);
                    })
                    .catch(err => reject(err));
                });
            } else {
                ret2 = new Promise((resolve, reject) => {
                    setTimeout(
                        () => resolve(result),
                        0);
                });
            }

            return ret2;
        };
    } else {
        return (...args) => {
            const
                handleNext = (generator, seed, resolve, reject) => {
                    try {
                        const
                            {value, done} = generator.next(seed),
                            valueIsPromise = value instanceof Promise;

                        if (done) {
                            if (valueIsPromise) {
                                value.then(resolve, reject);
                            } else {
                                resolve(value);
                            }
                        } else {
                            if (valueIsPromise) {
                                value.then(result => handleNext(generator, result, resolve, reject), reject);
                            } else {
                                handleNext(generator, value, resolve, reject);
                            }
                        }
                    } catch (err) {
                        generator.return();
                        reject(err);
                    }
                };

            return new Promise((resolve, reject) =>
                handleNext(fn(...args), undefined, resolve, reject));
        };
    }

    return ret;
}

function defineReadWriteProperty(obj, propertyName, initialValue) {
    let value = initialValue;

    Object.defineProperty(obj, propertyName, {
        get() {
            return value;
        },

        set(newValue) {
            value = newValue;
        }
    });
}
