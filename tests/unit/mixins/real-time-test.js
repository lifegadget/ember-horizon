import Ember from 'ember';
import RealTimeMixin from 'ember-cli-horizon/mixins/real-time';
import { module, test } from 'qunit';

module('Unit | Mixin | real time');

// Replace this with your real tests.
test('it works', function(assert) {
  let RealTimeObject = Ember.Object.extend(RealTimeMixin);
  let subject = RealTimeObject.create();
  assert.ok(subject);
});
