import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { Accounts } from 'meteor/accounts-base';
import { Identifiers } from '../../api/identifiers/identifiers.js';
import { identifiers } from '../../../stores/identifiers.js';
import { categories } from '../../../stores/categories.js';
import { checkpoints } from '../../../stores/checkpoints.js';
import RoleTypes from '../../api/users/roles/roleTypes.js';
import { Checkpoints } from '../../api/checkpoints/checkpoints.js';
import { Races } from '../../api/races/races.js';
import { Categories } from '../../api/categories/categories.js';
import MqttManager from './mqtt.js';
import moment from 'moment';
import './accounts.js';

const namesToLoad = [
  { firstName: 'Martin', lastName: 'Alvarez-Test', gender: 'Male' },

  { firstName: 'Sonia', lastName: 'Arango', gender: 'Female' },
  { firstName: 'Lucía', lastName: 'Alonso', gender: 'Female' },
  { firstName: 'Telmo', lastName: 'Díaz', gender: 'Male' },
  { firstName: 'Jonatan', lastName: 'Yuguero', gender: 'Male' },

  { firstName: 'Ulises Abdul', lastName: 'Sall', gender: 'Male' },
  { firstName: 'Frida', lastName: 'Sall', gender: 'Female' },
  { firstName: 'Ángela', lastName: 'Prados', gender: 'Female' },
  { firstName: 'Alba', lastName: 'Ordíz', gender: 'Female' },

  { firstName: 'Escolar1.1', lastName: 'Escolar1.1', gender: 'Male' },
  { firstName: 'Escolar1.2', lastName: 'Escolar1.2', gender: 'Male' },
  { firstName: 'Escolar1.3', lastName: 'Escolar1.3', gender: 'Female' },
  { firstName: 'Escolar1.4', lastName: 'Escolar1.4', gender: 'Female' },

  { firstName: 'Escolar2.1', lastName: 'Escolar2.1', gender: 'Male' },
  { firstName: 'Escolar2.2', lastName: 'Escolar2.2', gender: 'Male' },
  { firstName: 'Escolar2.3', lastName: 'Escolar2.3', gender: 'Female' },
  { firstName: 'Escolar2.4', lastName: 'Escolar2.4', gender: 'Female' },

  { firstName: 'Escolar3.1', lastName: 'Escolar3.1', gender: 'Male' },
  { firstName: 'Escolar3.2', lastName: 'Escolar3.2', gender: 'Male' },
  { firstName: 'Escolar3.3', lastName: 'Escolar3.3', gender: 'Female' },
  { firstName: 'Escolar3.4', lastName: 'Escolar3.4', gender: 'Female' },

  { firstName: 'Paula González', lastName: 'Blanco', gender: 'Female' },
  { firstName: 'Claudia', lastName: 'Junquera', gender: 'Female' },
  { firstName: 'Isabel', lastName: 'Barreiro', gender: 'Female' },  
    
  { firstName: 'Marta', lastName: 'Manzano', gender: 'Female' },
  { firstName: 'Marta2', lastName: 'Manzano2', gender: 'Female' },
  { firstName: 'Marta3', lastName: 'Manzano3', gender: 'Female' },
  
  { firstName: 'Chicas1.1', lastName: 'Chicas1.1', gender: 'Female' },
  { firstName: 'Chicas1.2', lastName: 'Chicas1.2', gender: 'Female' },
  { firstName: 'Chicas1.3', lastName: 'Chicas1.3', gender: 'Female' },

  { firstName: 'Chicas2.1', lastName: 'Chicas2.1', gender: 'Female' },
  { firstName: 'Chicas2.2', lastName: 'Chicas2.2', gender: 'Female' },
  { firstName: 'Chicas2.3', lastName: 'Chicas2.3', gender: 'Female' },

  { firstName: 'Raúl', lastName: 'Bengoa', gender: 'Male' },
  { firstName: 'Ciro', lastName: 'Canseco', gender: 'Male' },

  { firstName: 'Chicos1.1', lastName: 'Chicos1.1', gender: 'Male' },
  { firstName: 'Chicos1.2', lastName: 'Chicos1.2', gender: 'Male' },

  { firstName: 'Chicos2.1', lastName: 'Chicos2.1', gender: 'Male' },
  { firstName: 'Chicos2.2', lastName: 'Chicos2.2', gender: 'Male' },

  { firstName: 'Chicos3.1', lastName: 'Chicos3.1', gender: 'Male' },
  { firstName: 'Chicos3.2', lastName: 'Chicos3.2', gender: 'Male' },

  { firstName: 'Chicos4.1', lastName: 'Chicos4.1', gender: 'Male' },
  { firstName: 'Chicos4.2', lastName: 'Chicos4.2', gender: 'Male' },
];

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max) + 1);
}
function getRandomBirthDate() {
  const day = getRandomInt(28);
  const month = getRandomInt(12);
  const year = 1920 + getRandomInt(90);
  const date = `${year}-${month}-${day}`;
  return moment(date, 'YYYY-MM-DD').toDate();
}

function getRandomGender() {
  if (Math.floor(Math.random() * Math.floor(2)) === 0) return 'Male';
  return 'Female';
}

export function createTestingUsers() {
  let counter = Math.floor(Math.random() * Math.floor(1000));

  namesToLoad.forEach(person => {
    const userId = Accounts.createUser({
      username: `${person.firstName}_${person.lastName}`,
      email: `user_${counter}@espinr.es`,
      profile: {
        name: `${person.firstName} ${person.lastName}`,
        firstName: person.firstName,
        passport: '00000000',
        lastName: person.lastName,
        birthDate: getRandomBirthDate(),
        gender: person.gender,
        phone: '000000000',
        acceptPolicy: true,
      },
      createdAt: new Date(),
      password: 'test',
    });
    if (userId) {
      Roles.addUsersToRoles(userId, [RoleTypes.PUBLIC]);
    }
    counter += 1;
  });
}
