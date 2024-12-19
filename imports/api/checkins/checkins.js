// Definition of the checkpoints collection
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import SimpleSchema from 'simpl-schema';
SimpleSchema.extendOptions(['autoform']);

export const Checkins = new Mongo.Collection('checkins');

Checkins.attachSchema(new SimpleSchema({
  bib: {
    type: String,
    label: 'Bib ID',
    optional: true,
  },
  epc: {
    type: String,
    label: 'EPC',
    optional: true,
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
}, { tracker: Tracker }));

Checkins.deny({
  insert: () => false,
  update: () => true,
  remove: () => true,
});

Checkins.allow({
  insert: () => true,
  update: () => false,
  remove: () => false,
});
