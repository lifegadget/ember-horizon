import Ember from 'ember';
const { RSVP: {Promise} } = Ember;

export default function logger() {
    console.log('logger: ', ...arguments);
    return Promise.resolve(...arguments);
}
