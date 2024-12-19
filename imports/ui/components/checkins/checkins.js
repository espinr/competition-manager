import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveTable } from 'meteor/aslagle:reactive-table';
import { Session } from 'meteor/session';
import Sntp from 'sntp';
import 'numeraljs';
import moment from 'moment';
import beautify from 'json-beautify';
import Common from '../../../../both/lib/common.js';


import './checkins.html';
//import { Checkins } from '../../../api/checkins/checkins.js';
import { CheckinsReports } from '../../../api/client/checkinsReports/checkinsReports';
import { Competitors } from '../../../api/competitors/competitors.js';
import { Races } from '../../../api/races/races.js';

function isInResults(arrayResults, checkinValue) {
  for (let i = 0; i < arrayResults.length; i += 1) {
    if (arrayResults[i].bibId === checkinValue.bibId) {
      return true;
    }
  }
  return false;
}

function lapsNumber(deviceId, checkin) {
  // Number of laps of this competitor on this checkpoint
  return CheckinsReports.find({
    checkpointId: deviceId,
    competitorId: checkin.competitorId,
    timestamp: { $lte: checkin.timestamp },
  }).count();
}

Template.competitionCheckins.onCreated(function () {
  const template = Template.instance();

  const raceId = FlowRouter.getParam('raceId');
  const deviceId = FlowRouter.getParam('checkpointId');
  if (!raceId || !deviceId) {
    console.log('No raceId or deviceId received');
    return false;
  }

  $(document).ready(function() {
    $('.modal').modal({
      dismissible: true,
    });
  });

  const handler = template.subscribe('races.id', raceId);
  template.subscribe('users.search');
  template.subscribe('competitors.race', raceId);
  template.currentRace = new ReactiveVar(null);

  Tracker.autorun(() => {
    if (handler.ready()) {
      const currentRace = Races.findOne(raceId);
      template.currentRace.set(currentRace);

      // finds the current checkpoint
      template.currentRace.get().checkpoints.forEach((checkpoint) => {
        if (checkpoint.deviceId === deviceId) {
          template.currentCheckpoint = checkpoint;
        }
      });

      if (template.currentRace.get().startTimestamp) {
        const finishTimestamp = (template.currentRace.get().status === 'Finished') ? template.currentRace.get().finishTimestamp : null;
        template.subscribe('checkins.between.plus.athlete', template.currentRace.get().startTimestamp, finishTimestamp);
      }
    }
  });
});

function getCheckpoint() {
  const race = Races.findOne(FlowRouter.getParam('raceId'));
  let checkpoint = null;
  for (let i = 0; race && i < race.checkpoints.length; i++) {
    if (race.checkpoints[i].deviceId === FlowRouter.getParam('checkpointId')) {
      checkpoint = race.checkpoints[i];
    }
  }
  return checkpoint;
}

Template.competitionCheckins.helpers({
  idRace() {
    return FlowRouter.getParam('raceId');
  },
  idDevice() {
    return FlowRouter.getParam('checkpointId');
  },
  checkpoint() {
    return getCheckpoint();
  },
  numberCheckins() {
    const template = Template.instance();
    if (template.currentRace && template.currentRace.get()) {
      const query = {
        checkpointId: FlowRouter.getParam('checkpointId'),
        valid: true,
      };
      return CheckinsReports.find(query).count();
    }
    return '-';
  },
  lapsExeeded(maxLaps, currentLaps) {
    return currentLaps > maxLaps;
  },
  settings() {
    return {
      showRowCount: true,
      showNavigation: 'auto',
      rowClass(checkin) {
        const checkpoint = getCheckpoint();
        if (!checkin.valid) {
          return 'brown brown lighten-3 brown-text';
        } else if (checkpoint.laps < lapsNumber(FlowRouter.getParam('checkpointId'), checkin)) {
          return 'red lighten-2 white-text';
        }
        return '';
      },
      fields: [
        {
          key: 'bib',
          label: 'Bib',
          sortable: false,
        },
        {
          key: '_id',
          label: 'Laps',
          sortable: false,
          headerClass: 'right-align',
          cellClass: 'right-align',
          fn(value, object, key) {
            const checkin = CheckinsReports.findOne(value);
            const lapsNumber = CheckinsReports.find({
              checkpointId: checkin.checkpointId,
              competitorId: checkin.competitorId,
              timestamp: { $lte: checkin.timestamp },
              valid: true,
            }).count();
            return new Spacebars.SafeString(checkin.valid ? lapsNumber : '');
          },
        },
        {
          key: 'timestamp',
          label: 'Timestamp',
          sortOrder: 1,
          sortDirection: 'ascending',
          sortByValue: true,
          headerClass: 'right-align',
          cellClass: 'right-align',
          fn(value) {
            const race = Races.findOne(FlowRouter.getParam('raceId'));
            const secondsFromStart = value - race.startTimestamp;
            let timeCheckpoint = moment().startOf('day').seconds(secondsFromStart).format('H:mm:ss');
            if (secondsFromStart > (60*60*24)) {
              timeCheckpoint = moment().startOf('day').seconds(secondsFromStart).format('d[d] H:mm:ss');
            }
            return new Spacebars.SafeString(timeCheckpoint);
          },
        },
        {
          key: 'athleteLastName',
          label: 'Last Name',
          sortable: true,
        },
        {
          key: 'athleteFirstName',
          label: 'First Name',
          sortable: true,
        },
        {
          key: 'epcs',
          label: 'EPC',
          sortable: false,
        },
        {
          key: '_id',
          label: 'Valid?',
          sortOrder: 1,
          sortDirection: 'ascending',
          fn(value) {
            const checkin = CheckinsReports.findOne(value);
            const checked = checkin.valid ? 'checked' : '';
            if (!checked) return new Spacebars.SafeString('<input type="checkbox" disabled="true" />');
            return new Spacebars.SafeString(`<input type="checkbox" ${checked} class="invalidate-checkin" name="${value}" id="${value}" ><label for="${value}">&nbsp;</label>`);
          },
        },
      ],
    };
  },
  checkins() {
    const template = Template.instance();
    FlowRouter.getParam('raceId');
    const deviceId = FlowRouter.getParam('checkpointId');
    const query = { checkpointId: deviceId };
    const projection = { sort: { timestamp: 1 } };
    return CheckinsReports.find(query, projection);
  },
});


Template.competitionCheckins.events({
  'change .invalidate-checkin'(event) {
    const checkinId = event.currentTarget.getAttribute('id');
    const checkbox = event.currentTarget;
    const isValid = $(`#${checkinId}`).is(':checked');
    Meteor.call('checkins.setValid', checkinId, isValid, (err) => {
      const valid = isValid ? 'valid' : 'invalid';
      if (!err) {
        Materialize.toast(`Checkin marked as ${valid}`, 2000);
        // Disables marking it again
        if (!isValid) {
          $(checkbox).hide();
          $(`label[for="${checkinId}"]`).hide();
        }
      } else {
        Materialize.toast(`Error marking checkin as ${valid}`, 4000);
      }
    });
  },
});

