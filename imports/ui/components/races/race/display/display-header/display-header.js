import { Template } from 'meteor/templating';
import { BackBehaviour } from 'meteor/chriswessels:back-behaviour';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Races } from '../../../../../../api/races/races';
import './display-header.html';

Template.displayHeader.helpers({
  title() {
    // Gets parameter with the name of the race
    const routeName = FlowRouter.getRouteName();
    let nameRace = '';
    const raceId = FlowRouter.getParam('raceId');
    if (raceId && raceId.length > 0) {
      const race = Races.findOne(raceId);
      if (race) {
        nameRace = race.name;
      }
    }
    let checkpoint = '';
    switch (routeName) {
      case 'admin.races.competition':
        return new Spacebars.SafeString(`${nameRace}`);
      case 'races.checkins':
        return new Spacebars.SafeString(`${nameRace} > <em>${FlowRouter.getParam('deviceId')} <i class="material-icons">timer</i></em>`);
      default:
        break;
    }
    return routeName;
  },
});

Template.displayHeader.onBack(function (details, origin) {
  FlowRouter.go('App.home');
});
