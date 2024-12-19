/* Register global templates */
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Roles } from 'meteor/alanning:roles';
import moment from 'moment';
import RoleTypes from '../../api/users/roles/roleTypes.js';


/* Helpers to control user permissions */
Template.registerHelper('isLoggedUser', () => {
  const returned = (Meteor && Meteor.user() && Meteor.user() !== null && Meteor.userId());
  return returned;
});

Template.registerHelper('isAdminUser', () => {
  const user = Meteor.user();
  if (user) {
    return Roles.userIsInRole(user, [RoleTypes.ADMIN]);
  }
  return false;
});

Template.registerHelper('raceNotStartedYet', (race) => {
  if (race && race.status === 'Ready') {
    return true;
  }
  return false;
});

Template.registerHelper('raceRunning', (race) => {
  if (race && race.status === 'Running') {
    return true;
  }
  return false;
});

Template.registerHelper('raceFinished', (race) => {
  if (race && race.status === 'Finished') {
    return true;
  }
  return false;
});

Template.registerHelper('raceDate', (race) => {
  if (!race || !race.startDate) return null;
  moment.locale('es');
  return moment(race.startDate).format('DD MMM YYYY');
});

Template.registerHelper('raceTime', (race) => {
  if (!race || !race.startTime) return null;
  moment.locale('es');
  return moment(race.startTime, 'hh:mmA').format('HH:mm');
});


Template.registerHelper('isRacePrivate', (race) => {
  return (race && race.privateEvent && race.privateEvent === true);
});

Template.registerHelper('escapeHTML', (text) => {
  if (text) {
    return new Spacebars.SafeString(text);
  }
  return '';
});

Template.registerHelper('organizerText', (race) => {
  if (race && race.organizerName) {
    let name = race.organizerName;
    if (race.organizerUrl) {
      name = `<a href="${race.organizerUrl}" target="_blank">${race.organizerName}</a>`;
    }
    const email = race.organizerEmail ? `(<a href="mailto:${race.organizerEmail}">${race.organizerEmail}</a>)` : '';
    return new Spacebars.SafeString(`${i18n('races.view.organized_by')}: ${name} ${email}`);
  }
  return null;
});

