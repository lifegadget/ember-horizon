import Ember from 'ember';
const { inject: {service}, RSVP: {Promise} } = Ember; // jshint ignore:line

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
      let personPromise;
      if(ownedBy) {
        personPromise = this.store.findRecord('person', ownedBy);
      } else {
        personPromise = Promise.resolve();
      }

      personPromise.then(person => {
        const newTodo = {
          name: name,
          due: due,
          ownedBy: person
        };
        if(name) {
          console.log('adding Todo');
          this.store.createRecord('todo', newTodo).save().then(todo => {
            console.log(`The todo's name is ${todo.get('name')}, id is ${todo.get('id')}`);
          });
          // const newTodo = this.store.createRecord('todo', newTodo);
          // newTodo.save().then(todo => {
          //   console.log('The TODO before person save: ', todo);
          //   person.get('owns').pushObject(todo);
          //   person.save();
          // });
        } else {
          console.warn('You didn\'t enter a name/description for the TODO so ignoring.');
          this.get('flashMessages').danger(`You didn't enter a name/description for the TODO so ignoring.`);
        }

      })
      .catch(err => {
        console.error(`Problem finding person ${ownedBy}`, err);
      });
    },
    deleteTodo(id) {
      this.store.findRecord('todo', id)
        .then(todo => todo.destroyRecord())
        .catch(err => {
          console.warn(`Problem deleting TODO ${id}: `, err);
        });
    }
  }
});
