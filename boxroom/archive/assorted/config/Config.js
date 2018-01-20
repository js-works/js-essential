import ConfigError from './ConfigError';
import Strings from './Strings';
import Seq from './Seq';
import Types from './Types';

const dummyDefaultValue = {};

export default class Config {
    constructor(data, options) {
        if (data === null || typeof data !== 'object') {
            throw new TypeError(
                "[Config.constructor] First argument 'data' has to be an object");
        } else if (
            options
            && options.rootPath !== undefined
            && options.rootPath !== null && !Array.isArray(options.rootPath)) {

            throw new TypeError(
                "[Config.constructor] Property 'rootPath' of second argument "
                + "'config' has to be an array or undefined or null");
        } else if (
            options
            && options.contextName !== undefined
            && options.contextName !== null
            && typeof options.contextName !== 'string') {

            throw new TypeError("[Config.constructor] Property 'contextName' of second argument 'config' "
                + 'has to be a string or undefined or null');
        }

        this.__data = data;
        this.__rootPath = (options && options.rootPath) || null;
        this.__contextName = (options && options.contextName) || null;
    }

    get(path, defaultValue = undefined) {
        let ret;

        if (typeof path === 'string') {
            ret = this.__data[path];
        } else if (!Array.isArray(path)) {
            throw new TypeError(
                `[Config:get] First parameter 'path' has to be a string or an array (invalid path: ${path})`);
        } else {
            const
                pathLength = path.length;

            if (pathLength === 0) {
                ret = this.__data;
            } else if (pathLength === 1) {
                ret = this.__data[path[0]];
            } else {
                let parent = this.__data;

                for (let i = 0; i < pathLength; ++i) {
                    if (!parent) {
                        break;
                    } else {
                        parent = parent[path[i]];

                        if (i === pathLength - 1) {
                            ret = parent;
                        }
                    }
                }
            }
        }

        if (ret === undefined) {
            if (defaultValue !== undefined) {
                ret = defaultValue;
            } else {
                throw errorMissingValue(this, path);
            }
        }

        return ret;
    }

    getConstrained(path, defaultValue, rule, validator = null, converter = null) {
        if (typeof rule !== 'string') {
           throw new TypeError(
               "[Config:getConstrained] Third argument 'rule' must be a string");
        } else if (rule.trim() === '') {
           throw new TypeError(
               "[Config:getConstrained] Third argument 'rule' must not be blank");
        } else if (validator !== null && typeof validator !== 'function') {
           throw new TypeError(
               "[Config:getConstrained] Fourth argument 'validator' "
               + ' must be a function or null');
        } else if (converter !== null && typeof converter !== 'function') {
           throw new TypeError(
               "[Config:getConstrained] Fifth argument 'converter' "
               + ' must be a function or null');
        }

        return getConstrainedValue(this, path, defaultValue, rule, validator, converter);
    }

    getOfType(path, typeSpec, defaultValue = undefined) {
        const
            rule = 'must be of valid type'
                + defaultValue === null ? ' or null' : '',

            validator = value => Types.isOfType(value, typeSpec);

        return getConstrainedValue(this, path, defaultValue, rule, validator);
    }

    getBoolean(path, defaultValue = undefined) {
        const
            rule = "must be a boolean value or string 'true' or string 'false'"
                + defaultValue === null ? ' or null' : '',

            validator = value => value === true || value === false || value === 'true' || value === 'false',
            converter = value => value === true || value === 'true';

        return getConstrainedValue(this, path, defaultValue, rule, validator, converter);
    }

    getNumber(path, defaultValue = undefined) {
        const
            rule = "must be numeric" + defaultValue === null ? ' or null' : '',
            validator = value => !isNaN(value),
            converter = value => 0 + value;

        return getConstrainedValue(this, path, defaultValue, rule, validator, converter);
    }

    getInteger(path, defaultValue = undefined) {
        const
            rule = "must be a integer number" + defaultValue === null ? ' or null' : '',
            validator = value => !isNaN(value),
            converter = value => Math.floor(0 + value);

        return getConstrainedValue(this, path, defaultValue, rule, validator, converter);
    }

    getString(path, defaultValue = undefined) {
        const
            rule = 'must be a string',
            validator = value => value === null || typeof value !== 'object',
            converter = value => Strings.asString(value);

        return getConstrainedValue(this, path, defaultValue, rule, validator, converter);
    }

    getNonEmptyString(path) {
        const
            rule = 'must be a non-empty string',
            validator = value => typeof value !== 'object' && Strings.asString(value) !== '';

        return getConstrainedValue(this, path, undefined, rule, validator);
    }

