'use strict';

import Seq from './Seq';

export default class EventStream {
    constructor(onSubscribe) {
        if (typeof onSubscribe !== 'function') {
            throw new TypeError(
                "[EventStream.constructor] First argument 'onSubscribe' must be a function");
        }

        this.__onSubscribe = onSubscribe;
    }

    subscribe(subscriber) {
        let unsubscribed = false;

        const
            unsubscribe = () => {
                if (!unsubscribed) {
                    unsubscribed = true;
                    subscriberProxy.complete();

                    if (resultIsFunction) {
                        result();
                    } else if (result) {
                        result.unsubscribe();
                    }
                }
            },

            subscriberProxy = createSubscriberProxy(subscriber, unsubscribe),
            result = this.__onSubscribe(subscriberProxy),
            resultIsFunction = typeof result === 'function';

        if (!resultIsFunction && (!result || typeof result.unsubscribe !== 'function')) {
            throw new TypeError(
                "[EventStream.subscribe] The 'onSubscribe' function used for te construction "
                + 'of the event stream must either return a function or a subscription');
        }

        return {
            unsubscribe
        };
    }

    filter(pred) {
        if (typeof pred !== 'function') {
            throw new TypeError("[EventStream#filter] First argument 'pred' must be a function");
        }

        return new EventStream(subscriber => {
            let
                idx = -1,

                subscription = this.subscribe({
                    next(value) {
                        if (pred(value, ++idx)) {
                            subscriber.next(value);
                        }
                    },

                    complete: () => subscriber.complete(),

                    error: err => subscriber.error(err)
                });

            return subscription;
        });
    }

    map(f) {
        if (typeof f !== 'function') {
            throw new TypeError("[EventStream#map] First argument 'f' must be a function");
        }

        return new EventStream(subscriber => {
            let idx = -1;

            const subscription = this.subscribe({
                next(value) {
                    subscriber.next(f(value, ++idx));
                },

                error: err => subscriber.error(err),

                complete: () => subscriber.complete()
            });

            return subscription;
        });
    }

    take(n) {
        if (typeof n !== 'number' || n < 0) {
            throw new TypeError(
                "[EventStream#take] First argument 'n' must be a non-negative integer number");
        }

        return (
            n === 0
            ? EventStream.empty()
            : new EventStream(subscriber => {
                let idx = 0;

                const ret = this.subscribe({
                    next: event => {
                        if (idx < n) {
                            subscriber.next(event);
                            ++idx;
                        } else {
                           subscriber.complete();
                        }
                    },

                    complete: () => subscriber.complete(),

                    error: err => subscriber.error(err)
                });

                return ret;
            })
        );
    }

    skip(n) {
        if (typeof n !== 'number' || n < 0) {
            throw new TypeError(
                "[EventStream#skip] First argument 'n' must be a non-negative integer number");
        }

        return new EventStream(subscriber => {
            let idx = 0;

            return this.subscribe({
                next: event => {
                    if (idx === n) {
                        subscriber.next(event);
                    } else {
                        ++idx;
                    }
                },

                complete: () => subscriber.complete(),

                error: err => subscriber.error(err)
            });
        });
    }

    combineLatest(streamable, fn) {
        const stream = EventStream.from(streamable);

        return new EventStream(subscriber => {
            const
                unsubscribe = () => {
                    if (subscription1) {
                        subscription1.unsubscribe();
                    }

                    if (subscription2) {
                        subscription2.unsubscribe();
                    }

                    subscription1 = null;
                    subscription2 = null;
                };

            let
                value1 = null,
                value1IsSet = false,
                value2 = null,
                value2IsSet = false,

                subscription1 = this.subscribe({
                    next(value) {
                        value1 = value;
                        value1IsSet = true;

                        if (value2IsSet) {
                            subscriber.next(fn(value1, value2));
                        }
                    },

                    error(err) {
                        unsubscribe();
                        subscriber.error(err);
                    },

                    complete() {
                        subscription1 = null;

                        if (!subscription2) {
                            subscriber.complete();
                        }
                    }
                }),

                subscription2 = stream.subscribe({
                    next(value) {
                        value2 = value;
                        value2IsSet = true;

                        if (value1IsSet) {
                            subscriber.next(fn(value1, value2));
                        }
                    },

                    error(err) {
                        unsubscribe();
                        subscriber.error(err);
                    },

                    complete() {
                        subscription2 = null;

                        if (!subscription1) {
                            subscriber.complete();
                        }
                    }
                });

            return unsubscribe;
        });
    }

    scan(fn, seed = undefined) {
        if (typeof fn !== 'function') {
            throw new TypeError("[EventStream#scan] First argument 'fn' must be a function");
        }

        return new EventStream(subscriber => {
            let
                accumulator = null,
                idx = -1;

            return this.subscribe({
                next: value => {
                    if (++idx === 0) {
                        accumulator = seed === undefined ? value : fn(seed, value, 0);
                    } else {
                        accumulator = fn(accumulator, value, idx);
                    }

                    subscriber.next(accumulator);
                }
            });
        });
    }

