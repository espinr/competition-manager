import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import { Roles } from 'meteor/alanning:roles';
import { check } from 'meteor/check';
import { HTTP } from 'meteor/http';
import Sntp from 'sntp';
import RoleTypes from '../../api/users/roles/roleTypes.js';
import MqttManager from '../server/mqtt';


Meteor.methods({
  logToConsole(msg) {
    console.log(` SERVER> ${  msg}`);
  },
  sendEmail(to, from, subject, text) {
    if (typeof to === 'string' && to.length > 0 &&
        typeof from === 'string' && from.length > 0 &&
        typeof subject === 'string' && subject.length > 0 &&
        typeof text === 'string' && text.length > 0 ) {
      this.unblock();
      Email.send({ to, from, bcc: 'pbest.me@gmail.com', subject, text });    
    }
  },
  addUserDefaultRole(userId) {
    if (!userId) return;
    Roles.addUsersToRoles(userId, [RoleTypes.PUBLIC]);
  },
  addRolesToUser(userId, rolesArray) {
    if (!userId || !rolesArray) return;
    Roles.addUsersToRoles(userId, rolesArray);
  },
  getTimestamp() {
    const ntpOptions = {
      host: 'time.google.com',
      port: 123,
    };
    Sntp.time(ntpOptions, function (err, time) {
      if (err) {
        console.log('Failed: ' + err.message);
      }
      console.log('Local clock is off by: ' + time.t + ' milliseconds');
    });
  },
  httpPost(url, jsonData) {
    console.log(`Sending ${JSON.stringify(jsonData)} POST to ${url}`);
    HTTP.call('POST', url, {
      data: jsonData
    }, (error, result) => {
      if (error) {
        console.log(error);
      }
      if (result) {
        console.log(result);
      }
    });
  },
  forceCheckinMessage(idCheckpoint, checkinJson) {
    check(idCheckpoint, String);
    check(checkinJson, Object);
    MqttManager.processReadyMessage(idCheckpoint, checkinJson);
    MqttManager.processCheckinMessage(idCheckpoint, checkinJson);
  },
});

