// Definition of the checkpoints collection
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';

import SimpleSchema from 'simpl-schema';
SimpleSchema.extendOptions(['autoform']);

export const Competitors = new Mongo.Collection('competitors');

Competitors.attachSchema(new SimpleSchema({
  idUser: {
    type: String,
    label: 'User ID',
    required: true,
  },
  idRace: {
    type: String,
    label: 'Race ID',
    required: true,
  },
  categories: {
    type: Array,
    label: 'Categories',
    optional: true,
  },
  'categories.$': {
    type: String,
    label: 'Category ID',
  },
  bibId: {
    type: String,
    label: 'Bib ID',
    required: true,
  },
  bib: {
    type: String,
    label: 'Bib',
    required: true,
  },
  epcs: {
    type: Array,
    label: 'EPC Lists',
    optional: true,
  },
  'epcs.$': {
    type: String,
  },
  createdAt: {
    type: Date,
    label: 'Created at',
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

Competitors.deny({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

Competitors.allow({
  insert: () => true,
  update: () => true,
  remove: () => true,
});
