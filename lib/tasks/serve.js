/* jshint node: true */
'use strict';

var runCommand = require('../utils/run-command');
var path       = require('path');
var linkEnv    = require('../tasks/link-environment');

module.exports = function(env, port, debug) {
  return;
  // REF: https://github.com/poetic/ember-cli-cordova/blob/v0.0.14/lib/tasks/build.js

  // var emberCommand = 'ember build --environment ' + env;
  //
  // var emberMsg   = 'Building ember project for environment ' + env;
  // var emberBuild = runCommand(emberCommand, emberMsg, {
  //   cwd: project.root
  // });
  //
  // var cdvCommand = 'cordova build ' + platform;
  //
  // if (env !== 'development') {
  //   cdvCommand += ' --release';
  // }
  //
  // var cdvMsg   = 'Building cordova project for platform ' + platform;
  // var cdvBuild = runCommand(cdvCommand, cdvMsg, {
  //   cwd: path.join(project.root, 'cordova')
  // });
  //
  // return function(){
  //   return linkEnv(project)().then(emberBuild).then(cdvBuild);
  // };
};
