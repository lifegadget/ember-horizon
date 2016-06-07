/* jshint node: true */
'use strict';

var commands = require('./lib/commands');

module.exports = {
  name: 'ember-cli-horizon',
  includedCommands() {
    return commands;
  },
  contentFor(type, config) {
    if (type === 'head') {
      var horizonConfig = config['horizon'];
      var protocol = horizonConfig.host.match(/(localhost|127.0.0.1)/) ? 'http://' : 'https://';
      return '<script src="' + protocol + horizonConfig.host + '/horizon/horizon.js"></script>';
    }
  }
};
