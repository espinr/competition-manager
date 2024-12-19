// Methods related to checkpoints

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Clubs } from './clubs';
import OpenTrack from '../../../both/lib/opentrack.js';

Meteor.methods({
  'clubs.insert'(doc) {
    check(doc, Object);
    return Clubs.insert(doc);
  },
});

// Definition of API
Meteor.method('api.clubs', function() {
  return Clubs.find({ alternate: { $ne: 'UNATTACHED' } }, { sort: { name: 1 } }).map((club) => {
    return OpenTrack.clubToOpentrack(club);
  });
}, {
  url: '/data/clubs',
  httpMethod: 'get',
});

Meteor.method('api.clubs.clubId', function(clubId) {
  check(clubId, String);
  const query = { _id: clubId };
  return OpenTrack.clubToOpentrack(Clubs.findOne(query));
}, {
  url: '/data/clubs/:clubId',
  getArgsFromRequest(request) {
    const { clubId } = request.params;
    return [clubId];
  },
  httpMethod: 'get',
});
