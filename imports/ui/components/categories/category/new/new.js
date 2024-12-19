import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { AutoForm } from 'meteor/aldeed:autoform';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Categories } from '../../../../../api/categories/categories';
import { Races } from '../../../../../api/races/races';
import Common from '../../../../../../both/lib/common';

import './new.html';


AutoForm.hooks({
  newCategoryForm: {
    beginSubmit() {
    },
    formToDoc(doc) {
      return doc;
    },
    onSubmit(insertDocum) {
      const doc = insertDocum;
      Meteor.call('categories.insert', doc, (err, result) => {
        if (err) {
          // Duplicate Alternate Name
          const validationContext = Categories.simpleSchema().namedContext('newCategoryForm');
          validationContext.addValidationErrors([{ name: 'identifier', type: 'notUnique' }]);
          this.done(new Error('Category insertion failed'));
        }
        if (result && result.length > 0) {
          this.done(null, result);
        }
      });
      return false;
    },
    onSuccess(formType, result) {
      FlowRouter.go('admin.categories', {}, {});
      Materialize.toast('New category created', 4000);
    },
    onError(formType, error) {
      console.log(error);
    },
  },
});

Template.newCategory.onCreated(function () {
  const template = Template.instance();
  const handlerCategories = template.subscribe('categories.all');
  const handlerRaces = template.subscribe('races.all');

  template.autorun(function () {
    if (handlerCategories.ready() && handlerRaces.ready()) {
      $(document).ready(() => {
        $('select').material_select();
      });
    }
  });
});

Template.newCategory.helpers({
  categoriesCollection() {
    return Categories;
  },
  raceIds() {
    return Races.find({}).map(function(race) {
      return { value: race._id, label: race.name };
    });
  },
});

Template.newCategory.events({
});
