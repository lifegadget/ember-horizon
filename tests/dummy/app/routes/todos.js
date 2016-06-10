import Ember from 'ember';
const { inject: {service} } = Ember; // jshint ignore:line

export default Ember.Route.extend({
  flashMessages: service(),

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
      if(name) {
        const newTodo = this.store.createRecord('todo', {
          name: name,
          due: due,
          ownedBy: person
        });
        person.get('owns').pushObject(newTodo);

        newTodo.save().then(() => {
          return person.save();
        });

      } else {
        console.warn('You didn\'t enter a name/description for the TODO so ignoring.');
        this.get('flashMessages').danger(`You didn't enter a name/description for the TODO so ignoring.`);
      }
    },
    deleteTodo(id) {
      this.store.findRecord('todo', id)
        .then(todo => {
          const ownedBy = todo.get('ownedBy');
          const person = this.store.peekRecord('person', ownedBy.get('id'));
          console.log(person.get('name'), person.get('id'));

          todo.destroyRecord().then(() => {
            person.save();
          })
          return todo;
        })
        .catch(err => {
          console.warn(`Problem deleting TODO ${id}: `, err);
        });
    }
  }
});
