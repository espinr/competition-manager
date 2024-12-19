
// Definition of the distance schema
import { Tracker } from 'meteor/tracker';
import SimpleSchema from 'simpl-schema';

const massUnitsValues = [
  { label: 'kg', value: 'KGM' },
  { label: 'lb', value: 'LBR' },
];

export const MassSchema = new SimpleSchema({
  value: {
    type: Number,
    label: 'Numeric value',
    min: 0,
    required: true,
  },
  unit: {
    type: String,
    label: 'Unit',
    defaultValue: 'KGM',
    autoform: {
      options: massUnitsValues,
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
