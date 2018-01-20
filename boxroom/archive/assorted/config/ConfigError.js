export default class ConfigError extends Error {
    constructor(message) {
        super(message);

        if (typeof message !== 'string' || message.trim() === '') {
            throw new TypeError("[ConfigError.constructor] First argument 'message' must be a non-blank string");
        }
    }

    /**
     * @ignore
     */
    toString() {
        return 'ConfigError: ' + this.message;
    }
}