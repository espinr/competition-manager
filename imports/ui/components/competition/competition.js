import { Checkpoints } from '/imports/api/checkpoints/checkpoints.js';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import Sntp from 'sntp';
import { ReactiveClock } from 'meteor/aldeed:clock';
import 'numeraljs';
import moment from 'moment';
import beautify from 'json-beautify';
import Common from '../../../../both/lib/common.js';


import './map/map.js';
import './competition.html';
import { Checkins } from '../../../api/checkins/checkins.js';
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

// In case the race is still running or already finished
function initClock(competitionClock) {
  const unixTimeNow = Common.unixTimeNow();
  competitionClock.start();
  competitionClock.setElapsedSeconds(unixTimeNow);
}

function startRace(idRace) {
  Meteor.call('races.startRace', idRace);
}

function restartRace(competitionClock, idRace) {
  competitionClock.setElapsedSeconds(0);
  competitionClock.stop();
  startRace(idRace);
}

function stopRace(competitionClock) {
  Meteor.call('races.finishRace', FlowRouter.getParam('raceId'));
}

Template.competitionMain.onCreated(function () {
  const template = Template.instance();
  template.checkpointsAlive = new ReactiveVar([]);

  const raceId = FlowRouter.getParam('raceId');
  if (!raceId) {
    console.log('No raceId received');
    return false;
  }

  $(document).ready(function() {
    $('.modal').modal({
      dismissible: true,
    });
    $('#modalConfirmRestart').modal({
      opacity: 0.5,
      startingTop: '40%',
      ready(modal, trigger) {
        $('#modalConfirmRestart .modal-ok').bind('click', (event) => {
          if (!template.startingRace) {
            template.startingRace = true;
            restartRace(template.CompetitionClock, raceId);
            Meteor.setTimeout(() => {
              template.startingRace = false;
            }, 2000);
          }
          $('#modalConfirmRestart').modal('close');
        });
      },
    });    
    $('#modalConfirmStop').modal({
      opacity: 0.5,
      startingTop: '40%',
      ready(modal, trigger) {
        $('#modalConfirmStop .modal-ok').bind('click', (event) => {
          if (!template.stoppingRace) {
            template.stoppingRace = true;
            stopRace(template.CompetitionClock);
            $('#modalConfirmStop').modal('close');
            Meteor.setTimeout(() => {
              template.stoppingRace = false;
            }, 2000);
          }
        });
      },
    });    
    $('.collapsible').collapsible();
    Meteor.setInterval(() => {
      // Checks if the latest ping received is within 60" timeframe
      const unixTimeNow = Math.floor(Date.now() / 1000);
      const checkpointsAlive = [];
      if (template.currentRace && template.currentRace.checkpoints) {
        for (let i = 0; i < template.currentRace.checkpoints.length; i += 1) {
          const checkpoint = template.currentRace.checkpoints[i];
          const isAlive = checkpoint.latestPingUnixTime && checkpoint.latestPingUnixTime > (unixTimeNow - 60);
          checkpointsAlive.push(isAlive);
        }
        if (template.checkpointsAlive) {
          template.checkpointsAlive.set(checkpointsAlive);
        }
      }
    }, 1000);
  });

  const handler = template.subscribe('races.id', raceId);
  template.subscribe('users.search');
  template.subscribe('competitors.race', raceId);

  template.CompetitionClock = new ReactiveClock('ExerciseClock');

  template.checkpoints = [];
  // The dynamic classification
  template.resultsAtCheckpoint = [];
  template.checkpointsCompleted = []; // Array with the IDs of checkpoints once there is a checkin

  template.startingRace = false;
  template.stoppingRace = false;

  Tracker.autorun(() => {
    if (handler.ready()) {
      template.currentRace = Races.findOne({ _id: raceId });

      if (template.currentRace.startTimestamp) {
        const finishTimestamp = (template.currentRace.status === 'Finished') ? template.currentRace.finishTimestamp : null;
        template.subscribe('checkins.between', template.currentRace.startTimestamp, finishTimestamp);
      }
      initClock(template.currentRace, template.CompetitionClock);
      
      //= new template.currentRace();
      /*if (template.currentRace && template.currentRace.checkpoints) {
        template.currentRace.checkpoints.forEach((checkpoint) => {
          template.checkpoints.push(Checkpoints.findOne({ _id: checkpoint.id }));
        });
      } */ 
    }
    /*
    if (template.startTimestamp.get() && template.startTimestamp.get() > 0) {
      template.subscribe('checkins.after', template.startTimestamp.get());
      template.checkpoints.forEach((checkpoint) => {
        const checkinsForCheckpoint = Checkins.find({ checkpointId: checkpoint._id });
        if (checkinsForCheckpoint) {
          checkinsForCheckpoint.forEach((checkin) => {
            let competitor;
            if (checkin.epc) {
              competitor = Competitors.findOne({ epc: checkin.epc });
            } else {
              competitor = Competitors.findOne({ bibId: checkin.bibId });
            }
            const totalTime = checkin.timestamp - template.startTimestamp.get();
            checkinAthlete(template, checkpoint._id, checkpoint.identifier, competitor.bibId, competitor.epc, competitor.nameUser, competitor.idUser, totalTime);
          });
        }
      });
    }
    */
  });
});

