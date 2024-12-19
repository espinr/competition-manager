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
import './join.html';
import Common from '../../../../../both/lib/common';


AutoForm.hooks({
  joinCompetitionForm: {
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
      $('#modalJoinCompetition').modal('close');
      FlowRouter.go('races.startingList', { raceId: FlowRouter.getParam('raceId') });
      Materialize.toast('New competitor created', 4000);
    },
    onError(formType, error) {
      console.log(error);
    },
  },
});

Template.joinCompetition.onCreated(function () {
  const template = Template.instance();
  let { raceId } = template.data;
  if (!raceId) {
    raceId = FlowRouter.getParam('raceId');
    if (!raceId) {
      console.log('No raceId received');
      return false;
    }
  }
  const handlerCats = template.subscribe('categories.race', raceId);
  const handlerUser = template.subscribe('users.own');
  const handlerCompetitors = template.subscribe('competitors.race', raceId);
  const handlerIdentifiers = template.subscribe('identifiers.race', raceId);

  template.currentUser = new ReactiveVar(null);
  template.currentRace = new ReactiveVar(null);
  template.categoriesAutoasigned = new ReactiveVar(null);

  template.autorun(function () {
    if (handlerCats.ready() && handlerCats.ready()
      && handlerUser.ready() && handlerIdentifiers.ready() && handlerCompetitors.ready()) {
      template.currentRace.set(Races.findOne(raceId));
      template.currentUser.set(Meteor.user());
      $(document).ready(() => {
        const categoriesAutoasigned = template.categoriesAutoasigned.get();
        for (let i = 0; i < categoriesAutoasigned.length; i += 1) {
          $(`input[value="${categoriesAutoasigned[i]}"]`).prop('checked', true);
        }
      });
    }
  });
});

Template.joinCompetition.helpers({
  bibToAssign() {
    // Free identifiers
    return Identifiers.findOne({
      assigned: false,
    }, { limit: 1 });
  },
  raceId() {
    return Template.instance().data.raceId;
  },
  yearsOldDayCompetition() {
    const template = Template.instance();
    const race = template.currentRace.get();
    if (race && race.startDate) {
      const startDate = moment(race.startDate);
      const user = Meteor.user();
      const diff = Common.getYearsOldOnDate(user.profile.birthDate, startDate.month() + 1, startDate.date());
      return diff;
    }
    return '';
  },
  categoryOptions() {
    const template = Template.instance();
    let arrayToReturn = [];
    const categoriesAutoasigned = [];
    if (template.currentUser && template.currentUser.get()) {
      const user = template.currentUser.get();
      // Years old this year
      const yearsOld = Common.getYearsOldOnDate(user.profile.birthDate, 12, 31);
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
        if (cat.autoAssigned) {
          categoriesAutoasigned.push(cat._id);
        }
        return {
          label: (cat.recognizingAuthorityCode ? `[${cat.recognizingAuthorityCode}] ` : '') + cat.name,
          value: cat._id,
        };
      });
    }
    template.categoriesAutoasigned.set(categoriesAutoasigned);
    return arrayToReturn;
  },
  idUser() {
    return Meteor.userId();
  },
  competitorsCollection() {
    return Competitors;
  },
});

Template.joinCompetition.events({
  'click .af-checkbox-group>p'(event) {
    event.preventDefault();
    event.stopPropagation();
    const checkbox = $(event.currentTarget).find('input[name="categories"]');
    checkbox.prop('checked', !checkbox.prop('checked'));
  },
});
