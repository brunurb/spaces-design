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

    var Promise = require("bluebird");

    var os = require("adapter/os"),
        log = require("js/util/log"),
        keyUtil = require("js/util/key");

    /**
     * Construct a semantic event from an adapter event.
     * 
     * @private
     * @param {{eventKind: number, keyCode: number=, keyChar: string=, modifiers: number}} event
     * @return {{keyCode: number=, keyChar: string=, modifiers: object}}
     */
    var _getEventDetail = function (event) {
        var detail = {
            modifierBits: event.modifiers,
            modifiers: keyUtil.bitsToModifiers(event.modifiers)
        };

        if (event.keyChar) {
            detail.keyChar = event.keyChar;
        } else if (event.hasOwnProperty("keyCode")) {
            detail.keyCode = event.keyCode;
        } else {
            switch (event.eventKind) {
            case os.eventKind.KEY_DOWN:
            case os.eventKind.KEY_UP:
                log.warn("Adapter key event has no key specification", event);
            }
        }

        return detail;
    };

    /**
     * Handler for EXTERNAL_KEYEVENT, used in beforeStartup.
     *
     * @private
     * @param {object} event
     */
    var _externalKeyEventHandler = function (event) {
        var type;
        switch (event.eventKind) {
        case os.eventKind.KEY_DOWN:
            type = "adapterKeydown";
            break;
        case os.eventKind.KEY_UP:
            type = "adapterKeyup";
            break;
        case os.eventKind.FLAGS_CHANGED:
            type = "adapterFlagsChanged";
            break;
        default:
            return;
        }

        var domEvent = new window.CustomEvent(type, {
            bubbles: true,
            detail: _getEventDetail(event)
        });

        window.document.activeElement.dispatchEvent(domEvent);
    };

    /**
     * Registers a key event handler to reflect adapter events back to the DOM.
     * 
     * @return {Promise}
     */
    var beforeStartupCommand = function () {
        os.addListener(os.notifierKind.EXTERNAL_KEYEVENT, _externalKeyEventHandler);

        return Promise.resolve();
    };

    /**
     * Remove event handlers.
     *
     * @private
     * @return {Promise}
     */
    var onResetCommand = function () {
        os.removeListener(os.notifierKind.EXTERNAL_KEYEVENT, _externalKeyEventHandler);

        return Promise.resolve();
    };

    var beforeStartup = {
        command: beforeStartupCommand,
        reads: [],
        writes: []
    };

    var onReset = {
        command: onResetCommand,
        reads: [],
        writes: []
    };

    exports.beforeStartup = beforeStartup;
    exports.onReset = onReset;
});
