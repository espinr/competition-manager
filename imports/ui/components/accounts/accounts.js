import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import moment from 'moment';
import Common from '../../../../both/lib/common';

import './accounts.html';

Template.adminAccounts.onCreated(function () {
  const template = Template.instance();
  template.loading = new ReactiveVar(true);

  template.autorun(() => {
    const handler = template.subscribe('users.search', '.');
    const handlerCountries = template.subscribe('countries.all');
    if (handler.ready() && handlerCountries.ready()) {
      template.loading.set(false);
      $('document').ready(function() {
        $('select').material_select();
      });    
    }
  });
});

Template.adminAccounts.helpers({
  loading() {
    return Template.instance().loading.get();
  },
  users() {
    return Meteor.users.find();
  },
  settings() {
    return {
      fields: [
        {
          key: 'profile.name',
          label: 'Name',
          sortOrder: 1,
          sortDirection: 'ascending',
        },
        {
          key: 'profile.birthDate',
          label: 'Edad',
          sortOrder: 3,
          sortDirection: 'ascending',
          fn(value) {
            if (!value) return '';
            return Common.getYearsOldToday(value);
          },
        },
        {
          key: 'emails',
          label: 'Email',
          sortOrder: 1,
          sortDirection: 'ascending',
          fn(value, object) {
            if (value && value.length > 0 && value[0].address) {
              return new Spacebars.SafeString(`<a class="truncate" style="max-width:15rem" href="mailto:${value[0].address}">${value[0].address}</a>`)
            }
            if (object.profile && object.profile.contactEmail) {
              return new Spacebars.SafeString(`<a class="truncate" style="max-width:15rem" href="mailto:${object.profile.contactEmail}">${object.profile.contactEmail}</a>`);
            }
            return '';
          },
        },
        {
          key: 'profile.clubName',
          label: 'Club',
          sortOrder: 1,
          sortDirection: 'ascending',
        },
        {
          key: '_id',
          label: '',
          fn(value) {
            return new Spacebars.SafeString(`<a href="${FlowRouter.path('admin.editProfileAdmin', { userId: value })}" title="Edit user"><i class="material-icons">edit</i></a>`);
          },
        },
      ],
    };
  },
});

Template.adminAccounts.events({
  'submit .search-filter>form'(event, template) {
    event.preventDefault();
  },
});
