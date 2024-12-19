// All checkpoints-related publications

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Clubs } from '../clubs';

Meteor.publish('clubs.all', function () {
  return Clubs.find({ alternate: { $ne: 'UNATTACHED' } });
});

Meteor.publish('clubs.id', function(clubId) {
  check(clubId, String);
  return Clubs.find({ _id: clubId });
});

