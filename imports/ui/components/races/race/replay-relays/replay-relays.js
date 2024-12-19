import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import Sntp from 'sntp';
import { ReactiveClock } from 'meteor/aldeed:clock';
import 'numeraljs';
import anime from 'animejs';
import moment from 'moment';
import beautify from 'json-beautify';
import Common from '../../../../../../both/lib/common';
import { Races } from '../../../../../api/races/races';
import { TeamCategories } from '../../../../../api/teamCategories/teamCategories';
import { StartingListEntries } from '../../../../../api/client/startingListEntries/startingListEntries';
import './replay-relays.html';
import { ResultLists } from '../../../../../api/resultLists/resultLists';
import { ResultListEntriesRelayTeams } from '../../../../../api/client/resultListEntriesRelayTeams/resultListEntriesRelayTeams';

function getPerformanceGapText(latestPerformance, numLaps, maxLapNumberCompleted, firstTimestamp) {
  if (!latestPerformance || !numLaps || !maxLapNumberCompleted || !firstTimestamp) return '';
  if (numLaps === maxLapNumberCompleted) {
    if (latestPerformance > firstTimestamp) {
      const gap = moment.duration(latestPerformance - firstTimestamp, 'seconds');
      const daysText = (gap.days() > 0) ? `${gap.days()}d ` : '';
      const hours = gap.hours() > 0 ? `${String(gap.hours()).padStart(2, '0')}:` : '';
      const mins = String(gap.minutes()).padStart(2, '0');
      const secs = String(gap.seconds()).padStart(2, '0');
      return `+${daysText}${hours}${mins}:${secs}`;
    }
  }
  // If the difference is 2, it is lapped
  const differenceLaps = maxLapNumberCompleted - numLaps - 1;
  if (differenceLaps === 1) {
    return '-1 lap';
  } else if (differenceLaps > 1) {
    // If lapped, it shows the difference
    return `-${maxLapNumberCompleted - numLaps} laps`;
  }
  return '';
}

function getPerformanceText(performanceSecs, lapsCompleted, maxLapNumberCompleted) {
  if (!performanceSecs || !maxLapNumberCompleted) return '';
  if (lapsCompleted === maxLapNumberCompleted) {
    // Last performance
    const performance = moment.duration(performanceSecs, 'seconds');
    const daysText = (performance.days() > 0) ? `${performance.days()}d ` : '';
    const hours = String(performance.hours()).padStart(2, '0');
    const mins = String(performance.minutes()).padStart(2, '0');
    const secs = String(performance.seconds()).padStart(2, '0');
    return `${daysText}${hours}:${mins}:${secs}`;
  }
  return '';
}

function getBestLap(splits) {
  const performances = [];
  for (let i = 0; i < splits.length; i += 1) {
    performances.push(parseInt(splits[i].performance, 10));
  }
  performances.sort((a, b) => a - b);
  let previousTimestamp = 0;
  let bestLap = -1;
  for (let i = 0; i < performances.length; i += 1) {
    const thisLap = performances[i] - previousTimestamp;
    if ((bestLap < 0) || (bestLap > thisLap)) {
      bestLap = thisLap;
    }
    previousTimestamp = performances[i];
  }
  if (bestLap > 0) {
    const performance = moment.duration(bestLap, 'seconds');
    const hoursText = (performance.hours() > 0) ? `${String(performance.hours()).padStart(2, '0')}:` : '';
    const mins = String(performance.minutes()).padStart(2, '0');
    const secs = String(performance.seconds()).padStart(2, '0');
    return `${hoursText}${mins}:${secs}`;
  }
  return '';
}

function getStandardDeviation(splits) {
  const performances = [];
  for (let i = 0; i < splits.length; i += 1) {
    performances.push(parseInt(splits[i].performance, 10));
  }
  performances.sort((a, b) => a - b);
  let previousTimestamp = 0;
  const finalTimestamp = performances[performances.length - 1];
  const averageLap = finalTimestamp / performances.length;
  let variance = 0;
  for (let i = 0; i < performances.length; i += 1) {
    const lap = performances[i] - previousTimestamp;
    previousTimestamp = performances[i];
    variance += (lap - averageLap) ** 2;
  }
  const deviation = Math.sqrt(variance / performances.length);
  return Math.floor(deviation);
}

