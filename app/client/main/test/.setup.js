/*
 * This setup file is taken from Airbnb's guide:
 * https://github.com/lelandrichardson/enzyme-example-mocha
 */

process.env.NODE_ENV = 'test';

require('ignore-styles'); // eslint-disable-line import/no-extraneous-dependencies
require('babel-polyfill');

const jsdom = require('global-jsdom')(
  undefined,
  {
    url: 'http://www.google.com' // required to use LocalStorage API
  }
);

window.Error = {}; // openchemlib tries to set property of this object, so it must exist to use opchemlib as a dep.
window.Math = Math; // openchemlib doesnt play well with jsdom unless this is explicitly set


global.navigator = {
  userAgent: 'node.js'
};

global.Transcriptic = {
  current_user: {
    id: 'foo'
  },
  Views: {}
};

global.Feature = {
  can_delete_datasets: true
};

require('raf/polyfill');

// Required for react-modal
global.requestAnimationFrame = function (callback) {
  return setTimeout(callback, 0);
};
global.cancelAnimationFrame = function (id) {
  clearTimeout(id);
};

// bootsrap-sass requires jquery to be defined on the window
global.jQuery = require('jquery');
window.$ = require('jquery');
require('bootstrap-sass');

// Setup enzyme
// https://enzymejs.github.io/enzyme/docs/installation/react-16.html
global.enzyme = require('enzyme');
const Adapter = require('@wojtekmaj/enzyme-adapter-react-17');

global.enzyme.configure({ adapter: new Adapter() });

HTMLCanvasElement.prototype.getContext = () => { }; // required for avoiding triggering errors in tests for canvas elements

// required for avoiding misc 'Not Implemented errors'
confirm = () => { }; 
alert = () => { };  
