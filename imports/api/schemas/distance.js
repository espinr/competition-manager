
// Definition of the distance schema
import { Tracker } from 'meteor/tracker';
import SimpleSchema from 'simpl-schema';

const distanceUnitsValues = [
  { label: 'Metres', value: 'MTR' },
  { label: 'Miles', value: 'SMI' },
];

export const DistanceSchema = new SimpleSchema({
  value: {
    type: Number,
    label: 'Numeric value',
    min: 0,
    required: true,
  },
  unit: {
    type: String,
    label: 'Unit',
    defaultValue: 'MTR',
    autoform: {
      options: distanceUnitsValues,
    },
    required: true,
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