Template.raceReplayRelays.onRendered(function () {
  $(document).ready(function() {
    $('.modal').modal({
      dismissible: true,
    });
    $('.collapsible.expandable').collapsible({
      accordion: false,
    });
  });
  $('#select-category').material_select();
});

// If no checkpointId is set, returns the final checkpoint
function getCheckpointFromRace(race, checkpointId) {
  if (!race) return null;
  for (let i = 0; i < race.checkpoints.length; i += 1) {
    const checkpoint = race.checkpoints[i];
    if (!checkpointId) {
      if (checkpoint.onFinishLine) {
        return checkpoint;
      }
    } else if (checkpoint.deviceId === checkpointId) {
      return checkpoint;
    }
  }
  return null;
}

function drawPaths(template) {
  const category = template.categorySelected.get();
  const checkpoint = template.currentCheckpoint.get();
  if (!category || !checkpoint) return [];
  // The result entries related to this list of results
  const query = {
    teamCategories: { $elemMatch: { _id: category._id } },
    resultListId: checkpoint.resultListId,
  };
  const projection = { sort: { lapsCompleted: -1, latestPerformance: 1 } };

  const currentLap = template.maxLapNumberCompleted.get();
  if (!currentLap) return [];
  // Gets only the competitors who did the current Lap
  query.lapsCompleted = currentLap;
  const totalNumberCompletedLap = ResultListEntriesRelayTeams.find(query).count();
  const cursor = ResultListEntriesRelayTeams.find(query, projection);
  template.currentRegistriesNumber.set(totalNumberCompletedLap);

  return cursor.map(function(item, index) {
    const element = item;
    element.calculatedRank = index + 1;
    return element;
  });
}

