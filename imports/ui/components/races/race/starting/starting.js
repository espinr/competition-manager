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

import beautify from 'json-beautify';
import Common from '../../../../../../both/lib/common';
import { Races } from '../../../../../api/races/races';
import { Categories } from '../../../../../api/categories/categories';
import { StartingListEntries } from '../../../../../api/client/startingListEntries/startingListEntries';


import './starting.html';

Template.raceStartingList.onRendered(function () {
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

Template.raceStartingList.onCreated(function () {
  const template = Template.instance();

  template.categorySelected = new ReactiveVar(null);
  template.currentPage = new ReactiveVar(Session.get('currentPage-starting-list') || 0);
  template.rowsPerPage = new ReactiveVar(Session.get('rowsPerPage-starting-list') || 10);
  this.autorun(function () {
    Session.set('currentPage-starting-list', template.currentPage.get());
    Session.set('rowsPerPage-starting-list', template.rowsPerPage.get());
  });

  const raceId = FlowRouter.getParam('raceId');
  if (!raceId) {
    console.log('No raceId received');
    return false;
  }

  const handlerRace = template.subscribe('races.id', raceId);
  const handlerUsers = template.subscribe('athletes.public.all');
  const handlerCat = template.subscribe('categories.race', raceId);
  const handlerCountries = template.subscribe('countries.all');
  const handlerCompetitors = template.subscribe('competitors.startingList', raceId);

  this.autorun(() => {
    if (handlerRace.ready() && handlerUsers.ready() && handlerCat.ready() && handlerCompetitors.ready() && handlerCountries.ready()) {
      template.currentRace = Races.findOne({ _id: raceId });

      const overallCat = Categories.findOne({ identifier: 'OVERALL' });
      template.categorySelected.set(overallCat);
      
      Tracker.afterFlush(() => {
        $('#select-category').val(overallCat._id);
        $('#select-category').material_select();
      });
      
      /*
      if (template.currentRace.status === 'Ready') {
      }
      */
    }
  });
});

Template.raceStartingList.helpers({
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
  checkedByDefault(catId) {
    // If the category is the overall, selects it
    const overallCat = Categories.findOne({ identifier: 'OVERALL' });
    return (catId === overallCat._id) ? 'checked' : '';
  },
  distanceRace(race) {
    if (race && race.distance) {
      return `${i18n('races.results.distance')}: ${race.distance.value} ${Common.getDistanceUnitAbbr(race.distance.unit)}`;
    }
    return null;
  },
  categories(race) {
    if (!race || !race.categories) return null;
    return Categories.find({ _id: { $in: race.categories } }, { sort: { requiredMinAge: 1, requiredMaxAge: 1, description: 1 } });
  },
  currentRegistries() {
    const category = Template.instance().categorySelected.get();
    if (!category) return [];
    return StartingListEntries.find({
      categories: { $elemMatch: { _id: category._id } },
    }).count();
  },
  raceDate(race) {
    if (!race || !race.startDate) return null;
    return moment(race.startDate).format('DD-MM-YYYY');
  },
  timeDate(race) {
    if (!race || !race.startTime) return null;
    return race.startTime;
  },
  hrefEdit(race) {
    if (!race) return null;
    return `${FlowRouter.path('admin.races.edit')}/${race._id}`;
  },
  idRace() {
    return FlowRouter.getParam('raceId');
  },
  competitors(race) {
    const category = Template.instance().categorySelected.get();
    if (!category) return [];
    return StartingListEntries.find({
      categories: { $elemMatch: { _id: category._id } },
    });
  },
  settingsTable() {
    return {
      currentPage: Template.instance().currentPage,
      rowsPerPage: Template.instance().rowsPerPage,
      fields: [
        {
          key: 'bib',
          label: i18n('races.results.bib'),
          sortOrder: 4,
          sortFn(value) {
            return parseInt(value, 10);
          },
          sortDirection: 'ascending',
        },
        {
          key: 'athleteLastName',
          label: i18n('races.results.lastName'),
          sortOrder: 1,
          cellClass: 'name',
          sortDirection: 'ascending',
        },
        {
          key: 'athleteFirstName',
          label: i18n('races.results.firstName'),
          sortOrder: 2,
          cellClass: 'name',
          sortDirection: 'ascending',
        },
        {
          key: 'athleteGender',
          label: i18n('races.results.gender'),
          sortOrder: 5,
          sortDirection: 'ascending',
          cellClass: 'name',
          fn(value) {
            const text = value === 'Male' ? 'M' : 'F';
            return new Spacebars.SafeString(text);
          },
        },
        {
          key: 'athleteClub',
          label: i18n('races.results.club'),
          sortOrder: 3,
          cellClass: 'name',
          sortDirection: 'ascending',
        },
        {
          key: 'categories',
          label: i18n('races.results.categories'),
          sortOrder: 1,
          sortDirection: 'ascending',
          fn(value) {
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
          key: 'athleteBirthDate',
          label: i18n('races.results.age'),
          sortOrder: 5,
          headerClass() {
            if (!Common.isAdmin()) return 'hide';
            return '';
          },
          cellClass() {
            if (!Common.isAdmin()) return 'hide';
            return '';
          },          
          sortDirection: 'ascending',
          fn(value) {
            if (!Common.isAdmin() || !value) return '';
            return Common.getYearsOldToday(value);
          },
        },
        {
          key: '_id',
          label: i18n('races.results.edit'),
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
            return new Spacebars.SafeString(`
              <a href="${FlowRouter.path('admin.competitors.edit', { competitorId: value, raceId: FlowRouter.getParam('raceId') })}" title="${i18n('races.results.edit')}"><i class="material-icons">filter_1</i></a> <a href="${FlowRouter.path('admin.editProfileAdmin', { userId: object.athleteId, raceId: FlowRouter.getParam('raceId')})}" title="${i18n('races.results.edit')}"><i class="material-icons">account_box</i></a>
            `);
          },
        },
      ],
    };
  },
});

function generatePdfDoc(template) {
  // Starting list for the OVERALL category
  const raceName = template.currentRace ? template.currentRace.name : '';
  const competitors = StartingListEntries.find({
    categories: { $elemMatch: { identifier: 'OVERALL' } },
  }, { sort: { athleteLastName: 1 } }).fetch();
  const numberCompetitors = competitors.length;
  const tableRows = [];
  tableRows.push([i18n('races.results.bib'), i18n('races.results.lastName'), i18n('races.results.firstName'), i18n('races.results.club'), i18n('races.results.categories')]);
  for (let i = 0; i < competitors.length; i += 1) {
    let categoriesToPrint = '';
    if (Array.isArray(competitors[i].categories)) {
      for (let j = 0; j < competitors[i].categories.length; j += 1) {
        // omits the race by default
        if (competitors[i].categories[j].identifier !== 'OVERALL') {
          categoriesToPrint += `${competitors[i].categories[j].identifier} `;
        }
      }
    }
    let clubName = '';
    const maxStringClub = 20; // number of maximum chars
    if (competitors[i].athleteClub) {
      if (competitors[i].athleteClub.length > maxStringClub ) {
        clubName = `${competitors[i].athleteClub.substring(0, maxStringClub)}…`;
      } else {
        clubName = competitors[i].athleteClub;
      }
    }
    tableRows.push([competitors[i].bib,
      { text: competitors[i].athleteLastName.toUpperCase(), italics: true, color: 'gray', fontSize: 10 },
      { text: competitors[i].athleteFirstName.toUpperCase(), italics: true, color: 'gray', fontSize: 10 },
      { text: clubName.toUpperCase(), italics: true, color: 'gray', fontSize: 10  },
      { text: categoriesToPrint, italics: true, color: 'gray' },
    ]);
  }
  return {    
    content: [
      { text: `${raceName} – Starting List`, style: 'header' },
      `${numberCompetitors} ${i18n('races.results.athletes_overall')}`,
      {
        style: 'tableResults',
        table: {
          widths: [30, 150, 100, '*', 70],
          body: tableRows,
        },
      },
    ],
    header: {
      alignment: 'right',
      fit: [100, 100],
      margin: [ 5, 5, 0, 0 ],
      image: Common.getImagePrinting(),
    },    
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
  };
}

Template.raceStartingList.events({
  'change select[name="category"]'(event) {
    const idSelected = $('select[name="category"]').val();
    const category = Categories.findOne({ _id: idSelected });
    Template.instance().categorySelected.set(category);
  },
  'click #print-button'(event) {
    pdfMake.createPdf(generatePdfDoc(Template.instance())).print();
  },
});
