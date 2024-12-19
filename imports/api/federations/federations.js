// Definition of the federations collection
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { Countries } from '../countries/countries';
import { PostalAddressSchema } from '../schemas/postalAddress';

import SimpleSchema from 'simpl-schema';
import Common from '../../../both/lib/common';
SimpleSchema.extendOptions(['autoform']);

export const Federations = new Mongo.Collection('federations');

Federations.attachSchema(new SimpleSchema({
  identifier: {
    type: String,
    label: 'Federation ID',
    unique: true,
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
  logo: {
    type: String,
    label: 'Logo',
    optional: true,
  },
  alternate: {
    type: String,
    label: 'Abbreviation',
    unique: true,
    min: 3,
    max: 5,
    optional: true,
  },
  location: {
    type: Object,
    label: 'Location (Starting point)',
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
  memberOf: {
    type: Array,
    label: 'Member Of (Code of Federation)',
    optional: true,
  },
  'memberOf.$': {
    type: String,
    label: 'Federation',
    optional: true,
  },
  areaServed: {
    type: String,
    label: 'Area served',
    optional: true,
  },
  telephone: {
    type: String,
    label: 'Phone',
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
        return Countries.find().map(function(entity) {
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

Federations.deny({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

Federations.allow({
  insert: () => true,
  update: () => true,
  remove: () => true,
});
