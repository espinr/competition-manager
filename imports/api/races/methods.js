// Methods related to checkpoints

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { HTTP } from 'meteor/http';
import { Races } from './races.js';
import { ResultLists } from '../resultLists/resultLists';
import { Competitors } from '../competitors/competitors.js';
import { ResultEntries } from '../resultEntries/resultEntries.js';
import OpenTrack from '../../../both/lib/opentrack.js';
import { Countries } from '../countries/countries.js';

Meteor.methods({
  'races.insert'(doc) {
    check(doc, Object);
    // Generates a set of identifiers
    const raceId = Races.insert(doc);
    if (!doc.external) {
      Meteor.call('identifiers.createBatch', raceId, doc.maxCompetitors);
    }
    return raceId;
  },
  'races.delete'(idRace) {
    check(idRace, String);
    return Races.update(
      { _id: idRace },
      { $set: { deleted: true } },
    );
  },
  'race.geocode'(idRace) {
    check(idRace, String);
    let addressToSearch = '';
    const race = Races.findOne(idRace);
    if (!race) return false;
    if (race && race.location && race.location.address && race.location.address.addressLocality) {
      addressToSearch += race.location.address.addressLocality;
      if (race.countryId) {
        const country = Countries.findOne(race.countryId);
        if (country) {
          addressToSearch += `,${country.name}`;
        }
      } else if (race.location.address.addressCountry) {
        addressToSearch += `,${race.location.address.addressCountry}`;
      }
      try {
        HTTP.call('GET', 'http://open.mapquestapi.com/geocoding/v1/address', {
          params: {
            key: Meteor.settings.mapquest_geocoding_api,
            location: addressToSearch,
          },
        }, (error, result) => {
          try {
            const { lat } = result.data.results[0].locations[0].latLng;
            const { lng } = result.data.results[0].locations[0].latLng;
            if (lat && lng) {
              Races.update({ _id: idRace }, { $set: { 'location.latitude': lat, 'location.longitude': lng } });
            }
          } catch (e) {
            console.log('I cannot geolocate the race');
          }
        });
        return true;
      } catch (e) {
        // Got a network error, timeout, or HTTP error in the 400 or 500 range.
        return false;
      }    
    }
  },
  // Updates the 'latestPingUnixTime' field with the now() time, indicating the checkpoint is ready
  'races.checkpointReady'(deviceId) {
    check(deviceId, String);
    const racesUsingDevices = Races.find({ 'checkpoints.deviceId': deviceId }).fetch();
    // Calculates the current time instead of timestamp
    const unixTimeNow = Math.floor(Date.now() / 1000);
    for (let j = 0; j < racesUsingDevices.length; j += 1) {
      const { checkpoints } = racesUsingDevices[j];
      for (let i = 0; i < checkpoints.length; i += 1) {
        if (checkpoints[i].deviceId === deviceId) {
          checkpoints[i].latestPingUnixTime = unixTimeNow;
        }
      }
      Races.update({ _id: racesUsingDevices[j]._id }, { $set: { checkpoints } }, function(error, regs) {
        if (error) {
          console.log('ERROR updating the readiness timestamp of the checkpoint');
        } else {
          console.log(`Checkpoint ${deviceId} ready`);
        }
      });
    }
  },

  // Updates the status to Running and the start time with the current time
  'races.startRace'(idRace) {
    check(idRace, String);
    const unixTimeNow = Math.floor(Date.now() / 1000);

    // Creates the results, removing the previous ones if exist
    const race = Races.findOne(idRace);

    const competitorsRace = Competitors.find({ idRace }).fetch();

    const checkpointsToUpdate = [];
    for (let i = 0; i < race.checkpoints.length; i += 1) {
      const checkpoint = race.checkpoints[i];
      // Remove previous resultLists and their entries
      if (checkpoint.resultListId) {
        const resultListToDelete = ResultLists.findOne(checkpoint.resultListId);
        for (let j = 0; resultListToDelete && j < resultListToDelete.entryIds.length; j++) {
          ResultEntries.remove({ _id: resultListToDelete.entryIds[j] });
        }
        ResultLists.remove({ _id: checkpoint.resultListId });
      }
      // Creates an entry for each competitor
      const entryIds = [];
      for (let j = 0; j < competitorsRace.length; j++) {
        entryIds.push(ResultEntries.insert({
          competitorId: competitorsRace[j]._id,
          splits: [],
        }));
      }
      const newId = ResultLists.insert({
        raceId: idRace,
        checkpointId: race.checkpoints[i].deviceId,
        status: 'live',
        createdAt: new Date(),
        modifiedAt: new Date(),
        entryIds,
      });
      checkpoint.resultListId = newId;
      checkpointsToUpdate.push(checkpoint);
    }
    Races.update(
      { _id: idRace },
      {
        $set: {
          startTimestamp: unixTimeNow,
          finishTimestamp: null,
          checkpoints: checkpointsToUpdate,
          status: 'Running',
        },
      }, function(error, regs) {
        if (error) {
          console.log('ERROR updating the Running status and starting timestamp of the race');
        } else {
          console.log(`Race ${idRace} started`);
        }
    });
  },
  // Updates the status to Finished and the finish time with the current time
  'races.finishRace'(idRace) {
    check(idRace, String);
    const unixTimeNow = Math.floor(Date.now() / 1000);
    Races.update(
      { _id: idRace },
      { 
        $set: {
          finishTimestamp: unixTimeNow,
          status: 'Finished',
        },
      }, function(error, regs) {
        if (error) {
          console.log('ERROR updating the finish status and timestamp of the race');
        } else {
          console.log(`Race ${idRace} ended`);
        }        
      });
  },
});

// Definition of API
Meteor.method('api.races', function() {
  const query = { deleted: { $ne: true }, identifier: { $ne: '_bydefault_' } };
  const projection = { sort: { createdAt: -1 } };
  return Races.find(query, projection).map((race) => {
    return OpenTrack.raceToOpentrack(race);
  });
}, {
  url: '/data/competitions',
  httpMethod: 'get',
});

Meteor.method('api.races.idRace', function(raceId) {
  check(raceId, String);
  const query = { _id: raceId };
  const projection = { sort: { createdAt: -1 } };
  const race = Races.findOne(query, projection);
  return OpenTrack.raceToOpentrack(race);
}, {
  url: '/data/competitions/:raceId',
  getArgsFromRequest(request) {
    const { raceId } = request.params;
    return [raceId];
  },
  httpMethod: 'get',
});
