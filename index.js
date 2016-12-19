/* jshint node: true */
'use strict';
var _ = require('lodash');
var commands = require('./lib/commands');

module.exports = {
  name: 'ember-horizon',
  includedCommands: function() {
    return commands;
  },
  contentFor: function(type, config) {
    // Horizon Client Library
    if (type === 'head') {
      var horizonConfig = Object.assign({
        host: 'localhost:8181',
        authType: 'anonymous',
        secure: false,
        realTime: true
      }, _.get(config, 'horizon', {}));
      var protocol = horizonConfig.secure ? 'https://' : 'http://';
      return '<script id="client-driver" src="' + protocol + horizonConfig.host + '/horizon/horizon.js"></script>';
    }
  }
};
