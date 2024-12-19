// All checkpoints-related publications

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Federations } from '../federations';

Meteor.publish('federations.all', function () {
  return Federations.find();
});

Meteor.publish('federations.id', function(federationId) {
  check(federationId, String);
  return Federations.find({ _id: federationId });
});
