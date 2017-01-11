import Arrays from './main/Arrays';
import Config from './main/Config';
import ConfigError from './main/ConfigError';
import EventStream from './main/EventStream';
import EventSubject from './main/EventSubject';
import Functions from './main/Functions';
import Objects from './main/Objects';
import Seq from './main/Seq';
import Store from './main/Store';
import Storage from './main/Storage';
import Strings from './main/Strings';
import Types from './main/Types'

export {
    Arrays,
    Config,
    ConfigError,
    EventStream,
    EventSubject,
    Functions,
    Objects,
    Seq,
    Storage,
    Store,
    Strings,
    Types
};

const jsprelude = {
    Arrays,
    Config,
    ConfigError,
    EventStream,
    EventSubject,
    Functions,
    Objects,
    Seq,
    Storage,
    Store,
    Strings,
    Types
};

if (typeof define === 'function' && define.amd) {
    define(() => jsprelude);
}

if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = jsprelude;
}

if (typeof window === 'object' && window) {
    window.jsprelude = jsprelude;
}
