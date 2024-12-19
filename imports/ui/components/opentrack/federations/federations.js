import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Countries } from '../../../../api/countries/countries';
import { Federations } from '../../../../api/federations/federations';

import './federations.html';

Template.opentrackFederations.onCreated(function () {
  const template = Template.instance();
  template.loading = new ReactiveVar(true);

  template.autorun(() => {
    const handler = template.subscribe('federations.all');
    const handlerCountries = template.subscribe('countries.all');
    if (handler.ready() && handlerCountries.ready()) {
      template.loading.set(false);
      $('document').ready(function() {});    
    }
  });
});

Template.opentrackFederations.helpers({
  loading() {
    return Template.instance().loading.get();
  },
  federations() {
    return Federations.find();
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
          key: 'name',
          label: 'Name',
          sortOrder: 1,
          sortDirection: 'ascending',
        },
        {
          key: 'memberOf',
          label: 'Member of',
          sortOrder: 1,
          sortDirection: 'ascending',
        },
        {
          key: 'areaServed',
          label: 'Area',
          sortOrder: 1,
          sortDirection: 'ascending',
        },
        {
          key: 'identifier',
          label: '',
          fn(value) {
            return new Spacebars.SafeString(`<a target='code' href="/data/federations/${value}" title="See code"><i class="material-icons">code</i></a>`);    
          },
        },
      ],
    };
  },
});

Template.opentrackFederations.events({});
