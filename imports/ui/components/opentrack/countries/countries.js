import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { Countries } from '../../../../api/countries/countries';

import './countries.html';

Template.opentrackCountries.onCreated(function () {
  const template = Template.instance();
  template.loading = new ReactiveVar(true);

  template.autorun(() => {
    const handlerCountries = template.subscribe('countries.all');
    if (handlerCountries.ready()) {
      template.loading.set(false);
      $('document').ready(function() {});
    }
  });
});

Template.opentrackCountries.helpers({
  loading() {
    return Template.instance().loading.get();
  },
  countries() {
    return Countries.find();
  },
  settings() {
    return {
      fields: [
        {
          key: 'codes',
          label: 'Code',
          cellClass: 'opentrack',
          sortOrder: 1,
          sortDirection: 'ascending',
          fn(value) {
            return value.iso;
          },
        },
        {
          key: 'name',
          label: 'Name',
          sortOrder: 1,
          sortDirection: 'ascending',
        },
        {
          key: 'codes',
          label: 'IOC',
          sortOrder: 1,
          sortDirection: 'ascending',
          fn(value) {
            return value.ioc;
          },
        },
        {
          key: 'imageUrl',
          label: 'Flag',
          sortable: false,
          headerClass: 'flag',
          cellClass: 'flag',
          fn(value, object) {
            if (value) {
              return new Spacebars.SafeString(`<img class="flag" src="${value}" alt="Flag of ${object.name}"/>`);
            }
            return '';
          },
        },
        {
          key: 'codes',
          label: '',
          fn(value) {
            return new Spacebars.SafeString(`<a target='code' href="/data/countries/${value.iso}" title="See code"><i class="material-icons">code</i></a>`);
          },
        },
      ],
    };
  },
});

Template.opentrackCountries.events({});
