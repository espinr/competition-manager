import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Disciplines } from '../../../../api/disciplines/disciplines';
import './disciplines.html';
import Common from '../../../../../both/lib/common';

Template.opentrackDisciplines.onCreated(function () {
  const template = Template.instance();
  template.loading = new ReactiveVar(true);
  template.autorun(() => {
    const handler = template.subscribe('disciplines.all');
    if (handler.ready()) {
      template.loading.set(false);
      $('document').ready(function() {
        $('.tabs').tabs();
      });
    }
  });
});

Template.opentrackDisciplines.helpers({
  disciplineTypes() {
    return Disciplines.eventTypes.map(function(type, index) {
      return { index, type: Object.keys(type)[0] };
    });
  },
  loading() {
    return Template.instance().loading.get();
  },
  disciplines(type) {
    return Disciplines.find({ typeEvent: type });
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
          key: 'subTypeEvent',
          label: 'Type Event',
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
          key: 'venueType',
          label: 'Venue Type',
          cellClass: 'truncate',
          sortOrder: 1,
          sortDirection: 'ascending',
        },
        {
          key: 'identifier',
          label: 'Features',
          sortOrder: 1,
          sortDirection: 'ascending',
          fn(value, object) {
            if (object.weight && object.weight.value && object.weight.unit) {
              return new Spacebars.SafeString(`${object.weight.value} ${Common.getPrettyUnit(object.weight.unit)}`);
            } else if (object.distance && object.distance.value && object.distance.unit) {
              return new Spacebars.SafeString(`${object.distance.value} ${Common.getPrettyUnit(object.distance.unit)}`);
            }
            return '';
          },
        },
        {
          key: 'identifier',
          label: '',
          sortable: false,
          fn(value) {
            return new Spacebars.SafeString(`<a target='code' href="/data/disciplines/${value}" title="See code"><i class="material-icons">code</i></a>`);
          },
        },
      ],
    };
  },
});

Template.opentrackDisciplines.events({});
