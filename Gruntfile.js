module.exports = function(grunt) {

    var isProduction = grunt.option('production') || false,
        pkg = grunt.file.readJSON('package.json');

    // Normalize assets path
    if (pkg.dcAssets && pkg.dcAssets[pkg.dcAssets.length-1] != '/') {
        pkg.dcAssets += '/';
    }

    grunt.initConfig({
        pkg: pkg,
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
            scss: {
                files: [
                    pkg.dcAssets + 'scss/**/*.scss'
                ],
                options: {
                    spawn: false
                },
                tasks: ['sass:dev']
            },
            js: {
                files: [
                    pkg.dcAssets + 'js/**/*.js',
                    '!<%= pkg.dcAssets %>js/dist/*.js',                
                ],
                options: {
                    spawn: false
                },
                tasks: ['jshint', 'uglify']
            },
            coffee: {
                files: [
                    pkg.dcAssets + 'coffee/**/*.coffee'                  
                ],
                options: {
                    spawn: false
                },
                tasks: ['coffee']
            }
        },
        sass: {
            dev: {
                options: {
                    style: 'compressed',
                    sourcemap: true,
                    banner: '<%= tag.banner %>'
                },
                files: [{
                    expand: true,
                    flatten: false,
                    cwd: pkg.dcAssets + 'scss/',
                    src: ['*.scss'],
                    dest: pkg.dcAssets + 'css/dist/',
                    ext: '.css'
                }]
            }
        },
        coffee: {
            glob_to_multiple: {
                expand: true,
                flatten: false,
                cwd: pkg.dcAssets + 'coffee/',
                src: ['**/*.coffee'],
                dest: pkg.dcAssets + 'js/',
                ext: '.js'
            },
        },
        uglify: {
            options: {
                banner: '<%= tag.banner %>'
            },
            index: {
                files: {
                    '<%= pck.dcAssets %>js/dist/index.min.js': [
                        pkg.dcAssets + 'js/vendor/jquery-1.10.2.min.js',
                        pkg.dcAssets + 'js/vendor/console.js'
                    ]
                }
            },
        },
        jshint: {
            files: [
                pkg.dcAssets + 'js/**/*.js',
                '!<%= pck.dcAssets %>js/dist/*.js',
                '!<%= pck.dcAssets %>/js/vendor/*.js'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-coffee');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    
   /*grunt.event.on('watch', function(action, filepath, target) {
        var path = require('path'),
            ext = path.extname(filepath);
        
        switch (ext) {
            case '.scss':
                grunt.task.run('sass:dev');
                break;
            case '.coffee':
                grunt.task.run('coffee', 'uglify');
                break;
            case '.js':
                grunt.task.run('uglify');
                break;
        }
    });*/
};