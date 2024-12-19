// Manages all the MQTT subscriptions
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';
import mqtt from 'mqtt';
import { Checkins } from '../../api/checkins/checkins';
import { ResultLists } from '../../api/resultLists/resultLists';
import { ResultEntries } from '../../api/resultEntries/resultEntries';
import RoleTypes from '../../api/users/roles/roleTypes.js';
import { Competitors } from '../../api/competitors/competitors';
import { Categories } from '../../api/categories/categories';
import { Races } from '../../api/races/races';
import moment from 'moment';
import Common from '../../../both/lib/common';


export default class MqttManager {
  static get TOPIC_READY() { return 'ready'; }
  static get TOPIC_CHECKIN() { return 'checkin'; }

  // Number of seconds to avoid registering duplicate messages
  static get SECURE_SECONDS_TO_AVOID_DUPLICATES() { return 30; }

  constructor(serverName, port) {
    this.serverName = serverName;
    this.port = port;
  }

  runSubscriptions() {
    this.client = mqtt.connect(this.serverName);
    this.client.on('connect', Meteor.bindEnvironment(() => {
      const topicsToSubscribe = [`+/${MqttManager.TOPIC_READY}`, `+/${MqttManager.TOPIC_CHECKIN}`];
      this.client.subscribe(topicsToSubscribe, function (err) {
        if (err) {
          console.log('ERROR subscribing MQTT topics:');
          console.log(err);
        } else {
          console.log(`MQTT topics subscribed: ${topicsToSubscribe}`);
        }
      });
      this.client.on('message', Meteor.bindEnvironment(MqttManager.onMessage));
    }));
  }

  static getNumberLapsOfTeam(raceId, competitorId) {
    const pipeline = [
      {
        $lookup: {
          localField: 'competitorId',
          from: 'teams',
          foreignField: 'competitorIds',
          as: 'team',
        },
      },
      { $unwind: '$team' },
      {
        $lookup: {
          localField: '_id',
          from: 'resultLists',
          foreignField: 'entryIds',
          as: 'list',
        },
      },
      {
        $lookup: {
          localField: 'competitorId',
          from: 'competitors',
          foreignField: '_id',
          as: 'competitor',
        },
      },
      { $unwind: '$list' },
      { $match: { 'list.raceId': raceId } },
      { $unwind: '$competitor' },
      { $unwind: '$splits' },
      {
        $project: {
          resultListId: '$list._id',
          splits: '$splits',
          competitor: '$competitor',
          competitionFeatures: 1,
          teamId: '$team._id',
        },
      },
      {
        $group: {
          _id: '$teamId',
          resultListId: { $addToSet: '$resultListId' },
          splits: { $push: '$splits' },
          competitors: { $push: '$competitor._id'},
          competitionFeatures: { $push: '$competitionFeatures' },
          numberCompetitors: { $sum: 1 },
          latestPerformance: { $max: '$splits.performance' },
        },
      },
      {
        $project: {
          resultListId: { $arrayElemAt: ['$resultListId', 0] },
          splits: '$splits',
          competitors: '$competitors',
          lapsCompleted: { $size: '$splits' },
          latestPerformance: '$latestPerformance',
        },
      },
      {
        $project: {
          resultListId: 1,
          competitors: '$competitors',
          teamId: 1,
          splits: '$splits',
          lapsCompleted: '$lapsCompleted',
          latestPerformance: '$latestPerformance',
        },
      },
      {
        $match: { competitors: competitorId },
      },
    ];
    //console.log(JSON.stringify(pipeline));
    const result = ResultEntries.aggregate(pipeline);
    return (result.length && result[0].lapsCompleted) ? result[0].lapsCompleted : 0;
  }

