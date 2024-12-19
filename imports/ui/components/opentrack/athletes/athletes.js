import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Athletes } from '../../../../api/users/users';
import { Clubs } from '../../../../api/clubs/clubs';
import { Countries } from '../../../../api/countries/countries';

import './athletes.html';

Template.opentrackAthletes.onCreated(function () {
  const template = Template.instance();
  template.loading = new ReactiveVar(true);

  template.autorun(() => {
    const handler = template.subscribe('athletes.public.opentrack.all');
    const handlerClubs = template.subscribe('clubs.all');
    const handlerCountries = template.subscribe('countries.all');
    if (handler.ready() && handlerCountries.ready() && handlerClubs.ready()) {
      template.loading.set(false);
      $('document').ready(function() {});
    }
  });
});

Template.opentrackAthletes.helpers({
  loading() {
    return Template.instance().loading.get();
  },
  athletes() {
    return Meteor.users.find({ username: { $ne: 'admin' } });
  },
  settings() {
    return {
      fields: [
        {
          key: 'profile.image',
          label: 'Photo',
          sortable: false,
          fn(value) {
            if (value) {
              return new Spacebars.SafeString(`<img src="${value}" alt="" class="circle responsive-img">`);
            }
            return new Spacebars.SafeString('<i class="material-icons">person</i>');
          },
        },
        {
          key: 'profile.firstName',
          label: 'First Name',
          sortOrder: 1,
          sortDirection: 'ascending',
        },
        {
          key: 'profile.lastName',
          label: 'Last Name',
          sortOrder: 1,
          sortDirection: 'ascending',
        },
        {
          key: 'profile.countryId',
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
            return new Spacebars.SafeString(`<a target='code' href="/data/athletes/${value}" title="See code"><i class="material-icons">code</i></a>`);    
          },
        },
      ],
    };
  },
});

Template.opentrackAthletes.events({});
