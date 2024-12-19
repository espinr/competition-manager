// Methods related to checkpoints

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Teams } from './teams';

Meteor.methods({
  'teams.insert'(doc) {
    check(doc, Object);
    return Teams.insert(doc);
  },
});