Template.raceReplayRelays.onCreated(function () {
  const template = Template.instance();

  template.categorySelected = new ReactiveVar(null);
  template.currentRegistriesNumber = new ReactiveVar(0);
  template.maxLapNumberCompleted = new ReactiveVar(0);
  template.athletesCompletedAllLaps = new ReactiveVar(0);
  template.firstCompetitorTimestamp = new ReactiveVar(0);
  template.currentCheckpoint = new ReactiveVar(null);

  const raceId = FlowRouter.getParam('raceId');
  const checkpointId = FlowRouter.getParam('checkpointId');
  if (!raceId || !checkpointId) {
    console.log('No raceId or checkpointId received');
    return false;
  }
  let numRowsToShow = 8;
  try {
    const numRows = FlowRouter.getQueryParam('rows');
    if (numRows) {
      numRowsToShow = parseInt(numRows, 10);
    }
  } catch (e) {
    // error converting the number
    console.log(e);
  }
  template.numberRows = new ReactiveVar(numRowsToShow);

  const handlerRace = template.subscribe('races.id', raceId);
  const handlerCat = template.subscribe('teamCategories.all');
  const handlerResultLists = template.subscribe('results.race', raceId);
  const handlerResultEntries = template.subscribe('resultEntriesRelayTeams.raceId', raceId);

  this.autorun(() => {
    if (handlerRace.ready() && handlerCat.ready() && handlerResultLists.ready() && handlerResultEntries.ready()) {
      template.currentRace = Races.findOne({ _id: raceId });
      template.currentCheckpoint.set(getCheckpointFromRace(template.currentRace, checkpointId));
      const overallCat = TeamCategories.findOne({ identifier: 'OVERALL' });
      template.categorySelected.set(overallCat);

      Tracker.afterFlush(() => {
        // Select the category by default
        $(`option[value="${overallCat._id}"]`).prop('selected', 'selected');
        $('#select-category').material_select();

        $(document).ready(function() {
          const path = anime.path('path');

          const myTimeline = anime.timeline();
          const myTimeline2 = anime.timeline();
          const myTimeline3 = anime.timeline();
          const myTimeline4 = anime.timeline();
          const myTimeline5 = anime.timeline();
          const myTimeline6 = anime.timeline();
          const myTimeline7 = anime.timeline();
          const myTimeline8 = anime.timeline();
          const myTimeline9 = anime.timeline();
          const myTimeline10 = anime.timeline();
          const myTimeline11 = anime.timeline();
          const myTimeline12 = anime.timeline();
    
          myTimeline.add({
            targets: '#team1',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1600,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team1',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1600,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team1',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1640,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team1',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1700,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team1',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1710,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team1',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1690,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team1',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1730,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team1',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1720,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team1',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1710,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team1',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1710,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team1',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1620,
            delay: 0,
            loop: 1,
          });

          myTimeline2.add({
            targets: '#team2',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1620,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team2',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1690,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team2',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1770,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team2',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1770,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team2',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1770,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team2',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1800,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team2',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1760,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team2',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1810,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team2',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1800,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team2',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1700,
            delay: 0,
            loop: 1,
          });
          
          myTimeline3.add({
            targets: '#team3',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1640,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team3',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1730,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team3',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1780,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team3',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1770,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team3',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1780,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team3',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1790,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team3',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1770,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team3',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1790,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team3',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1800,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team3',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1790,
            delay: 0,
            loop: 1,
          });
          
          myTimeline4.add({
            targets: '#team4',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1760,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team4',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1740,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team4',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1820,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team4',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1810,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team4',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1790,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team4',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1800,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team4',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1780,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team4',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1780,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team4',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1790,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team4',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1760,
            delay: 0,
            loop: 1,
          });

          myTimeline5.add({
            targets: '#team5',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1680,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team5',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1750,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team5',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1800,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team5',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1800,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team5',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1830,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team5',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1870,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team5',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1850,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team5',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1860,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team5',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1890,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team5',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1780,
            delay: 0,
            loop: 1,
          });

          myTimeline6.add({
            targets: '#team6',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1730,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team6',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1810,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team6',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1830,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team6',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1850,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team6',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1860,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team6',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1880,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team6',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1840,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team6',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1860,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team6',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1840,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team6',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1840,
            delay: 0,
            loop: 1,
          });

          myTimeline7.add({
            targets: '#team7',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1810,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team7',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1780,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team7',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1860,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team7',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1870,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team7',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1870,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team7',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1860,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team7',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1870,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team7',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1850,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team7',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1880,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team7',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1860,
            delay: 0,
            loop: 1,
          });

          myTimeline8.add({
            targets: '#team8',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1910,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team8',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1690,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team8',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1820,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team8',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1830,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team8',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1850,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team8',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1890,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team8',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1940,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team8',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1880,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team8',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1950,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team8',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1930,
            delay: 0,
            loop: 1,
          });

          myTimeline9.add({
            targets: '#team9',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1730,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team9',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1800,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team9',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1870,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team9',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1940,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team9',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1890,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team9',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1990,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team9',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1990,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team9',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1990,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team9',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1930,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team9',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1840,
            delay: 0,
            loop: 1,
          });

          myTimeline10.add({
            targets: '#team10',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1870,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team10',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1880,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team10',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2000,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team10',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1950,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team10',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2040,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team10',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1950,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team10',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2030,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team10',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1970,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team10',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2030,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team10',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1940,
            delay: 0,
            loop: 1,
          });

          myTimeline11.add({
            targets: '#team11',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1970,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team11',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2020,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team11',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2090,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team11',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2080,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team11',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2000,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team11',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2040,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team11',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2040,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team11',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2080,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team11',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2060,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team11',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2070,
            delay: 0,
            loop: 1,
          });

          myTimeline12.add({
            targets: '#team12',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1770,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team12',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 1860,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team12',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2020,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team12',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2050,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team12',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2170,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team12',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2370,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team12',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2220,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team12',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2140,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team12',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2090,
            delay: 0,
            loop: 1,
          }).add({
            targets: '#team12',
            translateX: path('x'),
            translateY: path('y'),
            rotate: path('angle'),
            easing: 'linear',
            duration: 2030,
            delay: 0,
            loop: 1,
          });
        });      
      });

      

      
      /*
      if (template.currentRace.status === 'Ready') {
      }
      */
    }
  });
});

