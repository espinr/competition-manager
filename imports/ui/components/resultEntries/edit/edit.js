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
import { ResultEntries } from '../../../../api/resultEntries/resultEntries';
import './edit.html';

AutoForm.hooks({
  editResultsEntryForm: {
    before: {
      update(doc) {
        const docToUpdate = doc;
        if (docToUpdate.$unset && 'splits' in docToUpdate.$unset) {
          delete docToUpdate.$unset.splits;
          docToUpdate.$set.splits = [];
        }
        return doc;
      },
    },
    formToDoc(doc) {
      return doc;
    },
    after: {
      update(error, result) {
        if (error) {
          if (error.reason) {
            alert(error.reason);
          }
        } else if (result) {
          FlowRouter.go('races.results', { raceId: FlowRouter.getParam('raceId'), checkpointId: FlowRouter.getParam('checkpointId') });
          Materialize.toast('Entry updated', 4000);
        }
      },
    },
  },
});

Template.editResultsEntry.onCreated(function () {
  const template = Template.instance();
  const resultEntryId = FlowRouter.getParam('resultEntryId');
  const raceId = FlowRouter.getParam('raceId');
  const checkpointId = FlowRouter.getParam('checkpointId');
  if (!resultEntryId || !checkpointId || !raceId) {
    console.log('No resultEntryId, checkpointId or raceId received');
    return false;
  }
  template.currentResultEntry = new ReactiveVar(null);
  template.currentCompetitor = new ReactiveVar(null);

  const handlerResultEntry = template.subscribe('resultEntries.id', resultEntryId);
  template.autorun(function () {
    if (handlerResultEntry.ready()) {
      const resultEntry = ResultEntries.findOne(resultEntryId);
      template.currentResultEntry.set(resultEntry);
      const handlerCompetitors = template.subscribe('competitors.byId', resultEntry.competitorId);
      if (handlerCompetitors.ready()) {
        const competitor = Competitors.findOne(resultEntry.competitorId);
        const handlerUser = template.subscribe('users.byId', competitor.idUser);
        if (handlerUser.ready()) {
          template.currentCompetitor.set(competitor);
          $(document).ready(() => {});
        } 
      }
    }
  });
});

Template.editResultsEntry.helpers({
  bibNumber() {
    const template = Template.instance();
    if (!template.currentCompetitor) return null;
    const currentCompetitor = template.currentCompetitor.get();
    if (currentCompetitor) {
      return currentCompetitor.bib;
    }
    return '';
  },
  athleteName() {
    const template = Template.instance();
    if (!template.currentCompetitor) return null;
    const currentCompetitor = template.currentCompetitor.get();
    if (currentCompetitor) {
      const currentAthlete = Users.findOne(currentCompetitor.idUser);
      if (currentAthlete) {
        return `${currentAthlete.profile.firstName} ${currentAthlete.profile.lastName}`;
      }
    }
    return '';
  },
  resultEntriesCollection() {
    return ResultEntries;
  },
  currentResultEntry() {
    return Template.instance().currentResultEntry.get();
  },
  currentCompetitor() {
    return Template.instance().currentCompetitor.get();
  },
});

Template.editResultsEntry.events({
});
