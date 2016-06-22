import workflow from 'dummy/utils/workflow';
import { module, test } from 'qunit';

module('Unit | Utility | workflow');

// Replace this with your real tests.
test('it works', function(assert) {
  let state = {};
  let result = workflow(state, 'get-this-party-started');
  assert.ok(result);
});
