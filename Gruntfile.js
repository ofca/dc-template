module.exports = function(grunt) {

    // Configuration
    var concatenate = {
        coffee: {
            dev: {
                'js/index.coffee.js': [
                    'coffee/index.coffee'
                ]
            }
        },
        js: {
            dev: {
                'js/index.min.dist.js': [
                    'js/vendor/jquery-1.10.2.min.js',
                    'js/lib/console.js',
                    'js/index.coffee.js'
                ]
            }
        },
        css: {
            dist: {
            }
        }
    };

    var isProduction = grunt.option('production') || false,
        taskMode = isProduction ? 'dist' : 'dev',
        pkg = grunt.file.readJSON('package.json'),
        target, mode, type, obj = {}, arr;

    // Prefix pathes with project.assets
    for (type in concatenate) {
        obj[type] = {};
        for (mode in concatenate[type]) {
            obj[type][mode] = {};
            for (target in concatenate[type][mode]) {
                arr = [];

                concatenate[type][mode][target].forEach(function(path) {
                    arr.push('<%= project.assets %>' + path);
                });

                obj[type][mode]['<%= project.assets %>' + target] = arr;
            }
        }
    }

    if (obj.js.dist === void 0) {
        obj.js.dist = obj.js.dev;
    }

    if (obj.css.dist === void 0) {
        obj.css.dist = obj.css.dev;
    }

    if (obj.coffee.dist === void 0) {
        obj.coffee.dist = obj.coffee.dev;
    }
    
    concatenate = obj;

    target = obj = mode = type = null;

    grunt.initConfig({
        pkg: pkg,
        project: {
            assets: 'assets/'
        },
        /**
         * Project banner
         * Dynamically appended to CSS/JS files
         * Inherits text from package.json
         */
        tag: {
          banner: '/*!\n' +                  
                  ' * <%= pkg.title %>\n' +
                  (pkg.description ? '\n * <%= pkg.description %>\n' : '') +
                  (pkg.url ? '\n * <%= pkg.url %>\n' : '') +
                  ' * \n' +
                  ' * @package <%= pkg.name %>\n' +
                  ' * @author <%= pkg.author %>\n' +
                  ' * @version <%= pkg.version %>\n' +
                  ' * @updated <%= new Date().toString() %>\n' +
                  ' * Copyright <%= pkg.copyright %>. <%= pkg.license %>\n' +
                  ' */\n'
        },
        watch: {
            misc: {
                files: [
                    'Gruntfile.js'
                ],
                options: {
                    reload: true
                }
            },
            scss: {
                files: [
                    '<%= project.assets %>scss/**/*.scss'
                ],
                options: {
                    spawn: false
                },
                tasks: ['sass:'+taskMode, 'cssmin:'+taskMode]
            },
            js: {
                files: [
                    '<%= project.assets %>js/**/*.js',
                    '!<%= project.assets %>js/dist/*.js',                
                ],
                options: {
                    spawn: false
                },
                tasks: ['jshint', 'jsmin:'+taskMode]
            },
            coffee: {
                files: [
                    '<%= project.assets %>coffee/**/*.coffee'                  
                ],
                options: {
                    spawn: false
                },
                tasks: ['coffee:'+taskMode, 'jsmin:'+taskMode]
            }
        },
        sass: {
            dev: {
                options: {
                    sourcemap: true,
                    banner: '<%= tag.banner %>'                  
                },
                files: [{
                    expand: true,
                    flatten: false,
                    cwd: '<%= project.assets %>scss/',
                    src: ['*.scss'],
                    dest: '<%= project.assets %>css/',
                    ext: '.css'
                }]
            },
            dist: {
                options: {
                    style: 'compressed',
                    banner: '<%= tag.banner %>'
                },
                files: [{
                    expand: true,
                    flatten: false,
                    cwd: '<%= project.assets %>scss/',
                    src: ['*.scss'],
                    dest: '<%= project.assets %>css/',
                    ext: '.min.dist.css'
                }]
            }
        },
        coffee: {
            dev: {
                options: {
                    sourceMap: true
                },
                files: concatenate.coffee.dev
            },
            dist: {
                options: {
                    sourceMap: true
                },
                files: concatenate.coffee.dist
            }
        },
        jsmin: {
            dev: {
                options: {
                    banner: '<%= tag.banner %>',
                    sourceMap: true
                },
                files: concatenate.js.dev
            },
            dist: {
                options: {
                    banner: '<%= tag.banner %>'
                },
                files: concatenate.js.dist
            }
        },
        jshint: {
            files: {
                src: [
                    '<%= project.assets %>js/**/*.js',
                    '!<%= project.assets %>js/dist/*.js',
                    '!<%= project.assets %>js/vendor/*.js'
                ]
            },
            options: {
                jshintrc: '.jshintrc'
            }
        },
        cssmin: {
            dev: {
                options: {
                    banner: '<%= tag.banner %>'
                },
                files: concatenate.css.dev
            },
            dist: {
                options: {
                    banner: '<%= tag.banner %>'
                },
                files: concatenate.css.dist
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-coffee');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    /**
     * Below code is taken from grunt-contrib-uglify, with one tiny
     * change added: it looks into files looking for file name containing
     * '.coffee.js' and (if founded) set options.sourceMapIn to
     * '<name>.coffee.js.map'.
     *
     * You ask why?
     *
     * I have something like this in grunt-contrib-uglify configuration:
     *
     *     dist: {
     *         options: {
     *             // bla, bla
     *         },
     *         files: {
     *             'index.min.dist.js': [
     *                 'vendor/jquery.min.js',
     *                 'vendor/some-important-lib.js',
     *                 'index.coffee.js'
     *             ],
     *             'contact.min.dist.js': [
     *                 'vendor/jquery.min.js',
     *                 'contact.coffee.js'
     *             ],
     *             // ect
     *         }
     *     }
     * 
     * So, for EVERY key in `files` I want to provide different map generated
     * by grunt-contrib-coffee. Standard grunt-contrib-uglify does not allow
     * to do that (I really don't understand why, maybe I don't know something?).
     */
    grunt.registerMultiTask('jsmin', 'Minify files with UglifyJS.', function() {
        // Internal lib.
        var uglify = require('./node_modules/grunt-contrib-uglify/tasks/lib/uglify').init(grunt);
        var path = require('path');
        var chalk = require('chalk');
        var maxmin = require('maxmin');

        // Generate the default source map name
        var getSourceMapLocation = function( dest ) {

            var destExt = path.extname(dest);
            var destDirname = path.dirname(dest);
            var destBasename = path.basename(dest, destExt);

            return destDirname + path.sep + destBasename + ".map";

        };

        // Return the relative path from file1 => file2
        var relativePath = function(file1, file2) {

            var file1Dirname = path.dirname(file1);
            var file2Dirname = path.dirname(file2);
            if (file1Dirname !== file2Dirname) {
                return path.relative(file1Dirname, file2Dirname) + path.sep;
            } else {
                return "";
            }
        };

        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            banner: '',
            footer: '',
            compress: {
                warnings: false
            },
            mangle: {},
            beautify: false,
            report: 'min'
        });

    // Process banner.
    var banner = options.banner;
    var footer = options.footer;
    var mapNameGenerator, mapInNameGenerator;

    // Iterate over all src-dest file pairs.
    this.files.forEach(function(f) {
        var src = f.src.filter(function(filepath) {
            // Warn on and remove invalid source files (if nonull was set).
            if (!grunt.file.exists(filepath)) {
                grunt.log.warn('Source file ' + chalk.cyan(filepath) + ' not found.');
                return false;
            } else {
                return true;
            }
        });

        src.forEach(function(filepath) {
            if (filepath.indexOf('.coffee.js') !== -1) {
                options.sourceMapIn = filepath + '.map';
            }
        });

        if (src.length === 0) {
            grunt.log.warn('Destination ' + chalk.cyan(f.dest) + ' not written because src files were empty.');
            return;
        }

        // function to get the name of the sourceMap
        if (typeof options.sourceMapName === "function") {
            mapNameGenerator = options.sourceMapName;
        }

        // function to get the name of the sourceMapIn file
        if (typeof options.sourceMapIn === "function") {
            if (src.length !== 1) {
                grunt.fail.warn('Cannot generate `sourceMapIn` for multiple source files.');
            }
            mapInNameGenerator = options.sourceMapIn;
        }

        // dynamically create destination sourcemap name
        if (mapNameGenerator) {
            try {
                options.generatedSourceMapName = mapNameGenerator(f.dest);
            } catch (e) {
                var err = new Error('SourceMap failed.');
                err.origError = e;
                grunt.fail.warn(err);
            }
        }
        // If no name is passed, generate the default name
        else if ( !options.sourceMapName ) {
            options.generatedSourceMapName = getSourceMapLocation( f.dest );
        } else {
            options.generatedSourceMapName = options.sourceMapName;
        }

        // Dynamically create incoming sourcemap names
        if (mapInNameGenerator) {
            try {
                options.sourceMapIn = mapInNameGenerator(src[0]);
            } catch (e) {
                var err = new Error('SourceMapInName failed.');
                err.origError = e;
                grunt.fail.warn(err);
            }
        }

        // Calculate the path from the dest file to the sourcemap for the
        // sourceMappingURL reference
        if (options.sourceMap) {
            var destToSourceMapPath = relativePath(f.dest, options.generatedSourceMapName);
            var sourceMapBasename = path.basename(options.generatedSourceMapName);
            options.destToSourceMap = destToSourceMapPath + sourceMapBasename;
        }

        // Minify files, warn and fail on error.
        var result;
        try {
            result = uglify.minify(src, f.dest, options);
        } catch (e) {
            console.log(e);
            var err = new Error('Uglification failed.');
            if (e.message) {
                err.message += '\n' + e.message + '. \n';
                if (e.line) {
                    err.message += 'Line ' + e.line + ' in ' + src + '\n';
                }
            }
            err.origError = e;
            grunt.log.warn('Uglifying source ' + chalk.cyan(src) + ' failed.');
            grunt.fail.warn(err);
        }

        // Concat minified source + footer
        var output = result.min + footer;

        // Only prepend banner if uglify hasn't taken care of it as part of the preamble
        if (!options.sourceMap) {
            output = banner + output;
        }

        // Write the destination file.
        grunt.file.write(f.dest, output);

        // Write source map
        if (options.sourceMap) {
            grunt.file.write(options.generatedSourceMapName, result.sourceMap);
            grunt.log.writeln('File ' + chalk.cyan(options.generatedSourceMapName) + ' created (source map).');
        }

        grunt.log.writeln('File ' + chalk.cyan(f.dest) + ' created: ' +
            maxmin(result.max, output, options.report === 'gzip'));
        });
    });
};