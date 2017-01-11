'use strict';

import EventStream from './EventStream';

export default class EventSubject extends EventStream {
    constructor() {
        super(subscriber => {
            this.__subscribers.push(subscriber);
            
            return () => {
                const index = this.__subscribers.indexOf(subscriber);
                    
                this.__subscribers.slice(index, index + 1);
            };
        });
        
        this.__subscribers = [];
        this.__eventStream = null;
    }
    
    next(event) {
        for (let subscriber of this.__subscribers) {
            subscriber.next(event);
        }
    }
    
    complete(event) {
        for (let subscriber of this.__subscribers) {
            subscriber.complete();
        }
        
        this.__subscribers = [];
    }
    
    error(error) {
        for (let subscriber of this.__subscribers) {
            subscriber.error(error);
        }
        
        this.__subscribers = [];
    }
    
    asEventStream() {
        let ret = this.__eventStream;
        
        if (!ret) {
            ret = this.__eventStream = new EventStream(subscriber => {
                return  this.subscribe(subscriber); 
            });
        }
        
        return ret;
    }
}