import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { AutoForm } from 'meteor/aldeed:autoform';
import { Users } from '/imports/api/users/users.js';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Roles } from 'meteor/alanning:roles';

import './edit-profile-admin.html';

AutoForm.hooks({
  editProfileAdminForm: {
    before: {
      update(doc) {
        return doc;
      },
    },
    after: {
      update(error, result) {
        if (error) {
          if (error.reason) {
            alert(error.reason);
          }
        } else if (result) {
          Materialize.toast('Profile updated successfully', 4000);
          // Continues to '/'
          FlowRouter.go('admin.users');
        }
      },
    },
  },
});

Template.editProfileAdmin.onCreated(function () {
  const template = Template.instance();
  const userId = FlowRouter.getParam('userId');
  const handler = template.subscribe('clubs.all');
  const handlerCountries = template.subscribe('countries.all');
  const handlerUser = template.subscribe('users.byId', userId);
  template.currentUser = new ReactiveVar(null);
  template.autorun(() => {
    if (handlerUser.ready()) {
      if (userId && userId.length > 0) {
        template.currentUser.set(Meteor.users.findOne({ _id: userId }));
      }
    }
  });
});

Template.editProfileAdmin.helpers({
  currentUser() {
    // Load the checkpoint specified on the param
    const template = Template.instance();
    return template.currentUser.get();
  },
  email() {
    const template = Template.instance();
    const currentUser = template.currentUser.get();
    if (currentUser && currentUser.emails && currentUser.emails.length > 0) {
      return currentUser.emails[0].address;
    }
    return '';
  },
  usersCollection() {
    return Users;
  },
  usersSchema() {
    return Users.simpleSchema();
  },
});

Template.editProfileAdmin.events({
  // Update the hidden field 'name'
  'change input[name="profile.firstName"]'() {
    const name = `${$('input[name="profile.firstName"]').val()} ${$('input[name="profile.lastName"]').val()}`;
    $('input[name="profile.name"]').val(name);
  },
  'change input[name="profile.lastName"]'() {
    const name = `${$('input[name="profile.firstName"]').val()  } ${  $('input[name="profile.lastName"]').val()}`;
    $('input[name="profile.name"]').val(name);
  },
});
