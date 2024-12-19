import { Template } from 'meteor/templating';
import { BackBehaviour } from 'meteor/chriswessels:back-behaviour';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Races } from '../../../../api/races/races';
import './opentrack-header.html';

Template.opentrackMainHeader.helpers({});

Template.opentrackSubHeader.helpers({
  title() {
    const routeName = FlowRouter.getRouteName();
    switch (routeName) {
      case 'opentrack.categories.list':
        return new Spacebars.SafeString('Open Athletics > <em>Categories</em>');
      case 'opentrack.clubs.list':
        return new Spacebars.SafeString('Open Athletics > <em>Clubs</em>');
      case 'opentrack.countries.list':
        return new Spacebars.SafeString('Open Athletics > <em>Countries</em>');
      case 'opentrack.competitionFeatures.list':
        return new Spacebars.SafeString('Open Athletics > <em>Competition Features</em>');
      case 'opentrack.federations.list':
        return new Spacebars.SafeString('Open Athletics > <em>Federations</em>');
      case 'opentrack.athletes.list':
        return new Spacebars.SafeString('Open Athletics > <em>Athletes</em>');
      case 'opentrack.races.list':
        return new Spacebars.SafeString('Open Athletics > <em>Competitions</em>');
      case 'opentrack.disciplines.list':
        return new Spacebars.SafeString('Open Athletics > <em>Disciplines</em>');
      default:
        break;
    }
    return routeName;
  },
});

/*
Template.opentrackSubHeader.onBack(function (details, origin) {
  // `this` will be the `Blaze.TemplateInstance` for the Settings template.
  // `details` will contain meta information.
  // `origin` will describe where the back event originated.
  window.history.back();
});
*/