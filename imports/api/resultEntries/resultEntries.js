// Definition of the checkpoints collection
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import Common from '../../../both/lib/common.js';
import RoleTypes from '../users/roles/roleTypes.js';

import SimpleSchema from 'simpl-schema';
SimpleSchema.extendOptions(['autoform']);

export const ResultEntries = new Mongo.Collection('resultEntries');

const competitionFeatureOptions = [
  { value: 'DNS', label: 'DNS (Did Not Start)' },
  { value: 'DNF', label: 'DNF (Did Not Finish)' },
  { value: 'DQ', label: 'DQ (Disqualified)' },
  { value: 'R', label: 'R (Retired from competition)' },
  { value: 'Q', label: 'Q (Qualified by place (track) or standard (field))' },
  { value: 'q', label: 'q (Qualified by performance (time in timed events and rank in field events))' },
  { value: 'qR', label: 'qR (Advanced to next round by Referee)' },
  { value: 'qJ', label: 'qJ (Advanced to next round by Jury of Appeal)' },
  { value: '>', label: '> (Bent knee (Race walking))' },
  { value: '~', label: '~ (Loss of contact (Race walking))' },
  { value: 'yC', label: 'yC (yellow Card)' },
  { value: 'yRC', label: 'yRC (Second yellow Card)' },
  { value: 'RC', label: 'RC (Red Card)' },
  { value: 'Fn', label: 'Fn (False Start)' },
  { value: 'o', label: 'o (Clearance (valid trial in Height Events))' },
  { value: '-', label: '- (Pass (passed trial in field events))' },
  { value: 'x', label: 'x (Failure (failed trial in field events))' },
  { value: 'NM', label: 'NM (No Mark)' },
  { value: 'NH', label: 'NH (No Height)' },
  { value: 'h', label: 'h (Hand-timing)' },
  { value: 'a', label: 'a (Automatic timing with no hundredths of a second measured)' },
  { value: 'A', label: 'A (Performance achieved at altitude)' },
  { value: 'OT', label: 'OT (Oversized Track)' },
];

const protestStatusOptions = [
  { value: 'CLS Closed', label: 'CLS Closed' },
  { value: 'OPN Open', label: 'OPN Open' },
  { value: 'PND Pending', label: 'PND Pending' },
  { value: 'ROPN Re Open', label: 'ROPN Re Open' },
];

ResultEntries.attachSchema(new SimpleSchema({
/*  resultListId: {
    type: String,
    label: 'Result List ID',
    required: true,
  },
*/
  competitorId: {
    type: String,
    label: 'Competitor ID',
    required: true,
  },
  latestRank: {
    type: Number,
    label: 'Aux Rank (the one of the last lap)',
    min: 0,
    optional: true,
  },
  competitionFeatures: {
    type: Array,
    label: 'Competition Features',
    optional: true,
  },
  'competitionFeatures.$': {
    type: String,
    label: 'Competition Feature',
    optional: true,
    autoform: {
      options: competitionFeatureOptions,
    },
  },
  protestStatus: {
    type: String,
    label: 'Protest Status',
    optional: true,
    autoform: {
      options: protestStatusOptions,
    },
  },
  splits: {
    type: Array,
    label: 'Splits',
    required: true,
  },
  'splits.$': {
    type: Object,
    optional: true,
  },
  'splits.$.performance': {
    type: Number,
    label: 'Performance (seconds)',
    min: 0,
    optional: true,
  },
  'splits.$.checkinId': {
    type: String,
    label: 'ID of the checkin that generated this split',
    optional: true,
  },
  rankCorrection: {
    type: Number,
    label: 'Rank Correction (caution!)',
    min: 0,
    optional: true,
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

ResultEntries.deny({
  insert: () => true,
  update: (userId, doc) => {
    // Only can update the admin 
    if (Common.hasAnyOfUserRoles([RoleTypes.ADMIN])) {
      return false;
    }
    return true;
  },
  remove: () => true,
});

ResultEntries.allow({
  insert: () => false,
  update: (userId, doc) => {
    // Only can update: gestor, admin or the same user
    if (Common.hasAnyOfUserRoles([RoleTypes.ADMIN])) {
      return true;
    }
    return false;
  },
  remove: () => false,
});
