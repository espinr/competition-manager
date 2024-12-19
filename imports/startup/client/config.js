import 'hammerjs';
import 'materialize-css/dist/js/materialize.js';
import 'meteor/bevanhunt:leaflet';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { BackBehaviour } from 'meteor/chriswessels:back-behaviour';
import SimpleSchema from 'simpl-schema';
import { AutoForm } from 'meteor/aldeed:autoform';
import { T9n } from 'meteor/softwarerero:accounts-t9n';

SimpleSchema.extendOptions(['autoform']);

function getUserLanguage () {
  return 'en';
}

/* Configuration of accounts */
Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL',
});

/* Configuration of templates (materialize, bootstrap3) */
AutoForm.setDefaultTemplate('materialize');

if (Meteor.isClient) {
  /* Maps */
  L.Icon.Default.imagePath = '/packages/bevanhunt_leaflet/images/';
  BackBehaviour.attachToHardwareBackButton(true);
  T9n.setLanguage('en');
}
