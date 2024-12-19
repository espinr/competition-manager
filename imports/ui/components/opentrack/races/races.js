import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import moment from 'moment';
import { Athletes } from '../../../../api/users/users';
import { Clubs } from '../../../../api/clubs/clubs';
import { Races } from '../../../../api/races/races';
import { Countries } from '../../../../api/countries/countries';

import './races.html';

Template.opentrackRaces.onCreated(function () {
  const template = Template.instance();
  template.loading = new ReactiveVar(true);

  template.autorun(() => {
    const handler = template.subscribe('athletes.public.all');
    const handlerClubs = template.subscribe('clubs.all');
    const handlerRaces = template.subscribe('races.all.external');
    const handlerCountries = template.subscribe('countries.all');
    if (handler.ready() && handlerRaces.ready() && handlerCountries.ready() && handlerClubs.ready()) {
      template.loading.set(false);
      $('document').ready(function() {});
    }
  });
});

Template.opentrackRaces.helpers({
  loading() {
    return Template.instance().loading.get();
  },
  races() {
    return Races.find();
  },
  settings() {
    return {
      fields: [
        {
          key: 'identifier',
          label: 'Code',
          cellClass: 'opentrack',
          sortOrder: 1,
          sortDirection: 'ascending',
        },
        {
          key: 'countryId',
          label: 'Country',
          sortable: false,
          headerClass: 'flag',
          cellClass: 'flag',
          fn(value, object) {
            if (value) {
              const country = Countries.findOne(value);
              if (country) {
                return new Spacebars.SafeString(`<img class="flag" src="${country.imageUrl}" alt="Flag of ${country.name}"/>`);
              }
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
          key: 'startDate',
          label: 'Date',
          sortOrder: 1,
          sortDirection: 'ascending',
          sortByValue: true,
          fn(value) {
            return new Spacebars.SafeString(`${moment(value).format('L')}`);
          },
        },
        {
          key: 'status',
          label: 'Status',
          sortOrder: 1,
          sortDirection: 'ascending',
        },
        {
          key: '_id',
          label: '',
          fn(value) {
            return new Spacebars.SafeString(`<a target='code' href="/data/competitions/${value}" title="See code"><i class="material-icons">code</i></a>`);    
          },
        },
      ],
    };
  },
});

Template.opentrackRaces.events({});
