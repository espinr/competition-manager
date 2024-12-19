// All checkpoints-related publications

import { Meteor } from 'meteor/meteor';
import { CompetitionFeatures } from '../competitionFeatures';


Meteor.publish('competitionFeatures.all', function () {
  return CompetitionFeatures.find({});
});