Template.competitionMain.onDestroyed = function () {
  const template = Template.instance();
  template.CompetitionClock.stop();
};

Template.competitionMain.helpers({
  stopwatch() {
    const template = Template.instance();
    return template.CompetitionClock.elapsedTime({ format: '00:00:00' });
  },
  showPlayButton() {
    const race = Races.findOne(FlowRouter.getParam('raceId'));
    return race && race.status === 'Ready';
  },
  showStopButton() {
    const race = Races.findOne(FlowRouter.getParam('raceId'));
    return race && race.status === 'Running';
  },
  showRestartButton() {
    const race = Races.findOne(FlowRouter.getParam('raceId'));
    return race && race.status === 'Finished';
  },
  idRace() {
    return FlowRouter.getParam('raceId');
  },
  disableCheckbox(checkin) {
    return checkin.valid ? '' : 'hide';
  },
  checkpoints() {
    const race = Races.findOne(FlowRouter.getParam('raceId'));
    if (!race) return null;
    return race.checkpoints;
  },
  isCheckpointAlive(checkpointIndex) {
    const template = Template.instance();
    return template.checkpointsAlive && template.checkpointsAlive.get()[checkpointIndex];
  },
  numberCheckinsAt(deviceId) {
    const template = Template.instance();
    if (template.currentRace && template.currentRace.startTimestamp) {
      const query = {
        checkpointId: deviceId,
        timestamp: { $gt: template.currentRace.startTimestamp },
        valid: true,
      };
      return Checkins.find(query).count();
    }
    return '-';
  },
  lapsExeeded(maxLaps, currentLaps) {
    return currentLaps > maxLaps;
  },
  checkins(deviceId) {
    const template = Template.instance();
    const arrayLatestCheckins = [];
    if (template.currentRace && template.currentRace.startTimestamp) {
      const query = { checkpointId: deviceId };
      const totalCheckins = Checkins.find(query).count();
      const projection = { sort: { timestamp: -1 }, limit: 10 };
      const checkins = Checkins.find(query, projection).fetch();
      // Shows only 5 results but retrieves 6 to get the info from previous checkin
      for (let i = checkins.length - 1; i >= 0; i -= 1) {

        // The first element of partial results is ommitted unless is the first one of all results
        if ((i === checkins.length - 1) && (checkins.length !== totalCheckins)) {
          continue;
        }

        const checkin = checkins[i];
        let secondsDifference = 0;

        if (i < checkins.length - 1) {
          const previousCheckin = checkins[i + 1];
          secondsDifference = checkin.timestamp - previousCheckin.timestamp;
        }
        const secondsFromStart = template.currentRace.startTimestamp - checkin.timestamp;
        const timeCheckpoint = moment().startOf('day').seconds(secondsFromStart).format('H:mm:ss');
        const timeDifference = moment().startOf('day').seconds(secondsDifference).format('mm:ss');

        // Number of laps of this competitor on this checkpoint
        const competitor = Competitors.findOne(checkin.competitorId);
        const athlete = Meteor.users.findOne(competitor.idUser);
        const lapsNumber = Checkins.find({
          checkpointId: deviceId,
          competitorId: checkin.competitorId,
          timestamp: { $lte: checkin.timestamp },
          valid: true,
        }).count();
        
        // Results are pushed into the array in inverted order
        const latestResults = {
          _id: checkin._id,
          position: totalCheckins - i,
          epc: checkin.epc ? checkin.epc : '',
          bib: checkin.bib ? checkin.bib : '',
          time: timeCheckpoint,
          athlete: athlete.profile.name,
          difference: `+${timeDifference}`,
          laps: checkin.valid ? lapsNumber : '',
          valid: checkin.valid,
        };
        arrayLatestCheckins.push(latestResults);
      }
    }
    return arrayLatestCheckins;
  },
});

