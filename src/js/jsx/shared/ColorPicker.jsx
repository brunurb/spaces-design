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


define(function (require, exports, module) {
    "use strict";


var React = require("react"),
    PureRenderMixin = React.addons.PureRenderMixin,
    classSet = React.addons.classSet,
    tinycolor = require("tinycolor"),
    _ = require("lodash");

    var clamp = function (val, min, max) {
        return val < min? min: (val > max? max: val);
    };

    /**
     * Mixin for drag-and-drop functionality. Clients should call _startUpdates
     * on mousedown/touchstart and implement the abstract method _updatePosition.
     */
    var DraggableMixin = {

        propTypes: {
            onChange: React.PropTypes.func,
            max: React.PropTypes.number
        },

        getDefaultProps: function () {
            return {
                onChange: _.identity,
                max: 1
            };
        },

        getInitialState: function () {
            return {
                active: false
            };
        },

        componentDidMount: function () {
            document.addEventListener("mousemove", this._handleUpdate);
            document.addEventListener("touchmove", this._handleUpdate);
            document.addEventListener("mouseup", this._stopUpdates);
            document.addEventListener("touchend", this._stopUpdates);
        },

        componentWillUnmount: function () {
            document.removeEventListener("mousemove", this._handleUpdate);
            document.removeEventListener("touchmove", this._handleUpdate);
            document.removeEventListener("mouseup", this._stopUpdates);
            document.removeEventListener("touchend", this._stopUpdates);
        },

        /**
         * Handler for the start-drag operation.
         * 
         * @private
         * @param {SyntheticEvent} e
         */
        _startUpdates: function (e) {
            e.preventDefault();
            var coords = this._getPosition(e);
            this.setState({ active: true });
            this._updatePosition(coords.x, coords.y);
        },

        /**
         * Handler for the update-drag operation.
         * 
         * @private
         * @param {SyntheticEvent} e
         */
        _handleUpdate: function (e) {
            if (this.state.active) {
                e.preventDefault();
                var coords = this._getPosition(e);
                this._updatePosition(coords.x, coords.y);
            }
        },

        /**
         * Handler for the stop-drag operation.
         * 
         * @private
         */
        _stopUpdates: function () {
            if (this.state.active) {
                this.setState({ active: false });
            }
        },

        /**
         * Helper function to extract the position a move or touch event.
         * 
         * @param {SyntheticEvent} e
         * @return {{x: number, y: num}}
         */
        _getPosition: function (e) {
            if (e.touches) {
                e = e.touches[0];
            }

            return {
                x: e.clientX,
                y: e.clientY
            };
        },

        /**
         * Transform the given value into a percentage relative to props.max.
         * 
         * @param {number} value
         * @return {string}
         */
        _getPercentageValue: function (value) {
            return (value / this.props.max) * 100 + "%";
        },

        /**
         * Scale the given value into the range [0,props.max].
         * 
         * @param {number} value
         * @return {number}
         */
        _getScaledValue: function (value) {
            return clamp(value, 0, 1) * this.props.max;
        }

    };

    /**
     * Vertical or horizontal slider component.
     * 
     * @constructor
     */
    var Slider = React.createClass({

        mixins: [DraggableMixin, PureRenderMixin],

        propTypes: {
            vertical: React.PropTypes.bool.isRequired,
            value: React.PropTypes.number.isRequired,
            hue: React.PropTypes.number
        },

        getDefaultProps: function () {
            return {
                value: 0
            };
        },

        /**
         * Implementation of the Draggable mixin's abstract method for handling
         * position chagnes.
         * 
         * @param {number} clientX
         * @param {number} clientY
         */
        _updatePosition: function (clientX, clientY) {
            var rect = this.getDOMNode().getBoundingClientRect();

            var value;
            if (this.props.vertical) {
              value = (rect.bottom - clientY) / rect.height;
            } else {
              value = (clientX - rect.left) / rect.width;
            }

            value = this._getScaledValue(value);
            this.props.onChange(value);
        },

        /**
         * Get the position of the slider pointer in CSS.
         * 
         * @private
         */
        _getSliderPositionCss: function () {
            var obj = {};
            var attr = this.props.vertical ? "bottom": "left";
            obj[attr] = this._getPercentageValue(this.props.value);
            return obj;
        },

        render: function () {
            var classes = classSet({
                "color-picker-slider": true,
                "color-picker-slider__vertical": this.props.vertical,
                "color-picker-slider__horizontal": !this.props.vertical
            });

            var overlay;
            if (this.props.hasOwnProperty("hue")) {
                // this is an alpha slider
                var bgColor = tinycolor({h: this.props.hue, s: 1, v: 1, a: this.props.value}).toHexString(),
                    bgGradient = "linear-gradient(to right, rgba(1, 1, 1, 0) 0%, " + bgColor + " 100%)";

                overlay = (
                    <div className="color-picker-slider__track-overlay" style={{
                        background: bgGradient
                    }} />
                );
            } else {
                overlay = null;
            }

            return (
                <div
                    className={classes}
                    onMouseDown={this._startUpdates}
                    onTouchStart={this._startUpdates}
                >
                    <div className="color-picker-slider__track" />
                    {overlay}
                    <div className="color-picker-slider__pointer" style={this._getSliderPositionCss()} />
                </div>
            );
        }
    });

    /**
     * Color map component.
     * 
     * @constructor
     */
    var Map = React.createClass({

      mixins: [DraggableMixin, PureRenderMixin],

        propTypes: {
            x: React.PropTypes.number,
            y: React.PropTypes.number,
            backgroundColor: React.PropTypes.string
        },

        getDefaultProps: function () {
            return {
                x: 0,
                y: 0,
                backgroundColor: "transparent"
            };
        },

        /**
         * Implementation of the Draggable mixin's abstract method for handling
         * position chagnes.
         * 
         * @param {number} clientX
         * @param {number} clientY
         */
        _updatePosition: function (clientX, clientY) {
            var rect = this.getDOMNode().getBoundingClientRect();
            var x = (clientX - rect.left) / rect.width;
            var y = (rect.bottom - clientY) / rect.height;

            x = this._getScaledValue(x);
            y = this._getScaledValue(y);

            this.props.onChange(x, y);
        },

        render: function () {
            var classes = classSet({
                "color-picker-map": true,
                "color-picker-map__active": this.state.active
            });

            return (
                <div
                    className={this.props.className + " " + classes}
                    onMouseDown={this._startUpdates}
                    onTouchStart={this._startUpdates}
                >
                <div className="color-picker-map__background" style={{
                    backgroundColor: this.props.backgroundColor
                }} />
                <div className="color-picker-map__pointer" style={{
                    left: this._getPercentageValue(this.props.x),
                    bottom: this._getPercentageValue(this.props.y)
                }} />
              </div>
            );
        }
    });

    /**
     * A color-picker component.
     * 
     * @constructor
     */
    var ColorPicker = React.createClass({
        mixins: [PureRenderMixin],

        getDefaultProps: function () {
            return {
                color: "#000000"
            };
        },

        getInitialState: function () {
            return this._getStateFrom(this.props.color);
        },

        componentWillReceiveProps: function (nextProps) {
            var nextColor = nextProps.color,
                currentColor = this.state.color.toHexString();

            if (nextColor.toLowerCase() !== currentColor.toLowerCase()) {
                this.setState(this._getStateFrom(nextColor));
            }
        },

        /**
         * Convert color props to a color state object.
         * 
         * @private
         * @param {object|string} color
         */
        _getStateFrom: function (color) {
            return {
                color: tinycolor(color)
            };
        },

        /**
         * Get the luminosity of the current color.
         * 
         * @private
         * return {number} The luminosity in [0,1].
         */
        _getLuminosity: function () {
            var hsl = this.state.color.toHsl();
            return tinycolor(hsl).greyscale().getBrightness() / 255;
        },

        /**
         * Get the hue of the color color, formatted as a hex string.
         * 
         * @return {string}
         */
        _getBackgroundHue: function () {
            var hsv = this.state.color.toHsv();
            return tinycolor({h: hsv.h, s: 100, v: 100}).toHexString();
        },

        /**
         * Event handler for the transparency slider.
         * 
         * @param {number} alpha
         */
        _handleTransparencyChange: function (alpha) {
            var hsv = this.state.color.toHsv();
            this._update({
                h: hsv.h,
                s: hsv.s,
                v: hsv.v,
                a: alpha
            });
        },

        /**
         * Event handler for the hue slider.
         * 
         * @param {number} hue
         */
        _handleHueChange: function (hue) {
            var hsv = this.state.color.toHsv();
            this._update({
                h: hue,
                s: hsv.s,
                v: hsv.v,
                a: hsv.a
            });
        },

        /**
         * Event handler for the color map, which determines the color
         * saturation and color value.
         * 
         * @param {number} saturation
         * @param {number} value
         */
        _handleSaturationValueChange: function (saturation, value) {
            var hsv = this.state.color.toHsv();
            this._update({
                h: hsv.h,
                s: saturation,
                v: value,
                a: hsv.a
            });
        },

        /**
         * Update the current color from an hsva object.
         * 
         * @param {{h: number, s: number, v: number, a: number}} hsva
         */
        _update: function (hsva) {
            var color = tinycolor(hsva);
            this.props.onChange(color.toRgbString());
            this.setState({ color: color });
        },

        render: function () {
            var luminosity = this._getLuminosity(),
                hue = this._getBackgroundHue(),
                hsv = this.state.color.toHsv();

            var classes = classSet({
                "color-picker-map__dark": luminosity <= 0.5,
                "color-picker-map__light": luminosity > 0.5
            });

            return (
                <div className="color-picker">
                    <div className="color-picker__hue-slider">
                        <Slider
                            vertical={false}
                            value={hsv.h}
                            max={360}
                            onChange={this._handleHueChange}
                        />
                    </div>
                    <div className="color-picker__transparency-slider">
                        <Slider
                            vertical={false}
                            value={hsv.a}
                            hue={hsv.h}
                            max={1}
                            onChange={this._handleTransparencyChange}
                        />
                    </div>
                    <Map
                        x={hsv.s}
                        y={hsv.v}
                        max={1}
                        className={classes}
                        backgroundColor={hue}
                        onChange={this._handleSaturationValueChange}
                    />
                </div>
            );
        }
    });

    module.exports = ColorPicker;
});