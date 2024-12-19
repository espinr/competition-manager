import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Categories } from '../../../api/categories/categories';
import moment from 'moment';
import './categories.html';


Template.categoriesMain.onCreated(function () {
  const template = Template.instance();
  template.loading = new ReactiveVar(true);
  template.autorun(() => {
    const handler = template.subscribe('categories.all');
    //const handlerFederations = template.subscribe('federations.all');
    //if (handler.ready() && handlerFederations.ready()) {
    if (handler.ready()) {
      template.loading.set(false);
      $('document').ready(function() {
      });
    }
  });
});

Template.categoriesMain.helpers({
  loading() {
    return Template.instance().loading.get();
  },
  categories() {
    return Categories.find({ identifier: { $ne: 'OVERALL' } }, { sort: { requiredMinAge: 1, requiredMaxAge: 1, description: 1 } });
  },
  settings() {
    return {
      fields: [
        {
          key: 'global',
          label: 'Global?',
          sortOrder: 1,
          cellClass: 'center',
          sortDirection: 'ascending',
          fn(value) {
            return value ? 'Y' : '';
          },
        },
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
          label: 'Description',
          cellClass: 'truncate description',
          sortable: false,
        },
        {
          key: 'requiredGender',
          label: 'Gender',
          sortOrder: 1,
          sortDirection: 'ascending',
        },
        {
          key: 'requiredMinAge',
          label: '>=',
          sortable: false,
        },
        {
          key: 'requiredMaxAge',
          label: '<=',
          sortable: false,
        },
        {
          key: 'recognizingAuthorityCode',
          label: 'Authority',
          sortOrder: 1,
          sortDirection: 'ascending',
        },
        {
          key: 'referenceDate',
          label: 'Birth Date',
          sortOrder: 2,
          sortDirection: 'ascending',
          fn(value) {
            if (!value) return '';
            return new Spacebars.SafeString(moment(value, '--MMDD').format('DD/MM'));
          },
        },
        {
          key: 'identifier',
          label: '',
          sortable: false,
          fn(value) {
            return new Spacebars.SafeString(`<a href="${FlowRouter.path('admin.categories.edit', { categoryIdentifier: value })}" title="Edit category"><i class="material-icons">edit</i></a>`);
          },
        },
      ],
    };
  },
});

Template.categoriesMain.events({});
