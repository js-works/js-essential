const
    GeneratorFunction = Object.getPrototypeOf(function* () {}).constructor;

export default class Functions {
    static isGeneratorFunction(fn) {
        return fn instanceof GeneratorFunction;
    }
}
