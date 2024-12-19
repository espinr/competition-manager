// Definition of the checkpoints collection
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import SimpleSchema from 'simpl-schema';
SimpleSchema.extendOptions(['autoform']);

export const Countries = new Mongo.Collection('countries');

Countries.attachSchema(new SimpleSchema({
  name: {
    type: String,
    label: 'Name',
    required: true,
  },
  codes: {
    type: Object,
    label: 'Codes',
    required: true,
  },
  'codes.iso': {
    type: String,
    label: 'ISO Code',
    optional: true,
  },
  'codes.ioc': {
    type: String,
    label: 'IOC Code',
    optional: true,
  },
  'codes.fifa': {
    type: String,
    label: 'FIFA Code',
    optional: true,
  },
  imageUrl: {
    type: String,
    label: 'Image URL',
    optional: true,
  },
}, { tracker: Tracker }));

Countries.deny({
  insert: () => false,
  update: () => true,
  remove: () => true,
});

Countries.allow({
  insert: () => true,
  update: () => false,
  remove: () => false,
});
