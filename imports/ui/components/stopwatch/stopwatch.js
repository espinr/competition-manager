import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveClock } from 'meteor/aldeed:clock';
import 'numeraljs';


import './stopwatch.html';
import { Races } from '../../../api/races/races.js';


// In case the race is still running or already finished
function initClock(race, competitionClock) {
  if (race) {
    const unixTimeNow = Math.floor(Date.now() / 1000);
    if (race.status === 'Running') {
      competitionClock.start();
      competitionClock.setElapsedSeconds(unixTimeNow - race.startTimestamp);
    } else if (race.status === 'Finished') {
      competitionClock.setElapsedSeconds(race.finishTimestamp - race.startTimestamp);
      competitionClock.stop();
    } else {
      competitionClock.setElapsedSeconds(0);
      competitionClock.stop();
    }
  }
}

Template.stopwatchCompetition.onCreated(function () {
  const template = Template.instance();

  const { raceId } = template.data;
  const { deviceId } = template.data;
  if (!raceId || !deviceId) {
    console.log('No raceId or deviceId received');
    return false;
  }
  const handler = template.subscribe('races.id', raceId);
  template.CompetitionClock = new ReactiveClock('ExerciseClock');
  template.currentRace = new ReactiveVar(null);

  Tracker.autorun(() => {
    if (handler.ready()) {
      const currentRace = Races.findOne(raceId);
      template.currentRace.set(currentRace);
      initClock(template.currentRace.get(), template.CompetitionClock);
    }
  });
});

Template.stopwatchCompetition.onDestroyed = function () {
  const template = Template.instance();
  template.CompetitionClock.stop();
};

function getCheckpoint() {
  const race = Races.findOne(FlowRouter.getParam('raceId'));
  let checkpoint = null;
  for (let i = 0; race && i < race.checkpoints.length; i++) {
    if (race.checkpoints[i].deviceId === FlowRouter.getParam('deviceId')) {
      checkpoint = race.checkpoints[i];
    }
  }
  return checkpoint;
}

Template.stopwatchCompetition.helpers({
  stopwatch() {
    const template = Template.instance();
    return template.CompetitionClock.elapsedTime({ format: '00:00:00' });
  },
});


Template.stopwatchCompetition.events({});