    getNonBlankString(path) {
        const
            rule = 'must be a non-blank string',
            validator = value => typeof value !== 'object' && Strings.trim(value) !== '';

        return getConstrainedValue(this, path, undefined, rule, validator);
    }

    getNonEmptyStringOrNull(path) {
        return this.getString(path, null) || null;
    }

    getTrimmedString(path, defaultValue) {
        return this.getString(path, defaultValue).trim();
    }

    getTrimmedNonEmptyStringOrNull(path) {
        return this.getTrimmedString(path, null) || null;
    }

    getNonBlankString(path, defaultValue) {
        const
            rule = 'must be non-blank string',

            validator = value => {
                const type = typeof value;

                return type === 'string' && value.trim() !== '' || type === 'boolean' || type === 'number';
            };

        return getConstrainedValue(this, path, defaultValue, rule, validator);
    }

    getStringMatchingRegex(path, regex, defaultValue) {
        if (!(regex instanceof RegExp)) {
            throw new TypeError(
                "[Config:getStringMatchngRegex] Second argument 'regex' must be a regular expression");
        }

        const
            rule = 'must be a string matching regex ' + regex,

            validator = value =>
                typeof value === 'string' && value.match(regex);

        return getConstrainedValue(this, path, defaultValue, rule, validator);
    }

    getFunction(path, defaultValue) {
        const
            rule = 'must be a function',
            validator = value => typeof value === 'function';

        return getConstrainedValue(this, path, defaultValue, rule, validator);
    }

    getMappedFunction(path, innerFn = null, defaultValue = undefined) {
        if (innerFn !== null && typeof innerFn !== 'function') {
            throw new TypeError(
                "[Config#getMappedFunction] Second parameter 'innerFn' must "
                + 'either be a function or null');
        }

        const
            rule = 'must be a function',
            validator = value => typeof value === 'function',
            converter = value => !innerFn ? value : (...args) => value(innerFn(...args));

        return getConstrainedValue(this, path, defaultValue, rule, validator, converter);
    }

    getCompositeFunction(path, outerFn = null, defaultValue = undefined) {
        if (outerFn !== null && typeof outerFn !== 'function') {
            throw new TypeError(
                "[Config#getCompositeFunction] Second parameter 'outerFn' must "
                + 'either be a function or null');
        }

        const
            rule = 'must be a function',
            validator = value => typeof value === 'function',
            converter = value => !outerFn ? value : (...args) => outerFn(value(...args));

        return getConstrainedValue(this, path, defaultValue, rule, validator, converter);
    }

    getObject(path, defaultValue) {
        const
            rule = 'must be an object',

            validator = value =>
                value !== null && typeof value === 'object';

        return getConstrainedValue(this, path, defaultValue, rule, validator);
    }

    getArray(path, defaultValue) {
        const
            rule = 'must be an array or some other non-string sequable',
            validator = Seq.isNonStringSeqable,
            converter = value => Array.isArray(value) ? value : Seq.from(value).toArray();

        return getConstrainedValue(this, path, defaultValue, rule, validator, converter);
    }

    getSeq(path, defaultValue) {
        const
            rule = 'must be iterable',
            validator = value => Seq.isSeqable(value),
            converter = value => Seq.from(value);

        return getConstrainedValue(this, path, defaultValue, rule, validator, converter);
    }

    getSeqOfConfigs(path, defaultValue) {
        const
            rule = 'must be iterable',

            validator = value => Seq.isSeqable(value),

            converter = value => Seq.from(value).map((obj, index) => {
                if (obj === null || typeof obj !== 'object') {
                    const fullPath =
                        Array.isArray(path)
                        ? path.slice().push(index)
                        : [path, index];

                    throw error(this, fullPath, 'must be an object');
                }

                return inheritConfig(this, obj);
            });

        return getConstrainedValue(this, path, defaultValue, rule, validator, converter);
    }

    getConfig(path, defaultValue) {
        const
            rule = 'must be an object or undefined or null',
            validator = value => value && typeof value === 'object',
            converter = value => new Config(value);

        return getConstrainedValue(this, path, defaultValue, rule, validator, converter);
    }

    isDefined(path) {
        const value = this.get(path, dummyDefaultValue);

        return value !== dummyDefaultValue;
    }

    isUndefined(path) {
        const value = this.get(path, dummyDefaultValue);

        return value === dummyDefaultValue;
    }

    isSomething(path) {
        const value = this.get(path, null);

        return (value !== null);
    }

