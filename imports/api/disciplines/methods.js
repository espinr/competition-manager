// Methods related to checkpoints

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Disciplines } from './disciplines';
import OpenTrack from '../../../both/lib/opentrack.js';

Meteor.method('disciplines.insert', function(doc) {
  check(doc, Object);
  return Disciplines.insert(doc);
}, {
  httpMethod: 'options',
});


Meteor.method('api.disciplines.all', function () {
  return Disciplines.find({}).map((discipline) => {
    return OpenTrack.disciplineToOpentrack(discipline);
  });
}, {
  url: '/data/disciplines',
  httpMethod: 'get',
});

Meteor.method('api.disciplines.id', function(disIdentifier) {
  check(disIdentifier, String);
  const query = { identifier: disIdentifier };
  return OpenTrack.disciplineToOpentrack(Disciplines.findOne(query));
}, {
  url: '/data/disciplines/:disciplineId',
  getArgsFromRequest(request) {
    const { disciplineId } = request.params;
    return [disciplineId];
  },
  httpMethod: 'get',
});
