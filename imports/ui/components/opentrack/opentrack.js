import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import moment from 'moment';
import './opentrack.html';
import Common from '../../../../both/lib/common.js';

Template.opentrackMenu.onCreated(function () {
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

Template.opentrackMenu.helpers({
  loading() {
    return Template.instance().loading.get();
  },
  raceDate(race) {
    if (!race || !race.startDate) return null;
    return moment(race.startDate).format('DD-MM-YYYY');
  },
  distanceRace(race) {
    if (race && race.distance) {
      return `Total Distance: ${race.distance.value} ${Common.getDistanceUnitAbbr(race.distance.unit)}`;
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
    return Races.find({ identifier: { $not: '_bydefault_' }, deleted: { $ne: true } });
  },
  picture(race) {
    if (!race) return '';
    return race.picture ? race.picture : '/img/default/race-background.jpg';
  },
});

/*
Template.opentrackMenu.events({

});
*/