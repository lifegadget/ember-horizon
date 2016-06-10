import Ember from 'ember';
import RealTimeAdapterMixin from 'ember-cli-horizon/mixins/real-time-adapter';
import { module, test } from 'qunit';

module('Unit | Mixin | real time adapter');

// Replace this with your real tests.
test('it works', function(assert) {
  let RealTimeAdapterObject = Ember.Object.extend(RealTimeAdapterMixin);
  let subject = RealTimeAdapterObject.create();
  assert.ok(subject);
});