    isNothing(path) {
        const value = this.get(path, null);

        return (value === null);
    }

    isFunction(path) {
        const value = this.get(path, null);

        return typeof value === 'function';
    }

    isObject(path) {
        const value = this.get(path, null);

        return !!value && typeof value === 'object';
    }

    isArray(path) {
        const value = this.get(path, null);

        return Array.isArray(value);
    }

    isScalar(path) {
        const
            value = this.get(path, null),
            type = typeof value;

        return (type === 'string' || type === 'number' || type === 'boolean');
    }

    isScalarOrNull(path) {
        const
            value = this.get(path, null),
            type = typeof value;

        return (value === null || type === 'string' || type === 'number' || type === 'boolean');
    }

    isScalarOrNothing(path) {
        const
            value = this.get(path, null),
            type = typeof value;

        return (value === undefined || value === null
            || type === 'string' || type === 'number' || type === 'boolean');
    }

    isIterable(path) {
        const value = this.get(path, null);

        return value !== null && Seq.isSeqable(value);
    }

    ifDefined(path, valueTrue, valueFalse) {
        return this.isDefined(path) ? valueTrue : valueFalse;
    }

    ifUndefined(path, valueTrue, valueFalse = null) {
        return this.isUndefined(path) ? valueTrue : valueFalse;
    }

    ifSomething(path, valueTrue, valueFalse = null) {
        return this.isSomething(path) ? valueTrue : valueFalse;
    }

    ifNothing(path, valueTrue, valueFalse = null) {
        return this.isNothing(path) ? valueTrue : valueFalse;
    }

    keys(keyValidation = null) {
        const
            validatorIsNull = keyValidation === null,
            validatorIsRegex = !validatorIsNull && keyValidation instanceof RegExp,
            validatorIsFunction = !validatorIsNull && typeof keyValidation === 'function';

        if (!validatorIsNull && !validatorIsRegex && !validatorIsFunction) {
            throw new TypeError(
                "[Config#keys] First argument 'keyValidation' must either be a "
                + 'function or a regular expression or null');
        }

        const
            ret = Object.keys(this.__data),
            count = ret.length,

            validator =
                validatorIsNull
                ? null
                : (validatorIsFunction ? validator : key => key.match(keyValidation));

        for (let i = 0; i < count; ++i) {
            const key = ret[i];

            if (typeof key !== 'string') {
                throw this.error(this, null, `Key '${key}' is not a string`);
            } else if (validator && !validator(key)) {
                if (validatorIsRegex) {
                    throw error(this, null,
                        `Key '${key}' does not match regular expression ${keyValidation}`);
                } else {
                    throw error(this, null,
                        `Invalid key '${key}'`);
                }
            }
        }

        return ret;
    }

    static from(obj) {
        if (obj === null || typeof obj !== 'object') {
            throw new TypeError("[Config.from] First argument 'obj' must be an object");
        }

        return (obj instanceof Config)
                ? obj
                : new Config(obj);
    }

    /**
     * @ignore
     */
    static toString() {
        return 'Config/class';
    }
}


function error(config, path, message) {
    const
        messagePrefix =
            config.__contextName
            ? config.__contextName + ': '
            : '',

        escapeKey = token =>
            String(token)
                .replace('\\', '\\\\')
                .replace('|', '\\|')
                .replace("'", "\\'");

    let
        ret,
        pathInfo;

    if (!path) {
        ret = new ConfigError(`${messagePrefix}${message}`);
    } else {
        if (typeof path === 'string') {
            pathInfo = escapeKey(path);
        } else {
            pathInfo = path.map(escapeKey).join('|');
        }

        ret = new ConfigError(`${messagePrefix}Erroneous attribute '${pathInfo}' (${message})`);
    }

    return ret;
}

function errorMissingValue(config, path) {
    return error(config, path, 'Mandatory value not available');
}

// @throws Error
function getConstrainedValue(config, path, defaultValue = undefined, rule = null, validator = null, converter = null) {
    // Parameters are fine - no need to validate them

    let ret;

    const value = config.get(path, defaultValue);

    if (value === defaultValue) {
        ret = defaultValue;
    } else {
        if (validator && !validator(value)) {
            if (rule) {
                throw error(config, path, "Invalid value - " + rule + "!");
            } else {
                throw error(config, path, 'Invalid value');
            }
        }

        ret = (converter ? converter(value) : value);
    }

    return ret;
}

function inheritConfig(config, data) {
    return new Config(data); // TODO
}