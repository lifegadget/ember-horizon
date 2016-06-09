import Ember from 'ember';
import WatchingMixin from 'ember-cli-horizon/mixins/watching';
import { module, test } from 'qunit';

module('Unit | Mixin | watching');

// Replace this with your real tests.
test('it works', function(assert) {
  let WatchingObject = Ember.Object.extend(WatchingMixin);
  let subject = WatchingObject.create();
  assert.ok(subject);
});
