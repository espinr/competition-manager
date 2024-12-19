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
import './edit.html';

function getYearsOldInDecember31(birthDate) {
  const currentYear = moment(new Date()).format('YYYY');
  const endOfCurrentYear = moment(`${currentYear}-12-31`);
  return endOfCurrentYear.diff(moment(birthDate), 'years');
}

AutoForm.hooks({
  editCompetitorForm: {
    before: {
      update(docToUpdate) {
        const doc = docToUpdate;
        // Assigns the category by default
        const catDefault = Categories.findOne({ identifier: 'OVERALL' });
        if (doc.$set && doc.$set.categories && Array.isArray(doc.$set.categories)) {
          doc.$set.categories.push(catDefault._id);
        } else {
          doc.$set.categories = [catDefault._id];
        }
        if (doc.$unset && doc.$unset.categories) {
          delete doc.$unset.categories;
        }
        this.formAttributes.currentBibId = doc.$set.bibId;
        return doc;
      },
    },
    formToDoc(docToUpdate) {
      const doc = docToUpdate;
      return doc;
    },
    after: {
      update(error, result) {
        if (error) {
          if (error.reason) {
            alert(error.reason);
          }
        } else if (result) {
          // Frees the previous bib in case it was changed
          if (this.formAttributes.previousBibId !== this.formAttributes.currentBibId) {
            Identifiers.update({ _id: this.formAttributes.previousBibId }, { $set: { assigned: false } });
          }
          Identifiers.update({ _id: this.formAttributes.currentBibId }, { $set: { assigned: true } });
          FlowRouter.go('races.startingList', { raceId: this.formAttributes.raceId });
          Materialize.toast('Competitor updated', 4000);
        }
      },
    },
  },
});

Template.editCompetitor.onCreated(function () {
  const competitorId = FlowRouter.getParam('competitorId');
  if (!competitorId) {
    console.log('No competitorId received');
    return false;
  }

  const template = Template.instance();

  const handlerCompetitors = template.subscribe('competitors.byId', competitorId);

  template.currentUser = new ReactiveVar(null);
  template.currentRace = new ReactiveVar(null);
  template.currentCompetitor = new ReactiveVar(null);

  template.autorun(function () {
    if (handlerCompetitors.ready()) {
      const currentCompetitor = Competitors.findOne(competitorId);
      if (!currentCompetitor) return null;
      template.previousBibId = currentCompetitor.bibId;
      template.currentCompetitor.set(currentCompetitor);
      const raceId = currentCompetitor.idRace;
      const handlerCats = template.subscribe('categories.race', raceId);
      const handlerIdentifiers = template.subscribe('identifiers.race', raceId);
      const handlerRaces = template.subscribe('races.id', raceId);
      const handlerUsers = template.subscribe('users.byId', currentCompetitor.idUser);
      if (handlerUsers.ready() && handlerCats.ready() && handlerIdentifiers.ready() && handlerRaces.ready()) {
        template.currentRace.set(Races.findOne(raceId));
        template.currentUser.set(Users.findOne(currentCompetitor.idUser));
      }
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

Template.editCompetitor.helpers({
  previousBibId() {
    const template = Template.instance();
    const competitor = template.currentCompetitor.get();
    return competitor ? competitor.bibId : '';
  },
  bibValuesOptions() {
    // Free identifiers and the current one
    const template = Template.instance();
    const competitor = template.currentCompetitor.get();
    if (!competitor) { return null; }
    return Identifiers.find({
      $or: [
        { assigned: false },
        { _id: competitor.bibId },
      ],
    }).map((id) => {
      return {
        label: id.bib,
        value: id._id,
      };
    });
  },
  athleteName() {
    const template = Template.instance();
    if (!template.currentCompetitor) return null;
    const currentCompetitor = template.currentCompetitor.get();
    if (currentCompetitor) {
      const currentAthlete = Users.findOne(currentCompetitor.idUser);
      if (currentAthlete) {
        const age = getYearsOldInDecember31(currentAthlete.profile.birthDate);
        return `${currentAthlete.profile.firstName} ${currentAthlete.profile.lastName} (${age})`;  
      }
    }
    return '';
  },
  raceId() {
    const template = Template.instance();
    if (!template.currentRace) return null;
    const currentRace = template.currentRace.get();
    return currentRace ? currentRace._id : null;
  },
  categoryOptions() {
    const template = Template.instance();
    const user = template.currentUser.get();
    if (!user) return null;
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
  },
  competitorsCollection() {
    return Competitors;
  },
  currentCompetitor() {
    return Template.instance().currentCompetitor.get();
  },
});

Template.editCompetitor.events({
  'click #newUser-button'(event) {
    $('#modalNewUser').modal('open');
  },
  'click #delete-competitor-button'(event) {
    const template = Template.instance();
    if (!template.currentCompetitor) return null;
    const currentCompetitor = template.currentCompetitor.get();
    if (currentCompetitor && template.previousBibId) {      
      Competitors.remove({ _id: currentCompetitor._id }, function(error) {
        if (error) {
          console.log(error);
        } else {
          template.currentCompetitor.set(null);
          // Frees the identifier
          Identifiers.update({ _id: template.previousBibId }, { $set: { assigned: false } });
          const currentRace = template.currentRace.get();
          FlowRouter.go('races.startingList', { raceId: currentRace._id });
          Materialize.toast('Competitor removed from this competition', 4000);
        }
      });
    }
  },
  'change select[name="bibId"]'(event) {
    const bibId = $('select[name="bibId"]').val();
    const identifier = Identifiers.findOne(bibId);
    // gets the EPCs and stores them on the form
    $('input[name="epcs"]').val(identifier.epcs);
    $('input[name="bib"]').val(identifier.bib);
  },
  'click .af-checkbox-group>p'(event) {
    event.preventDefault();
    event.stopPropagation();
    const checkbox = $(event.currentTarget).find('input[name="categories"]');
    checkbox.prop('checked', !checkbox.prop('checked'));
  },
  'click .goBack-button'(event) {
    const race = Template.instance().currentRace.get();
    if (race) {
      FlowRouter.go('races.startingList', { raceId: race._id });
    }
  },
});
