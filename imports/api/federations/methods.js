// Methods related to checkpoints

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Federations } from './federations';
import OpenTrack from '../../../both/lib/opentrack';

Meteor.methods({
  'federations.insert'(doc) {
    check(doc, Object);
    return Federations.insert(doc);
  },
});

/* API definitions */
Meteor.method('api.federations.all', function () {
  return Federations.find({}).map((fed) => {
    return OpenTrack.federationToOpentrack(fed);
  });
}, {
  url: '/data/federations',
  httpMethod: 'get',
});

Meteor.method('api.federations.id', function(fedId) {
  check(fedId, String);
  const query = { identifier: fedId };
  return OpenTrack.federationToOpentrack(Federations.findOne(query));
}, {
  url: '/data/federations/:fedId',
  getArgsFromRequest(request) {
    const { fedId } = request.params;
    return [fedId];
  },
  httpMethod: 'get',
});
