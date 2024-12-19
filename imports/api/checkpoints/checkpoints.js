// Definition of the checkpoints collection with static values about checkpoints 
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import Common from '../../../both/lib/common.js';
import RoleTypes from '../users/roles/roleTypes.js';

import SimpleSchema from 'simpl-schema';
SimpleSchema.extendOptions(['autoform']);

export const Checkpoints = new Mongo.Collection('checkpoints');


Checkpoints.attachSchema(new SimpleSchema({
  identifier: {
    type: String,
    label: 'Checkpoint Identifier (the ID of the device)',
    unique: true,
    required: true,
  },
  description: {
    type: String,
    label: 'Description',
    optional: true,
  },
  name: {
    type: String,
    label: 'Name',
    required: true,
  },
  notes: {
    type: String,
    label: 'Notes',
    autoform: {
      type: 'textarea',
    },
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
},
{ tracker: Tracker },
));

if (Meteor.isServer) {
  Checkpoints._ensureIndex({
    identifier: 1,
    name: 1,
    description: 1,
  });
}

Checkpoints.deny({
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

Checkpoints.allow({
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