    concat(...streamables) {
        return EventStream.concat(this, ...streamables);
    }

    merge(...streamables) {
        return EventStream.merge(this, ...streamables);
    }

    startWith(value) {
        return EventStream.of(value).concat(this);
    }

    forEach(f) {
        if (typeof f !== 'function') {
           throw new TypeError("[EventStream#forEach] First argument 'f' must be a function") ;
        }

        return new Promise((resolve, reject) => {
            let counter = -1;

            const subscription = this.subscribe({
                next(value) {
                    try {
                        f(value, ++counter);
                    } catch (err) {
                        if (subscription) {
                            subscription.unsubscribe();
                        }

                        reject(err);
                    }
                },

                error: reject,
                complete: () => resolve(counter + 1)
            });
        });
    }

    toString() {
        return "EventStream/instance";
    }

    static concat(...streamables) {
        const
            streams =
                Seq.from(streamables)
                    .filter(streamable => EventStream.isStreamable(streamable))
                    .map(streamable => EventStream.from(streamable))
                    .toArray(),

            streamCount = streams.length;

        return (
            streamCount === 0
            ? EventStream.empty()
            : new EventStream(subscriber => {
                let
                    streamIndex = -1,
                    subscription = null,
                    done = false,

                    performSubscription = () => {
                        subscription = streams[++streamIndex].subscribe({
                            next(value) {
                                if (done) {
                                    if (subscription) {

                                    }
                                } else {
                                    subscriber.next(value);
                                }
                            },

                            error(err) {
                                subscriber.error(err);

                            },

                            complete() {
                                subscription = null;

                                if (!done && streamIndex < streamCount - 1) {
                                    performSubscription();
                                } else {
                                    subscriber.complete();
                                }
                            }
                        });
                    };

                performSubscription();

                return () => {
                    done = true;

                    if (subscription) {
                        subscription.unsubscribe();
                        subscription = null;
                    }
                };
            })
        );
    }

    static merge(...streamables) {
        const
            streams =
                Seq.from(streamables)
                    .filter(streamable => EventStream.isStreamable(streamable))
                    .map(streamable => EventStream.from(streamable))
                    .toArray();

        return new EventStream(subscriber => {
            const
                subscriptions = [],

                unsubscribe = () => {
                    for (let subscription of subscriptions) {
                        if (subscription) {
                            subscription.unsubscribe();
                        }
                    }

                    subscriptions.length = 0;
                };

            let activeStreamCount = streams.length;

            for (let i = 0; i < streams.length; ++i) {
                streams[i].subscribe({
                    next: value => subscriber.next(value),

                    error: err => subscriber.error(err),

                    complete: () => {
                        if (--activeStreamCount === 0) {
                            subscriber.complete();
                        }
                    }
                });
            }

            return unsubscribe;
        });
    }

    static from(obj) {
        let ret;

        if (obj instanceof EventStream) {
            ret = obj;
        } else if (Seq.isSeqable(obj)) {
            return new EventStream(subscriber => {
                try {
                    Seq.from(obj)
                        .forEach(value => subscriber.next(value));
                } catch (err) {
                    subscriber.error(err);
                }

                subscriber.complete();
                return () => {};
            });
        } else {
            // TODO - support also reactive stream like from "RXJS" or "Kefir" etc.
            throw new TypeError(
                "[EventStream.from] First argument 'obj' must be some kind of "
                + ' asynchronous event stream or a synchronous sequence');
        }

        return ret;
    }

    static of(...events) {
        return EventStream.from(events);
    }

    static empty() {
        return emptyEventStream;
    }

    static isStreamable(obj) {
        return (
            obj instanceof EventStream
            || Seq.isSeqable(obj)
        );
    }

    static isNonSequableStreamable(obj) {
        return EventStream.isStreamable(obj) && !Seq.isSequable(obj);
    }

    static toString() {
        return 'EventStream/class';
    }
}

function createSubscriberProxy(subscriber, unsubscribe) {
    let
        onNext = null,
        onError = null,
        onComplete = null,
        done = false;

    if (typeof subscriber === 'function') {
       onNext = subscriber;
    } else if (subscriber) {
        if (typeof subscriber.next === 'function') {
            onNext = value => subscriber.next(value);
        }

        if (typeof subscriber.error === 'function') {
            onError = err => subscriber.error(err);
        }

        if (typeof subscriber.complete === 'function') {
            onComplete = () => subscriber.complete();
        }
    }

    return {
        next(value) {
            if (!done && onNext) {
                try {
                    onNext(value);
                } catch (err) {
                    if (onError) {
                        onError(err);
                    }

                    done = true;
                    unsubscribe();
                }
            }
        },

        error(err) {
            if (!done) {
                if (onError) {
                    onError(err);
                }

                done = true;
                unsubscribe();
            }
        },

        complete() {
            if (!done) {
                if (onComplete) {
                    onComplete();
                }

                done = true;
                unsubscribe();
            }
        },
    };
}

const emptyEventStream = new EventStream(subscriber => {
   subscriber.complete();

   return () => {};
});
