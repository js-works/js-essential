import Arrays from './main/Arrays';
import Config from './main/Config';
import ConfigError from './main/ConfigError';
import Functions from './main/Functions';
import Objects from './main/Objects';
import Seq from './main/Seq';
import Strings from './main/Strings';
import Types from './main/Types'

export {
    Arrays,
    Config,
    ConfigError,
    Functions,
    Objects,
    Seq,
    Strings,
    Types
};

const jsprelude = {
    Arrays,
    Config,
    ConfigError,
    Functions,
    Objects,
    Seq,
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
