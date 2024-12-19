import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import 'numeraljs';
import moment from 'moment';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import Common from '../../../../../../both/lib/common';
import { Races } from '../../../../../api/races/races';
import { Categories } from '../../../../../api/categories/categories';
import { StartingListEntries } from '../../../../../api/client/startingListEntries/startingListEntries';
import './results.html';
import { ResultLists } from '../../../../../api/resultLists/resultLists';
import { ResultListEntries } from '../../../../../api/client/resultListEntries/resultListEntries';


Template.raceResults.onRendered(function () {
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

Template.raceResults.onCreated(function () {
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
  const handlerCat = template.subscribe('categories.all');
  const handlerResultLists = template.subscribe('results.race', raceId);
  const handlerResultEntries = template.subscribe('resultEntries.raceId', raceId);

  this.autorun(() => {
    if (handlerRace.ready() && handlerCat.ready() && handlerResultLists.ready() && handlerResultEntries.ready()) {
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

function getPerformanceGapText(splits, maxLapNumberCompleted, firstTimestamp) {
  if (!splits || !maxLapNumberCompleted || !firstTimestamp) return '';
  if (splits.length === maxLapNumberCompleted) {
    const latestPerformance = splits[splits.length - 1].performance;
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
  const differenceLaps = maxLapNumberCompleted - splits.length - 1;
  if (differenceLaps === 1) {
    return '-1 lap';
  } else if (differenceLaps > 1) {
    // If lapped, it shows the difference
    return `-${maxLapNumberCompleted - splits.length} laps`;
  }
  return '';
}

function getPerformanceText(value, maxLapNumberCompleted) {
  if (!value || !maxLapNumberCompleted) return '';
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
}

Template.raceResults.helpers({
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
    const cursor = ResultListEntries.find(query, projection);
    // Gets information from the first one
    const firstCompetitor = ResultListEntries.findOne(query, projection);
    if (firstCompetitor) {
      template.maxLapNumberCompleted.set(firstCompetitor.splits.length);
      if (firstCompetitor.splits.length > 0) {
        template.firstCompetitorTimestamp.set(firstCompetitor.splits[firstCompetitor.splits.length - 1].performance);
      }
    }
    // The first one completed the most laps
    template.currentRegistriesNumber.set(cursor.count());
    return cursor.map(function(item, index) {
      const element = item;
      element.calculatedRank = index + 1;
      return element;
    });
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
      currentPage: Template.instance().currentPage,
      rowsPerPage: Template.instance().rowsPerPage,
      rowClass(object) {
        if (object && (object.splits.length > 0) && object.splits.length === this.templateData.maxLapNumberCompleted) {
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
            const total = Template.instance().data.currentCheckpoint.laps;
            if (value && value.length > 0 && value.length === total) {
              return new Spacebars.SafeString('<i class="material-icons">flag</i>');
            }
            return '';
          },
        },
        {
          key: 'calculatedRank',
          label: 'Rank',
          sortOrder: 0,
          sortDirection: 'ascending',
          fn(value, object) {
            // Only shows the rank in case they has completed all laps
            const { maxLapNumberCompleted } = Template.instance().data;
            if (object && (object.splits.length > 0) && object.splits.length === maxLapNumberCompleted) {
              if (object.rankCorrection) {
                return object.rankCorrection;
              }
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
          key: 'competitionFeatures',
          label: 'Features',
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
        {
          key: 'bib',
          label: 'Bib',
          sortable: false,
        },
        {
          key: 'athleteLastName',
          label: 'Last Name',
          cellClass: 'name',
          sortable: false,
        },
        {
          key: 'athleteFirstName',
          label: 'First Name',
          cellClass: 'name',
          sortable: false,
        },
        {
          key: 'athleteGender',
          label: 'Gender',
          sortable: false,
          fn(value) {
            const text = value === 'Male' ? 'M' : 'F';
            return new Spacebars.SafeString(text);
          },
        },
        {
          key: 'categories',
          label: 'Categories',
          sortable: false,
          fn(value, object, key) {
            let toShow = '';
            if (Array.isArray(value)) {
              for (let i = 0; i < value.length; i += 1) {
                // omits the race by default
                if (value[i].identifier !== 'OVERALL') {
                  toShow += `<abbr title="${value[i].name}">${value[i].identifier}</abbr> `;
                }
              }
            }
            return new Spacebars.SafeString(toShow);
          },
        },
        {
          key: 'splits',
          label: 'Laps',
          sortable: false,
          fn(value) {
            const total = Template.instance().data.currentCheckpoint.laps;
            if (value && value.length > 0) {
              return `${value.length}/${total}`;
            }
            return `0/${total}`;
          },
        },
        {
          key: 'splits',
          label: 'Performance',
          sortable: false,
          fn(value) {
            // Only if this completed the same number of laps than the first competitor
            return getPerformanceText(value, Template.instance().data.maxLapNumberCompleted);
          },
        },
        {
          key: 'splits',
          label: 'Gap',
          sortable: false,
          fn(value) {
            return getPerformanceGapText(value, Template.instance().data.maxLapNumberCompleted, Template.instance().data.firstCompetitorTimestamp);
          },
        },

        /*
        {
          key: 'performanceLaps',
          label: 'Laps',
          sortable: false,
          fn(value) {
            const template = Template.instance();
            if (!template.data.currentCheckpoint) { return value; }
            const total = template.data.currentCheckpoint.laps;
            return `${value}/${total}`;
          },
        },
        {
          key: 'performanceTimestamp',
          label: 'Performance',
          sortable: false,
          sortByValue: true,
          fn(value) {
            return moment(value).subtract(Template.instance().data.currentRace.startDate).format('hh:mm:ss');
          },
        },
        */
        {
          key: '_id',
          label: 'Edit',
          sortable: false,
          headerClass() {
            if (!Common.isAdmin()) return 'hide';
            return '';
          },
          cellClass() {
            if (!Common.isAdmin()) return 'hide';
            return '';
          },
          fn(value, object) {
            if (!Common.isAdmin()) return '';
            const raceId = FlowRouter.getParam('raceId');
            const checkpointId = FlowRouter.getParam('checkpointId');
            return new Spacebars.SafeString(`
              <a target="editResult" href="${FlowRouter.path('admin.races.editResultEntry', { raceId, checkpointId, resultEntryId: value })}" title="Edit Entry"><i class="material-icons">edit</i></a>
            `);
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
  const categoryList = Categories.find({ _id: { $in: template.currentRace.categories } }).fetch();
  const maxLapNumberCompleted = template.maxLapNumberCompleted.get();
  const tables = [];
  tables.push({ text: `Resultados de ${raceName} > ${checkpoint.deviceId}`, style: 'header' });
  for (let i = 0; i < categoryList.length; i += 1) {
    const query = {
      categories: { $elemMatch: { _id: categoryList[i]._id } },
      resultListId: checkpoint.resultListId,
    };
    const entries = ResultListEntries.find(query).map(function(item, index) {
      const element = item;
      element.calculatedRank = index + 1;
      return element;
    });
    tables.push({ text: `Resultados ${raceName} > ${checkpoint.deviceId} - ${categoryList[i].identifier}`, style: 'header', headlineLevel: 1 });
    tables.push(`${entries.length} atletas listados en esta categoría`);
    const tableRows = [[
      { text: '#', alignment: 'right' },
      { text: 'Dosal', alignment: 'right' },
      'Apellidos', 'Nombre', 'Club', 'País', 'Vueltas',
      { text: 'Tiempo', alignment: 'right' },
      { text: 'Dif.', alignment: 'right' },
    ]];
    for (let j = 0; j < entries.length; j += 1) {
      const performance = getPerformanceText(entries[j].splits, maxLapNumberCompleted);
      const gap = getPerformanceGapText(entries[j].splits, maxLapNumberCompleted, template.firstCompetitorTimestamp.get());
      tableRows.push([{ text: entries[j].calculatedRank, color: 'gray', alignment: 'right' },
        { text: entries[j].bib, color: 'gray', alignment: 'right' },
        { text: entries[j].athleteLastName, italics: true, color: 'gray' },
        { text: entries[j].athleteFirstName, italics: true, color: 'gray' },
        { text: entries[j].athleteClub, italics: true, color: 'gray' },
        { text: entries[j].athleteCountryIOC, italics: true, color: 'gray' },
        { text: entries[j].splits.length, color: 'gray' },
        { text: performance, color: 'gray', alignment: 'right' },
        { text: gap, color: 'gray', alignment: 'right' },
      ]);
    }
    tables.push({
      style: 'tableResults',
      table: {
        widths: [20, 30, '*', 100, 100, 25, 20, 60, 60],
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
      image: Common.getImagePrinting(),
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

Template.raceResults.events({
  'change select[name="category"]'(event) {
    const idSelected = $('select[name="category"]').val();
    const category = Categories.findOne({ _id: idSelected });
    Template.instance().categorySelected.set(category);
  },
  'click #print-button'(event) {
    pdfMake.createPdf(generatePdfDoc(Template.instance())).print();
  },
});
