// Methods related to checkpoints

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Checkins } from './checkins.js';
import { ResultEntries } from '../resultEntries/resultEntries.js';

Meteor.methods({
  'checkins.insert'(doc) {
    check(doc, Object);
    return Checkins.insert(doc);
  },
  'checkins.setValid'(idCheckin, valid) {
    check(idCheckin, String);
    check(valid, Boolean);
    return Checkins.update(
      { _id: idCheckin },
      {
        $set: {
          valid: valid,
        },
      }, function(error, regs) {
        if (error) {
          console.log('ERROR seting the valid status of the checkin');
        } else {
          const marked = valid ? 'as valid' : 'as invalid';
          console.log(`Checkin ${idCheckin} marked ${marked}`);
          if (!valid) {
            // Remove the associated ResultEntry
            const resultEntry = ResultEntries.findOne({ splits: { $elemMatch: { checkinId: idCheckin } } });
            const newSplits = [];
            if (resultEntry) {
              for (let i = 0; i < resultEntry.splits.length; i += 1) {
                if (resultEntry.splits[i].checkinId !== idCheckin) {
                  newSplits.push(resultEntry.splits[i]);
                }
              }
              ResultEntries.update({ _id: resultEntry._id }, { $set: { splits: newSplits } });
              console.log(`Result Entry ${resultEntry._id} updated`);
            }
          }
        }
      },
    );
  },
});