  // Process the MQTT +/ready message
  static onMessage(topic, message) {
    const regex = new RegExp('(.+)/(.+)');
    const found = topic.match(regex);
    if (!found || found.length !== 3) {
      console.log(`BAD topic received <${topic.toString()}>. Ignoring...`);
      return false;
    }
    // Checks if the JSON message received is valid
    try {
      JSON.parse(message);
    } catch (e) {
      console.log(`BAD MQTT message format: ${message.toString()}. Ignoring message...`);
      return false;
    }
    const idCheckpoint = found[1];
    const topicId = found[2];
    switch (topicId) {
      case MqttManager.TOPIC_READY:
        MqttManager.processReadyMessage(idCheckpoint, JSON.parse(message));
        break;
      case MqttManager.TOPIC_CHECKIN:
        MqttManager.processReadyMessage(idCheckpoint, JSON.parse(message));
        MqttManager.processCheckinMessage(idCheckpoint, JSON.parse(message));
        break;
      default:
        break;
    }
  }

  /*
  Process a ready message.
  Sample message: topic: '001/ready'
    {"checkpoint" : {"id" : "001"}, "timestamp" : 1535524129} //<- Timestamp is optional
  */
  static processReadyMessage(idCheckpoint, json) {
    try {
      console.log(json);
      console.log(idCheckpoint);
      if (idCheckpoint === json.checkpoint.id) {
        //const timestamp = json.timestamp;
        Meteor.call('races.checkpointReady', idCheckpoint);
      } else {
        console.log(`Ready message incoherent IDs mismatched: ${idCheckpoint} and ${json.checkpoint.id}`);  
      }
    } catch (e) {
      console.log(e);
      console.log(`Error in ready message from ${idCheckpoint}:\n${json}. It must follow the structure\n{"checkpoint" : {"id" : "001"}, "timestamp" : 1535524129}`);
    }
  }

  /*
  Search for a competitor with either that EPC or BIB id.
  If none is detected, logs the error.
  */
  static getCompetitorId(epc, bib, runningRaceIds) {
    const query = { $or: [], idRace: { $in: runningRaceIds } };
    if (bib) {
      query.$or.push({ bib: `${bib}` });
    }
    if (epc) {
      query.$or.push({ epcs: epc });
    }
    const competitor = Competitors.findOne(query);
    /*
    let competitorId;
    if (!competitor) {
      const defaultRace = Races.findOne({ identifier: '_bydefault_' });
      const defaultUser = Meteor.users.findOne({ username: '_bydefault_' });
      const defaultCategory = Categories.findOne({ identifier: 'OVERALL' });
      // Also a competitor
      competitorId = Competitors.insert({
        idUser: defaultUser._id,
        idRace: defaultRace._id,
        categories: [defaultCategory._id],
        bib: (bib ? bib : 'XXX'),
        epcs: (epc ? [epc] : ['XXX']),
        createdAt: new Date(),
      });
      console.log(`New competitor ${competitorId} created`);
    } else {
      competitorId = competitor._id;
    }
    */
    return competitor ? competitor._id : null;
  }

