import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { AutoForm } from 'meteor/aldeed:autoform';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Categories } from '../../../../../api/categories/categories';
import { Races } from '../../../../../api/races/races';
import Common from '../../../../../../both/lib/common';

import './edit.html';


function removeCategory() {
  const categoryIdentifier = FlowRouter.getParam('categoryIdentifier');
  if (categoryIdentifier && categoryIdentifier.length > 0) {
    Meteor.call('categories.delete', categoryIdentifier, function(error, result) {
      if (error) {
        console.log(error);
      } else if (result > 0) {
        Materialize.toast('The category was deleted', 4000);
      } else {
        Materialize.toast('The category could not be deleted (in use?)', 4000);
      }
    });
    FlowRouter.go('admin.categories');
  }
}

AutoForm.hooks({
  editCategoryForm: {
    before: {
      update(docUpdate) {
        return docUpdate;
      },
    },
    formToDoc(doc) {
      const docToUpdate = doc;
      return docToUpdate;
    },
    after: {
      update(error, result) {
        if (error) {
          if (error.reason) {
            console.log(error.reason);
          }
        } else if (result) {
          FlowRouter.go('admin.categories');
          Materialize.toast('The category was successfully updated', 4000);
        }
      },
    },
  },
});


Template.editCategory.onCreated(function () {
  const template = Template.instance();

  const categoryIdentifier = FlowRouter.getParam('categoryIdentifier');
  if (!categoryIdentifier) {
    console.log('No categoryIdentifier received');
    return;
  }
  const handlerRaces = template.subscribe('races.all');
  const handlerCategories = template.subscribe('categories.id', categoryIdentifier);

  template.autorun(function () {
    if (handlerRaces.ready() && handlerCategories.ready()) {
      $(document).ready(() => {
        $('select').material_select();
        $('#modalConfirmDeleteCategory').modal({
          dismissible: true,
          opacity: 0.5,
          startingTop: '40%',
          ready(modal, trigger) {
            $('#modalConfirmDeleteCategory .modal-ok').bind('click', (event) => {
              $('#modalConfirmDeleteCategory').modal('close');
              removeCategory();
            });
          },
        });
      });
    }
  });
});

Template.editCategory.helpers({
  currentDocument() {
    return Categories.findOne({ identifier: FlowRouter.getParam('categoryIdentifier') });
  },
  categoriesCollection() {
    return Categories;
  },
  raceIds() {
    return Races.find({}).map(function(race) {
      return { value: race._id, label: race.name };
    });
  },
});

Template.editCategory.events({
  'click .delete-category-button'(event) {
    $('#modalConfirmDeleteCategory').modal('open');
  },
});
