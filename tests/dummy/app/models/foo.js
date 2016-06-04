import DS from 'ember-data';

export default DS.Model.extend({
    stringAttr: DS.attr('string'),
    numberAttr: DS.attr('number'),
    freeAttr: DS.attr()
});
