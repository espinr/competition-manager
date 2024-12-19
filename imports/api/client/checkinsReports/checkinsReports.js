// Auxiliar schema that contains an aggregation with data from different collections

import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import SimpleSchema from 'simpl-schema';

export const CheckinsReports = new Mongo.Collection('checkinsReports');

CheckinsReports.attachSchema(new SimpleSchema({
  bib: {
    type: String,
    label: 'Bib ID',
    optional: true,
  },
  epcs: {
    type: Array,
    label: 'EPCs',
    optional: true,
  },
  'epcs.$': {
    type: String,
    label: 'EPC',
  },
  competitorId: {
    type: String,
    label: 'Competitor ID',
    required: true,
  },
  timestamp: {
    type: Number,
    label: 'Timestamp',
    required: true,
  },
  checkpointId: {
    type: String,
    label: 'Checkpoint ID',
    required: true,
  },
  valid: {
    type: Boolean,
    label: 'Is valid?',
    required: true,
    defaultValue: true,
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
  athleteName: {
    type: String,
    label: 'Athlete Name',
    required: true,
  },
  athleteFirstName: {
    type: String,
    label: 'Athlete First Name',
    required: true,
  },
  athleteLastName: {
    type: String,
    label: 'Athlete Last Name',
    required: true,
  },
}, { tracker: Tracker }));

CheckinsReports.deny({
  insert: () => false,
  update: () => true,
  remove: () => true,
});

CheckinsReports.allow({
  insert: () => true,
  update: () => false,
  remove: () => false,
});
