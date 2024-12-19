import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import 'moment/locale/es';
import moment from 'moment';
import { Races } from '../../../../api/races/races.js';
import './cards.html';
import Common from '../../../../../both/lib/common.js';

Template.racesCards.onCreated(function () {
  const template = Template.instance();
  template.loading = new ReactiveVar(true);

  template.autorun(() => {
    const handler = template.subscribe('races.search');
    if (handler.ready()) {
      template.loading.set(false);
      $('document').ready(function() {
        $('select').material_select();
      });
    }
  });
});

Template.racesCards.helpers({
  loading() {
    return Template.instance().loading.get();
  },
  pBestRace(race) {
    return race && (race.external === undefined || race.external === false);
  },
  isRelayRace(race) {
    return race && (race.competitionType === 'Relay Race');
  },
  distanceRace(race) {
    if (race && race.distance) {
      return new Spacebars.SafeString(`${i18n('races.view.total_distance')}: ${race.distance.value} ${Common.getDistanceUnitAbbr(race.distance.unit)} <br>`);
    }
    return null;
  },
  checkpointId(race) {
    if (race && race.checkpoints && Array.isArray(race.checkpoints)) {
      return race.checkpoints[race.checkpoints.length - 1].deviceId;
    }
    return null;
  },
  races() {
    return Races.find({ identifier: { $not: '_bydefault_' }, deleted: { $ne: true } }, { sort: { startDate: -1 } });
  },
  picture(race) {
    if (!race) return '';
    return race.picture ? race.picture : '/img/default/race-background.jpg';
  },
});

/*
Template.racesCards.events({

});
*/