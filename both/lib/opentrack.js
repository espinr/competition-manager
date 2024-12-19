/**
 * Common functions to work with OpenTrack
 */

import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import moment from 'moment';
import { Countries } from '../../imports/api/countries/countries';
import RoleTypes from '../../imports/api/users/roles/roleTypes.js';
import { Categories } from '../../imports/api/categories/categories';
import { TeamCategories } from '../../imports/api/teamCategories/teamCategories';
import { Clubs } from '../../imports/api/clubs/clubs';
import { ResultLists } from '../../imports/api/resultLists/resultLists';
import { ResultEntries } from '../../imports/api/resultEntries/resultEntries';
import { Competitors } from '../../imports/api/competitors/competitors';

export default class OpenTrack {
  static getContext() {
    return 'http://w3c.github.io/opentrack-cg/contexts/opentrack.jsonld';
  }
  static getBase() {
    return Meteor.settings.openTrackBaseUri;
  }
  static locationToOpentrack(loc) {
    const location = { '@type': 'schema:Place' };
    if (loc.name) { location['schema:name'] = loc.name; }
    if (loc.address) {
      location.address = { '@type': 'schema:PostalAddress' };
      if (loc.address.streetAddress) { location.address['schema:streetAddress'] = loc.address.streetAddress; }
      if (loc.address.addressLocality) { location.address['schema:addressLocality'] = loc.address.addressLocality; }
      if (loc.address.postalCode) { location.address['schema:postalCode'] = loc.address.postalCode; }
      if (loc.address.addressRegion) { location.address['schema:addressRegion'] = loc.address.addressRegion; }
      if (loc.address.addressCountry) {
        const country = Countries.findOne({ $or: [{ 'codes.ioc': loc.address.addressCountry }, { 'codes.iso': loc.address.addressCountry }] });
        if (country) { location.address['schema:addressCountry'] = OpenTrack.countryToOpentrack(country); }
        else { location.address['schema:addressCountry'] = loc.address.addressCountry; }
      }
    }
    return location;
  }
  static getISODateTime(date, time) {
    if (!date) return null;
    if (time) {
      const timeToAdd = moment(time, 'hh:mmA');
      return moment(date).hours(timeToAdd.hours()).minutes(timeToAdd.minutes()).seconds(timeToAdd.seconds());
    }
    return moment(date)
      .hours(0)
      .minutes(0)
      .seconds(0)
      .milliseconds(0);
  }
  static raceToOpentrack(race) {
    const opentrack = {
      '@context': OpenTrack.getContext(),
      '@type': 'ath:SportsCompetitionEvent',
      '@id': OpenTrack.uriCompetitionToOpentrack(race._id),
    };
    if (race.identifier) { opentrack['schema:identifier'] = race.identifier; }
    if (race.name) { opentrack['schema:name'] = race.name; }
    if (race.alternate) { opentrack['schema:alternateName'] = race.alternate; }
    if (race.description) { opentrack['schema:description'] = race.description; }
    if (race.url) { opentrack['schema:url'] = race.url; }
    if (race.image) { opentrack['schema:image'] = race.image; }
    if (race.startDate) { opentrack['schema:startDate'] = OpenTrack.getISODateTime(race.startDate, race.startTime); }
    if (race.identifier) { opentrack['schema:identifier'] = race.identifier; }
    if (race.location) { opentrack['schema:location'] = OpenTrack.locationToOpentrack(race.location); }
    if (race.competitionType) {
      let discipline = { '@type': 'ath:RaceDiscipline' };
      if (race.external) {
        discipline = { '@type': 'ath:AthleticsDiscipline' }; // Generic
      }
      switch (race.competitionType) {
        case 'Relay Race':
          discipline['ath:raceCompetitionType'] = 'race:RelayCompetition';
          break;
        case 'Time Trial':
          discipline['ath:raceCompetitionType'] = 'race:TimeTrialCompetition';
          break;
        default:
          discipline['ath:raceCompetitionType'] = 'race:IndividualCompetition';
          break;
      }
      if (race.distance) { discipline['schema:distance'] = OpenTrack.quantityToOpentrack(race.distance); }
      opentrack['ath:sportsDiscipline'] = discipline;
    }
    if (race.categories && Array.isArray(race.categories)) {
      const categories = [];
      for (let i = 0; i < race.categories.length; i += 1) {
        const cat = Categories.findOne({ _id: race.categories[i] });
        if (cat && cat.identifier !== 'OVERALL') {
          categories.push(OpenTrack.categoryToOpentrack(cat));
        }
      }
      for (let i = 0; race.teamCategories && i < race.teamCategories.length; i += 1) {
        const cat = TeamCategories.findOne({ _id: race.teamCategories[i] });
        if (cat && cat.identifier !== 'OVERALL') {
          categories.push(OpenTrack.categoryToOpentrack(cat));
        }
      }
      opentrack['ath:competitionCategory'] = categories;
    }
    if (race.competitionType === 'Relay Race') {
      opentrack['ath:resultDecision'] = { '@id': OpenTrack.uriRelayResultListToOpentrack(race._id) };
    } else {
      opentrack['ath:resultDecision'] = { '@id': OpenTrack.uriResultListToOpentrack(race._id) };
    }
    // Starters for this race
    const starters = Competitors.find({ idRace: race._id }).map(function(starter) {
      return { '@id': OpenTrack.uriAthleteToOpentrack(starter.idUser) };
    });
    opentrack['schema:competitor'] = starters;
    // Competitors for this race
    const competitors = Competitors.find({ idRace: race._id }).map(function(competitor) {
      return { '@id': OpenTrack.uriAthleteToOpentrack(competitor.idUser), 'ath:bibIdentifier': competitor.bib };
    });
    opentrack['ath:competitionAction'] = competitors;
    return opentrack;
  }
  static uriCountryToOpentrack(country) {
    return `${OpenTrack.getBase()}/countries/${country.codes.iso}`;
  }
  static uriCompetitionToOpentrack(raceId) {
    return `${OpenTrack.getBase()}/competitions/${raceId}`;
  }
  static uriCompetitorToOpentrack(competitorId) {
    return `${OpenTrack.getBase()}/competitor/${competitorId}`;
  }
  static uriClubToOpentrack(clubId) {
    return `${OpenTrack.getBase()}/clubs/${clubId}`;
  }
  static uriAthleteToOpentrack(athleteId) {
    return `${OpenTrack.getBase()}/athletes/${athleteId}`;
  }
  static uriTeamToOpentrack(teamId) {
    return `${OpenTrack.getBase()}/teams/${teamId}`;
  }
  static uriCategoryToOpentrack(categoryId) {
    return `${OpenTrack.getBase()}/categories/${categoryId}`;
  }
  static uriFederationToOpentrack(orgCode) {
    return `${OpenTrack.getBase()}/federations/${orgCode}`;
  }
  static uriDisciplineToOpentrack(disciplineIdentifier) {
    return `${OpenTrack.getBase()}/disciplines/${disciplineIdentifier}`;
  }
  static uriResultListToOpentrack(raceId) {
    return `${OpenTrack.getBase()}/races/${raceId}/results`;
  }
  static uriRelayResultListToOpentrack(raceId) {
    return `${OpenTrack.getBase()}/races/${raceId}/relay-results`;
  }
  static countryToOpentrack(country) {
    const opentrack = {
      '@context': OpenTrack.getContext(),
      '@type': 'schema:Country',
      '@id': OpenTrack.uriCountryToOpentrack(country),
    };
    if (country.name) { opentrack['schema:name'] = country.name; }
    if (country.imageUrl) { opentrack['schema:image'] = country.imageUrl; }
    if (country.codes && country.codes.iso) { opentrack['schema:identifier'] = country.codes.iso; }
    if (country.codes && country.codes.ioc) { opentrack['schema:alternateName'] = country.codes.ioc; }
    return opentrack;
  }
  static categoryToOpentrack(cat) {
    const opentrack = {
      '@context': OpenTrack.getContext(),
      '@type': 'ath:CompetitiveAudience',
      '@id': OpenTrack.uriCategoryToOpentrack(cat.identifier),
    };
    if (cat.name) { opentrack['schema:name'] = cat.name; }
    if (cat.identifier) { opentrack['schema:identifier'] = cat.identifier; }
    if (cat.description) { opentrack['schema:description'] = cat.description; }
    if (cat.requiredGender) { opentrack['schema:requiredGender'] = cat.requiredGender; }
    if (cat.requiredMinAge) { opentrack['schema:requiredMinAge'] = cat.requiredMinAge; }
    if (cat.requiredMaxAge) { opentrack['schema:requiredMaxAge'] = cat.requiredMaxAge; }
    if (cat.recognizingAuthorityCode) {
      opentrack['schema:recognizingAuthority'] = { '@id': OpenTrack.uriFederationToOpentrack(cat.recognizingAuthorityCode) };
    }
    return opentrack;
  }
  static disciplineToOpentrack(discipline) {
    let type = '';
    // Event type
    if (discipline.typeEvent) {
      switch (discipline.typeEvent) {
        case 'Race':
          type = 'ath:RaceDiscipline';
          break;
        case 'Throws':
          type = 'ath:ThrowsDiscipline';
          break;
        case 'Horizontal Jumps':
          type = 'ath:HorizontalJumpsDiscipline';
          break;
        case 'Vertical Jumps':
          type = 'ath:VerticalJumpsDiscipline';
          break;
        case 'Combined Discipline':
          type = 'ath:CombinedDiscipline';
          break;
        default:
          type = 'ath:AthleticsDiscipline';
      }
    }
    if (discipline.subTypeEvent) {
      switch (discipline.subTypeEvent) {
        case 'Middle-Long Distance':
          type = 'ath:DistanceDiscipline';
          break;
        case 'Steeplechase':
          type = 'ath:SteeplechaseDiscipline';
          break;
        case 'Hurdles':
          type = 'ath:HurdlesDiscipline';
          break;
        case 'Sprint':
          type = 'ath:SprintsDiscipline';
          break;
        case 'Race Walking':
          type = 'ath:RaceWalkingDiscipline';
          break;
        case 'Road Running':
          type = 'ath:RoadRunningDiscipline';
          break;
        case 'Cross Country':
          type = 'ath:CrossCountryDiscipline';
          break;
        case 'Mountain Running':
          type = 'ath:MountainRunningDiscipline';
          break;
        case 'Track Relays':
          type = 'ath:TrackRelaysDiscipline';
          break;
        case 'Ultra Running':
          type = 'ath:UltraRunningDiscipline';
          break;
        case 'Race':
          type = 'ath:RaceDiscipline';
          break;
        case 'Shot Put':
          type = 'ath:ShotPutDiscipline';
          break;
        case 'Discus Throw':
          type = 'ath:DiscusThrowDiscipline';
          break;
        case 'Hammer Throw':
          type = 'ath:HammerThrowDiscipline';
          break;
        case 'Javelin Throw':
          type = 'ath:JavelinThrowDiscipline';
          break;
        case 'Weight Throw':
          type = 'ath:WeightThrowDiscipline';
          break;
        case 'Long Jump':
          type = 'ath:LongJumpDiscipline';
          break;
        case 'Triple Jump':
          type = 'ath:TripleJumpDiscipline';
          break;
        case 'High Jump':
          type = 'ath:HighJumpDiscipline';
          break;
        case 'Pole Vault':
          type = 'ath:PoleVaultDiscipline';
          break;
        default:
          break;
      }
    }
    const opentrack = {
      '@context': OpenTrack.getContext(),
      '@type': type,
      '@id': OpenTrack.uriDisciplineToOpentrack(discipline.identifier),
    };
    if (discipline.name) { opentrack['schema:name'] = discipline.name; }
    if (discipline.identifier) { opentrack['schema:identifier'] = discipline.identifier; }
    if (discipline.alternateName) { opentrack['schema:alternateName'] = discipline.alternateName; }
    if (discipline.description) { opentrack['schema:description'] = discipline.description; }
    let venue;
    if (discipline.venueType) {
      switch (discipline.venueType) {
        case 'Indoor':
          venue = 'ath:AthleticsVenueIndoor';
          break;
        case 'Outdoor':
          venue = 'ath:AthleticsVenueOutdoor';
          break;
        case 'Road':
          venue = 'ath:AthleticsVenueRoad';
          break;
        case 'Mountain':
          venue = 'ath:AthleticsVenueMountain';
          break;
        case 'Cross Country':
          venue = 'ath:AthleticsVenueCrossCountry';
          break;
        default:
          break;
      }
      if (venue) { opentrack['ath:venueType'] = venue; }
    }
    let competitionType;
    if (discipline.competitionType) {
      switch (discipline.competitionType) {
        case 'Individual':
          competitionType = 'ath:IndividualCompetition';
          break;
        case 'Relays':
          competitionType = 'ath:RelayCompetition';
          break;
        case 'Time Trial':
          competitionType = 'ath:TimeTrialCompetition';
          break;
        default:
          break;
      }
      if (competitionType) { opentrack['ath:raceCompetitionType'] = competitionType; }
    }
    if (discipline.weight && (typeof discipline.weight === 'object')) { opentrack['schema:weight'] = OpenTrack.quantityToOpentrack(discipline.weight); }
    if (discipline.distance && (typeof discipline.distance === 'object')) { opentrack['schema:distance'] = OpenTrack.quantityToOpentrack(discipline.distance); }
    return opentrack;
  }
  static quantityToOpentrack(q) {
    const opentrack = {
      '@type': 'schema:QuantitativeValue',
    };
    if (q.value) { opentrack['schema:value'] = q.value; }
    if (q.unit) { opentrack['schema:unitCode'] = q.unit; }
    return opentrack;
  }
  static secondsToISO(seconds) {
    const thisDuration = moment.duration(seconds, 'seconds');
    const hours = String(thisDuration.hours()).padStart(2, '0');
    const mins = String(thisDuration.minutes()).padStart(2, '0');
    const secs = String(thisDuration.seconds()).padStart(2, '0');
    return `${hours}:${mins}:${secs}`;
  }
  static timePerformanceToOpentrack(timeSeconds) {
    const opentrack = {
      '@type': 'ath:TimePerformance',
      time: OpenTrack.secondsToISO(timeSeconds),
    };
    return opentrack;
  }
  static clubToOpentrack(club) {
    const opentrack = {
      '@context': OpenTrack.getContext(),
      '@type': 'schema:SportsClub',
      '@id': OpenTrack.uriClubToOpentrack(club.identifier),
    };
    if (club.identifier) { opentrack['schema:alternateName'] = club.identifier; }
    if (club.name) { opentrack['schema:name'] = club.name; }
    if (club.url) { opentrack['schema:url'] = club.url; }
    if (club.location) { opentrack['schema:location'] = OpenTrack.locationToOpentrack(club.location); }
    if (club.alternate) { opentrack['schema:alternateName'] = club.alternate; }
    if (club.memberOf && Array.isArray(club.memberOf)) {
      opentrack['schema:memberOf'] = club.memberOf.map((code) => {
        return { '@id': OpenTrack.uriFederationToOpentrack(code) };
      });
    }
    return opentrack;
  }
  static federationToOpentrack(organization) {
    const opentrack = {
      '@context': OpenTrack.getContext(),
      '@type': 'ath:SportsGoverningBody',
      '@id': OpenTrack.uriFederationToOpentrack(organization.identifier),
    };
    if (organization.name && organization.localName && organization.localLanguage) {
      opentrack['schema:name'] = [
        { '@value': organization.name, '@language': 'en' },
        { '@value': organization.localName, '@language': organization.localLanguage },
      ];
    } else if (organization.name) { opentrack['schema:name'] = organization.name; }
    if (organization.identifier) { opentrack['schema:identifier'] = organization.identifier; }
    if (organization.url) { opentrack['schema:url'] = organization.url; }
    if (organization.location) { opentrack['schema:location'] = OpenTrack.locationToOpentrack(organization.location); }
    if (organization.alternate) { opentrack['schema:alternateName'] = organization.alternate; }
    if (organization.memberOf && Array.isArray(organization.memberOf)) {
      opentrack['schema:memberOf'] = organization.memberOf.map((code) => {
        return { '@id': OpenTrack.uriFederationToOpentrack(code) };
      });
    }
    return opentrack;
  }
  static athleteToOpentrack(athlete) {
    const opentrack = {
      '@context': OpenTrack.getContext(),
      '@type': 'schema:Athlete',
      '@id': OpenTrack.uriAthleteToOpentrack(athlete._id),
    };
    if (athlete.profile.identifier) { opentrack['schema:identifier'] = athlete.profile.identifier; }
    if (athlete.profile.firstName) { opentrack['schema:firstName'] = athlete.profile.firstName; }
    if (athlete.profile.lastName) { opentrack['schema:lastName'] = athlete.profile.lastName; }
    if (athlete.profile.name) { opentrack['schema:name'] = athlete.profile.name; }
    if (athlete.profile.url) { opentrack['schema:url'] = athlete.profile.url; }
    if (athlete.profile.countryId) {
      const country = Countries.findOne(athlete.profile.countryId);
      //if (country) { opentrack['schema:nationality'] = OpenTrack.countryToOpentrack(country); }
      if (country) { opentrack['schema:nationality'] = OpenTrack.uriCountryToOpentrack(country); }
    }
    if (athlete.profile.clubId) {
      const club = Clubs.findOne(athlete.profile.clubId);
      if (club) { opentrack['schema:memberOf'] = OpenTrack.uriClubToOpentrack(club.identifier); }
    }
    if (athlete.profile.gender) { opentrack['schema:gender'] = athlete.profile.gender; }
    if (athlete.profile.birthDate) { opentrack['schema:birthDate'] = moment(athlete.profile.birthDate).format('YYYY-MM-DD'); }
    return opentrack;
  }
  static getTypeEntity(json) {
    if (json['@context'] && json['@context'] === this.getContext()) {
      //console.log(json);
      if (json['@type']) {
        if (json['@type'] === 'Athlete' || json['@type'] === 'ath:Athlete') { return 'Athlete'; }
        if (json['@type'] === 'Club' || json['@type'] === 'ath:Club') { return 'Club'; }
        if (json['@type'] === 'SportsEvent' || json['@type'] === 'ath:SportsEvent') { return 'SportsEvent'; }
      }
    }
    console.log('Cannot find the context or the context is not what I expected');
    return null;
  }
  static resultEntryRelaysToOpentrack(relayEntry) {
    const opentrack = {
      '@context': OpenTrack.getContext(),
      '@type': 'ath:CompetitionResult',
      '@id': OpenTrack.uriRelayResultListToOpentrack(relayEntry.raceId),
      'ath:inCompetition': OpenTrack.uriCompetitionToOpentrack(relayEntry.raceId),
    };
    if (relayEntry.calculatedRank) { opentrack['ath:rank'] = relayEntry.calculatedRank; }
    if (relayEntry.latestPerformance) { opentrack['ath:performance'] = OpenTrack.timePerformanceToOpentrack(relayEntry.latestPerformance); }
    if (relayEntry.lapsCompleted) { opentrack['ath:laps'] = relayEntry.lapsCompleted; }
    if (relayEntry.splits && relayEntry.splits.length > 0) {
      opentrack['ath:lapSplits'] = relayEntry.splits.map(function(split) {
        return OpenTrack.timePerformanceToOpentrack(split.performance);
      });
    }
    const competitorTeam = {
      '@id': OpenTrack.uriTeamToOpentrack(relayEntry._id),
      identifier: relayEntry._id,
      '@type': 'schema:SportsTeam',
    };
    if (relayEntry.teamName) { competitorTeam['schema:name'] = relayEntry.teamName; }
    if (relayEntry.bibs) { competitorTeam['ath:bibIdentifier'] = relayEntry.bibs; }
    if (relayEntry.teamLogo) { competitorTeam['schema:logo'] = relayEntry.teamLogo; }
    if (relayEntry.country) { competitorTeam['schema:location'] = { '@id': OpenTrack.uriCountryToOpentrack(relayEntry.country) }; }
    if (relayEntry.teamAlternate) { competitorTeam['schema:alternate'] = relayEntry.teamAlternate; }
    opentrack['schema:agent'] = competitorTeam;
    return opentrack;
  }
  static resultEntryToOpentrack(resultEntry) {
    const opentrack = {
      '@context': OpenTrack.getContext(),
      '@type': 'ath:CompetitionResult',
    };
    if (resultEntry.competitionFeatures) { opentrack['ath:competitionFeature'] = resultEntry.competitionFeatures; }
    if (resultEntry.protestStatus) { opentrack['ath:protestStatus'] = resultEntry.protestStatus; }
    if (resultEntry.competitorId) {
      opentrack['ath:competitor'] = { '@id': OpenTrack.uriCompetitorToOpentrack(resultEntry.competitorId) };
    }
    if (resultEntry.latestRank) {
      if (resultEntry.rankCorrection) {
        opentrack['ath:rank'] = resultEntry.rankCorrection;
      } else {
        opentrack['ath:rank'] = resultEntry.latestRank;
      }
    }
    if (resultEntry.splits && resultEntry.splits.length > 0) {
      opentrack['ath:performance'] = resultEntry.splits[resultEntry.splits.length - 1].performance;
    }
    return opentrack;
  }
  static resultListToOpentrack(resultList) {
    const opentrack = {
      '@context': OpenTrack.getContext(),
      '@type': 'ath:ResultList',
      '@id': OpenTrack.uriResultListToOpentrack(resultList.raceId),
    };
    if (resultList.modifiedAt) { opentrack['schema:dateModified'] = resultList.modifiedAt; }
    if (resultList.createdAt) { opentrack['schema:dateCreated'] = resultList.createdAt; }
    if (resultList.checkpointId) { opentrack['schema:name'] = `Results at ${resultList.checkpointId}`; }
    if (resultList.status) { opentrack['schema:status'] = resultList.status; }
    if (resultList.categoryId && resultList.categoryId !== undefined) {
      opentrack['ath:category'] = { '@id': OpenTrack.uriCategoryToOpentrack(resultList.categoryId) };
    }
    if (resultList.entryIds) {
      opentrack['ath:entrieschangeme'] = resultList.entryIds.map(function(resultEntryId) {
        return OpenTrack.resultEntryToOpentrack(ResultEntries.findOne(resultEntryId));
      });
      opentrack['ath:category'] = { '@id': OpenTrack.uriCategoryToOpentrack(resultList.categoryId) };
    }
    return opentrack;
  }
}

