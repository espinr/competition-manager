// All checkpoints-related publications

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Races } from '../races.js';

Meteor.publish('races.all', function () {
  return Races.find({ deleted: { $ne: true }, external: { $ne: true }, identifier: { $ne: '_bydefault_' } });
});

Meteor.publish('races.all.external', function () {
  return Races.find({ deleted: { $ne: true }, identifier: { $ne: '_bydefault_' } });
});

Meteor.publish('races.search', function (search) {
  check(search, Match.OneOf(String, null, undefined));
  let query = { deleted: { $ne: true }, external: { $ne: true }, identifier: { $ne: '_bydefault_' }};
  const projection = { sort: { createdAt: -1 } };

  if (search) {
    const regex = {
      $regex: search,
      $options: 'i',
    };

    query = {
      $and: [
        { deleted: { $ne: true } },
        { external: { $ne: true } },
        { identifier: { $ne: '_bydefault_' } },
        {
          $or: [
            { name: regex },
            { description: regex },
            { identifier: regex },
            { place: regex },
          ],
        },
      ],
    };
  }
  return Races.find(query, projection);
});

Meteor.publish('races.id', function (idRace) {
  check(idRace, String);
  return Races.find({ _id: idRace });
});
