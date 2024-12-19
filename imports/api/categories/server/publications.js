// All checkpoints-related publications

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveAggregate } from 'meteor/jcbernack:reactive-aggregate';
import { Categories } from '../categories';
import { Races } from '../../races/races';


Meteor.publish('categories.all', function () {
  return Categories.find({ deleted: { $ne: true } });
});

Meteor.publish('categories.all.raceId', function (raceId) {
  check(raceId, String);
  return Categories.find({ $or: [{ raceId }, { global: true }] });
});

Meteor.publish('categories.id', function (categoryIdentifier) {
  check(categoryIdentifier, String);
  return Categories.find({ identifier: categoryIdentifier });
});


Meteor.publish('categories.race', function (raceId) {
  check(raceId, String);
  const race = Races.findOne(raceId);
  return Categories.find({ _id: { $in: race.categories } });
});
