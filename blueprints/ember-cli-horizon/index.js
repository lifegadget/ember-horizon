/*jshint node:true*/
module.exports = {
  description: 'Default blueprint to be run after install.',
  normalizeEntityName: function() {
    // this prevents an error when the entityName is not specified
	},
  afterInstall: function() {
    return this.addPackagesToProject([
      { name: '@horizon/client', target: '^1.1.1' },
      { name: 'bufferutil', target: '^1.2.1'  },
      { name: 'utf-8-validate', target: '^1.2.1' },
      { name: 'ember-browserify', target: '^1.1.9' }
    ]);
  }
};
