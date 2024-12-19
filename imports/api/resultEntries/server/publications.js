// All results-related publications

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveAggregate } from 'meteor/jcbernack:reactive-aggregate';
import { ResultEntries } from '../resultEntries';
import Common from '../../../../both/lib/common.js';
import RoleTypes from '../../users/roles/roleTypes.js';
import { ResultLists } from '../../resultLists/resultLists';
import { Races } from '../../races/races';
import OpenTrack from '../../../../both/lib/opentrack.js';


Meteor.publish('resultEntries.id', function (resultEntryId) {
  check(resultEntryId, String);
  return ResultEntries.find({ _id: resultEntryId });
});

Meteor.publish('resultEntries.raceId', function (raceId) {
  check(raceId, String);
  const nonRankingFeaturesArray = Common.getNonRankingFeatures();
  const pipeline = [
    {
      $lookup: {
        localField: '_id',
        from: 'resultLists',
        foreignField: 'entryIds',
        as: 'list',
      },
    },
    {
      $lookup: {
        localField: 'competitorId',
        from: 'competitors',
        foreignField: '_id',
        as: 'competitor',
      },
    },
    { $unwind: '$list' },
    { $match: { 'list.raceId': raceId } },
    { $unwind: '$competitor' },
    {
      $lookup: {
        localField: 'competitor.idUser',
        from: 'users',
        foreignField: '_id',
        as: 'athlete',
      },
    },
    { $unwind: '$athlete' },
    {
      $lookup: {
        localField: 'competitor.categories',
        from: 'categories',
        foreignField: '_id',
        as: 'categories',
      },
    },
    {
      $lookup: {
        localField: 'athlete.profile.countryId',
        from: 'countries',
        foreignField: '_id',
        as: 'country',
      },
    },
    {
      $unwind: {
        path: '$country',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        resultListId: '$list._id',
        // Avoids the splits of athletes disqualified or marked as not finished
        splits: { $cond: [ '$competitionFeatures': { $elemMatch: { $in: nonRankingFeaturesArray } }, [], '$splits'] },
        lapsCompleted: { $size: '$splits' },
        latestSplit: { $arrayElemAt: ['$splits', -1] },
        rankCorrection: 1,
        competitionFeatures: 1,
        raceId: '$list.raceId',
        checkpointId: '$list.checkpointId',
        bib: '$competitor.bib',
        categories: '$categories',
        competitorId: '$competitor._id',
        athleteFirstName: '$athlete.profile.firstName',
        athleteLastName: '$athlete.profile.lastName',
        athleteGender: '$athlete.profile.gender',
        athleteClub: '$athlete.profile.clubName',
        athleteUsername: '$athlete.username',
        athleteName: '$athlete.profile.name',
        athleteBirthDate: '$athlete.profile.birthDate',
        athleteCountryFlag: '$country.imageUrl',
        athleteCountryIOC: '$country.codes.ioc',
      },
    },
    {
      $sort: {
        lapsCompleted: -1,
        'latestSplit.performance': 1,
      },
    },
  ];
  ReactiveAggregate(this, ResultEntries, pipeline, { clientCollection: 'resultListEntries' });
});

