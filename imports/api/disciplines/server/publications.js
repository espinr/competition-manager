// All checkpoints-related publications

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Disciplines } from '../disciplines';


Meteor.publish('disciplines.all', function () {
  return Disciplines.find({});
});

