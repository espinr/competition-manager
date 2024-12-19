// Definition of the checkpoints collection
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import SimpleSchema from 'simpl-schema';
import { DistanceSchema } from '../schemas/distance';
import { MassSchema } from '../schemas/mass';
SimpleSchema.extendOptions(['autoform']);

export const Disciplines = new Mongo.Collection('disciplines');

const eventTypes = [
  { 'Race': ['Middle-Long Distance', 'Steeplechase', 'Hurdles', 'Sprint', 'Race Walking', 'Road Running', 'Cross Country', 'Mountain Running', 'Track Relays', 'Ultra Running'] },
  { 'Throws': ['Shot Put', 'Discus Throw', 'Hammer Throw', 'Javelin Throw', 'Weight Throw'] },
  { 'Horizontal Jumps': ['Long Jump', 'Triple Jump'] },
  { 'Vertical Jumps': ['High Jump', 'Pole Vault'] },
  { 'Combined Discipline': ['Pentathlon', 'Heptathlon', 'Decathlon', 'Throws Pentathlon'] },
];

const venueTypes = ['Indoor', 'Outdoor', 'Road', 'Mountain', 'Cross Country'];
const competitionTypes = ['Individual', 'Relays', 'Time Trial'];

Disciplines.attachSchema(new SimpleSchema({
  identifier: {
    type: String,
    label: 'Code',
    required: true,
    unique: true,
  },
  name: {
    type: String,
    label: 'Name',
    required: true,
  },
  alternateName: {
    type: String,
    label: 'Alternate name',
    optional: true,
  },
  description: {
    type: String,
    label: 'Description',
    optional: true,
  },
  venueType: {
    type: String,
    label: 'Type of Venue',
    allowedValues: venueTypes,
    autoform: {
      options() {
        return venueTypes.map(function(key) {
          return { label: key, value: key };
        });
      },
    },
    optional: true,
  },
  typeEvent: {
    type: String,
    label: 'Type of Event',
    autoform: {
      options() {
        return Object.keys(eventTypes).map(function(key) {
          return { label: key, value: key };
        });
      },
    },
    optional: true,
  },
  subTypeEvent: {
    type: String,
    label: 'Subtype of event',
    optional: true,
  },
  distance: {
    type: DistanceSchema,
    label: 'Distance',
    optional: true,
  },
  weight: {
    type: MassSchema,
    label: 'Weight of the throwing item',
    optional: true,
  },
  competitionType: {
    type: String,
    label: 'Type of Competition',
    defaultValue: 'Individual Race',
    autoform: {
      options: competitionTypes,
    },
    optional: true,
  },
}, { tracker: Tracker }));

Disciplines.eventTypes = eventTypes;
Disciplines.venueTypes = venueTypes;
Disciplines.competitionTypes = competitionTypes;


Disciplines.deny({
  insert: () => false,
  update: () => true,
  remove: () => true,
});

Disciplines.allow({
  insert: () => true,
  update: () => false,
  remove: () => false,
});
