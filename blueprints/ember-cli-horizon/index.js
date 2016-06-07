/*jshint node:true*/
var chalk = require('chalk');
var RSVP = require('rsvp');

module.exports = {
  description: 'ember-cli-horizon blueprint',
  normalizeEntityName: function() {
    // this prevents an error when the entityName is not specified
	},
  afterInstall: function() {
    var self = this;
    return new RSVP.Promise(function(resolve, reject) {

      self.addPackagesToProject([
          { name: '@horizon/client', target: '^1.1.1' },
          { name: 'bufferutil', target: '^1.2.1'  },
          { name: 'utf-8-validate', target: '^1.2.1' },
          { name: 'ember-browserify', target: '^1.1.9' }
      ])
        .then(function() {
          console.log(chalk.green.bold('ember-cli-horizon') + ' has been installed along with all client dependencies.');
          console.log('  - in order to use this you will need to install the Horizon server,');
          console.log('    you can find more information here: ' + chalk.blue.underline('http://horizon.io/install/'));
          console.log();
          console.log('In development mode you can serve both Horizon server and Ember\'s "serve" by');
          console.log('using the ' + chalk.bold('ember horizon:serve') + ' command.');
          console.log();
          resolve(true);
        })
        .catch(reject);

    });
  },
};
