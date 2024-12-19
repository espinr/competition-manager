import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import Sntp from 'sntp';
import { ReactiveClock } from 'meteor/aldeed:clock';
import 'numeraljs';
import moment from 'moment';
import beautify from 'json-beautify';
import Common from '../../../../../../both/lib/common';
import { Checkins } from '../../../../../api/checkins/checkins.js';
import { Competitors } from '../../../../../api/competitors/competitors.js';
import { Races } from '../../../../../api/races/races.js';
import { Categories } from '../../../../../api/categories/categories';
import '../map/map';
import './view.html';
import { StartingListEntries } from '../../../../../api/client/startingListEntries/startingListEntries';
import { Countries } from '../../../../../api/countries/countries';

Template.raceView.onCreated(function () {
  const template = Template.instance();
  template.checkpointsAlive = new ReactiveVar([]);
  template.currentRace = new ReactiveVar();
  template.alreadyRegistered = new ReactiveVar(false);
  Session.set('alreadyRegistered', false);

  const raceId = FlowRouter.getParam('raceId');
  if (!raceId) {
    console.log('No raceId received');
    return false;
  }

  const handler = template.subscribe('races.id', raceId);
  //const handlerUsers = template.subscribe('users.search');
  const handlerCountries = template.subscribe('countries.all');
  const handlerCompetitors = template.subscribe('competitors.startingList', raceId);
  Tracker.autorun(() => {
    if (handler.ready() && handlerCompetitors.ready() && handlerCountries.ready()) {
      template.subscribe('categories.race', raceId);
      template.currentRace.set(Races.findOne({ _id: raceId }));
      $(document).ready(function() {
        $('#modalJoinCompetition').modal({
          dismissible: true,
          opacity: 0.5,
          startingTop: '40%',
          /*
          ready(modal, trigger) {
            $('#modalJoinCompetition .modal-ok').bind('click', (event) => {
              $('#modalJoinCompetition').modal('close');
            });
          },
          */
        });
        $('#modalNewUserToJoin').modal({
          dismissible: false,
          opacity: 0.5,
          startingTop: '40%',
        });
        $('.collapsible.expandable').collapsible({
          accordion: false,
        });
      });    
    }
  });
  Tracker.autorun(() => {
    template.alreadyRegistered.set(Session.get('alreadyRegistered'));
  });
});

Template.raceView.helpers({
  currentRace() {
    return Races.findOne(FlowRouter.getParam('raceId'));
  },
  alreadyRegistered() {
    const race = Template.instance().currentRace.get();
    const myId = Meteor.userId();
    if (race && myId && Competitors.find({ idUser: myId, idRace: race._id }).count() > 0) {
      return true;
    }
    return Template.instance().alreadyRegistered.get();
  },
  isRegistrationOpen() {
    const race = Template.instance().currentRace.get();
    const now = new Date();
    return race && (race.dateOpenRegistration < now) && (!race.dateCloseRegistration || race.dateCloseRegistration > now);
  },
  mayRegister() {
    const race = Template.instance().currentRace.get();
    const now = new Date();
    if (race.dateCloseRegistration && race.dateCloseRegistration < now) {
      return false;
    }
    if (race && race.status === 'Ready') {
      const myId = Meteor.userId();
      if (myId && Competitors.find({ idUser: myId, idRace: race._id }).count() === 0) {
        return true;
      }
    }
    return false;
  },
  raceId() {
    return FlowRouter.getParam('raceId');
  },
  distanceRace(race) {
    if (race && race.distance) {
      return `${i18n('races.view.total_distance')}: ${race.distance.value} ${Common.getDistanceUnitAbbr(race.distance.unit)}`;
    }
    return null;
  },
  registriesStartingList() {
    return StartingListEntries.find({
      categories: { $elemMatch: { identifier: 'OVERALL' } },
    }).count();
  },
  finishCheckpointId(race) {
    if (!race || !race.checkpoints) return null;
    for (let i = 0; i < race.checkpoints.length; i += 1) {
      if (race.checkpoints[i].onFinishLine) {
        return race.checkpoints[i].deviceId;
      }
    }
    return '';
  },
  categories(race) {
    if (!race || !race.categories) return null;
    return Categories.find({ _id: { $in: race.categories } }, { sort: { requiredMinAge: 1, requiredMaxAge: 1, description: 1 } });
  },
  isRelayRace(race) {
    if (!race || !race.competitionType) return null;
    return race && (race.competitionType === 'Relay Race');
  },
  isTeamsRace(race) {
    if (!race || !race.competitionType) return null;
    return race && (race.competitionType === 'Individual + Teams Race');
  },
  locationRace(race) {
    if (race && race.location && race.location.address) {
      let returnValue = `<b>${race.location.name}</b><br>`;
      if (race.location.address.streetAddress) {
        returnValue += `${race.location.address.streetAddress}<br>`;
      }
      if (race.location.address.addressLocality) {
        returnValue += `${race.location.address.addressLocality} `;
      }
      if (race.location.address.postalCode) {
        returnValue += ` (${race.location.address.postalCode})<br>`;
      }
      if (race.countryId) {
        const country = Countries.findOne(race.countryId);
        if (country) {
          returnValue += `${country.name} (${country.codes.ioc})`;
        }
      } else if (race.location.address.addressCountry) {
        const country = Countries.findOne(race.location.address.addressCountry);
        if (country) {
          returnValue += `${country.name} (${country.codes.ioc})`;
        } else {
          returnValue += ` (${race.location.address.addressCountry})`;
        }
      }
      return new Spacebars.SafeString(returnValue);
    }
    return null;
  },
  idRace() {
    return FlowRouter.getParam('raceId');
  },
});

Template.raceView.events({
  'click #join-competition'(event) {
    $('#modalJoinCompetition').modal('open');
  },
  'click #new-user-register-button'(event) {
    $('#modalNewUserToJoin').modal('open');
  },
});
