import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { AutoForm } from 'meteor/aldeed:autoform';
import { Users } from '/imports/api/users/users.js';
import { Clubs } from '/imports/api/clubs/clubs.js';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Roles } from 'meteor/alanning:roles';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

import './join-new-profile.html';
import { Session } from 'meteor/session';
import { Countries } from '../../../../api/countries/countries';

AutoForm.hooks({
  newProfileJoiningForm: {
    beginSubmit() {
    },
    formToDoc(docToInsert) {
      const doc = docToInsert;
      if (doc.emails && doc.emails.length > 0) {
        doc.emails[0].verified = true;
      }
      return doc;
    },
    onSubmit(docToInsert) {
      const doc = docToInsert;
      const { raceId } = this.formAttributes;
      if (!doc.profile.clubName || doc.profile.clubName.trim() === '') {
        delete doc.profile.clubId;
      }
      Meteor.call('users.insert.competitor', doc, raceId, (err, result) => {
        if (err) {
          console.log(err);
          this.done(new Error('Competitor insertion failed'));
        }
        if (result && result.length > 0) {
          Session.set('alreadyRegistered', true);
          this.done(null, result);
        }
      });
      return false;
    },
    onSuccess(formType, result) {
      $('#modalNewUserToJoin').modal('close');
      Materialize.toast('Inscripción realizada', 10000);
    },
    onError(formType, error) {
      //console.log(error);
    },
  },
});

Template.newProfileJoining.onCreated(function () {
  const template = Template.instance();
  const handlerCountries = template.subscribe('countries.all');
  const handlerClubs = template.subscribe('clubs.all');

  template.raceId = new ReactiveVar(null);
  template.registered = new ReactiveVar(false);
  template.countryDefault = new ReactiveVar(null);
  
  let { raceId } = template.data;
  if (!raceId) {
    raceId = FlowRouter.getParam('raceId');
    if (!raceId) {
      console.log('No raceId received');
      return false;
    }
  }

  template.raceId.set(raceId);

  template.autorun(() => {
    if (handlerCountries.ready() && handlerClubs.ready()) {
      template.countryDefault.set(Countries.findOne({ 'codes.iso': 'ESP' }));
      $(document).ready(() => {
        $('#modalPrivacyPolicy').modal({
          dismissible: true,
          opacity: 0.5,
          startingTop: '0',
          ready() {
            $('.modal-overlay').addClass('privacy-dialog-open');
            $('#close-privacy-policy').click(function() { $('#modalPrivacyPolicy').modal('close'); });
          },
        });
        $('select').material_select();
      });
      Tracker.afterFlush(() => {
        Meteor.typeahead.inject();
      });
    }
  });
});

Template.newProfileJoining.helpers({
  fieldIsInvalid(name) {
    const context = Meteor.users.simpleSchema().namedContext('newProfileJoiningForm');
    context.isValid(name);
    return context.keyIsInvalid(name);
  },
  keyErrorMessage(name) {
    const context = Meteor.users.simpleSchema().namedContext('newProfileJoiningForm');
    return context.keyErrorMessage(name);
  },
  countryByDefault() {
    const country = Template.instance().countryDefault.get();
    if (!country) return '';
    return country._id;
  },
  raceId() {
    return Template.instance().raceId.get();
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

Template.newProfileJoining.events({
  // Update the hidden field 'name'
  'change input[name="profile.firstName"]'() {
    const name = `${$('input[name="profile.firstName"]').val()} ${$('input[name="profile.lastName"]').val()}`;
    $('input[name="profile.name"]').val(name);
  },
  'change input[name="profile.lastName"]'() {
    const name = `${$('input[name="profile.firstName"]').val()  } ${  $('input[name="profile.lastName"]').val()}`;
    $('input[name="profile.name"]').val(name);
  },
  'click .privacyPolicy'() {
    $('#modalPrivacyPolicy').modal('open');
  },
});
