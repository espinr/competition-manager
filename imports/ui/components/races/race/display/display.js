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
import Common from '../../../../../../both/lib/common';
import { Checkins } from '../../../../../api/checkins/checkins';
import { Competitors } from '../../../../../api/competitors/competitors';
import { Races } from '../../../../../api/races/races';
import { Teams } from '../../../../../api/teams/teams';
import { Categories } from '../../../../../api/categories/categories';
import { StartingListEntries } from '../../../../../api/client/startingListEntries/startingListEntries';
import './display.html';
import { ResultEntries } from '../../../../../api/resultEntries/resultEntries';
import { ResultLists } from '../../../../../api/resultLists/resultLists';
import { ResultListEntries } from '../../../../../api/client/resultListEntries/resultListEntries';


Template.raceDisplayResults.onRendered(function () {
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

Template.raceDisplayResults.onCreated(function () {
  const template = Template.instance();

  template.categorySelected = new ReactiveVar(null);
  template.currentRegistriesNumber = new ReactiveVar(0);
  template.maxLapNumberCompleted = new ReactiveVar(0);
  template.athletesCompletedAllLaps = new ReactiveVar(0);
  template.firstCompetitorTimestamp = new ReactiveVar(0);
  template.currentCheckpoint = new ReactiveVar(null);
  this.autorun(function () {
  });

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
  const handlerCat = template.subscribe('categories.all');
  const handlerResultLists = template.subscribe('results.race', raceId);
  const handlerResultEntries = template.subscribe('resultEntries.raceId', raceId);
  const handlerTeams = template.subscribe('teams.raceId', raceId);

  this.autorun(() => {
    if (handlerRace.ready() && handlerTeams.ready() && handlerCat.ready() && handlerResultLists.ready() && handlerResultEntries.ready()) {
      template.currentRace = Races.findOne({ _id: raceId });
      template.currentCheckpoint.set(getCheckpointFromRace(template.currentRace, checkpointId));
      const overallCat = Categories.findOne({ identifier: 'OVERALL' });
      template.categorySelected.set(overallCat);

      Tracker.afterFlush(() => {
        // Select the category by default
        $(`option[value="${overallCat._id}"]`).prop('selected', 'selected');
        $('#select-category').material_select();
      });
      
      /*
      if (template.currentRace.status === 'Ready') {
      }
      */
    }
  });
});

Template.raceDisplayResults.helpers({
  categorySelected() {
    // Reads the radio selected
    const selected = Template.instance().categorySelected.get();
    if (!selected) return null;
    const number = StartingListEntries.find({
      categories: { $elemMatch: { _id: selected._id } },
    }).count();
    return `${selected.name} (${number} registries)`;
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
  categories(race) {
    if (!race || !race.categories) return null;
    return Categories.find({ _id: { $in: race.categories } }, { sort: { requiredMinAge: 1, requiredMaxAge: 1, description: 1 } });
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
    const checkpoint = Template.instance().currentCheckpoint.get();
    if (!category || !checkpoint) return [];
    // The result entries related to this list of results 
    const query = {
      categories: { $elemMatch: { _id: category._id } },
      resultListId: checkpoint.resultListId,
    };
    const projection = {
      sort: {
        lapsCompleted: -1,
        'latestSplit.performance': 1,
      },
    };
    // Gets information from the first competitor
    const firstCompetitor = ResultListEntries.findOne(query, projection);
    if (firstCompetitor) {
      template.maxLapNumberCompleted.set(firstCompetitor.lapsCompleted);
      if (firstCompetitor.lapsCompleted > 0) {
        template.firstCompetitorTimestamp.set(firstCompetitor.latestSplit.performance);
      }
      firstCompetitor.calculatedRank = 1;
    }
    const currentLap = template.maxLapNumberCompleted.get();
    if (!currentLap) return [];
    // Gets only the competitors who did the current Lap
    query.lapsCompleted = currentLap;
    const totalNumberCompletedLap = ResultListEntries.find(query).count();
    const limit = template.numberRows.get() - 1;
    const invertedCursor = ResultListEntries.find(query, { sort: { 'latestSplit.performance': -1 }, limit });
    // The first one completed the most laps
    template.currentRegistriesNumber.set(totalNumberCompletedLap);
    const invertedMap = invertedCursor.map(function(item, index) {
      const element = item;
      element.calculatedRank = totalNumberCompletedLap - index;
      return element;
    });
    // The last one is the first competitor to be shown on top
    if (totalNumberCompletedLap >= template.numberRows.get()) {
      invertedMap.push(firstCompetitor);
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
    return ResultListEntries.find(query).count();
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
    return ResultListEntries.find(query).count();
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
          key: 'competitorId',
          label: '',
          sortable: false,
          headerClass: 'hide',
          cellClass: 'flag',
          fn(value, object) {
            if (value) {
              const team = Teams.findOne({ competitorIds: value });
              if (team && team.logo) {
                return new Spacebars.SafeString(team.logo);
              }
            }
            return new Spacebars.SafeString(`<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="250" height="150" viewBox="0 0 66.145832 39.687502" version="1.1"><g id="base" transform="translate(0,-257.31249)" style="display:inline"><rect style="opacity:1.0;fill:#4a4a4a;fill-opacity:1;stroke:none;stroke-width:1;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" width="66.145836" height="39.6875" x="0" y="257.31046"></rect></g></svg>`);
          },
        },
        /*
        {
          key: 'athleteCountryFlag',
          label: '',
          sortable: false,
          headerClass: 'hide',
          cellClass: 'flag',
          fn(value, object) {
            // find the team it's in
            const team = Teams.findOne({ competitorIds: object.competitorId });
            if (team && team.logo) {
              return new Spacebars.SafeString(team.logo);
            } else if (value) {
              const iocCode = object.athleteCountryIOC ? object.athleteCountryIOC : '';
              const flag = value ? value : '/img/default/blankflag.svg';
              return new Spacebars.SafeString(`<img src="${value}" alt="${iocCode}">`);
            }
          },
        },
        */
        {
          key: 'bib',
          label: '',
          sortable: false,
          headerClass: 'hide',
          cellClass: 'bib',
          fn(value, object) {
            return new Spacebars.SafeString(`${value}`);
          },
        },
        {
          key: 'athleteLastName',
          label: 'Last Name',
          sortable: false,
          headerClass: 'hide',
          cellClass: 'name truncate',
          fn(value, object) {
            return new Spacebars.SafeString(`${object.athleteFirstName} <span class="lastName">${object.athleteLastName}</span>`);
          },
        },
        {
          key: 'competitorId',
          label: '',
          sortable: false,
          headerClass: 'hide',
          cellClass: 'abbr-team',
          fn(value, object) {
            if (value) {
              const team = Teams.findOne({ competitorIds: value });
              if (team && team.logo) {
                return new Spacebars.SafeString(team.alternate);
              }
            }
            return '';
          },
        },
        {
          key: 'categories',
          label: '',
          headerClass: 'hide',
          sortable: false,
          fn(value, object, key) {
            let toShow = '';
            if (Array.isArray(value)) {
              for (let i = 0; i < value.length; i += 1) {
                // omits the race by default
                if (value[i].identifier !== 'OVERALL') {
                  toShow += `${value[i].identifier} `;
                }
              }
            }
            return new Spacebars.SafeString(toShow);
          },
        },
        {
          key: 'splits',
          label: '',
          headerClass: 'hide',
          sortable: false,
          fn(value) {
            // Only if this completed the same number of laps than the first competitor
            const { maxLapNumberCompleted } = Template.instance().data;
            if (!value) return '';
            if (value.length === maxLapNumberCompleted) {
              // Last performance
              const performance = moment.duration(value[value.length - 1].performance, 'seconds');
              const daysText = (performance.days() > 0) ? `${performance.days()}d ` : '';
              const hours = String(performance.hours()).padStart(2, '0');
              const mins = String(performance.minutes()).padStart(2, '0');
              const secs = String(performance.seconds()).padStart(2, '0');
              return `${daysText}${hours}:${mins}:${secs}`;
            }
            return '';
          },
        },
        {
          key: 'splits',
          label: '',
          sortable: false,
          fn(value) {
            // Only if this completed the same number of laps than the first competitor
            const { maxLapNumberCompleted } = Template.instance().data;
            if (!value) return '';
            if (value.length === maxLapNumberCompleted) {
              const latestPerformance = value[value.length - 1].performance;
              const firstTimestamp = Template.instance().data.firstCompetitorTimestamp;
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
            const differenceLaps = maxLapNumberCompleted - value.length - 1;
            if (differenceLaps === 1) {
              return '-1 lap';
            } else if (differenceLaps > 1) {
              // If lapped, it shows the difference
              return `-${maxLapNumberCompleted - value.length} laps`;
            }
            return '';
          },
        },
        {
          key: 'competitionFeatures',
          label: 'Features',
          headerClass: 'hide',
          sortable: false,
          fn(value, object) {
            let toReturn = '';
            if (value && Array.isArray(value)) {
              for (let i = 0; i < value.length; i += 1) {
                if (i > 0) {
                  toReturn += '<br>';
                }
                toReturn += `${value[i]}`;
              }
              return new Spacebars.SafeString(toReturn);
            }
          },
        },
      ],
    };
  },
});

Template.raceDisplayResults.events({
  'change select[name="category"]'(event) {
    const idSelected = $('select[name="category"]').val();
    const category = Categories.findOne({ _id: idSelected });
    Template.instance().categorySelected.set(category);
  },
});
