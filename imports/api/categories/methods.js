// Methods related to checkpoints

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Categories } from './categories.js';
import OpenTrack from '../../../both/lib/opentrack.js';
import { Races } from '../races/races.js';

Meteor.method('categories.insert', function(doc) {
  check(doc, Object);
  return Categories.insert(doc);
}, {
  httpMethod: 'options',
});

// Changes the raceId of the categories by another new one
Meteor.method('categories.update.raceId', function(previous, newId) {
  check(previous, String);
  check(newId, String);
  return Categories.update({ raceId: previous }, { $set: { raceId: newId } }, { multi: true });
}, {
  httpMethod: 'options',
});

// Deletes the category if it is not linked and used by one race
Meteor.method('categories.delete', function(catIdentifier) {
  check(catIdentifier, String);
  // If there is no race linked 
  const cat = Categories.findOne({ identifier: catIdentifier });
  let race = null;
  if (cat && cat.raceId) {
    race = Races.findOne({ _id: cat.raceId, categories: cat._id });
  }
  if (!race) {
    return Categories.update({ identifier: catIdentifier }, { $set: { deleted: true } });
  }
  return 0;
}, {
  httpMethod: 'options',
});

Meteor.method('api.categories.all', function () {
  return Categories.find({ deleted: { $ne: true } }).map((category) => {
    return OpenTrack.categoryToOpentrack(category);
  });
}, {
  url: '/data/categories',
  httpMethod: 'get',
});

Meteor.method('api.categories.id', function(catIdentifier) {
  check(catIdentifier, String);
  const query = { identifier: catIdentifier };
  return OpenTrack.categoryToOpentrack(Categories.findOne(query));
}, {
  url: '/data/categories/:catId',
  getArgsFromRequest(request) {
    const { catId } = request.params;
    return [catId];
  },
  httpMethod: 'get',
});
