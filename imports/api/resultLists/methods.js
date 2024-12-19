// Methods related to results

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ResultLists } from './resultLists.js';
import OpenTrack from '../../../both/lib/opentrack.js';

Meteor.methods({
  'results.insert'(doc) {
    check(doc, Object);
    return ResultLists.insert(doc);
  },
});

/* API definitions */
Meteor.method('api.results.raceId', function(raceId) {
  check(raceId, String);
  const query = { raceId };
  return ResultLists.find(query).map(function(resultList) {
    return OpenTrack.resultListToOpentrack(resultList);
  });
}, {
  url: '/data/races/:raceId/results',
  getArgsFromRequest(request) {
    const { raceId } = request.params;
    return [raceId];
  },
  httpMethod: 'get',
});
