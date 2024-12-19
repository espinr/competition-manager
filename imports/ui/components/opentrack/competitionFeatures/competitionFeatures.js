import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { CompetitionFeatures } from '../../../../api/competitionFeatures/competitionFeatures';

import './competitionFeatures.html';

Template.opentrackCompetitionFeatures.onCreated(function () {
  const template = Template.instance();
  template.loading = new ReactiveVar(true);

  template.autorun(() => {
    const handler = template.subscribe('competitionFeatures.all');
    if (handler.ready()) {
      template.loading.set(false);
      $('document').ready(function() {});
    }
  });
});

Template.opentrackCompetitionFeatures.helpers({
  loading() {
    return Template.instance().loading.get();
  },
  competitionFeatures() {
    return CompetitionFeatures.find();
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
          key: 'description',
          label: 'description',
          sortOrder: 1,
        },
      ],
    };
  },
});

Template.opentrackCompetitionFeatures.events({});
