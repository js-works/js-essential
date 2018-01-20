export default class Strings {
    /**
     * Will throw exception if someone tries to instantiate this utility class.
     *
     * @ignore
     */
    construct() {
        throw '[Strings] Class is not instantiable';
    }
    

    /**
     * Converts a value to a string by using the toString method.
     *
     * @param {any} obj
     *    The value to be converted
     *
     * @return {string}
     *    The string representation of the value
     *
     * @example
     *    Strings.asString(undefined)         // ''
     *    Strings.asString(null)              // ''
     *    Strings.asString(42)                // '42'
     *    Strings.asString(true)              // 'true'
     *    Strings.asString(false)             // 'false'
     *    Strings.asString({toString: 'abc'}) // 'abc'
     *    Strings.asString('  some text  ')   // '  some text  '
     */
    static asString(value) {
        var ret;

        if (value === undefined || value === null) {
            ret = '';
        } else if (typeof value === 'string') {
            ret = value;
        } else {
            ret = value.toString();

            // Normally in this case the JavaScript engine should return undefined.
            // Nevertheless, to play save, we handle all cases here.
            if (ret === undefined || ret === null) {
                ret = '';
            } else if (typeof ret !== 'string') {
                ret = String(ret);
            }
        }

        return ret;
    }

   /**
     * @param {string} text
     *     The string to be trimmed
     *
     * @return {string}
     *     The trimmed string.
     *     If argument 'text' is not a string then it will be converted
     *     to a string first.
     *
     * @example
     *     Strings.trim('  some text  ')             // 'some text'
     *     Strings.trim('some text')                 // 'some text'
     *     String.trim('')                           // ''
     *     String.trim(null)                         // ''
     *     String.trim(undefined)                    // ''
     *     String.trim({toString: () => 'whatever'}) // 'whatever'
     */
    static trim(text) {
        return Strings.asString(text).trim();
    }

    /**
     * @param {string} text
     *     The string to be trimmed (possible to null).
     *
     * @return {string}
     *     The trimmed string.
     *     If argument 'text' is not a string then it will be converted
     *     to a string first, using function Strings.asString
     *
     * @example
     *     Strings.trimToNull('  some text  ')             // 'some text'
     *     Strings.trimToNull('some text')                 // 'some text'
     *     String.trim('')                                 // null
     *     String.trim(null)                               // null
     *     String.trim(undefined)                          // undefined
     *     String.trim({toString: () => '  whatever  '})   // 'whatever'
     */
    static trimToNull(text) {
        let ret = Strings.trim(text);

        if (ret.length === 0) {
            ret = null;
        }

        return ret;
    }
    
    /**
     * Will return a proper string representation for debugging purposes.
     *
     * @ignore
     */
    static toString() {
        return 'String/class';
    }
}