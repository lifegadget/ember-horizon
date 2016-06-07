import Ember from 'ember';

export default Ember.Route.extend({
  model() {
    return this.store.findAll('todo');
  },

  actions: {
    addTodo(e) {
      e.preventDefault();
      console.log('adding Todo');
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
      this.store.createRecord('todo', newTodo).save();
    }
  }
});
