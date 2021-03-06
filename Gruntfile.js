/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

/* jshint browser: false, node: true */

module.exports = function (grunt) {
    "use strict";

    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: true
            },
            all: [
                "bower.json",
                "package.json",
                "*.js",
                "src/js/**/*.js",
                "src/nls/**/*.js",
                "test/**/*.js",
                "src/js/jsx/**/*.jsx",
                "test/spec/jsx/**/*.jsx"
            ]
        },
        jscs: {
            src: "<%= jshint.all %>",
            options: {
                config: ".jscsrc"
            }
        },

        clean: ["./build"],
        copy: {
            requirejs: { src: "bower_components/requirejs/require.js", dest: "build/js/require.js" },
            html: { src: "src/index-build.html", dest: "build/index.html" },
            img: { expand: true, cwd: "src/img", src: "**", dest: "build/img/" }
        },
        requirejs: {
            compile: {
                options: {
                    baseUrl: "src/",
                    mainConfigFile: "src/js/config.js",
                    name: "js/main",
                    out: "build/js/main.js",
                    // optimize: "none",
                    paths: {
                        "react": "../bower_components/react/react-with-addons.min",
                        "JSXTransformer": "../bower_components/jsx-requirejs-plugin/js/JSXTransformer"
                    },
                    stubModules: ["jsx"],
                    exclude: ["JSXTransformer"],
                    useStrict: true
                }
            }
        },
        less: {
            production: {
                files: {
                    "build/style/style.css": "src/style/main.less"
                }
            }
        }

    });

    grunt.loadNpmTasks("grunt-jsxhint");
    grunt.loadNpmTasks("grunt-jscs");

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-requirejs");
    grunt.loadNpmTasks("grunt-contrib-less");

    grunt.registerTask("test", ["jshint", "jscs"]);
    grunt.registerTask("build", [
        "test", "clean", "copy:requirejs", "copy:html", "copy:img", "requirejs", "less"
    ]);
    grunt.registerTask("default", ["test"]);
};
