import { Template } from 'meteor/templating';
import { BackBehaviour } from 'meteor/chriswessels:back-behaviour';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { ReactiveVar } from 'meteor/reactive-var';
import { Races } from '../../../../api/races/races';
import './competition-header.html';

Template.competitionHeader.onCreated(function () {
  const template = Template.instance();
  const raceId = FlowRouter.getParam('raceId');
  template.currentRace = new ReactiveVar(null);
  if (!raceId) {
    console.log('No raceId received!');
    return;
  }
  template.autorun(() => {
    const handler = template.subscribe('races.id', raceId);
    if (handler.ready()) {
      template.currentRace.set(Races.findOne(raceId));
      $('document').ready(function() {});
    }
  });
});

Template.competitionHeader.helpers({
  title() {
    // Gets parameter with the name of the race
    const routeName = FlowRouter.getRouteName();
    let nameRace = '';
    const race = Template.instance().currentRace.get();
    let checkpointId = FlowRouter.getParam('checkpointId');
    if (race) {
      nameRace = race.name;
      if (!checkpointId && race.checkpoints.length > 0) {
        checkpointId = race.checkpoints[race.checkpoints.length - 1].deviceId;
      }
    }
    let checkpoint = '';
    switch (routeName) {
      case 'admin.races.competition':
        return new Spacebars.SafeString(`${nameRace} > ${i18n('races.nav.dashboard')}`);
      case 'races.checkins':
        return new Spacebars.SafeString(`${nameRace} > <em>${checkpointId} <i class="material-icons">timer</i></em>`);
      case 'admin.competitors.new':
        return new Spacebars.SafeString(`${nameRace} > ${i18n('races.nav.new_competitor')}</em>`);
      case 'admin.competitors.edit':
        return new Spacebars.SafeString(`${nameRace} > ${i18n('races.nav.update_competitor')}</em>`);
      case 'races.startingList':
        return new Spacebars.SafeString(`${nameRace} > ${i18n('races.nav.starting_list')}</em>`);
      case 'races.results':
        return new Spacebars.SafeString(`${nameRace} <em>${checkpointId} <i class="material-icons">format_list_numbered</i></em>`);
      case 'admin.races.newResultEntry':
        return new Spacebars.SafeString(`${nameRace} <em>${checkpointId} > ${i18n('races.nav.new_result_entry')}`);
      case 'admin.races.editResultEntry':
        return new Spacebars.SafeString(`${nameRace} <em>${checkpointId} > ${i18n('races.nav.update_result_entry')}`);
      case 'admin.teams':
        return new Spacebars.SafeString(`${nameRace} > ${i18n('races.nav.team_starting_list')}`);
      case 'admin.teams.edit':
        return new Spacebars.SafeString(`${nameRace} > ${i18n('races.nav.update_team')}`);
      case 'races.relayResults':
        return new Spacebars.SafeString(`${nameRace} > ${i18n('races.nav.relay_race_results')}`);
      case 'races.view':
        return new Spacebars.SafeString(`${nameRace}`);
      case 'races.teamResults':
        return new Spacebars.SafeString(`${nameRace} > ${i18n('races.nav.team_race_results')}`);
      default:
        break;
    }
    return routeName;
  },
});

Template.competitionHeader.onBack(function (details, origin) {
  const raceId = FlowRouter.getParam('raceId');
  const routeName = FlowRouter.getRouteName();
  if (routeName === 'races.view') {
    FlowRouter.go('races.dashboard');
  } else {
    FlowRouter.go('races.view', { raceId });
  }
});
