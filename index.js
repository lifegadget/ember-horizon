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
      var horizonConfig = Object.assign(_.get(config, 'horizon', {}), {
        host: 'localhost:8181',
        authType: 'anonymous'
      });
      var protocol = horizonConfig.host.match(/(localhost|127.0.0.1)/) ? 'http://' : 'https://';
      return '<script id="client-driver" src="' + protocol + horizonConfig.host + '/horizon/horizon.js"></script>';
    }
  }
};
