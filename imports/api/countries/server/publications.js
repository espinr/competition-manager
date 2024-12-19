// All checkpoints-related publications

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Countries } from '../countries';


Meteor.publish('countries.all', function () {
  return Countries.find({}, { sort: { name: 1 } });
});

Meteor.publish('countries.id', function (countryId) {
  check(countryId, String);
  return Countries.find({ _id: countryId });
});
