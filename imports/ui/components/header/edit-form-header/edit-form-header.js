import { Template } from 'meteor/templating';
import { BackBehaviour } from 'meteor/chriswessels:back-behaviour';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Races } from '../../../../api/races/races';
import './edit-form-header.html';

Template.editionFormHeader.helpers({
  title() {
    const routeName = FlowRouter.getRouteName();
    const raceId = FlowRouter.getParam('raceId');
    let raceName = 'Race';
    if (raceId) {
      const race = Races.findOne(raceId);
      if (race) {
        raceName = race.name;
      }
    }
    switch (routeName) {
      case 'admin.races.new':
        return 'New Race';
      case 'admin.races.edit':
        return 'Update Race';
      case 'admin.categories.new':
        return 'New Category';
      case 'admin.categories.edit':
        return 'Update Category';
      case 'admin.editProfileAdmin':
        return 'Update profile';
      case 'App.editProfile':
        return 'Update profile';
      case 'App.changePwd':
        return 'Change password';
      case 'checkpoints.new':
        return 'New checkpoint';
      case 'admin.checkpoints.map':
        return new Spacebars.SafeString(`${raceName} > Race checkpoints`);
      case 'races.competition':
        return new Spacebars.SafeString(`${raceName} > Live Competition`);
      case 'races.competitors':
        return new Spacebars.SafeString(`${raceName} > Start List`);
      case 'admin.clubs.edit':
        return new Spacebars.SafeString('Update Club');
      case 'admin.clubs.new':
        return new Spacebars.SafeString('New Club');
      default:
        break;
    }
    return routeName;
  },
});

Template.editionFormHeader.onBack(function (details, origin) {
  // `this` will be the `Blaze.TemplateInstance` for the Settings template.
  // `details` will contain meta information.
  // `origin` will describe where the back event originated.
  window.history.back();
});
