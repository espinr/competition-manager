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
import { StartingListEntries } from '../../../../api/client/startingListEntries/startingListEntries';
import { ResultEntries } from '../../../../api/resultEntries/resultEntries';
import './new.html';
import { ResultLists } from '../../../../api/resultLists/resultLists';

function getYearsOldInDecember31(birthDate) {
  const currentYear = moment(new Date()).format('YYYY');
  const endOfCurrentYear = moment(`${currentYear}-12-31`);
  return endOfCurrentYear.diff(moment(birthDate), 'years');
}

AutoForm.hooks({
  newResultsEntryForm: {
    beginSubmit() {
    },
    formToDoc(doc) {
      const docToInsert = doc;
      docToInsert.createdAt = new Date();
      return docToInsert;
    },
    onSubmit(insertDocum) {
      const doc = insertDocum;
      Meteor.call('resultEntries.insert', doc, this.formAttributes.resultListId, (err, result) => {
        if (err) {
          console.log(err);
          this.done(new Error('Result entry insertion failed'));
        }
        if (result && result.length > 0) {
          this.done(null, result);
        }
      });
      return false;
    },
    onSuccess(formType, result) {
      FlowRouter.go('races.results', {
        raceId: this.formAttributes.raceId,
        checkpointId: this.formAttributes.checkpointId,
      });
      Materialize.toast('New result entry created', 4000);
    },
    onError(formType, error) {
      console.log(error);
    },
  },
});

Template.newResultsEntry.onCreated(function () {
  const template = Template.instance();
  const raceId = FlowRouter.getParam('raceId');
  const checkpointId = FlowRouter.getParam('checkpointId');
  if (!checkpointId || !raceId) {
    console.log('No resultEntryId, checkpointId or raceId received');
    return false;
  }


  template.currentResultList = new ReactiveVar(null);
  template.currentRace = new ReactiveVar(null);

  const handlerResultLists = template.subscribe('results.race', raceId);

  template.autorun(function () {
    if (handlerResultLists.ready()) {
      const resultList = ResultLists.findOne({ raceId, checkpointId });
      template.currentResultList.set(resultList);

      const handlerRaces = template.subscribe('races.id', raceId);
      const handlerCompetitors = template.subscribe('competitors.startingList', raceId);
      if (handlerRaces.ready() && handlerCompetitors.ready()) {
        template.currentRace.set(Races.findOne(raceId));
        $(document).ready(() => {});
      }
    }
  });
});

Template.newResultsEntry.helpers({
  resultListId() {
    const currentResultList = Template.instance().currentResultList.get();
    return currentResultList ? currentResultList._id : null;
  },
  competitorOptions() {
    // All competitors of the race
    return StartingListEntries.find({}).map((competitor) => {
      return {
        label: `${competitor.bib} - ${competitor.athleteFirstName} ${competitor.athleteLastName}`,
        value: competitor._id,
      };
    });
  },
  raceId() {
    const race = Template.instance().currentRace.get();
    return race ? race._id : null;
  },
  checkpointId() {
    const resultList = Template.instance().currentResultList.get();
    return resultList ? resultList.checkpointId : null;
  },
  categoryOptions() {
    const template = Template.instance();
    if (template.currentUser && template.currentUser.get()) {
      const user = template.currentUser.get();
      const yearsOld = getYearsOldInDecember31(user.profile.birthDate);
      return Categories.find({
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
      }, { sort: { requiredMinAge: 1, requiredMaxAge: 1, description: 1 } }).map(function (cat) {
        return {
          label: (cat.recognizingAuthorityCode ? `[${cat.recognizingAuthorityCode}] ` : '') + cat.name,
          value: cat._id,
        };
      });
    }
    return [];
  },
  resultEntriesCollection() {
    return ResultEntries;
  },
  usersCollection() {
    return Users;
  },
});

function updatePerformanceTimestamp(race) {
  const hours = parseInt($('#performanceHours').val(), 10);
  const mins = parseInt($('#performanceMinutes').val(), 10);
  const secs = parseInt($('#performanceSeconds').val(), 10);
  const performance = moment(race.startTimestamp, 'X').add({ hours, minutes: mins, seconds: secs });
  $('input[name="performanceTimestamp"]').val(performance.format('X'));
}

Template.newResultsEntry.events({
  /*
  'input #performanceHours'(event, templateInstance) {
    updatePerformanceTimestamp(templateInstance.currentRace.get());
  },
  'input #performanceMinutes'(event, templateInstance) {
    updatePerformanceTimestamp(templateInstance.currentRace.get());
  },
  'input #performanceSeconds'(event, templateInstance) {
    updatePerformanceTimestamp(templateInstance.currentRace.get());
  },
  */    
});
