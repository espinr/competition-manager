// All checkpoints-related publications

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Teams } from '../teams';

Meteor.publish('teams.all', function () {
  return Teams.find({});
});

Meteor.publish('teams.id', function(teamId) {
  check(teamId, String);
  return Teams.find({ _id: teamId });
});

Meteor.publish('teams.raceId', function(raceId) {
  check(raceId, String);
  return Teams.find({ raceId });
});
