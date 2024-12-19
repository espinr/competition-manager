// Definition of the checkpoints collection
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import SimpleSchema from 'simpl-schema';
SimpleSchema.extendOptions(['autoform']);

export const Identifiers = new Mongo.Collection('identifiers');

Identifiers.attachSchema(new SimpleSchema({
  raceId: {
    type: String,
    label: 'Race ID (where this bib belongs to)',
    required: true,
  },
  bib: {
    type: String,
    label: 'Bib',
    required: true,
  },
  epcs: {
    type: Array,
    label: 'EPC List',
    optional: true,
  },
  'epcs.$': {
    type: String,
    label: 'EPC',
  },
  assigned: {
    type: Boolean,
    label: 'Assigned already',
    defaultValue: false,
    required: true,
    autoform: {
      type: 'hidden',
    },
  },
}, { tracker: Tracker }));

Identifiers.deny({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

Identifiers.allow({
  insert: () => true,
  update: () => true,
  remove: () => true,
});
