import Ember from 'ember';
const { inject: {service} } = Ember; // jshint ignore:line

export default Ember.Route.extend({
  // flashMessage: service(),

  model() {
    return this.store.findAll('todo');
  },

  actions: {
    addTodo(e) {
      e.preventDefault();
      const name = Ember.$('#todo-name').val();
      const due = Ember.$('#todo-date').val();
      const ownedBy = Ember.$('#person-id').val();
      const person = this.store.peekRecord('person', ownedBy);
      const newTodo = {
        name: name,
        due: due,
        ownedBy: person
      };
      console.log(newTodo);
      if(name) {
        console.log('adding Todo');
        this.store.createRecord('todo', newTodo).save();
      } else {
        console.warn('You didn\'t enter a name/description for the TODO so ignoring.');
        this.get('flashMessages').success(`You didn't enter a name/description for the TODO so ignoring.`);
      }
    }
  }
});