Template.raceReplayRelays.helpers({
  categorySelected() {
    // Reads the radio selected
    const selected = Template.instance().categorySelected.get();
    if (!selected) return null;
    const number = StartingListEntries.find({
      categories: { $elemMatch: { _id: selected._id } },
    }).count();
    return `${selected.name} (${number} registries@@@@)`;
  },
  currentRace() {
    return Races.findOne(FlowRouter.getParam('raceId'));
  },
  maxLapNumberCompleted() {
    return Template.instance().maxLapNumberCompleted.get();
  },
  athletesCompletedAllLaps() {
    return Template.instance().athletesCompletedAllLaps.get();
  },
  currentCheckpoint() {
    return Template.instance().currentCheckpoint.get();
  },
  checkpointId() {
    return FlowRouter.getParam('checkpointId');
  },
  teamCategories(race) {
    if (!race || !race.teamCategories) return null;
    return TeamCategories.find({ _id: { $in: race.teamCategories } });
  },
  currentResultList() {
    const checkpoint = Template.instance().currentCheckpoint.get();
    if (!checkpoint) return null;
    return ResultLists.findOne({ _id: checkpoint.resultListId });
  },
  distanceRace(race) {
    if (race && race.distance) {
      return `Total Distance: ${race.distance.value} ${Common.getDistanceUnitAbbr(race.distance.unit)}`;
    }
    return null;
  },
  firstCompetitorTimestamp() {
    return Template.instance().firstCompetitorTimestamp.get();
  },
  resultEntries() {
    const template = Template.instance();
    const category = template.categorySelected.get();
    const checkpoint = template.currentCheckpoint.get();
    if (!category || !checkpoint) return [];
    // The result entries related to this list of results
    const query = {
      teamCategories: { $elemMatch: { _id: category._id } },
      resultListId: checkpoint.resultListId,
    };
    const projection = { sort: { lapsCompleted: -1, latestPerformance: 1 } };

    const cursor = ResultListEntriesRelayTeams.find(query, projection);
    // Gets information from the first one
    const firstTeam = ResultListEntriesRelayTeams.findOne(query, projection);
    if (firstTeam) {
      template.maxLapNumberCompleted.set(firstTeam.lapsCompleted);
      if (firstTeam.lapsCompleted > 0) {
        template.firstCompetitorTimestamp.set(firstTeam.latestPerformance);
      }
      firstTeam.calculatedRank = 1;
    }
    const currentLap = template.maxLapNumberCompleted.get();
    if (!currentLap) return [];
    // Gets only the competitors who did the current Lap
    query.lapsCompleted = currentLap;
    const totalNumberCompletedLap = ResultListEntriesRelayTeams.find(query).count();
    const limit = template.numberRows.get() - 1;
    const invertedCursor = ResultListEntriesRelayTeams.find(query, { sort: { latestPerformance: -1 }, limit });
    template.currentRegistriesNumber.set(totalNumberCompletedLap);

    const invertedMap = invertedCursor.map(function(item, index) {
      const element = item;
      element.calculatedRank = totalNumberCompletedLap - index;
      return element;
    });
    // The last one is the first competitor to be shown on top
    if (totalNumberCompletedLap >= template.numberRows.get()) {
      invertedMap.push(firstTeam);
    }
    return invertedMap.reverse();
  },
  currentNumberRegistries() {
    return Template.instance().currentRegistriesNumber.get();
  },
  numberAthletesFinishedOverall() {
    const template = Template.instance();
    const checkpoint = template.currentCheckpoint.get();
    if (!checkpoint) return '';
    const query = { splits: { $size: checkpoint.laps } };
    return ResultListEntriesRelayTeams.find(query).count();
  },
  numberLaps() {
    const checkpoint = Template.instance().currentCheckpoint.get();
    if (!checkpoint) return '';
    return checkpoint.laps;
  },
  numberAthletesStarted() {
    const template = Template.instance();
    const checkpoint = template.currentCheckpoint.get();
    if (!checkpoint) return '';
    const query = {
      competitionFeatures: { $nin: ['DNS'] },
      resultListId: checkpoint.resultListId,
    };
    return ResultListEntriesRelayTeams.find(query).count();
  },
  raceDate(race) {
    if (!race || !race.startDate) return null;
    return moment(race.startDate).format('DD-MM-YYYY');
  },
  hrefEdit(race) {
    if (!race) return null;
    return `${FlowRouter.path('admin.races.edit')}/${race._id}`;
  },
  idRace() {
    return FlowRouter.getParam('raceId');
  },
  settingsTable() {
    return {
      rowsPerPage: Template.instance().numberRows.get(),
      rowClass(object) {
        // The first one is marked in a different way
        if (object.calculatedRank === 1) {
          return 'first';
        }
        return '';
      },
      fields: [
        {
          key: 'calculatedRank',
          label: '',
          sortOrder: 0,
          sortDirection: 'ascending',
          headerClass: 'hide',
          cellClass: 'rank',
          fn(value, object) {
            // Only shows the rank in case they has completed all laps
            const { maxLapNumberCompleted } = Template.instance().data;
            if (object && (object.splits.length > 0) && object.splits.length === maxLapNumberCompleted) {
              if (object.rankCorrection) {
                return object.rankCorrection;
              }
              if (value === 1) return new Spacebars.SafeString('<span class="emoji">🥇</span>');
              if (value === 2) return new Spacebars.SafeString('<span class="emoji">🥈</span>');
              if (value === 3) return new Spacebars.SafeString('<span class="emoji">🥉</span>');
              return value;
            }
            return Spacebars.SafeString('<span class="hide">100000000</span>');
          },
        },
        {
          key: 'teamLogo',
          label: '',
          sortable: false,
          headerClass: 'hide',
          cellClass: 'flag',
          fn(value, object) {
            if (value) {
              return new Spacebars.SafeString(value);
            }
          },
        },
        {
          key: 'teamName',
          label: '',
          sortable: false,
          headerClass: 'hide',
          cellClass: 'name truncate',
          fn(value, object) {
            return new Spacebars.SafeString(`${value}`);
          },
        },
        {
          key: 'splits',
          label: '',
          sortable: false,
          headerClass: 'hide',
          cellClass: 'laps',
          fn(value) {
            const total = Template.instance().data.currentCheckpoint.laps;
            if (value && value.length > 0) {
              return `${value.length}/${total}`;
            }
            return `0/${total}`;
          },
        },
        /*
        {
          key: 'latestPerformance',
          label: '',
          sortable: false,
          fn(value, object) {
            // Only if this completed the same number of laps than the first competitor
            return getPerformanceText(value, object.lapsCompleted, Template.instance().data.maxLapNumberCompleted);
          },
        },
        */
        {
          key: 'latestPerformance',
          label: '',
          sortable: false,
          fn(value, object) {
            if (object.calculatedRank === 1) {
              return getPerformanceText(value, object.lapsCompleted, Template.instance().data.maxLapNumberCompleted);
            }
            return getPerformanceGapText(value, object.lapsCompleted, Template.instance().data.maxLapNumberCompleted, Template.instance().data.firstCompetitorTimestamp);
          },
        },
        {
          key: 'splits',
          label: '',
          cellClass: 'hide-on-small-only',
          headerClass: 'hide-on-small-only',
          sortable: false,
          fn(value) {
            return new Spacebars.SafeString(`<i class="material-icons">publish</i>${getBestLap(value)}`);
          },
        },
        {
          key: 'splits',
          label: '',
          cellClass: 'hide-on-small-only',
          headerClass: 'hide-on-small-only',
          sortable: false,
          fn(value) {
            return new Spacebars.SafeString(`<i class="material-icons">linear_scale</i>${getStandardDeviation(value)}`);
          },
        },
      ],
    };
  },
});

Template.raceReplayRelays.events({
  'change select[name="category"]'(event) {
    const idSelected = $('select[name="category"]').val();
    const category = Categories.findOne({ _id: idSelected });
    Template.instance().categorySelected.set(category);
  },
});