function getPipelineRelayTeams(raceId) {
  const nonRankingFeaturesArray = Common.getNonRankingFeatures();
  return [
    {
      $lookup: {
        localField: 'competitorId',
        from: 'teams',
        foreignField: 'competitorIds',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    {
      $lookup: {
        localField: '_id',
        from: 'resultLists',
        foreignField: 'entryIds',
        as: 'list',
      },
    },
    {
      $lookup: {
        localField: 'competitorId',
        from: 'competitors',
        foreignField: '_id',
        as: 'competitor',
      },
    },
    { $unwind: '$list' },
    { $match: { 'list.raceId': raceId } },
    { $unwind: '$competitor' },
    {
      $lookup: {
        localField: 'competitor.idUser',
        from: 'users',
        foreignField: '_id',
        as: 'athlete',
      },
    },
    { $unwind: '$athlete' },
    {
      $lookup: {
        localField: 'team.countryId',
        from: 'countries',
        foreignField: '_id',
        as: 'country',
      },
    },
    {
      $unwind: {
        path: '$country',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        localField: 'team.teamCategories',
        from: 'teamCategories',
        foreignField: '_id',
        as: 'teamCategories',
      },
    },
    { $unwind: '$splits' },
    {
      $project: {
        resultListId: '$list._id',
        athlete: '$athlete',
        splits: '$splits',
        competitor: '$competitor',
        country: 1,
        teamCategories: '$teamCategories',
        competitionFeatures: 1,
        name: '$team.name',
        alternate: '$team.alternate',
        logo: '$team.logo',
        teamId: '$team._id',
      },
    },
    {
      $group: {
        _id: '$teamId',
        competitorBibs: { $addToSet: '$competitor.bib' },
        resultListId: { $addToSet: '$resultListId' },
        athletes: { $push: { firstName: '$athlete.profile.firstName', lastName: '$athlete.profile.lastName', gender: '$athlete.profile.gender', birthDate: '$athlete.profile.birthDate' }},
        splits: { $push: '$splits' },
        competitionFeatures: { $push: '$competitionFeatures' },
        country: { $addToSet: '$country' },
        teamCategories: { $addToSet: '$teamCategories' },
        name: { $addToSet: '$name' },
        logo: { $addToSet: '$logo' },
        alternate: { $addToSet: '$alternate' },
        numberCompetitors: { $sum: 1 },
        latestPerformance: { $max: '$splits.performance' },
      },
    },
    {
      $project: {
        athletes: '$athletes',
        resultListId: { $arrayElemAt: ['$resultListId', 0] },
        splits: '$splits',
        competitionFeatures: { $arrayElemAt: ['$competitionFeatures', 0] },
        bibs: '$competitorBibs',
        country: { $arrayElemAt: ['$country', 0] },
        teamName: '$name',
        teamCategories: { $arrayElemAt: ['$teamCategories', 0] },
        teamLogo: '$logo',
        teamAlternate: '$alternate',
        teamId: '$team._id',
        lapsCompleted: { $size: '$splits' },
        latestPerformance: '$latestPerformance',
      },
    },
    { $unwind: '$teamName' },
    { $unwind: '$teamAlternate' },
    { $unwind: '$teamLogo' },
    {
      $project: {
        athletes: 1,
        resultListId: 1,
        competitionFeatures: 1,
        bibs: 1,
        country: 1,
        raceId,
        teamName: 1,
        teamCategories: 1,
        teamLogo: 1,
        teamAlternate: 1,
        teamId: 1,
        splits: { $cond: [ '$competitionFeatures': { $elemMatch: { $in: nonRankingFeaturesArray } }, [], '$splits'] },
        lapsCompleted: { $cond: [ '$competitionFeatures': { $elemMatch: { $in: nonRankingFeaturesArray } }, 0, '$lapsCompleted'] },
        latestPerformance: { $cond: [ '$competitionFeatures': { $elemMatch: { $in: nonRankingFeaturesArray } }, 0, '$latestPerformance'] },        
      },
    },
    {
      $sort: {
        lapsCompleted: -1,
        latestPerformance: 1,
      },
    },
  ];
}

Meteor.publish('resultEntriesRelayTeams.raceId', function (raceId) {
  check(raceId, String);
  ReactiveAggregate(this, ResultEntries, getPipelineRelayTeams(raceId), { clientCollection: 'resultListEntriesRelayTeams' });
});

function getPipelineTeams(raceId) {
  const nonRankingFeaturesArray = Common.getNonRankingFeatures();
  return [
    {
      $lookup: {
        localField: 'competitorId',
        from: 'teams',
        foreignField: 'competitorIds',
        as: 'team',
      },
    },
    { $unwind: '$splits' },
    { $sort: { 'splits.performance': 1 } },
    { $unwind: '$team' },
    {
      $lookup: {
        localField: '_id',
        from: 'resultLists',
        foreignField: 'entryIds',
        as: 'list',
      },
    },
    {
      $lookup: {
        localField: 'competitorId',
        from: 'competitors',
        foreignField: '_id',
        as: 'competitor',
      },
    },
    { $unwind: '$list' },
    { $match: { 'list.raceId': raceId } },
    { $unwind: '$competitor' },
    {
      $lookup: {
        localField: 'competitor.idUser',
        from: 'users',
        foreignField: '_id',
        as: 'athlete',
      },
    },
    { $unwind: '$athlete' },
    {
      $lookup: {
        localField: 'team.countryId',
        from: 'countries',
        foreignField: '_id',
        as: 'country',
      },
    },
    {
      $unwind: {
        path: '$country',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        localField: 'team.teamCategories',
        from: 'teamCategories',
        foreignField: '_id',
        as: 'teamCategories',
      },
    },
    { $unwind: '$splits' },
    {
      $project: {
        resultListId: '$list._id',
        athlete: '$athlete',
        splits: '$splits',
        competitor: '$competitor',
        country: 1,
        teamCategories: '$teamCategories',
        competitionFeatures: 1,
        name: '$team.name',
        alternate: '$team.alternate',
        logo: '$team.logo',
        teamId: '$team._id',
      },
    },
    {
      $group: {
        _id: '$teamId',
        competitorBibs: { $addToSet: '$competitor.bib' },
        resultListId: { $addToSet: '$resultListId' },
        athletes: { $push: { firstName: '$athlete.profile.firstName', lastName: '$athlete.profile.lastName', gender: '$athlete.profile.gender', birthDate: '$athlete.profile.birthDate' }},
        splits: { $push: '$splits.performance' },
        competitionFeatures: { $push: '$competitionFeatures' },
        country: { $addToSet: '$country' },
        teamCategories: { $addToSet: '$teamCategories' },
        name: { $addToSet: '$name' },
        logo: { $addToSet: '$logo' },
        alternate: { $addToSet: '$alternate' },
        numberCompetitors: { $sum: 1 },
      },
    },
    {
      $project: {
        athletes: '$athletes',
        resultListId: { $arrayElemAt: ['$resultListId', 0] },
        splits: '$splits',
        competitionFeatures: { $arrayElemAt: ['$competitionFeatures', 0] },
        bibs: '$competitorBibs',
        country: { $arrayElemAt: ['$country', 0] },
        teamName: '$name',
        teamCategories: { $arrayElemAt: ['$teamCategories', 0] },
        teamLogo: '$logo',
        teamAlternate: '$alternate',
        teamId: '$team._id',
        lapsCompleted: { $size: '$splits' },
      },
    },
    { $unwind: '$teamName' },
    { $unwind: '$teamAlternate' },
    { $unwind: '$teamLogo' },
    {
      $project: {
        athletes: 1,
        resultListId: 1,
        competitionFeatures: 1,
        bibs: 1,
        country: 1,
        raceId,
        teamName: 1,
        teamCategories: 1,
        teamLogo: 1,
        teamAlternate: 1,
        teamId: 1,
        splits: { $cond: [ '$competitionFeatures': { $elemMatch: { $in: nonRankingFeaturesArray } }, [], '$splits'] },
        lapsCompleted: { $cond: [ '$competitionFeatures': { $elemMatch: { $in: nonRankingFeaturesArray } }, 0, '$lapsCompleted'] },
      },
    },
    {
      $sort: {
        lapsCompleted: -1,
      },
    },
  ];
}

// For indifidual (non-relay) teams only
Meteor.publish('resultEntriesTeams.raceId', function (raceId) {
  check(raceId, String);
  ReactiveAggregate(this, ResultEntries, getPipelineTeams(raceId), { clientCollection: 'resultListEntriesTeams' });
});


// Definition of API
Meteor.method('api.resultEntriesRelayTeams.raceId', function (raceId) {
  check(raceId, String);
  const arrayEntries = ResultEntries.aggregate(getPipelineRelayTeams(raceId)).map((entry, index) => {
    const updated = entry;
    updated.calculatedRank = index + 1;
    return OpenTrack.resultEntryRelaysToOpentrack(updated);
  });
  return arrayEntries;
}, {
  url: '/data/races/:raceId/relay-results',
  getArgsFromRequest(request) {
    const { raceId } = request.params;
    return [raceId];
  },
  httpMethod: 'get',
});
