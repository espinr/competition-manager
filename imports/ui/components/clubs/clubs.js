import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Clubs } from '../../../api/clubs/clubs';
import { Countries } from '../../../api/countries/countries';

import './clubs.html';

Template.adminClubs.onCreated(function () {
  let template = Template.instance();
  template.loading = new ReactiveVar(true);

  template.autorun(() => {
    const handler = template.subscribe('clubs.all');
    const handlerCountries = template.subscribe('countries.all');
    if (handler.ready() && handlerCountries.ready()) {
      template.loading.set(false);
      $('document').ready(function() {
        $('select').material_select();
      });    
    }
  });
});

Template.adminClubs.helpers({
  loading() {
    return Template.instance().loading.get();
  },
  clubs() {
    return Clubs.find();
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
          key: '_id',
          label: '',
          fn(value) {
            return new Spacebars.SafeString(`<a href="${FlowRouter.path('admin.clubs.edit', { clubId: value })}" title="Edit club"><i class="material-icons">edit</i></a>`);
          },
        },
      ],
    };
  },
});

Template.adminClubs.events({});
