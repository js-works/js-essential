module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            build: {
                src: ['build/*', 'dist/*'],
            }
        },
        babel: {
            options: {
                moduleId: 'jsEssential',
                retainLines: true,
                moduleIds: false,
                sourceMap: true,
                presets: ['es2015'],
                plugins: [[
                    'transform-runtime', {
                        helpers: false,
                        polyfill: false,
                        regenerator: false,
                        moduleName: 'babel-runtime'
                    }]]
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'src',
                    src: ['**/*.js'],
                    dest: 'build/src',
                    ext: '.js'
                }]
            }
        },
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    require: [
                        'node_modules/babel-polyfill/dist/polyfill.min.js'
                    ],
                    bail: true
                },
                src: ['build/src/test/**/*.js']
            }
        },
        esdoc : {
            dist : {
                options: {
                    source: 'src/main/',
                    destination: 'dist/docs/api',
                    title: 'js-essential',
                    undocumentIdentifier: true,

                    test: {
                        type: 'mocha',
                        source: './src/test',
                        includes: ['\\Test.js']
                    }
                }
            }
        },
        webpack: {
            js: {
                entry: ['./build/src/js-essential.js'],
                output: {
                    filename: './dist/js-essential-<%= pkg.version %>.js',
                    libraryTarget: 'umd'
                },
                module: {
                    loaders: [{
                        loader: 'webpack-strip-blocks',
                        options: {
                            blocks: ['strip-block'],
                            start: '/*',
                            end: '*/'
                        }
                    }]
                }
            }
        },
        uglify: {
            options: {
                ASCIIOnly: true,
                banner: '/*\n'
                        + ' <%= pkg.name %> v<%= pkg.version %> -'
                        + ' <%= grunt.template.today("yyyy-mm-dd") %>\n'
                        + ' Homepage: <%= pkg.homepage %>\n'
                        + ' License: <%= pkg.license %>\n'
                        + '*/\n'
            },
            js: {
                src: ['dist/js-essential-<%= pkg.version %>.js'],
                dest: 'dist/js-essential-<%= pkg.version %>.min.js'
            }
        },
        compress: {
            main: {
                options: {
                    mode: 'gzip',
                    level: 9
                },
                files: [{
                    src: ['dist/js-essential-<%= pkg.version %>.min.js'],
                    dest: 'dist/js-essential-<%= pkg.version %>.min.js.gz'
                }, {
                    src: ['node_modules/babel-polyfill/dist/polyfill.min.js'],
                    dest: 'dist/polyfill.min.js.gz'
                }]
            }
        },
        copy: {
            jsEssential1: {
                src: 'dist/js-essential-<%= pkg.version %>.js',
                dest: 'dist/js-essential.js'
            },
            jsEssential2: {
                src: 'dist/js-essential-<%= pkg.version %>.min.js',
                dest: 'dist/js-essential.min.js'
            },
            jsEssential3: {
                src: 'dist/js-essential-<%= pkg.version %>.min.js.gz',
                dest: 'dist/js-essential.min.js.gz'
            },
            polyfill: {
                src: 'node_modules/babel-polyfill/dist/polyfill.min.js',
                dest: 'dist/polyfill.min.js'
            }
        },
        watch: {
            js: {
                options: {
                    spawn: true,
                },
                files: ['src/**/*.js'],
                tasks: ['compile', 'mochaTest']
                //tasks: ['esdoc']
            }
        }
    });

    // TODO: This is not really working :-(
    // On watch events, if the changed file is a test file then configure mochaTest to only
    // run the tests from that file. Otherwise run all the tests
    grunt.event.on('watch', function (action, filePath) {
        if (filePath.match('^src/')) {
            grunt.config.set(['mochaTest', 'test', 'src'], 'build/' + filePath);
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-webpack');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-esdoc');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('compile', ['babel']);
    grunt.registerTask('test', ['babel', 'mochaTest']);
    grunt.registerTask('doc', ['babel', 'mochaTest', 'esdoc']);
    grunt.registerTask('dist', ['clean', 'babel', 'mochaTest', 'esdoc', 'webpack', 'uglify', 'compress', 'copy']);
    grunt.registerTask('default', ['dist']);
};
