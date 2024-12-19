// All checkpoints-related publications

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveAggregate } from 'meteor/jcbernack:reactive-aggregate';
import { Competitors } from '../competitors.js';
import { Races } from '../../races/races.js';

Meteor.publish('competitors.race', function (idCompetition) {
  check(idCompetition, String);
  // It returns also the generic race
  const raceByDefault = Races.findOne({ identifier: '_bydefault_' });
  return Competitors.find({
    $or: [
      { idRace: idCompetition },
      { idRace: raceByDefault._id },
    ],
  });
});

Meteor.publish('competitors.byId', function (idCompetitor) {
  check(idCompetitor, String);
  return Competitors.find({ _id: idCompetitor });
});

Meteor.publish('competitors.startingList', function (raceId) {
  check(raceId, String);

  const aggregation = [
    { $match: { idRace: raceId } },
    {
      $lookup: {
        localField: 'idUser',
        from: 'users',
        foreignField: '_id',
        as: 'athlete',
      },
    },
    {
      $lookup: {
        localField: 'categories',
        from: 'categories',
        foreignField: '_id',
        as: 'categories',
      },
    },
    { $unwind: '$athlete' },
    { $sort: { timestamp: 1 } },
    {
      $project: {
        _id: 1,
        checkpointId: 1,
        competitorId: '$_id',
        athleteId: '$athlete._id',
        athleteUsername: '$athlete.username',
        athleteName: '$athlete.profile.name',
        athleteGender: '$athlete.profile.gender',
        athleteLastName: '$athlete.profile.lastName',
        athleteFirstName: '$athlete.profile.firstName',
        athleteClub: '$athlete.profile.clubName',
        categories: 1,
        athleteBirthDate: '$athlete.profile.birthDate',
        bib: 1,
        epcs: 1,
        createdAt: 1,
      },
    },
  ];
  ReactiveAggregate(this, Competitors, aggregation, { clientCollection: 'startingListEntries' });
});

