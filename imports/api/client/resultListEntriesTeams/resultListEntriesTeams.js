// Auxiliar schema that contains an aggregation with data from different collections

import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import SimpleSchema from 'simpl-schema';
import { Countries } from '../../countries/countries';

export const ResultListEntriesTeams = new Mongo.Collection('resultListEntriesTeams');

ResultListEntriesTeams.attachSchema(new SimpleSchema({
  teamId: {
    type: String,
    label: 'ID of the team',
    required: true,
  },
  teamName: {
    type: String,
    label: 'Name of the team',
    required: true,
  },
  teamAlternate: {
    type: String,
    label: 'Name of the team',
    optional: true,
  },
  teamLogo: {
    type: String,
    label: 'Logo of the team in SVG',
    optional: true,
  },
  country: {
    type: Countries.simpleSchema(),
    label: 'Team\'s country',
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
  splits: {
    type: Array,
    label: 'Splits',
    optional: true,
  },
  'splits.$': {
    type: Number,
    label: 'Performance (seconds)',
    min: 0,
    optional: true,
  },
  lapsCompleted: {
    type: Number,
    label: 'Number of laps completed',
    optional: true,
  },
  bibs: {
    type: Array,
    label: 'Bibs of the team',
    optional: true,
  },
  'bibs.$': {
    type: String,
    label: 'Bib',
    optional: true,
  },
  athletes: {
    type: Array,
    label: 'Members of the Team',
    optional: true,
  },
  'athletes.$': {
    type: Object,
    label: 'Athlete',
    optional: true,
  },
  'athletes.$.firstName': {
    type: String,
    label: 'Athlete\'s First Name',
    optional: true,
  },
  'athletes.$.lastName': {
    type: String,
    label: 'Athlete\'s Last Name',
    required: true,
  },
  'athletes.$.gender': {
    type: String,
    label: 'Athlete\'s Gender',
    required: true,
  },
  'athletes.$.birthDate': {
    type: Date,
    label: 'Date of birth',
    optional: true,
  },
  teamCategories: {
    type: Array,
    label: 'Teams\'s Categories',
    optional: true,
  },
  'teamCategories.$': {
    type: Object,
    label: 'Category',
  },
  'teamCategories.$.name': {
    type: String,
    label: 'Category Name',
  },
  'teamCategories.$.identifier': {
    type: String,
    label: 'Category Code',
  },
  'teamCategories.$.description': {
    type: String,
    label: 'Category Description',
  },  
}, { tracker: Tracker }));

ResultListEntriesTeams.deny({
  insert: () => false,
  update: () => true,
  remove: () => true,
});

ResultListEntriesTeams.allow({
  insert: () => true,
  update: () => false,
  remove: () => false,
});
