/* jshint node: true */
'use strict';

module.exports = {
  name: 'horizon:serve',
  aliases: ['h:s'],
  description: 'Serve both Ember, Horizon server, and ReThinkDB.',
  works: 'insideProject',

  availableOptions: [
    { name: 'env', type: String, default: 'development' },
    { name: 'port', type: String, default: '4200' },
    { name: 'debug', type: Boolean, default: false },
  ],

  run: function(options) {
    return require('../tasks/serve')(options.port, options.debug)();
  }
};
