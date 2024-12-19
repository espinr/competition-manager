// Methods related to checkpoints

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Countries } from './countries.js';
import OpenTrack from '../../../both/lib/opentrack.js';

Meteor.methods({
  'countries.insert'(doc) {
    check(doc, Object);
    return Countries.insert(doc);
  },
});

// Definition of API
Meteor.method('api.countries', function() {
  return Countries.find().map((country) => {
    return OpenTrack.countryToOpentrack(country);
  });
}, {
  url: '/data/countries',
  httpMethod: 'get',
});

Meteor.method('api.countries.countryId', function(countryId) {
  check(countryId, String);
  const query = { 'codes.iso': countryId };
  return OpenTrack.countryToOpentrack(Countries.findOne(query));
}, {
  url: '/data/countries/:countryId',
  getArgsFromRequest(request) {
    const { countryId } = request.params;
    return [countryId];
  },
  httpMethod: 'get',
});
