// All checkpoints-related publications

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Common from '../../../../both/lib/common.js';
import RoleTypes from '../../users/roles/roleTypes.js';


Meteor.publish('users.email', function () {
  return Meteor.users.find({ _id: this.userId }, { fields: { emails: 1,  profile: 1, firstName: 1, lastName: 1 } });
});

Meteor.publish('user.data', function () {
  return Meteor.users.find({ _id: this.userId }, { fields: { emails: 1,  profile: 1, 'profile.name': 1, 'profile.firstName': 1, 'profile.lastName': 1, } });
});

Meteor.publish('users.roles', function () {
  return Meteor.roles.find({});
});

Meteor.publish('users.byId', function (idUser) {
  check(idUser, Match.OneOf(String, null, undefined));
  return Meteor.users.find({ _id: idUser });
});

Meteor.publish('athletes.public.all', function () {
  return Meteor.users.find({
    'profile.name': {
      $nin: ['####UNKNOWN####', 'admin'],
    },
  },
  {
    fields: {
      'profile.firstName': 1,
      'profile.lastName': 1,
      'profile.gender': 1,
      'profile.locality': 1,
      'profile.countryId': 1,
      'profile.external': 1,
      'profile.public': 1,
      'profile.clubId': 1,
    },
  });
});

Meteor.publish('athletes.public.opentrack.all', function () {
  return Meteor.users.find({ 'profile.public': true },
    {
      fields: {
        'profile.firstName': 1,
        'profile.lastName': 1,
        'profile.gender': 1,
        'profile.locality': 1,
        'profile.countryId': 1,
        'profile.external': 1,
        'profile.public': 1,
        'profile.clubId': 1,
      },
    });
});

// Their own user entity
Meteor.publish('users.own', function () {
  const user = Meteor.user();
  if (user) {
    return Meteor.users.find({ _id: user._id });
  }
  return null;
});


Meteor.publish('users.search', function (search) {
  check(search, Match.OneOf(String, null, undefined));

  let query = { };
  if (!Common.hasAnyOfUserRoles([RoleTypes.ADMIN])) {
    return null;
  }

  if (search) {
    const regex = {
      $regex: search,
      $options: 'i',
    };
    query = {
      $or: [
        { username: regex },
        { 'profile.name': regex },
        { 'profile.firstName': regex },
        { 'profile.lastName': regex },
        { 'profile.emails.0': regex },
        { 'profile.notes': regex },
      ],
    };
  }
  return Meteor.users.find(query);
});
