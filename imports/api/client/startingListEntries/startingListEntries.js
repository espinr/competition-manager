// Auxiliar schema that contains an aggregation with data from different collections

import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import SimpleSchema from 'simpl-schema';

export const StartingListEntries = new Mongo.Collection('startingListEntries');

StartingListEntries.attachSchema(new SimpleSchema({
  bib: {
    type: String,
    label: 'Bib',
    optional: true,
  },
  competitorId: {
    type: String,
    label: 'Competitor ID',
    required: true,
  },
  createdAt: {
    type: Date,
    label: 'Creation of the record',
    required: true,
  },
  athleteId: {
    type: String,
    label: 'Athlete ID',
    required: true,
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

StartingListEntries.deny({
  insert: () => false,
  update: () => true,
  remove: () => true,
});

StartingListEntries.allow({
  insert: () => true,
  update: () => false,
  remove: () => false,
});
