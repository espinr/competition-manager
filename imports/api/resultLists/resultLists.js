// Definition of the checkpoints collection
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import Common from '../../../both/lib/common.js';
import RoleTypes from '../users/roles/roleTypes.js';

import SimpleSchema from 'simpl-schema';
SimpleSchema.extendOptions(['autoform']);

export const ResultLists = new Mongo.Collection('resultLists');

const resultsStatusOptions = [
  { value: 'live', label: 'live' },
  { value: 'intermediate', label: 'intermediate' },
  { value: 'unconfirmed', label: 'unconfirmed' },
  { value: 'partial', label: 'partial' },
  { value: 'protested', label: 'protested' },
  { value: 'unofficial', label: 'unofficial' },
  { value: 'official', label: 'official' },
];

ResultLists.attachSchema(new SimpleSchema({
  raceId: {
    type: String,
    label: 'Race ID',
    optional: true,
  },
  categoryId: {
    type: String,
    label: 'Category ID',
    optional: true,
  },
  checkpointId: {
    type: String,
    label: 'Checkpoint ID',
    optional: true,
  },
  status: {
    type: String,
    label: 'Status of results',
    optional: true,
    autoform: {
      options: resultsStatusOptions,
    },
  },
  createdAt: {
    type: Date,
    label: 'Date of creation',
    required: true,
  },
  modifiedAt: {
    type: Date,
    label: 'Last update',
    optional: true,
  },
  entryIds: {
    type: Array,
    required: true,
  },
  'entryIds.$': {
    type: String,
    label: 'Entry ID in result list',
    required: true,
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

ResultLists.deny({
  insert: () => true,
  update: (userId, doc) => {
    // Only can update the admin 
    if (Common.hasAnyOfUserRoles([RoleTypes.ADMIN])) {
      return false;
    }
    return true;
  },
  remove: () => true,
});

ResultLists.allow({
  insert: () => false,
  update: (userId, doc) => {
    // Only can update: gestor, admin or the same user
    if (Common.hasAnyOfUserRoles([RoleTypes.ADMIN])) {
      return true;
    }
    return false;
  },
  remove: () => false,
});
