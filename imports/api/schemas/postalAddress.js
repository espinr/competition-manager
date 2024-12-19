import { Tracker } from 'meteor/tracker';
import SimpleSchema from 'simpl-schema';
import { Countries } from '../countries/countries';

export const PostalAddressSchema = new SimpleSchema({
  streetAddress: {
    type: String,
    optional: true,
    label: 'Street address',
  },
  addressLocality: {
    type: String,
    optional: true,
    label: 'Locality',
  },
  postalCode: {
    type: String,
    optional: true,
    label: 'Postal Code',
  },
  addressRegion: {
    type: String,
    optional: true,
    label: 'Region, province',
  },
  addressCountry: {
    type: String,
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
  }},
  {
    clean: {
      filter: true,
      autoConvert: true,
      removeEmptyStrings: true,
      trimStrings: true,
    },
    tracker: Tracker,
  },
);
