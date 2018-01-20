export default class Types {
    /**
     * Will throw exception if someone tries to instantiate this utility class.
     *
     * @ignore
     */
    construct() {
        throw '[Types] Class is not instantiable';
    }


    /**
     * Checks for being something else than undefined or null.
     *
     * @param {any} obj
     *    The value to be checked
     *
     * @return {boolean}
     *    false if obj is null or undefined, otherwise true
     *
     * @example
     *    Types.isSomething(undefined)  // false
     *    Types.isSomething(null)       // false
     *    Types.isSomething(0)          // true
     *    Types.isSomething(false)      // true
     *    Types.isSomething('')         // true
     *    Types.isSomething({})         // true
     *    Types.isSomething(42)         // true
     *    Types.isSomething({x: 42})    // true
     */
    static isSomething(obj) {
        return obj !== null && obj !== undefined;
    }

    /**
     * Checks for being undefined or null.
     *
     * @param {any} obj
     *    The value to be checked
     *
     * @return {boolean}
     *    true if obj is null or undefined, otherwise false
     *
     * @example
     *    Types.isNothing(undefined)  // true
     *    Types.isNothing(null)       // true
     *    Types.isNothing(0)          // false
     *    Types.isNothing(false)      // false
     *    Types.isNothing('')         // false
     *    Types.isNothing({})         // false
     *    Types.isNothing(42)         // false
     *    Types.isNothing({x: 42})    // false
     */
    static isNothing(obj) {
        return obj === null || obj === undefined;
    }

    static isOfType(obj, typeSpec) {
        let ret;

        if (Array.isArray(typeSpec)) {
            for (let typeSpecItem of typeSpec) {
                if (Types.isOfType(obj, typeSpecItem)) {
                    ret = true;
                    break;
                }
            }

            if (ret !== true) {
                ret = false;
            }
        } else {
            const type = typeof obj;

            if (typeSpec === null) {
                ret = obj === null;
            } else if (typeSpec === undefined) {
                ret = obj === undefined;
            } else if (typeof typeSpec === 'string') {
                switch (typeSpec) {
                    case 'boolean':
                        ret = type === 'boolean';
                        break;

                    case 'number':
                        ret = type === 'number';
                        break;

                    case 'string':
                        ret = type === 'string';
                        break;

                    case 'function':
                        ret = type === 'function';
                        break;

                    case 'object':
                        ret = obj !== null && type === 'object';
                        break;

                    case 'symbol':
                        ret = type === 'symbol';
                        break;

                    case 'scalar':
                        ret = type == 'string'
                            || type === 'number' || type === 'boolean';

                        break;

                    case 'array':
                        ret = Array.isArray(obj);
                        break;

                    default:
                        throw new TypeError(
                            "[Types.isOfType] Do not know what type '"
                            + typeSpec + "' shall be");
                }
            } else if (typeof typeSpec === 'function') {
                ret = obj instanceof typeSpec;
            } else {
                throw new TypeError(
                    "[Types.isOfType] Second argument 'typeSpec' must either "
                    + 'be a constructor function or a string or an array of'
                    + 'type specs');
            }
        }

        return ret;
    }

    /**
     * Will return a proper string representation for debugging purposes.
     *
     * @ignore
     */
    static toString() {
        return 'Types/class';
    }
}