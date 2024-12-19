// Definition of the checkpoints collection
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import SimpleSchema from 'simpl-schema';
SimpleSchema.extendOptions(['autoform']);

export const TeamCategories = new Mongo.Collection('teamCategories');

TeamCategories.attachSchema(new SimpleSchema({
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
  requiredMinAthleteNumber: {
    type: Number,
    label: 'Minimum number of athletes',
    optional: true,
    min: 0,
  },
  requiredMaxAthleteNumber: {
    type: Number,
    label: 'Maximum number of athletes',
    optional: true,
    min: 0,
  },
  scoringAthletes: {
    type: Number,
    label: 'Number of athletes that counts for the total score',
    optional: true,
    min: 0,
  },
  scoringCriteria: {
    type: String,
    label: 'Scoring criteria',
    allowedValues: ['Time', 'Rank'],
    autoform: {
      options: [
        { label: 'Time', value: 'Time' },
        { label: 'Rank', value: 'Rank' },
      ],
    },
    optional: true,
  },
}, { tracker: Tracker }));

TeamCategories.deny({
  insert: () => false,
  update: () => true,
  remove: () => true,
});

TeamCategories.allow({
  insert: () => true,
  update: () => false,
  remove: () => false,
});
