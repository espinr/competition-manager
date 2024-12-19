// Methods related to checkpoints

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Identifiers } from './identifiers';
import OpenTrack from '../../../both/lib/opentrack';
import Common from '../../../both/lib/common';

Meteor.methods({
  'identifiers.createBatch'(raceId, size) {
    check(raceId, String);
    check(size, Number);
    const idsArray = [];
    for (let i = 0; i < size; i += 1) {
      const epc = Common.epcToHex(String(i + 1));
      // HEX value of the bib
      idsArray.push(Identifiers.insert({
        raceId,
        bib: `${i + 1}`,
        epcs: new Array(epc),
        assigned: false,
      }));
    }
    return idsArray;
  },
  'identifiers.createBatchFromTo'(raceId, from, to) {
    check(raceId, String);
    check(from, Number);
    check(to, Number);
    if (from >= to) return null;
    const idsArray = [];
    for (let i = from; i < to + 1; i += 1) {
      const epc = Common.epcToHex(String(i + 1));
      // HEX value of the bib
      idsArray.push(Identifiers.insert({
        raceId,
        bib: `${i + 1}`,
        epcs: new Array(epc),
        assigned: false,
      }));
    }
    return idsArray;
  },
});

