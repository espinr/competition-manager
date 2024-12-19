// All checkpoints-related publications

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { TeamCategories } from '../teamCategories.js';

import { Races } from '../../races/races';


Meteor.publish('teamCategories.all', function () {
  return TeamCategories.find({});
});

Meteor.publish('teamCategories.race', function (raceId) {
  check(raceId, String);
  const race = Races.findOne(raceId);
  return TeamCategories.find({ _id: { $in: race.teamCategories } });
});
