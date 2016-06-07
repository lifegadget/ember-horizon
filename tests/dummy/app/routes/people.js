import Ember from 'ember';

export default Ember.Route.extend({

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
      }
    },
    deleteUser(id) {
      console.log(`deleting user ${id}`);
      this.store.findRecord('person', id).then(person => person.destroyRecord());
    }
  }
});
