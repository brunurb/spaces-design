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

define(function (require, exports) {
    "use strict";

    var Promise = require("bluebird"),
        CCLibraries = require("file://shared/libs/cc-libraries-api-min.js"),
        descriptor = require("adapter/ps/descriptor");

    var events = require("../events");

    var _accessToken = null;

    var getAccessToken = function (callback) {
        if (_accessToken) {
            callback(null, _accessToken);
        } else {
            descriptor.getProperty("application", "imsStatus")
                .then(function (imsStatus) {
                    _accessToken = imsStatus._value.imsAccessToken;
                    callback(null, imsStatus._value.imsAccessToken);
                });
        }
    };

    var beforeStartupCommand = function () {
        var dependencies = {
            vulcanCall: function (requestType, requestPayload, responseType, callback) {
                debugger;
            }
        };

        CCLibraries.configure({}, {
            STORAGE_API_KEY: "PhotoshopSpacesLibrary1"
        });
        return Promise.resolve();
    };

    /**
     * After startup, load the libraries
     * 
     * @return {Promise}
     */
    var afterStartupCommand = function () {
        var options = {
            STORAGE_HOSTNAME: "cc-api-storage-stage.adobe.io",
            getAccessToken: getAccessToken
        };
        
        CCLibraries.loadLibraryCollection(options, function (err, libraryCollection) {
            if (err) {
                console.log(err);
                return;
            }
            // Print out the names of all the libraries:
            libraryCollection.libraries.forEach(function (library) {
                console.log(library.name);
            });
        });
        this.dispatch(events.libraries.FAKE_DATA, {});

        return Promise.resolve();
    };

    var beforeStartup = {
        command: beforeStartupCommand,
        reads: [],
        writes: []
    };

    var afterStartup = {
        command: afterStartupCommand,
        reads: [],
        writes: []
    };

    exports.beforeStartup = beforeStartup;
    exports.afterStartup = afterStartup;
});
