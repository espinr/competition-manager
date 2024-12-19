// All checkpoints-related publications

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveAggregate } from 'meteor/jcbernack:reactive-aggregate';
import { Checkins } from '../checkins.js';

Meteor.publish('checkins.between', function (timestampFrom, timestampTo) {
  check(timestampFrom, Number);
  check(timestampTo, Match.OneOf(undefined, null, Number));
  const queryTimestamp = {
    $gt: timestampFrom,
  };
  if (timestampTo) {
    queryTimestamp.$lt = timestampTo;
  }
  Meteor.call('logToConsole', JSON.stringify(queryTimestamp));
  return Checkins.find({ timestamp: queryTimestamp });
});

Meteor.publish('checkins.between.plus.athlete', function (timestampFrom, timestampTo) {
  check(timestampFrom, Number);
  check(timestampTo, Match.OneOf(undefined, null, Number));

  const queryTimestamp = { $gt: timestampFrom };
  if (timestampTo) {
    queryTimestamp.$lt = timestampTo;
  }

  const aggregation = [
    { $match: { timestamp: queryTimestamp } },
    {
      $lookup: {
        localField: 'competitorId',
        from: 'competitors',
        foreignField: '_id',
        as: 'competitor',
      },
    },
    {
      $lookup: {
        localField: 'competitor.idUser',
        from: 'users',
        foreignField: '_id',
        as: 'athlete',
      },
    },
    { $unwind: '$competitor' },
    { $unwind: '$athlete' },    
    { $sort: { timestamp: 1 } },
    {
      $project: {
        _id: 1,
        checkpointId: 1,
        competitorId: 1,
        athleteId: '$athlete._id',
        athleteName: '$athlete.profile.name',
        athleteLastName: '$athlete.profile.lastName',
        athleteFirstName: '$athlete.profile.firstName',
        bib: '$competitor.bib',
        epcs: '$competitor.epcs',
        timestamp: 1,
        valid: 1,
        createdAt: 1,
      },
    },
  ];
  ReactiveAggregate(this, Checkins, aggregation, { clientCollection: 'checkinsReports' });
});
