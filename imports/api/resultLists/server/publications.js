// All results-related publications

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ResultLists } from '../resultLists.js';
import { Races } from '../../races/races';
import Common from '../../../../both/lib/common.js';
import RoleTypes from '../../users/roles/roleTypes.js';

Meteor.publish('results.race', function (raceId) {
  check(raceId, String);
  return ResultLists.find({ raceId });
});

Meteor.publish('results.id', function (resultListId) {
  check(resultListId, String);
  return ResultLists.find({ _id: resultListId });
});
