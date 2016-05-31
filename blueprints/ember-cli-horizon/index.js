/*jshint node:true*/
module.exports = {
    description: 'Default blueprint to be run after install.',

    afterInstall: function() {
        return this.addPackagesToProject([
            { package: '@horizon/client' },
            { package: 'ember-browserify' }
        ]);
    }
};
