// Definition of the users and their profiles collection 
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { Roles } from 'meteor/alanning:roles';
import SimpleSchema from 'simpl-schema';
import RoleTypes from './roles/roleTypes.js';
import { Countries } from '../countries/countries';
import moment from 'moment';

SimpleSchema.extendOptions(['autoform']);


// Configuration of pickadate (http://amsul.ca/pickadate.js/date/)
const pickadateBirthdayOptions = {
  /*
  monthsFull: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthsShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dec'],
  weekdaysFull: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  weekdaysShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  // Buttons
  today: 'Hoy',
  clear: 'Borrar',
  close: 'Cerrar',
  */
  closeOnSelect: true,
  closeOnClear: true,
  selectMonths: true,
  selectYears: true,
  editable: true,
  firstDay: 1,
  format: 'dd/mm/yyyy',
  onStart() {
    // 18 years ago
    const date = moment().subtract(18, 'years').toDate();
    //this.set('select', [date.getFullYear(), date.getMonth(), date.getDate()]);
  },
};

// Extended profile for users
const userProfilesSchema = new SimpleSchema({
  // name is used as a full name composition
  name: {
    type: String,
    optional: true,
    autoform: {
      type: 'hidden',
    },
  },
  firstName: {
    type: String,
    label: 'Nombre',
    required: true,
  },
  lastName: {
    type: String,
    label: 'Apellidos',
    required: true,
  },
  alternate: {
    type: String,
    label: 'Alternate Name',
    optional: true,
  },
  phone: {
    type: String,
    label: 'Phone',
    optional: true,
  },
  passport: {
    type: String,
    label: 'ID card, Passport',
    optional: true,
  },
  locality: {
    type: String,
    label: 'City, Town,...',
    optional: true,
  },
  countryId: {
    type: String,
    label: 'Nacionalidad',
    optional: true,
    autoform: {
      options() {
        return Countries.find({}, { sort: { name: 1 } }).map(function(entity) {
          return { label: entity.name, value: entity._id };
        });
      },
    },
  },
  clubName: {
    type: String,
    label: 'Club',
    optional: true,
  },
  clubId: {
    type: String,
    label: 'Sports Club Id',
    optional: true,
  },
  gender: {
    type: String,
    label: 'Sexo',
    allowedValues: ['Male', 'Female'],
    autoform: {
      options: [
        { label: 'Masculino', value: 'Male' },
        { label: 'Femenino', value: 'Female' },
      ],
    },
    required: true,
  },
  birthDate: {
    type: Date,
    label: 'Fecha de nacimiento',
    required: true,
    /*
    autoform: {
      type: 'pickadate',
      pickadateOptions: pickadateBirthdayOptions,
    },
    */
  },
  notes: {
    type: String,
    label: 'Notes',
    optional: true,
  },
  external: {
    type: Boolean,
    optional: true,
    label: 'External User (imported)',
    defaultValue: false,
  },
  public: {
    type: Boolean,
    optional: true,
    label: 'Show as public profile',
    defaultValue: false,
  },
  contactEmail: {
    type: String,
    label: 'Correo electrónico',
    regEx: SimpleSchema.RegEx.Email,
    optional: true,
  },
  acceptPolicy: {
    type: Boolean,
    label: 'Acepto la política de privacidad',
    custom() {
      if (Meteor.isClient && this.isSet) {
        if (!this.value) {
          console.log('You must accept the privacy policy to continue');
          return 'required';
        }
      }
    },
  },
}, { tracker: Tracker });

// The schema for Meteor.users
const userSchema = new SimpleSchema({
  username: {
    type: String,
    optional: true,
  },
  emails: {
    type: Array,
    optional: true,
  },
  'emails.$': {
    type: Object,
  },
  'emails.$.address': {
    type: String,
    label: 'Correo electrónico',
    regEx: SimpleSchema.RegEx.Email,
  },
  'emails.$.verified': {
    type: Boolean,
  },
  registered_emails: {
    type: Array,
    optional: true,
  },
  'registered_emails.$': {
    type: Object,
    blackbox: true,
  },
  createdAt: {
    type: Date,
    autoform: {
      type: 'hidden',
    },
    autoValue() {
      if (this.isInsert) {
        return new Date();
      } else if (this.isUpsert) {
        return { $setOnInsert: new Date() };
      }
      this.unset(); // Prevent user from supplying their own value
      return undefined;
    },
  },
  profile: {
    type: userProfilesSchema,
    optional: true,
  },
  services: {
    type: Object,
    optional: true,
    blackbox: true,
  },
  // No use groups
  roles: {
    type: Array,
    optional: true,
  },
/*  roles: {
    type: Object,
    optional: true,
    blackbox: true,
  },
*/
  'roles.$': {
    type: String,
  },
  // In order to avoid an 'Exception in setInterval callback' from Meteor
  heartbeat: {
    type: Date,
    optional: true,
  },
}, { tracker: Tracker });


userSchema.messageBox.setLanguage('es');

Meteor.users.attachSchema(userSchema);

Meteor.users.allow({
  insert (userId, doc) { return true; },
  update (userId, doc, fieldNames, modifier) { 
    // An update only can be made by the admin or the user themselves
    if (userId && ((userId === doc._id) || (Roles.userIsInRole(userId, [RoleTypes.ADMIN])))) {
      return true;
    }
    return false;
  },
});

export const Users = Meteor.users;
