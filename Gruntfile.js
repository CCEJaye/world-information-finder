module.exports = function (grunt) {
    grunt.initConfig({
        concat: {
            css: {
                src: ["src/css/reset.css", "src/css/components.css", "src/css/main.css", "src/css/type.css", "src/css/anim.css"],
                dest: "temp/index-concat.css"
            },
            js: {
                src: ["src/js/*.js", "!src/js/index.js", "src/js/index.js"],
                dest: "temp/index-concat.js"
            }
        },
        autoprefixer: {
            css: {
                src: "temp/index-concat.css",
                dest: "temp/index-prefixed.css"
            }
        },
        cssmin: {
            index: {
                src: "temp/index-prefixed.css",
                dest: "temp/index.min.css"
            }
        },
        uglify: {
            js: {
                files: [{
                    src: "temp/index-concat.js",
                    dest: "temp/index.min.js"
                }]
            }
        },
        htmlmin: {
            index: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: [{
                    src: "src/index.html",
                    dest: "temp/index.min.html"
                }]
            }
        },
        copy: {
            css: {
                src: "temp/index.min.css",
                dest: "dist/public_html/world-information-finder/css/index.css",
            },
            js: {
                src: "temp/index.min.js",
                dest: "dist/public_html/world-information-finder/js/index.js",
                options: {
                    process: function(content) {
                        return content.replace(/(\\n[\s]+)/g, "");
                    }
                }
            },
            html: {
                src: "temp/index.min.html",
                dest: "dist/public_html/world-information-finder/index.html"
            },
            server: {
                expand: true,
                cwd: "src/server",
                src: "**/*.*",
                dest: "dist/scripts/"
            },
            other: {
                expand: true,
                cwd: "src",
                src: ["**/*.*", "!{{css,server,js}/**/*.*,index.html}"],
                dest: "dist/public_html/world-information-finder/"
            }
        },
        clean: {
            dist: ["dist", "temp"]
        },
        watch: {
            options: {
                spawn: false,
                debounceDelay: 50
            },
            css: {
                files: "src/css/*.css",
                tasks: ["concat:css", "autoprefixer:css", "cssmin:index", "copy:css"]
            },
            js: {
                files: "src/js/*.js",
                tasks: ["concat:js", "uglify:js", "copy:js"]
            },
            html: {
                files: "src/index.html",
                tasks: ["htmlmin:index", "copy:html"]
            },
            server: {
                files: "src/server/**/*.*",
                tasks: "copy:server"
            },
            other: {
                files: ["src/**/*.*", "!src/{{css,server}/**/*.*,js/**/*.js,index.html}"],
                tasks: "copy:other"
            }
        }
    });
    grunt.loadNpmTasks("grunt-autoprefixer");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-uglify-es");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.registerTask("default", "watch");
    grunt.registerTask("build", [
        "clean:dist",
        "concat",
        "autoprefixer",
        "cssmin",
        "uglify",
        "htmlmin",
        "copy"
    ]);
};