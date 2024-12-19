// Methods related to checkpoints

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { TeamCategories } from './teamCategories.js';

Meteor.methods({
  'teamCategories.insert'(doc) {
    check(doc, Object);
    return TeamCategories.insert(doc);
  },
});
