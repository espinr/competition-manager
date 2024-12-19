import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Teams } from '../../../api/teams/teams';
import { Countries } from '../../../api/countries/countries';
import { StartingListEntries } from '../../../api/client/startingListEntries/startingListEntries';
import { TeamCategories } from '../../../api/teamCategories/teamCategories';
import './teams.html';

Template.adminTeams.onCreated(function () {
  let template = Template.instance();
  template.loading = new ReactiveVar(true);

  const raceId = FlowRouter.getParam('raceId');
  if (!raceId) {
    console.log('No raceId received!');
    return;
  }
  template.raceId = new ReactiveVar(raceId);

  template.autorun(() => {
    const handler = template.subscribe('teams.all');
    const handlerCountries = template.subscribe('countries.all');
    const handlerCompetitors = template.subscribe('competitors.startingList', raceId);
    const handlerCategories = template.subscribe('teamCategories.race', raceId);
    if (handler.ready() && handlerCountries.ready() && handlerCompetitors.ready() && handlerCategories.ready()) {
      template.loading.set(false);
      $('document').ready(function() {
        $('select').material_select();
      });    
    }
  });
});

Template.adminTeams.helpers({
  loading() {
    return Template.instance().loading.get();
  },
  raceId() {
    return Template.instance().raceId.get();
  },
  teams() {
    return Teams.find({ raceId: Template.instance().raceId.get() });
  },
  settings() {
    return {
      fields: [
        {
          key: 'logo',
          label: 'Flag',
          sortable: false,
          headerClass: 'flag',
          cellClass: 'flag',
          fn(value) {
            if (value) {
              return new Spacebars.SafeString(`${value}`);
            }
            return '';
          },
        },
        {
          key: 'name',
          label: 'Name',
          sortOrder: 1,
          sortDirection: 'ascending',
        },
        {
          key: 'competitorIds',
          label: 'Members',
          sortable: false,
          fn(value) {
            if (value && Array.isArray(value)) {
              return StartingListEntries.find({
                competitorId: { $in: value },
              }).map(function(entry) {
                return `(${entry.bib}) ${entry.athleteLastName}`;
              });
            }
            return '';
          },
        },
        {
          key: 'alternate',
          label: 'Abbr',
          sortOrder: 1,
          sortDirection: 'ascending',
        },
        {
          key: 'countryId',
          label: 'Country',
          sortOrder: 1,
          sortDirection: 'ascending',
          fn(value) {
            const country = Countries.findOne({ _id: value });
            if (country) {
              return new Spacebars.SafeString(`<img class="flag" src="${country.imageUrl}" alt="${country.codes.ioc}">`);
            }
            return '';
          },
        },
        {
          key: 'teamCategories',
          label: 'Category',
          sortOrder: 1,
          sortDirection: 'ascending',
          fn(value) {
            let textCat = '';
            if (value && Array.isArray(value)) {
              for (let i = 0; i < value.length; i += 1) {
                const category = TeamCategories.findOne({ _id: value[i] });
                if (category.identifier !== 'OVERALL') {
                  textCat += `${category.identifier} `;
                }
              }
            }
            return new Spacebars.SafeString(textCat);
          },
        },
        {
          key: '_id',
          label: '',
          fn(value, object) {
            return new Spacebars.SafeString(`<a href="${FlowRouter.path('admin.teams.edit', { teamId: value, raceId: object.raceId })}" title="Edit club"><i class="material-icons">edit</i></a>`);
          },
        },
      ],
    };
  },
});

Template.adminTeams.events({});
