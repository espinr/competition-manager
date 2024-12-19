// Methods related to checkpoints

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { CompetitionFeatures } from './competitionFeatures';

Meteor.method('competitionFeatures.insert', function(doc) {
  check(doc, Object);
  return CompetitionFeatures.insert(doc);
}, {
  httpMethod: 'options',
});

Meteor.method('api.competitionFeatures', function() {
  return CompetitionFeatures.find().map((feature) => {
    return feature.identifier;
  });
}, {
  url: '/data/competitionFeatures',
  httpMethod: 'get',
});
