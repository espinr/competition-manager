// Auxiliar schema that contains an aggregation with data from different collections

import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import SimpleSchema from 'simpl-schema';

export const ResultListEntries = new Mongo.Collection('resultListEntries');

ResultListEntries.attachSchema(new SimpleSchema({
  bib: {
    type: String,
    label: 'Bib',
    optional: true,
  },
  resultListId: {
    type: String,
    label: 'ResultList ID',
    optional: true,
  },
  entryId: {
    type: String,
    label: 'Result List Entry ID',
    optional: true,
  },
  raceId: {
    type: String,
    label: 'Race ID',
    optional: true,
  },
  competitorId: {
    type: String,
    label: 'Competitor ID',
    required: true,
  },
  splits: {
    type: Array,
    label: 'Splits',
    required: true,
  },
  'splits.$': {
    type: Object,
    optional: true,
  },
  'splits.$.performance': {
    type: Number,
    label: 'Performance (seconds)',
    min: 0,
    optional: true,
  },
  competitionFeatures: {
    type: Array,
    label: 'Competition Features',
    optional: true,
  },
  'competitionFeatures.$': {
    type: String,
    label: 'Competition Feature',
    optional: true,
  },
  rankCorrection: {
    type: Number,
    label: 'Rank Correction (caution!)',
    min: 0,
    optional: true,
  },
  athleteId: {
    type: String,
    label: 'Athlete ID',
    required: true,
  },
  athleteCountryFlag: {
    type: String,
    label: 'Country Flag URL',
    optional: true,
  },
  athleteCountryIOC: {
    type: String,
    label: 'Country IOC Code',
    optional: true,
  },
  athleteClub: {
    type: String,
    label: 'Club',
    optional: true,
  },
  athleteUsername: {
    type: String,
    label: 'Athlete Username',
    required: true,
  },
  athleteName: {
    type: String,
    label: 'Athlete Name',
    required: true,
  },
  athleteFirstName: {
    type: String,
    label: 'Athlete\'s First Name',
    required: true,
  },
  athleteLastName: {
    type: String,
    label: 'Athlete\'s Last Name',
    required: true,
  },
  athleteGender: {
    type: String,
    label: 'Athlete\'s Gender',
    required: true,
  },
  athleteBirthDate: {
    type: Date,
    label: 'Date of birth',
    optional: true,
  },
  athleteCategories: {
    type: Array,
    label: 'Athlete\'s Categories',
    optional: true,
  },
  'athleteCategories.$': {
    type: Object,
    label: 'Category',
  },
  'athleteCategories.$.name': {
    type: String,
    label: 'Category Name',
  },
  'athleteCategories.$.identifier': {
    type: String,
    label: 'Category Code',
  },
  'athleteCategories.$.description': {
    type: String,
    label: 'Category Description',
  },
}, { tracker: Tracker }));

ResultListEntries.deny({
  insert: () => false,
  update: () => true,
  remove: () => true,
});

ResultListEntries.allow({
  insert: () => true,
  update: () => false,
  remove: () => false,
});
