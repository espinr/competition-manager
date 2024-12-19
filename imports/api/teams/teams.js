// Definition of the checkpoints collection
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { Countries } from '../countries/countries';
import { PostalAddressSchema } from '../schemas/postalAddress';

import SimpleSchema from 'simpl-schema';
SimpleSchema.extendOptions(['autoform']);

export const Teams = new Mongo.Collection('teams');

Teams.attachSchema(new SimpleSchema({
  name: {
    type: String,
    label: 'Name',
    required: true,
  },
  raceId: {
    type: String,
    label: 'Race ID',
    required: true,
  },
  competitorIds: {
    type: Array,
    label: 'Individual competitors IDs',
    required: true,
    autoform: {
      type: 'select-multiple',
    },
  },
  'competitorIds.$': {
    type: String,
    label: 'Competitor ID',
    optional: true,
  },
  logo: {
    type: String,
    label: 'Picture',
    optional: true,
    defaultValue: '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="250" height="150" viewBox="0 0 66.145832 39.687502" version="1.1"><g id="base" transform="translate(0,-257.31249)" style="display:inline"><rect style="opacity:1.0;fill:#cddc39;fill-opacity:1;stroke:none;stroke-width:1;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" width="66.145836" height="39.6875" x="0" y="257.31046"></rect></g></svg>',
  },
  alternate: {
    type: String,
    label: 'Abbreviation',
    min: 3,
    max: 4,
    optional: true,
  },
  location: {
    type: Object,
    label: 'Location',
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
  teamCategories: {
    type: Array,
    label: 'Categories',
    optional: true,
  },
  'teamCategories.$': {
    type: String,
    label: 'Team Category ID',
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

Teams.deny({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

Teams.allow({
  insert: () => true,
  update: () => true,
  remove: () => true,
});
