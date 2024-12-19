// Definition of the checkpoints collection
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import SimpleSchema from 'simpl-schema';
SimpleSchema.extendOptions(['autoform']);

export const Categories = new Mongo.Collection('categories');

Categories.attachSchema(new SimpleSchema({
  identifier: {
    type: String,
    label: 'Identifier',
    required: true,
    unique: true,
  },
  name: {
    type: String,
    label: 'Name',
    required: true,
  },
  description: {
    type: String,
    label: 'Description',
    optional: true,
  },
  requiredGender: {
    type: String,
    label: 'Required Gender',
    allowedValues: ['Male', 'Female'],
    autoform: {
      options: [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
      ],
    },
    optional: true,
  },
  recognizingAuthorityCode: {
    type: String,
    label: 'Recognizing Authority Code',
    optional: true,
  },
  requiredMinAge: {
    type: Number,
    label: 'Required minimum age',
    optional: true,
    min: 0,
  },
  requiredMaxAge: {
    type: Number,
    label: 'Required maximum age',
    optional: true,
    min: 0,
  },
  referenceDate: {
    type: Date,
    label: 'Date of reference',
    optional: true,
  },
  raceId: {
    type: String,
    label: 'Specific for this race',
    optional: true,
    autoform: {
      type: 'select',
    },
  },
  global: {
    type: Boolean,
    label: 'Allow global usage',
    defaultValue: false,
    optional: true,
  },
  autoAssigned: {
    type: Boolean,
    label: 'Assigned automatically',
    defaultValue: true,
    optional: true,
  },
  deleted: {
    type: Boolean,
    label: 'Is it deleted',
    defaultValue: false,
    optional: true,
  },
  createdAd: {
    type: Date,
    label: 'Date of creation',
    defaultValue: new Date(),
    optional: true,
  },
}, { tracker: Tracker }));

Categories.deny({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

Categories.allow({
  insert: () => true,
  update: () => true,
  remove: () => true,
});
