import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { AutoForm } from 'meteor/aldeed:autoform';
import { Users } from '/imports/api/users/users.js';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Clubs } from '/imports/api/clubs/clubs.js';
import { Roles } from 'meteor/alanning:roles';

import './edit-profile.html';

AutoForm.hooks({
  editProfileForm: {
    before: {
      update(doc) {
        const docToUpdate = doc;
        if (!doc.$set['profile.clubId'] || (Clubs.find({ _id: doc.$set['profile.clubId'], name: doc.$set['profile.clubName'] }).count() === 0)) {
          // It is a new club
          const idClub = Clubs.insert({
            name: doc.$set['profile.clubName'],
          });
          docToUpdate.$set['profile.clubId'] = idClub;
          delete docToUpdate.$unset['profile.clubId'];
        }
        return docToUpdate;
      },
    },
    after: {
      update(error, result) {
        if (error) {
          if (error.reason) {
            alert(error.reason);
          }
        } else if (result) {
          Materialize.toast('Your profile was updated successfully', 4000);
          // Continues to '/'
          FlowRouter.go('App.home');
        }
      },
    },
  },
});

Template.editProfile.onCreated(function () {
  const template = Template.instance();
  const handlerCountries = template.subscribe('countries.all');
  const handlerClubs = template.subscribe('clubs.all');

  template.autorun(() => {
    if (handlerCountries.ready() && handlerClubs.ready()) {
      $(document).ready(() => {
        Meteor.typeahead.inject();
        $('select').material_select();
      });
    }
  });
});


Template.editProfile.helpers({
  currentUser() {
    return Meteor.user();
  },
  email() {
    const user = Meteor.users.findOne({ _id: Meteor.userId() });
    return user.emails[0].address;
  },
  usersCollection() {
    return Users;
  },
  usersSchema() {
    return Users.simpleSchema();
  },
  clubs() {
    return Clubs.find().fetch().map(function(club) { return { id: club._id, value: club.name }; });
  },
  selectedClub(event, suggestion, datasetName) {
    $('input[name="profile.clubId"]').val(suggestion.id);
  },
});

Template.editProfile.events({
  // Update the hidden field 'name'
  'change input[name="profile.firstName"]'() {
    const name = `${$('input[name="profile.firstName"]').val()} ${$('input[name="profile.lastName"]').val()}`;
    $('input[name="profile.name"]').val(name);
  },
  'change input[name="profile.lastName"]'() {
    const name = `${$('input[name="profile.firstName"]').val()} ${$('input[name="profile.lastName"]').val()}`;
    $('input[name="profile.name"]').val(name);
  },
});
