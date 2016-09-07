'use strict';
/* jshint node:true */
// var RSVP = require('rsvp');

// For details on each option run `ember help release`
module.exports = {
  // local: true,
  // remote: 'some_remote',
  // annotation: "Release %@",
  // message: "Bumped version to %@",
  // manifest: [ 'package.json', 'bower.json', 'someconfig.json' ],
  publish: true,
  strategy: 'semver',
  // format: 'YYYY-MM-DD',
  timezone: 'Europe/London',
  //
  // beforeCommit: function(project, versions) {
  //   return new RSVP.Promise(function(resolve, reject) {
  //     // Do custom things here...
  //   });
  // }
};