/* 
  Return -1 if the athlete has a worse result in the previous checkpoint,
  0 if it is the same or 1 if it's better.
*/
/*
function worseOrBetterResult(checkpointsCompleted, resultsAtCheckpoint, bibId, idCheckpointCurrent, currentRank) {
  const indexCheckpoint = checkpointsCompleted.indexOf(idCheckpointCurrent);
  // The first one, no changes
  if (indexCheckpoint === 0) {
    return 0;
  }
  const previousCheckpointId = checkpointsCompleted[indexCheckpoint - 1];
  // Search for the bibId
  const previousResults = resultsAtCheckpoint[previousCheckpointId];
  for (let i = 0; i < previousResults.length; i += 1) {
    const result = previousResults[i];
    if (result.bibId === bibId) {
      if (currentRank > result.rank) {
        return -1;
      } else if (currentRank < result.rank) {
        return 1;
      }
      return 0;
    }
  }
  return 0;
}

function checkinAthlete(template, idCheckpoint, nameCheckpoint, bibId, epc, nameAthlete, idAthlete, totalTime) {
  let timeCheckpoint = Math.round(totalTime);
  // First athlete at this checkpoint?
  if (!template.resultsAtCheckpoint[idCheckpoint]) {
    template.resultsAtCheckpoint[idCheckpoint] = [];
    template.checkpointsCompleted.push(idCheckpoint);
    Materialize.toast(`First athlete at checkpoint ${nameCheckpoint}!`, 4000);
    timeCheckpoint = moment().startOf('day').seconds(timeCheckpoint).format('H:mm:ss');
  } else {
    // It is not the first one
    const results = template.resultsAtCheckpoint[idCheckpoint];
    timeCheckpoint = totalTime - results[0].time;
    timeCheckpoint = moment().startOf('day').seconds(timeCheckpoint).format('mm:ss');
  }
  const checkinValue = {
    rank: template.resultsAtCheckpoint[idCheckpoint].length + 1,
    bibId,
    epc,
    idAthlete,
    nameAthlete,
    time: totalTime,
  };
  if (isInResults(template.resultsAtCheckpoint[idCheckpoint], checkinValue)) {
    return false;
  }
  console.log(`Competitor ${nameAthlete} at checkpoint <${nameCheckpoint}> -> ${totalTime}s `);
  template.resultsAtCheckpoint[idCheckpoint].push(checkinValue);
  const results = template.resultsAtCheckpoint[idCheckpoint];
  const numberCheckins = template.resultsAtCheckpoint[idCheckpoint].length;
  let materialIcon = '<i class="material-icons tiny"></i>';
  const worseOrBetter = worseOrBetterResult(template.checkpointsCompleted, template.resultsAtCheckpoint, bibId, idCheckpoint, numberCheckins);
  if (worseOrBetter === -1) {
    materialIcon = '<i class="material-icons tiny down">keyboard_arrow_down</i>';
  } else if (worseOrBetter === 1) {
    materialIcon = '<i class="material-icons tiny up">keyboard_arrow_up</i>';
  }
  if (numberCheckins === 1) {
    $(`table#${idCheckpoint} tr.first`).html(`<td>🥇${materialIcon}</td><td>${results[0].nameAthlete}</td><td class="time">${timeCheckpoint}</td>`);
  } else if (numberCheckins === 2) {
    $(`table#${idCheckpoint} tr.second`).html(`<td>🥈${materialIcon}</td><td>${results[1].nameAthlete}</td><td class="time">+${timeCheckpoint}</td>`);
  } else if (numberCheckins === 3) {
    $(`table#${idCheckpoint} tr.third`).html(`<td>🥉${materialIcon}</td><td>${results[2].nameAthlete}</td><td class="time">+${timeCheckpoint}</td>`);
  } else if (numberCheckins === 4) {
    $(`table#${idCheckpoint} tr.fourth`).html(`<td>${numberCheckins} ${materialIcon}</td><td>${results[3].nameAthlete}</td><td class="time">+${timeCheckpoint}</td>`);
  } else if (numberCheckins === 5) {
    $(`table#${idCheckpoint} tr.fifth`).html(`<td>${numberCheckins} ${materialIcon}</td><td>${results[4].nameAthlete}</td><td class="time">+${timeCheckpoint}</td>`);
  } else if (numberCheckins === 6) {
    $(`table#${idCheckpoint} tr.sixth`).html(`<td>${numberCheckins} ${materialIcon}</td><td>${results[5].nameAthlete}</td><td class="time">+${timeCheckpoint}</td>`);
  } else {
    // > 6
    const fourthAthlete = results[numberCheckins - 3].nameAthlete;
    let timeCheckpointFourth = results[numberCheckins - 3].time - results[0].time;
    timeCheckpointFourth = moment().startOf('day').seconds(timeCheckpointFourth).format('mm:ss');

    const fifthAthlete = results[numberCheckins - 2].nameAthlete;
    let timeCheckpointFifth = results[numberCheckins - 2].time - results[0].time;
    timeCheckpointFifth = moment().startOf('day').seconds(timeCheckpointFifth).format('mm:ss');
    $(`table#${idCheckpoint} tr.fourth`).html(`<td>${numberCheckins - 2} ${materialIcon}</td><td>${fourthAthlete}</td><td>+${timeCheckpointFourth}</td>`);
    $(`table#${idCheckpoint} tr.fifth`).html(`<td>${numberCheckins - 1} ${materialIcon}</td><td>${fifthAthlete}</td><td>+${timeCheckpointFifth}</td>`);
    $(`table#${idCheckpoint} tr.sixth`).html(`<td>${numberCheckins} ${materialIcon}</td><td>${nameAthlete}</td><td>+${timeCheckpoint}</td>`);
  }
}

function generateResultsJsonLD(currentRace, resultsArray) {
  if (!currentRace || !resultsArray || resultsArray === 'undefined') return '';
  let results = {
    '@context' : "http://w3c.github.io/opentrack-cg/contexts/opentrack.jsonld",
    '@id' : `http://activioty.ddns.net/race/${currentRace._id}`,
    '@type' : 'UnitRace',
    name : currentRace.name,
  };
  const resultsJsonLD = [];
  for (let i = 0 ; i < resultsArray.length ; i += 1) {
    const timeCheckpoint = moment().startOf('day').seconds(resultsArray[i].time).format('H:mm:ss');
    resultsJsonLD.push({
      '@id': `http://activioty.ddns.net/race/${currentRace._id}/results#${i}`,
      '@type': 'Result',
      name: `Result #${i} of ${currentRace.name}`,
      rank: i,
      performance: {
        '@type': 'Performance',
        competitor: {
          '@id': `http://activioty.ddns.net/race/${currentRace._id}/competitor/${resultsArray[i].bibId}`,
          bibIdentifier: resultsArray[i].bibId,
          transponderIdentifier: resultsArray[i].epc,
          agent: {
            '@id': `http://activioty.ddns.net/athlete/${resultsArray[i].idUser}`,
            name: resultsArray[i].nameUser,
          },
        },
        time: `${timeCheckpoint}`,
      },
    });
  }
  results.results = resultsJsonLD;
  return results;
}
*/
Template.competitionMain.events({
  'click #startCompetition-button'(event) {
    const template = Template.instance();
    if (!template.startingRace) {
      template.startingRace = true;
      startRace(template.currentRace._id);
    }
    Meteor.setTimeout(() => {
      template.startingRace = false;
    }, 2000);
  },
  'click #restartCompetition-button'(event) {
    $('#modalConfirmRestart').modal('open');
  },
  'click #finishCompetition-button'(event) {
    $('#modalConfirmStop').modal('open');
  },
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
          checkbox.disabled = true;
        }
      } else {
        Materialize.toast(`Error marking checkin as ${valid}`, 4000);
      }
    });
  },
  'click #downloadResults-button'(event) {
    const template = Template.instance();
    const idFinishLine = template.currentRace.finalCheckpoint.id;
    const jsonResults = generateResultsJsonLD(template.currentRace, template.resultsAtCheckpoint[idFinishLine]);
    $('#modalJsonResults .json').html(beautify(jsonResults, null, 2, 80));
    $('#modalJsonResults').modal('open');
  },
  'click .force-checkin-bib'(event) {
    event.preventDefault();
    const checkpointId = event.currentTarget.attributes['data-checkpoint-id'].value;
    const inputBib = $(`#${checkpointId}`).val();
    const unixTimeNow = Common.unixTimeNow();
    const jsonCheckin = Common.buildJSONCheckin(checkpointId, inputBib, unixTimeNow);
    $(`#${checkpointId}`).val('');
    $(`#${checkpointId}`).focus();
    Meteor.call('forceCheckinMessage', checkpointId, jsonCheckin);
  },
  'submit form'(event, template) {
    event.preventDefault();
    $(event.currentTarget).find('.force-checkin-bib').click();
  },
});


/*
'<id/ready> messages':
{
	"checkpoint" : {
		"id" : "001",
	},
	"timestamp"  : 1535524129
}

topic: '001/ready'
{"checkpoint" : {"id" : "001"}, "timestamp" : 1535701044}


'checkin messages':
{
	"checkpoint" : { 
		"id" : "…",			// Required
	},
	"bibIdentifier" : "…",	// Either 'bib' or 'epc' are required
	"epcIdentifier" : "…",
	"timestamp"  : 0000000, 	// Required
}
{ "checkpoint" : { "id" : "meta001" }, "bib" : "1",	"epc" : "000000000029272",	"timestamp"  : 1535701040 }
}
*/

