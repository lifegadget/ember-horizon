import Ember from 'ember';
const {debug, typeOf} = Ember;
/**
 * Helps create a workflow stack for promise chains
 */
export default function(state, newState) {
  let wf = state.workflow || [];
  if (wf) {
    if(typeOf(wf) !== 'array') {
      debug('promise workflow was set but to a non-array value: ', wf);
      wf = [];
    }
    wf.push(newState);
  } else {
    wf = [ newState ];
  }
  return wf;
}
