// Definition of the checkpoints collection
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import SimpleSchema from 'simpl-schema';
import { Countries } from '../countries/countries';
import { PostalAddressSchema } from '../schemas/postalAddress';
import Common from '../../../both/lib/common';


SimpleSchema.extendOptions(['autoform']);

export const Clubs = new Mongo.Collection('clubs');

Clubs.attachSchema(new SimpleSchema({
  identifier: {
    type: String,
    label: 'Club ID',
    unique: true,
    autoValue() {
      const counter = `${Clubs.find().count() + 1}`;
      if (this.isInsert) {
        return `ESP${counter.padStart(6, '0')}`;
      } else if (this.isUpsert) {
        return { $setOnInsert: `ESP${counter.padStart(6, '0')}` };
      }
      this.unset(); // Prevent user from supplying their own value
      return undefined;
    },
    required: true,
  },
  name: {
    type: String,
    label: 'Name',
    required: true,
  },
  localName: {
    type: String,
    label: 'Name (local language)',
    optional: true,
  },
  localLanguage: {
    type: String,
    label: 'Local language',
    optional: true,
    autoform: {
      options: Common.getLanguageOptions(),
    },
  },
  url: {
    type: SimpleSchema.RegEx.Url,
    label: 'URL',
    optional: true,
  },
  email: {
    type: SimpleSchema.RegEx.Email,
    label: 'Email',
    optional: true,
  },
  logo: {
    type: String,
    label: 'Picture',
    optional: true,
    defaultValue: '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="250" height="150" viewBox="0 0 66.145832 39.687502" version="1.1"><g id="base" transform="translate(0,-257.31249)" style="display:inline"><rect style="opacity:1.0;fill:#ff005c;fill-opacity:1;stroke:none;stroke-width:1;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" width="66.145836" height="39.6875" x="0" y="257.31046"></rect></g></svg>',
  },
  alternate: {
    type: String,
    label: 'Abbreviation',
    unique: true,
    min: 3,
    max: 10,
    optional: true,
  },
  location: {
    type: Object,
    label: 'Location (Starting point)',
    optional: true,
  },
  memberOf: {
    type: Array,
    label: 'Member Of',
    optional: true,
  },
  'memberOf.$': {
    type: String,
    label: 'Federation Identifier',
    optional: true,
  },
  'location.name': {
    type: String,
    label: 'Place name',
    optional: true,
  },
  'location.address': {
    type: PostalAddressSchema,
    optional: true,
  },
  createdAt: {
    type: Date,
    autoform: {
      type: 'hidden',
    },
    autoValue() {
      if (this.isInsert) {
        return new Date();
      } else if (this.isUpsert) {
        return { $setOnInsert: new Date() };
      }
      this.unset(); // Prevent user from supplying their own value
      return undefined;
    },
  },
  countryId: {
    type: String,
    label: 'Country',
    optional: true,
    autoform: {
      options() {
        return Countries.find({}, { sort: { name: 1 } }).map(function(entity) {
          return {
            label: entity.name,
            value: entity._id,
          };
        });
      },
    },
  },
},
{
  clean: {
    filter: true,
    autoConvert: true,
    removeEmptyStrings: true,
    trimStrings: true,
  },
  tracker: Tracker,
},
));

Clubs.deny({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

Clubs.allow({
  insert: () => true,
  update: () => true,
  remove: () => true,
});
