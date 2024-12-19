import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import 'numeraljs';
import moment from 'moment';
import beautify from 'json-beautify';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import Common from '../../../../../../both/lib/common';
import { Races } from '../../../../../api/races/races';
import { TeamCategories } from '../../../../../api/teamCategories/teamCategories';
import { StartingListEntries } from '../../../../../api/client/startingListEntries/startingListEntries';
import './team-results.html';
import { ResultLists } from '../../../../../api/resultLists/resultLists';
import { ResultListEntriesTeams } from '../../../../../api/client/resultListEntriesTeams/resultListEntriesTeams';


Template.raceTeamResults.onRendered(function () {
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

Template.raceTeamResults.onCreated(function () {
  const template = Template.instance();

  template.categorySelected = new ReactiveVar(null);
  template.currentRegistriesNumber = new ReactiveVar(0);
  template.maxLapNumberCompleted = new ReactiveVar(0);
  template.athletesCompletedAllLaps = new ReactiveVar(0);
  template.firstCompetitorTimestamp = new ReactiveVar(0);
  template.currentPage = new ReactiveVar(Session.get('currentPage-starting-list') || 0);
  template.rowsPerPage = new ReactiveVar(Session.get('rowsPerPage-starting-list') || 10);
  template.currentCheckpoint = new ReactiveVar(null);
  this.autorun(function () {
    Session.set('currentPage-starting-list', template.currentPage.get());
    Session.set('rowsPerPage-starting-list', template.rowsPerPage.get());
  });

  const raceId = FlowRouter.getParam('raceId');
  const checkpointId = FlowRouter.getParam('checkpointId');
  if (!raceId || !checkpointId) {
    console.log('No raceId or checkpointId received');
    return false;
  }

  const handlerRace = template.subscribe('races.id', raceId);
  const handlerCat = template.subscribe('teamCategories.race', raceId);
  const handlerResultLists = template.subscribe('results.race', raceId);
  const handlerResultEntries = template.subscribe('resultEntriesTeams.raceId', raceId);

  this.autorun(() => {
    if (handlerRace.ready() && handlerCat.ready() && handlerResultLists.ready() && handlerResultEntries.ready()) {
      template.currentRace = Races.findOne({ _id: raceId });
      template.currentCheckpoint.set(getCheckpointFromRace(template.currentRace, checkpointId));
      const firstCat = template.currentRace.teamCategories[0];
      template.categorySelected.set(firstCat);

      Tracker.afterFlush(() => {
        // Select the category by default
        $(`option[value="${firstCat._id}"]`).prop('selected', 'selected');
        $('#select-category').material_select();
      });
      
      /*
      if (template.currentRace.status === 'Ready') {
      }
      */
    }
  });
});

function getPerformanceGapText(latestPerformance, numLaps, totalLaps, firstTimestamp) {
  if (!latestPerformance || !numLaps || !totalLaps || !firstTimestamp) return '';
  if (numLaps >= totalLaps) {
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
  const differenceLaps = totalLaps - numLaps - 1;
  if (differenceLaps === 1) {
    return '-1 lap';
  } else if (differenceLaps > 1) {
    // If lapped, it shows the difference
    return `-${totalLaps - numLaps} laps`;
  }
  return '';
}

function getPerformanceText(performanceSecs, lapsCompleted, totalLaps) {
  if (!performanceSecs || !totalLaps) return '';
  if (lapsCompleted >= totalLaps) {
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

Template.raceTeamResults.helpers({
  categorySelected() {
    // Reads the radio selected
    const selected = Template.instance().categorySelected.get();
    if (!selected) return null;
    const number = StartingListEntries.find({
      categories: { $elemMatch: { _id: selected._id } },
    }).count();
    return `${selected.name} (${number} registries@@@@@)`;
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

    const numScoringAthletes = category.scoringAthletes ? category.scoringAthletes : 100;
    // The result entries related to this list of results
    const query = {
      teamCategories: { $elemMatch: { _id: category._id } },
      resultListId: checkpoint.resultListId,
      lapsCompleted: { $gte: numScoringAthletes },
    };
    const arrayTeams = ResultListEntriesTeams.find(query).map(function(item, index) {
      // Slice the best splits and sums them
      const element = item;
      element.splits = item.splits.slice(0, numScoringAthletes);
      let totalPerformance = 0;
      for (let i = 0; i < element.splits.length; i++) {
        totalPerformance += element.splits[i];
      }
      element.totalPerformance = totalPerformance;
      return element;
    });
    // Order by total performance
    arrayTeams.sort(function(a, b) {
      return a.totalPerformance - b.totalPerformance;
    });
    // Gets information from the first one
    if (arrayTeams && arrayTeams.length > 0) {
      const firstCompetitor = arrayTeams[0];
      template.maxLapNumberCompleted.set(firstCompetitor.lapsCompleted);
      if (firstCompetitor.lapsCompleted > 0) {
        template.firstCompetitorTimestamp.set(firstCompetitor.totalPerformance);
      }
    }
    // The first one completed the most laps
    template.currentRegistriesNumber.set(arrayTeams.length);
    const calculatedArray = arrayTeams.map(function(item, index) {
      const element = item;
      element.calculatedRank = index + 1;
      return element;
    });
    return calculatedArray;
  },
  distanceRace(race) {
    if (race && race.distance) {
      return `${i18n('races.view.total_distance')}: ${race.distance.value} ${Common.getDistanceUnitAbbr(race.distance.unit)}`;
    }
    return null;
  },
  organizerText(race) {
    if (race && race.organizerName) {
      let name = race.organizerName;
      if (race.organizerUrl) {
        name = `<a href="${race.organizerUrl}" target="_blank">${race.organizerName}</a>`;
      }
      const email = race.organizerEmail ? `(<a href="mailto:${race.organizerEmail}">${race.organizerEmail}</a>)` : '';
      return new Spacebars.SafeString(`${i18n('races.view.organized_by')}: ${name} ${email}`);
    }
    return null;
  },
  currentNumberRegistries() {
    return Template.instance().currentRegistriesNumber.get();
  },
  scoringAthletes() {
    const template = Template.instance();
    const category = template.categorySelected.get();
    return (category && category.scoringAthletes) ? category.scoringAthletes : 100;
  },
  numberTeamsFinishedOverall() {
    const template = Template.instance();
    const checkpoint = template.currentCheckpoint.get();
    const category = template.categorySelected.get();
    if (!checkpoint || !category) return '';
    const total = category.scoringAthletes ? category.scoringAthletes : 1;
    const query = { lapsCompleted: { $gte: total } };
    return ResultListEntriesTeams.find(query).count();
  },
  numberAthletesStarted() {
    const template = Template.instance();
    const checkpoint = template.currentCheckpoint.get();
    if (!checkpoint) return '';
    const query = {
      competitionFeatures: { $nin: ['DNS'] },
      resultListId: checkpoint.resultListId,
    };
    return ResultListEntriesTeams.find(query).count();
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
      currentPage: Template.instance().currentPage,
      rowsPerPage: Template.instance().rowsPerPage,
      rowClass(object) {
        const total = this.templateData.currentCheckpoint.laps * this.templateData.scoringAthletes;
        if (object && (object.splits.length > 0) && object.splits.length >= total) {
          return '';
        }
        return 'pending-result';
      },
      fields: [
        {
          key: 'splits',
          label: '',
          sortable: false,
          cellClass: 'rowIcon',
          fn(value) {
            const template = Template.instance();
            const total = template.data.currentCheckpoint.laps * template.data.scoringAthletes;
            if (value && value.length > 0 && value.length === total) {
              return new Spacebars.SafeString('<i class="material-icons">flag</i>');
            }
            return '';
          },
        },
        {
          key: 'calculatedRank',
          label: 'Pos.',
          sortOrder: 0,
          sortDirection: 'ascending',
          fn(value, object) {
            // Only shows the rank in case they has completed all laps
            const template = Template.instance();
            const total = template.data.currentCheckpoint.laps * template.data.scoringAthletes;
            if (object && (object.splits.length > 0) && object.splits.length >= total) {
              /*
              if (value === 1) return new Spacebars.SafeString('<span class="emoji">🥇</span>');
              if (value === 2) return new Spacebars.SafeString('<span class="emoji">🥈</span>');
              if (value === 3) return new Spacebars.SafeString('<span class="emoji">🥉</span>');
              */
              return value;
            }
            return Spacebars.SafeString('<span class="hide">100000000</span>');
          },
        },
        {
          key: 'teamLogo',
          label: 'Logo',
          cellClass: 'flag',
          sortable: false,
          fn(value) {
            return new Spacebars.SafeString(value);
          },
        },
        {
          key: 'teamAlternate',
          label: 'Abr.',
          sortable: false,
        },
        {
          key: 'teamName',
          label: 'Equipo',
          sortable: false,
        },
        {
          key: 'bibs',
          label: 'Dorsales',
          sortable: false,
        },
        {
          key: 'splits',
          label: 'Atletas',
          sortable: false,
          fn(value, object) {
            const template = Template.instance();
            const total = template.data.currentCheckpoint.laps * template.data.scoringAthletes;
            if (value && object.bibs && value.length > 0) {
              return `${object.bibs.length}/${total}`;
            }
            return `0/${total}`;
          },
        },
        {
          key: 'totalPerformance',
          label: 'Tiempo',
          sortable: false,
          fn(value, object) {
            const template = Template.instance();
            const total = template.data.currentCheckpoint.laps * template.data.scoringAthletes;
            // Only if this completed the same number of laps than the first competitor
            return getPerformanceText(value, object.lapsCompleted, total);
          },
        },
        {
          key: 'totalPerformance',
          label: 'Dif.',
          sortable: false,
          fn(value, object) {
            const template = Template.instance();
            const total = template.data.currentCheckpoint.laps * template.data.scoringAthletes;            
            return getPerformanceGapText(value, object.lapsCompleted, total, template.data.firstCompetitorTimestamp);
          },
        },
        {
          key: 'competitionFeatures',
          label: 'Notas',
          cellClass: 'features',
          headerClass: 'features',
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


function generatePdfDoc(template) {
  // Result lists for all categories
  const raceName = template.currentRace ? template.currentRace.name : '';
  const checkpoint = template.currentCheckpoint.get();
  const categoryList = TeamCategories.find({ _id: { $in: template.currentRace.teamCategories } }).fetch();
  const maxLapNumberCompleted = template.maxLapNumberCompleted.get();

  const tables = [];
  tables.push({ text: `Resultados ${raceName} (equipos) > ${checkpoint.deviceId}`, style: 'header' });
  for (let i = 0; i < categoryList.length; i += 1) {
    const category = categoryList[i];
    if (!category || !checkpoint) return [];

    const numScoringAthletes = categoryList[i].scoringAthletes ? categoryList[i].scoringAthletes : 100;
    // The result entries related to this list of results
    const query = {
      teamCategories: { $elemMatch: { _id: categoryList[i]._id } },
      resultListId: checkpoint.resultListId,
      lapsCompleted: { $gte: numScoringAthletes },
    };
    const arrayTeams = ResultListEntriesTeams.find(query).map(function(item, index) {
      // Slice the best splits and sums them
      const element = item;
      element.splits = item.splits.slice(0, numScoringAthletes);
      let totalPerformance = 0;
      for (let i = 0; i < element.splits.length; i++) {
        totalPerformance += element.splits[i];
      }
      element.totalPerformance = totalPerformance;
      return element;
    });
    // Order by total performance
    arrayTeams.sort(function(a, b) {
      return a.totalPerformance - b.totalPerformance;
    });
    // Gets information from the first one
    if (arrayTeams && arrayTeams.length > 0) {
      const firstCompetitor = arrayTeams[0];
      template.maxLapNumberCompleted.set(firstCompetitor.lapsCompleted);
      if (firstCompetitor.lapsCompleted > 0) {
        template.firstCompetitorTimestamp.set(firstCompetitor.totalPerformance);
      }
    }
    // The first one completed the most laps
    template.currentRegistriesNumber.set(arrayTeams.length);
    const entries = arrayTeams.map(function(item, index) {
      const element = item;
      element.calculatedRank = index + 1;
      return element;
    });

    console.log(entries);

    const totalLaps = checkpoint.laps * numScoringAthletes;

    tables.push({ text: `Resultados de ${raceName} (equipos) > ${checkpoint.deviceId} - ${categoryList[i].identifier}`, style: 'header' });
    tables.push(`${entries.length} equipos en esta categoría`);
    const tableRows = [[
      { text: '#', alignment: 'right' },
      { text: 'Abbr', alignment: 'left' },
      'Equipo', 'Dorsales', 
      //'Meta', 
      'Parciales',
      { text: 'Total', alignment: 'right' },
    ]];
    for (let j = 0; j < entries.length; j += 1) {
      // Only if this completed the same number of laps than the first competitor
      const performance = getPerformanceText(entries[j].totalPerformance, entries[j].lapsCompleted, totalLaps);
      const gap = getPerformanceGapText(entries[j].totalPerformance, entries[j].lapsCompleted, totalLaps, template.firstCompetitorTimestamp.get());
      let splits = '';
      for (let k = 0; k < entries[j].splits.length; k += 1) {
        if (k > 0) { splits += ' | '; }
        splits += `${getPerformanceText(entries[j].splits[k], 1, 1)} `;
      }
      tableRows.push([{ text: entries[j].calculatedRank, color: 'gray', alignment: 'right' },
        { text: entries[j].teamAlternate, color: 'gray', alignment: 'left' },
        { text: entries[j].teamName, italics: true, color: 'gray' },
        { text: entries[j].bibs.join(' | '), italics: true, color: 'gray' },
        //{ text: entries[j].lapsCompleted, italics: true, color: 'gray'},
        { text: splits, color: 'gray', alignment: 'left' },
        { text: performance, color: 'gray', alignment: 'right' },
      ]);
    }
    tables.push({
      style: 'tableResults',
      table: {
        widths: [15, 40, 200, 100, 250, 50],
        body: tableRows,
      },
    });
  }
  return {
    pageOrientation: 'landscape',
    header: {
      alignment: 'right',
      fit: [100, 100],
      margin: [ 5, 5, 0, 0 ],
      image: 'data:image/png;base64,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',
    },
    content: tables,
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5],
      },
      tableResults: {
        margin: [0, 5, 0, 15],
      },
      tableHeader: {
        bold: true,
        fontSize: 13,
        color: 'black',
      },
    },
    defaultStyle: {
      // alignment: 'justify'
    },
    pageBreakBefore(currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage) {
      return currentNode.headlineLevel === 1;
    },
  };
}

Template.raceTeamResults.events({
  'change select[name="category"]'(event) {
    const idSelected = $('select[name="category"]').val();
    const category = TeamCategories.findOne({ _id: idSelected });
    Template.instance().categorySelected.set(category);
  },
  'click #print-button'(event) {
    pdfMake.createPdf(generatePdfDoc(Template.instance())).print();
  },
});
