import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { AutoForm } from 'meteor/aldeed:autoform';
import { Categories } from '../../../../../api/categories/categories';

import './newModal.html';


AutoForm.hooks({
  newCategoryFormModal: {
    beginSubmit() {
    },
    formToDoc(doc) {
      return doc;
    },
    onSubmit(insertDocum) {
      const doc = insertDocum;
      doc.createdAt = new Date();
      // the temp ID for this race
      doc.raceId = this.template.data.raceId;
      Meteor.call('categories.insert', doc, (err, result) => {
        if (err) {
          // Duplicate Alternate Name
          const validationContext = Categories.simpleSchema().namedContext('newCategoryFormModal');
          validationContext.addValidationErrors([{ name: 'identifier', type: 'notUnique' }]);
          this.done(new Error('Category insertion failed'));
        }
        if (result && result.length > 0) {
          this.done(null, result);
        }
      });
      return false;
    },
    onSuccess(formType, idCategory) {
      $('#modalNewCategory').modal('close');
      Materialize.toast('New category created', 4000);
    },
    onError(formType, error) {
      console.log(error);
    },
  },
});

Template.newCategoryModal.onCreated(function () {
  const template = Template.instance();
  if (!template.data.raceId) return null;
});

Template.newCategoryModal.helpers({
  categoriesCollection() {
    return Categories;
  },
});
