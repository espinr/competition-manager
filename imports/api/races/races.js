// Definition of the checkpoints collection
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import SimpleSchema from 'simpl-schema';
import moment from 'moment';
import { Checkpoints } from '../checkpoints/checkpoints.js';
import { Countries } from '../countries/countries';
import { PostalAddressSchema } from '../schemas/postalAddress';
import { DistanceSchema } from '../schemas/distance';
SimpleSchema.extendOptions(['autoform']);

export const Races = new Mongo.Collection('races');

const statusRaceOptions = [
  { label: 'Ready', value: 'Ready' },
  { label: 'Running', value: 'Running' },
  { label: 'Finished', value: 'Finished' },
];

const competitionTypeOptions = [
  { label: 'Individual Race', value: 'Individual Race' },
  { label: 'Individual + Teams Race', value: 'Individual + Teams Race' },
  { label: 'Relay Race', value: 'Relay Race' },
];


// Configuration of pickadate (http://amsul.ca/pickadate.js/date/)
const pickadateOptions = {
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
  firstDay: 1,
  format: 'dd/mm/yyyy',
  onStart() {
    const date = new Date();
    this.set('select', [date.getFullYear(), date.getMonth(), date.getDate()]);
  },
};

Races.attachSchema(new SimpleSchema({
  identifier: {
    type: String,
    label: 'Race ID',
    autoValue() {
      const currentYear = moment(new Date()).year();
      const counter = `${Races.find({}).count() + 1}`;
      if (this.isInsert) {
        return `${currentYear}${counter.padStart(3, '0')}`;
      } else if (this.isUpsert) {
        return { $setOnInsert: `${currentYear}${counter.padStart(3, '0')}` };
      }
      return undefined;
    },
    unique: true,
    required: true,
  },
  description: {
    type: String,
    label: 'Description',
    optional: true,
  },
  distance: {
    type: DistanceSchema,
    label: 'Distance',
    optional: true,
  },
  competitionType: {
    type: String,
    label: 'Type of Competition',
    defaultValue: 'Individual Race',
    autoform: {
      options: competitionTypeOptions,
    },
    required: true,
  },
  startTimestamp: {
    type: Number,
    label: 'Start Timestamp',
    optional: true,
  },
  finishTimestamp: {
    type: Number,
    label: 'Finish Timestamp',
    optional: true,
  },
  name: {
    type: String,
    label: 'Name',
    required: true,
  },
  picture: {
    type: String,
    label: 'Picture',
    optional: true,
  },
  location: {
    type: Object,
    label: 'Location (Starting point)',
    optional: true,
  },
  'location.name': {
    type: String,
    label: 'Place name',
    required: true,
  },
  'location.latitude': {
    type: Number,
    label: 'Latitude',
    min: -90.0,
    max: 90.0,
    autoform: {
      type: 'hidden',
    },
    optional: true,
  },
  'location.longitude': {
    type: Number,
    label: 'Longitude',
    min: -180.0,
    max: 180.0,
    autoform: {
      type: 'hidden',
    },
    optional: true,
  },
  'location.address': {
    type: PostalAddressSchema,
    optional: true,
  },
  startDate: {
    type: Date,
    label: 'Start date',
    optional: true,
    autoform: {
      type: 'pickadate',
      pickadateOptions,
    },
  },
  startTime: {
    type: String,
    label: 'Start time',
    optional: true,
    autoform: {
      type: 'pickatime',
    },
  },
  kmlCourse: {
    type: String,
    label: 'Course path in KML format (paste here)',
    autoform: {
      type: 'textarea',
    },
    optional: true,
  },
  createdAt: {
    type: Date,
    label: 'Created at',
    optional: true,
  },
  organizerName: {
    type: String,
    label: 'Organizer Name',
    optional: true,
  },
  organizerEmail: {
    type: String,
    label: 'Organizer Email',
    optional: true,
  },
  organizerUrl: {
    type: String,
    label: 'Organizer Url',
    optional: true,
  },
  status: {
    type: String,
    label: 'Status',
    required: true,
    defaultValue: 'Ready',
    autoform: {
      options: statusRaceOptions,
    },
  },
  notes: {
    type: String,
    label: 'Notes',
    autoform: {
      type: 'textarea',
    },
    optional: true,
  },
  checkpoints: {
    type: Array,
    label: 'Race Checkpoint List (ordered)',
    optional: true,
  },
  'checkpoints.$': {
    type: Object,
    label: 'Checkpoint',
  },
  'checkpoints.$.deviceId': {
    type: String,
    label: 'Device Identifier',
    required: true,
    autoform: {
      options() {
        return Checkpoints.find({}).map(function (checkpoint) {
          return {
            label: checkpoint.identifier,
            value: checkpoint.identifier,
          };
        });
      },
    },
  },
  'checkpoints.$.laps': {
    type: Number,
    label: 'Number of laps to complete',
    defaultValue: 1,
    required: true,
  },
  'checkpoints.$.latitude': {
    type: Number,
    label: 'Latitude',
    min: -90.0,
    max: 90.0,
    autoform: {
      type: 'hidden',
    },
    optional: true,
  },
  'checkpoints.$.longitude': {
    type: Number,
    label: 'Longitude',
    min: -180.0,
    max: 180.0,
    autoform: {
      type: 'hidden',
    },
    optional: true,
  },
  'checkpoints.$.onFinishLine': {
    type: Boolean,
    label: 'Is Installed on the Finish Line',
    defaultValue: false,
    optional: true,
  },
  'checkpoints.$.latestPingUnixTime': {
    type: Number,
    label: 'Timestamp of the latest ping received from the checkpoint',
    defaultValue: 0,
    autoform: {
      type: 'hidden',
    },
    optional: true,
  },
  'checkpoints.$.resultListId': {
    optional: true,
    type: String,
    label: 'ResultList ID',
    autoform: {
      type: 'hidden',
    },
  },
  deleted: {
    type: Boolean,
    label: 'Marked as delete',
    defaultValue: false,
    optional: true,
  },
  categories: {
    type: Array,
    optional: true,
    label: 'Categories',
  },
  'categories.$': {
    type: String,
    required: true,
  },
  teamCategories: {
    type: Array,
    optional: true,
    label: 'Team Categories',
  },
  'teamCategories.$': {
    type: String,
    required: true,
  },
  external: {
    type: Boolean,
    optional: true,
    label: 'External Competition (imported)',
    defaultValue: false,
  },
  countryId: {
    type: String,
    optional: true,
    label: 'Country Id',
  },
  maxCompetitors: {
    type: Number,
    label: 'Maximum number of competitors',
    min: 1,
    required: true,
    defaultValue: 1,
  },
  privateEvent: {
    type: Boolean,
    label: 'Private Event',
    defaultValue: false,
    optional: true,
  },
  dateCloseRegistration: {
    type: Date,
    label: 'Date when the registration closes',
    optional: true,
    autoform: {
      type: 'pickadate',
      pickadateOptions,
    },
  },
  dateOpenRegistration: {
    type: Date,
    label: 'Date when the registration opens',
    defaultValue: new Date(),
    required: true,
    autoform: {
      type: 'pickadate',
      pickadateOptions,
    },
  },
  bibsReserved: {
    type: Number,
    label: 'Number of first bibs reserved',
    defaultValue: 10,
    min: 0,
    optional: true,
  },
},
{
  clean: {
    filter: true,
    autoConvert: true,
    removeEmptyStrings: true,
    trimStrings: true,
  },
  tracker: Tracker,
},
));

if (Meteor.isServer) {
  Races._ensureIndex({
    identifier: 1,
    name: 1,
    countryId: 1,
    description: 1,
    place: 1,
  });
}

Races.deny({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

Races.allow({
  insert: () => true,
  update: () => true,
  remove: () => true,
});
