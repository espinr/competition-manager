// Methods related to users

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';
import RoleTypes from '/imports/api/users/roles/roleTypes';
import moment from 'moment';
import OpenTrack from '../../../both/lib/opentrack';
import Common from '../../../both/lib/common';
import { Categories } from '../categories/categories';
import { Identifiers } from '../identifiers/identifiers';
import { Competitors } from '../competitors/competitors';
import { Races } from '../races/races';


Meteor.methods({
  'users.insert'(docToInsert) {
    check(docToInsert, Object);
    const doc = docToInsert;
    if (!doc.username) {
      let username = '';
      let index = 0;
      do {
        counter = `${Meteor.users.find().count() + index}`;
        username = `ES${counter.padStart(8, '0')}`;
        index += 1;
      } while (Meteor.users.find({ username }).count() > 0);
      doc.username = username;
      doc.password = username;
      doc.profile.name = `${doc.profile.firstName} ${doc.profile.lastName}`;  
    }
    const userId = Accounts.createUser(doc);
    if (userId) {
      Roles.addUsersToRoles(userId, [RoleTypes.PUBLIC]);
    }
    return userId;
  },
  // Creates a user and join the race
  'users.insert.competitor'(docToInsert, raceId) {
    check(docToInsert, Object);
    check(raceId, String);
    const race = Races.findOne(raceId);
    const doc = docToInsert;
    if (!doc.username) {
      let username = '';
      let index = 0;
      do {
        counter = `${Meteor.users.find().count() + index}`;
        username = `ES${counter.padStart(8, '0')}`;
        index += 1;
      } while (Meteor.users.find({ username }).count() > 0);
      doc.username = username;
      doc.password = username;
      doc.profile.name = `${doc.profile.firstName} ${doc.profile.lastName}`;
    }
    const userId = Accounts.createUser(doc);
    if (userId) {
      Roles.addUsersToRoles(userId, [RoleTypes.PUBLIC]);
    }
    // Now register to the race
    const yearsOld = Common.getYearsOldOnDate(doc.profile.birthDate, 12, 31);
    const raceCategories = race.categories;
    const categoriesArray = Categories.find({
      identifier: { $ne: 'OVERALL' },
      _id: { $in: raceCategories },
      $or: [
        { requiredGender: doc.profile.gender },
        { requiredGender: { $exists: false } },
      ],
      $and: [
        {
          $or: [
            { requiredMinAge: { $lte: yearsOld } },
            { requiredMinAge: { $exists: false } },
          ],
        },
        {
          $or: [
            { requiredMaxAge: { $gte: yearsOld } },
            { requiredMaxAge: { $exists: false } },
          ],
        },
      ],
    }).map(function (cat) { return cat._id; });
    const catDefault = Categories.findOne({ identifier: 'OVERALL' });
    categoriesArray.push(catDefault._id);
    // Get the first identifier
    const skipIdentifiers = race.bibsReserved ? race.bibsReserved : 0;
    const identifier = Identifiers.findOne({ raceId, assigned: false }, { limit: 1, skip: skipIdentifiers });
    const newCompetitor = {
      createdAt: new Date(),
      categories: categoriesArray,
      idUser: userId,
      idRace: raceId,
      bibId: identifier._id,
      bib: identifier.bib,
      epcs: identifier.epcs,
    };
    const competitorId = Competitors.insert(newCompetitor);
    if (competitorId) {
      Identifiers.update({ _id: identifier._id }, {
        $set: {
          assigned: true,
        },
      });
    }
    // Send an email
    if (doc.profile.contactEmail) {
      moment.locale('es');
      const organization = race.organizerName ? race.organizerName : 'El equipo pBest';
      const text = `Hola,

Muchas gracias por inscribirte a ${race.name}. Ya tienes tu plaza asegurada. 
  
Puedes ver toda la información sobre la carrera, horarios, cómo llegar y otros detalles en la web:
http://pbest.es/races/view/${race._id}

¡Nos vemos el ${moment(race.startDate).format('DD MMM YYYY')} a las ${race.startTime}!
  
${organization}
`;
      try {
        Meteor.call(
          'sendEmail',
          `${doc.profile.contactEmail}`, // To
          'pBest <pbest.me@gmail.com>', // From
          `Inscripción a ${race.name} confirmada`,
          text);
      } catch (ex) {
        console.log(ex);
      }
    }
    return competitorId;
  },
});

// Definition of API
Meteor.method('api.athletes', function() {
  return Meteor.users.find({
    'profile.public': true,
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
      'profile.clubId': 1,
    },
  },
  { sort: { 'profile.lastName': 1 } }).map(function(athlete) {
    return OpenTrack.athleteToOpentrack(athlete);
  });
}, {
  url: '/data/athletes',
  httpMethod: 'get',
});

Meteor.method('api.athletes.athleteId', function(athleteId) {
  check(athleteId, String);
  const query = { _id: athleteId };
  return OpenTrack.athleteToOpentrack(Meteor.users.findOne(query));
}, {
  url: '/data/athletes/:athleteId',
  getArgsFromRequest(request) {
    const { athleteId } = request.params;
    return [athleteId];
  },
  httpMethod: 'get',
});

