import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Categories } from '../../../../api/categories/categories';
import './categories.html';

Template.opentrackCategories.onCreated(function () {
  const template = Template.instance();
  template.loading = new ReactiveVar(true);
  template.autorun(() => {
    const handler = template.subscribe('categories.all');
    const handlerFederations = template.subscribe('federations.all');
    if (handler.ready() && handlerFederations.ready()) {
      template.loading.set(false);
      $('document').ready(function() {
      });
    }
  });
});

Template.opentrackCategories.helpers({
  loading() {
    return Template.instance().loading.get();
  },
  categories() {
    return Categories.find({ identifier: { $ne: 'OVERALL' }, global: true }, { sort: { requiredMinAge: 1, requiredMaxAge: 1, description: 1 } });
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
          label: 'Description',
          cellClass: 'truncate',
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
          key: 'identifier',
          label: '',
          sortable: false,
          fn(value) {
            return new Spacebars.SafeString(`<a target='code' href="/data/categories/${value}" title="See code"><i class="material-icons">code</i></a>`);
          },
        },
      ],
    };
  },
});

Template.opentrackCategories.events({});