  /*
  Process a checkin message.
  Sample message: topic: 'RFID_IND903/checkin'
  {"checkpoint" : {"id" : "RFID_IND903"}, "timestamp" : 1536508802, "bib": "121", "epc" : "E2 00 51 79 98 18 01 38 01 50 F9 BB"}
  either 'bib' or 'epc' are required.
  */
  static processCheckinMessage(idCheckpoint, json) {
    try {
      const runningRaceIds = Races.find({ status: 'Running' }).map(function(race) { return race._id; });
      const thisEPC = json.epc ? Common.cleanEPC(json.epc) : null;
      const competitorId = MqttManager.getCompetitorId(thisEPC, json.bib ? json.bib : null, runningRaceIds);
      if (idCheckpoint === json.checkpoint.id) {
        const docToInsert = {
          checkpointId: idCheckpoint,
          competitorId,
        };
        // Avoids duplicates allowing only new entries (checkpointId + json.bib|json.epc)
        const timeout = json.timestamp - MqttManager.SECURE_SECONDS_TO_AVOID_DUPLICATES;
        const queryDuplicates = {
          $and: [
            docToInsert,
            { timestamp: { $gt: timeout } },
          ],
        };        
        const duplicates = Checkins.find(queryDuplicates).count();
        if (duplicates > 0) {
          console.log('Skip checkin. Duplicated');
          return;
        }
        if (json.bib) {
          docToInsert.bib = `${json.bib}`;
        }
        if (json.epc) {
          docToInsert.epc = thisEPC;
        }
        // Avoids also checkins of competitors who already completed all the laps
        const pipeline = [
          { $match: { checkpoints: { $elemMatch: { deviceId: idCheckpoint } }, status: 'Running' } },
          {
            $lookup: {
              localField: 'competitorId',
              from: 'competitors',
              foreignField: '_id',
              as: 'competitor',
            },
          },
          {
            $project: {
              identifier: 1,
              startTimestamp: 1,
              competitionType: 1,
              checkpoints: {
                $filter: {
                  input: '$checkpoints',
                  as: 'checkpoint',
                  cond: { $eq : ['$$checkpoint.deviceId', idCheckpoint] },
                },
              },
            },
          },
          {
            $project: {
              idRace: '_id',
              startTimestamp: 1,
              competitionType: 1,
              identifier: 1,
              checkpoint: { $arrayElemAt: ['$checkpoints', 0] },
            },
          },
          {
            $lookup: {
              localField: 'checkpoint.resultListId',
              from: 'resultLists',
              foreignField: '_id',
              as: 'resultList',
            },
          },
          { $unwind: '$resultList' },
          {
            $lookup: {
              localField: 'resultList.entryIds',
              from: 'resultEntries',
              foreignField: '_id',
              as: 'entries',
            },
          },
          {
            $project: {
              checkpoint: 1,
              idRace: '$_id',
              startTimestamp: 1,
              competitionType: 1,
              entry: {
                $filter: {
                  input: '$entries',
                  as: 'entry',
                  cond: { $eq : ['$$entry.competitorId', competitorId] },
                },
              },
            },
          },
          { $unwind: '$entry' },
        ];

        //console.log(JSON.stringify(pipeline));

        // Finds the splits of competitors
        Races.aggregate(pipeline).forEach(Meteor.bindEnvironment((element) => {
          const { entry } = element;
          const performance = parseInt(json.timestamp, 10) - parseInt(element.startTimestamp, 10);
          let lapsExceeded = false;
          // If the race is a relay competition, counts all team-mates' laps
          if (element.competitionType === 'Relay Race') {
            const laps = this.getNumberLapsOfTeam(element._id, entry.competitorId);
            lapsExceeded = laps >= element.checkpoint.laps;
          } else {
            lapsExceeded = element.entry.splits.length >= element.checkpoint.laps;
          }
          // Skips the checkins if competitor completed all laps
          if (!lapsExceeded) {
            docToInsert.timestamp = json.timestamp;
            docToInsert.competitorId = competitorId;
            docToInsert.createdAt = new Date();
            Checkins.insert(docToInsert, (err, checkinId) => {
              if (!err) {
                console.log(`Checkin at ${idCheckpoint}`);
                // Now it includes a split
                const newSplit = { performance, checkinId };
                const { splits } = entry;
                splits.push(newSplit);
                ResultEntries.update({ _id: entry._id }, { $set: { splits } });
                console.log(`New split at ${idCheckpoint}`);
              }
            });
          } else {
            console.log(`Skips the checkin at ${idCheckpoint} due to exceed of laps`);
          }
        }));
      } else {
        console.log(`Checkin message IDs mismatched: ${idCheckpoint} and ${json.checkpoint.id}`);  
      }
    } catch (e) {
      console.log(e);
      console.log(`Error in checking message from ${idCheckpoint}:\n${json}. It must follow the structure\n{"checkpoint" : {"id" : "001"}, "timestamp" : 1535524129, "bib": "121", "epc" : "0292383837292938272"}`);
    }
  }
}
