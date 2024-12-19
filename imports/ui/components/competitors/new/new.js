import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { AutoForm } from 'meteor/aldeed:autoform';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Races } from '/imports/api/races/races.js';
import { Tracker } from 'meteor/tracker';
import { Identifiers } from '/imports/api/identifiers/identifiers';
import { Categories } from '/imports/api/categories/categories.js';
import { Users } from '/imports/api/users/users';
import moment from 'moment';
import { Competitors } from '../../../../api/competitors/competitors';
import './new.html';

function getYearsOldInDecember31(birthDate) {
  const currentYear = moment(new Date()).format('YYYY');
  const endOfCurrentYear = moment(`${currentYear}-12-31`);
  return endOfCurrentYear.diff(moment(birthDate), 'years');
}

AutoForm.hooks({
  newCompetitorForm: {
    beginSubmit() {
    },
    formToDoc(doc) {
      const docToInsert = doc;
      docToInsert.createdAt = new Date();
      if (!docToInsert.categories) {
        docToInsert.categories = [];
      }
      return docToInsert;
    },
    onSubmit(insertDocum) {
      const doc = insertDocum;
      // Assigns the category by default
      const catDefault = Categories.findOne({ identifier: 'OVERALL' });
      if (doc.categories && Array.isArray(doc.categories)) {
        doc.categories.push(catDefault._id);
      } else {
        doc.categories = [catDefault._id];
      }
      Meteor.call('competitors.insert', doc, (err, result) => {
        if (err) {
          console.log(err);
          this.done(new Error('Competitor insertion failed'));
        }
        if (result && result.length > 0) {
          // Mark the identifier as assigned
          Identifiers.update({ _id: doc.bibId }, {
            $set: {
              assigned: true,
            },
          });
          this.done(null, result);
        }
      });
      return false;
    },
    onSuccess(formType, result) {
      FlowRouter.go('races.startingList', { raceId: FlowRouter.getParam('raceId') });
      Materialize.toast('New competitor created', 4000);
    },
    onError(formType, error) {
      console.log(error);
    },
  },
  newUserCompetitorForm: {
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
      Meteor.call('users.insert', doc, (err, result) => {
        if (err) {
          console.log(err);
          this.done(new Error('Competitor insertion failed'));
        }
        if (result && result.length > 0) {
          this.done(null, result);
        }
      });
      return false;
    },
    onSuccess(formType, result) {
      $('#modalNewUser').modal('close');
      Materialize.toast('New user created', 4000);
      // focus on the first athlete of the select
      $('select[name="idUser"]').val(result);
      Template.instance().currentUser.set(Users.findOne(result));
    },
    onError(formType, error) {
      console.log(error);
    },
  },  
});

Template.newCompetitor.onCreated(function () {
  const raceId = FlowRouter.getParam('raceId');
  if (!raceId) {
    console.log('No raceId received');
    return false;
  }

  const template = Template.instance();
  const handlerCats = template.subscribe('categories.race', raceId);
  const handlerUsers = template.subscribe('users.search');
  const handlerCompetitors = template.subscribe('competitors.race', raceId);
  const handlerIdentifiers = template.subscribe('identifiers.race', raceId);

  template.currentUser = new ReactiveVar(null);
  template.currentRace = new ReactiveVar(null);

  template.autorun(function () {
    if (handlerCats.ready() && handlerCats.ready()
      && handlerUsers.ready() && handlerIdentifiers.ready() && handlerCompetitors.ready()) {
      template.currentRace.set(Races.findOne(raceId));
    }
  });

  $(document).ready(() => {
    $('#modalNewUser').modal({
      dismissible: true,
      opacity: 0.5,
      startingTop: '40%',
      ready(modal, trigger) {
        $('#modalNewUser .modal-ok').bind('click', (event) => {});
      },
    });
  });
});

Template.newCompetitor.helpers({
  bibValuesOptions() {
    // Free identifiers
    return Identifiers.find({
      assigned: false,
    }).map((id) => {
      return {
        label: id.bib,
        value: id._id,
      };
    });
  },
  raceId() {
    return FlowRouter.getParam('raceId');
  },
  userList() {
    const raceId = FlowRouter.getParam('raceId');
    // Only those who are not already in the competition
    const listAlreadyRegisteredUsers = Competitors.find({}).fetch();
    const idUsers = [];
    if (listAlreadyRegisteredUsers) {
      for (let i = 0; i < listAlreadyRegisteredUsers.length; i += 1) {
        idUsers.push(listAlreadyRegisteredUsers[i].idUser);
      }
    }
    return Users.find({
      _id: { $nin: idUsers },
    }, { sort: { createdAt: -1 } }).map(function (user) {
      return {
        label: `${user.profile.name} (${getYearsOldInDecember31(user.profile.birthDate)})`,
        value: user._id,
      };
    });
  },
  categoryOptions() {
    const template = Template.instance();
    let arrayToReturn = [];
    if (template.currentUser && template.currentUser.get()) {
      const user = template.currentUser.get();
      const yearsOld = getYearsOldInDecember31(user.profile.birthDate);
      arrayToReturn = Categories.find({
        identifier: { $ne: 'OVERALL' },
        $or: [
          { requiredGender: user.profile.gender },
          { requiredGender: { $exists: false } },
        ],
        $and: [
          {
            $or: [
              { requiredMinAge: { $lte: yearsOld } },
              { requiredMinAge: { $exists: false } },
            ],
          },
          {
            $or: [
              { requiredMaxAge: { $gte: yearsOld } },
              { requiredMaxAge: { $exists: false } },
            ],
          },
        ],
      }).map(function (cat) {
        return {
          label: (cat.recognizingAuthorityCode ? `[${cat.recognizingAuthorityCode}] ` : '') + cat.name,
          value: cat._id,
        };
      });
    }
    return arrayToReturn;
  },
  competitorsCollection() {
    return Competitors;
  },
  usersCollection() {
    return Users;
  },
});

function updateBibEpcValues() {
  const bibId = $('select[name="bibId"]').val();
  const identifier = Identifiers.findOne(bibId);
  // gets the EPCs and stores them on the form
  $('input[name="epcs"]').val(identifier.epcs);
  $('input[name="bib"]').val(identifier.bib);
}

function updateCategoriesUsers(template) {
  const userId = $('select[name="idUser"]').val();
  template.currentUser.set(Users.findOne(userId));
}

Template.newCompetitor.events({
  'click #newUser-button'(event) {
    $('#modalNewUser').modal('open');
  },
  'click #autoAssign-button'(event) {
    // Select the first bib number available
    $('select[name="bibId"]').val($('select[name="bibId"] option:eq(1)').val());
    $('select[name="bibId"]').material_select();
    updateBibEpcValues();

    // Select the first user
    $('select[name="idUser"]').prop('selectedIndex', 1);
    $('select[name="idUser"]').material_select();
    updateCategoriesUsers(Template.instance());
    Meteor.setTimeout(function() {
      $('input[name="categories"]').prop('checked', true);
    }, 100);
  },
  'change select[name="idUser"]'(event) {
    updateCategoriesUsers(Template.instance());
  },
  'change select[name="bibId"]'(event) {
    updateBibEpcValues();
  },
  'click .af-checkbox-group>p'(event) {
    event.preventDefault();
    event.stopPropagation();
    const checkbox = $(event.currentTarget).find('input[name="categories"]');
    checkbox.prop('checked', !checkbox.prop('checked'));
  },  
});
