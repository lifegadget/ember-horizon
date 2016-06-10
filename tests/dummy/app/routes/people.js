import Ember from 'ember';
const { inject: {service} } = Ember; // jshint ignore:line

export default Ember.Route.extend({
  flashMessages: service(),

  model() {
    return this.store.findAll('person');
  },

  actions: {
    addUser(e) {
      e.preventDefault();
      const userName = Ember.$('#addUser').val();
      if(userName) {
        console.log(`adding user "${userName}"`);
        this.store.createRecord('person', {name: userName}).save();
        Ember.$('#addUser').val('');
      } else {
        console.warn('There was no user name to add!');
        this.get('flashMessages').danger(`You didn't enter a name so ignoring request to add a PERSON.`);
      }
    },
    deleteUser(id) {
      console.log(`deleting user ${id}`);
      this.store.findRecord('person', id).then(person => {
        console.log(person.get('id'));
        const deletions = person.get('owns').map(todo => {
          return todo.destroyRecord();
        });

        Ember.RSVP.all(deletions)
          .then(() => person.destroyRecord())
          .catch(err => console.warn(`Problem deleting Person ${id}: `, err));
      });
    }
  }
});
