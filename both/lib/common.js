/**
 * Common functions to work with from anywhere
 */

import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import moment from 'moment';
import RoleTypes from '../../imports/api/users/roles/roleTypes.js';
import { languages } from '../../stores/languages';


const nonRankingFeatures = ['DNS', 'DNF', 'DQ', 'R', 'RC'];

export default class Common {
  static raceNotStartedYet(race) {
    if (race && race.status === 'Ready') return true;
    return false;
  }
  static getYearsOldToday(birthDate) {
    const currentYear = moment(new Date());
    return currentYear.diff(moment(birthDate), 'years');
  }
  static getYearsOldOnDate(birthDate, month, day) {
    const currentYear = moment(new Date()).format('YYYY');
    const endOfCurrentYear = moment(`${currentYear}-${month}-${day}`);
    return endOfCurrentYear.diff(moment(birthDate), 'years');
  }
  static getNonRankingFeatures() {
    return nonRankingFeatures;
  }
  static getTempId(prefix) {
    return `${prefix}${Math.floor(Math.random() * 100000)}`;
  }
  static getPrettyUnit(standardUnit) {
    let toReturn = '';
    switch (standardUnit) {
      case 'KGM':
        toReturn = 'kg';
        break;
      case 'LBR':
        toReturn = 'lb';
        break;
      case 'MTR':
        toReturn = 'm';
        break;
      case 'SMI':
        toReturn = 'mile';
        break;
      default:
        break;
    }
    return toReturn;
  }
  static getLanguageOptions() {
    return languages;
  }
  static isLoggedUser() {
    return (Meteor && Meteor.user() && Meteor.user() !== null && Meteor.userId());
  }
  // to lowercase and removes spaces
  static cleanEPC(epc) {
    return epc.toUpperCase().replace(/(..) ?(..) ?(..) ?(..) ?(..) ?(..) ?(..) ?(..) ?(..) ?(..) ?(..) ?(..)/g, '$1 $2 $3 $4 $5 $6 $7 $8 $9 $10 $11 $12');
  }
  static hasSetUpProfile() {
    // Checks if the current user has configured the basic profile (at least the name in profile)
    if (Meteor && Meteor.user() && Meteor.user() !== null && Meteor.user().profile
      && Meteor.user().profile.firstName) {
      return true;
    }
    return false;
  }
  static isAdmin() {
    if (Meteor && Meteor.user() && Meteor.user() !== null && Meteor.userId()) {
      return Roles.userIsInRole(Meteor.userId(), RoleTypes.ADMIN);
    }
    return false;
  }
  static hasAnyOfUserRoles(roleArray) {
    if (Meteor && Meteor.user() && Meteor.user() !== null && Meteor.userId()) {
      return Roles.userIsInRole(Meteor.userId(), roleArray);
    }
    return false;
  }
  // Look for the competition features that indicates that they does not compute for the ranking
  static showAthleteInRanking(competitionFeaturesArray) {
    if (competitionFeaturesArray && Array.isArray(competitionFeaturesArray)) {
      for (let i = 0; i < nonRankingFeatures.length; i += 1) {
        if (competitionFeaturesArray.indexOf(nonRankingFeatures[i]) >= 0) {
          return true;
        }
      }
    }
    return false;
  }
  static getYearsOldNow(isoBirthDate) {
    const currentYear = moment(new Date());
    return currentYear.diff(moment(isoBirthDate), 'years');
  }
  static isValidJSON(jsonString) {
    try {
      JSON.parse(jsonString);
    } catch (e) {
      return false;
    }
    return true;
  }
  static getDistanceUnitAbbr(code) {
    switch (code) {
      case 'MTR':
        return 'm';
      case 'SMI':
        return 'miles';
      default:
        break;
    }
    return '';
  }
  static epcToHex(str) {
    const finalArray = [];
    // To complete to have always 8 chars [00 00 00 00]
    const numberCharsToAdd = 4 - (str.length % 4);
    for (let i = 0; i < numberCharsToAdd; i++) {
      // Pushes a '0' -> 0x30 in the front
      finalArray.push('30');
    }
    for (let i = 0; i < str.length; i += 1) {
      const hex = Number(str.charCodeAt(i)).toString(16);
      finalArray.push(hex);
    }
    return finalArray.join('');
  }
  static getIcons(iconColor) {
    return {
      triangle: `<g id="g846" transform="matrix(1.1024306,0,0,1.1024306,19.84375,6.6145828)"> <path id="path832" d="M 12,7.77 18.39,18 H 5.61 L 12,7.77 M 12,4 2,20 h 20 z" style="fill:${iconColor};"/><path id="path834" d="M 0,0 H 24 V 24 H 0 Z" style="fill:none" /></g>`,
      pet: `<g id="g1084" transform="matrix(1.1024306,0,0,1.1024306,19.84375,6.6145834)"><circle id="circle1058" style="fill:${iconColor};" r="2.5" cy="9.5" cx="4.5" /><circle id="circle1060" r="2.5" cy="5.5" cx="9" style="fill:${iconColor};"/> <circle id="circle1062" r="2.5" cy="5.5" cx="15" style="fill:${iconColor};" /><circle id="circle1064" r="2.5" cy="9.5" cx="19.5" style="fill:${iconColor};"/><path id="path1066" d="M 17.34,14.86 C 16.47,13.84 15.74,12.97 14.86,11.95 14.4,11.41 13.81,10.87 13.11,10.63 13,10.59 12.89,10.56 12.78,10.54 12.53,10.5 12.26,10.5 12,10.5 c -0.26,0 -0.53,0 -0.79,0.05 -0.11,0.02 -0.22,0.05 -0.33,0.09 -0.7,0.24 -1.28,0.78 -1.75,1.32 -0.87,1.02 -1.6,1.89 -2.48,2.91 -1.31,1.31 -2.92,2.76 -2.62,4.79 0.29,1.02 1.02,2.03 2.33,2.32 0.73,0.15 3.06,-0.44 5.54,-0.44 h 0.18 c 2.48,0 4.81,0.58 5.54,0.44 1.31,-0.29 2.04,-1.31 2.33,-2.32 0.31,-2.04 -1.3,-3.49 -2.61,-4.8 z" style="fill:${iconColor};"/><path id="path1068" d="M 0,0 H 24 V 24 H 0 Z" style="fill:none" /></g>`,
      world: `<g id="g1100" transform="matrix(1.1024306,0,0,1.1024306,19.84375,6.6145834)"><path id="path1086" d="M 0,0 H 24 V 24 H 0 Z" style="fill:none" /><path id="path1088" d="M 11.99,2 C 6.47,2 2,6.48 2,12 2,17.52 6.47,22 11.99,22 17.52,22 22,17.52 22,12 22,6.48 17.52,2 11.99,2 Z m 6.93,6 H 15.97 C 15.65,6.75 15.19,5.55 14.59,4.44 16.43,5.07 17.96,6.35 18.92,8 Z M 12,4.04 c 0.83,1.2 1.48,2.53 1.91,3.96 H 10.09 C 10.52,6.57 11.17,5.24 12,4.04 Z M 4.26,14 C 4.1,13.36 4,12.69 4,12 4,11.31 4.1,10.64 4.26,10 h 3.38 c -0.08,0.66 -0.14,1.32 -0.14,2 0,0.68 0.06,1.34 0.14,2 z m 0.82,2 h 2.95 c 0.32,1.25 0.78,2.45 1.38,3.56 C 7.57,18.93 6.04,17.66 5.08,16 Z M 8.03,8 H 5.08 C 6.04,6.34 7.57,5.07 9.41,4.44 8.81,5.55 8.35,6.75 8.03,8 Z M 12,19.96 C 11.17,18.76 10.52,17.43 10.09,16 h 3.82 C 13.48,17.43 12.83,18.76 12,19.96 Z M 14.34,14 H 9.66 C 9.57,13.34 9.5,12.68 9.5,12 c 0,-0.68 0.07,-1.35 0.16,-2 h 4.68 c 0.09,0.65 0.16,1.32 0.16,2 0,0.68 -0.07,1.34 -0.16,2 z m 0.25,5.56 c 0.6,-1.11 1.06,-2.31 1.38,-3.56 h 2.95 c -0.96,1.65 -2.49,2.93 -4.33,3.56 z M 16.36,14 c 0.08,-0.66 0.14,-1.32 0.14,-2 0,-0.68 -0.06,-1.34 -0.14,-2 h 3.38 c 0.16,0.64 0.26,1.31 0.26,2 0,0.69 -0.1,1.36 -0.26,2 z" style="fill:${iconColor};"/></g>`,
      thumb: `<g id="g1056" transform="matrix(1.1024306,0,0,1.1024306,19.84375,6.6145834)"><path id="path1043" d="M 0,0 H 24 V 24 H 0 Z" style="fill:none" /> <path id="path1045" d="M 1,21 H 5 V 9 H 1 Z M 23,10 C 23,8.9 22.1,8 21,8 H 14.69 L 15.64,3.43 15.67,3.11 C 15.67,2.7 15.5,2.32 15.23,2.05 L 14.17,1 7.59,7.59 C 7.22,7.95 7,8.45 7,9 v 10 c 0,1.1 0.9,2 2,2 h 9 c 0.83,0 1.54,-0.5 1.84,-1.22 l 3.02,-7.05 C 22.95,12.5 23,12.26 23,12 Z" style="fill:${iconColor};"/></g>`,
      star: `<g id="g1041" transform="matrix(1.1024306,0,0,1.1024306,19.84375,6.6145834)"><path id="path1027" d="M 0,0 H 24 V 24 H 0 Z" style="fill:none" /><path id="path1029" d="M 11.99,2 C 6.47,2 2,6.48 2,12 2,17.52 6.47,22 11.99,22 17.52,22 22,17.52 22,12 22,6.48 17.52,2 11.99,2 Z M 16.23,18 12,15.45 7.77,18 8.89,13.19 5.16,9.96 10.08,9.54 12,5 l 1.92,4.53 4.92,0.42 -3.73,3.23 z" style="fill:${iconColor};"/></g>`,
      circle: ` <g id="g1009" transform="matrix(1.1024306,0,0,1.1024306,19.84375,6.6145834)"><circle id="circle995" r="10" cy="12" cx="12" style="fill:${iconColor};" /> <path id="path997" d="M 0,0 H 24 V 24 H 0 Z" style="fill:none" />
    </g>`,
      swim: `<g transform="matrix(1.1024306,0,0,1.1024306,19.84375,6.6145834)"><path id="path848" d="M 22,21 C 20.89,21 20.27,20.63 19.82,20.36 19.45,20.14 19.22,20 18.67,20 18.11,20 17.89,20.13 17.52,20.36 17.06,20.63 16.45,21 15.34,21 14.23,21 13.61,20.63 13.16,20.36 12.79,20.14 12.56,20 12.01,20 11.45,20 11.23,20.13 10.86,20.36 10.4,20.63 9.78,21 8.67,21 7.56,21 6.94,20.63 6.49,20.36 6.12,20.13 5.89,20 5.34,20 4.79,20 4.56,20.13 4.19,20.36 3.73,20.63 3.11,21 2,21 V 19 C 2.56,19 2.78,18.87 3.15,18.64 3.61,18.37 4.23,18 5.34,18 6.45,18 7.07,18.37 7.52,18.64 7.89,18.87 8.11,19 8.67,19 9.23,19 9.45,18.87 9.82,18.64 10.28,18.37 10.9,18 12.01,18 c 1.11,0 1.73,0.37 2.18,0.64 0.37,0.22 0.6,0.36 1.15,0.36 0.55,0 0.78,-0.13 1.15,-0.36 0.45,-0.27 1.07,-0.64 2.18,-0.64 1.11,0 1.73,0.37 2.18,0.64 C 21.22,18.87 21.44,19 22,19 Z m 0,-4.5 c -1.11,0 -1.73,-0.37 -2.18,-0.64 -0.37,-0.22 -0.6,-0.36 -1.15,-0.36 -0.56,0 -0.78,0.13 -1.15,0.36 -0.45,0.27 -1.07,0.64 -2.18,0.64 -1.11,0 -1.73,-0.37 -2.18,-0.64 -0.37,-0.22 -0.6,-0.36 -1.15,-0.36 -0.56,0 -0.78,0.13 -1.15,0.36 C 10.41,16.13 9.79,16.5 8.68,16.5 7.57,16.5 6.95,16.13 6.5,15.86 6.13,15.64 5.9,15.5 5.35,15.5 4.8,15.5 4.57,15.63 4.2,15.86 3.73,16.13 3.11,16.5 2,16.5 v -2 c 0.56,0 0.78,-0.13 1.15,-0.36 0.45,-0.27 1.07,-0.64 2.18,-0.64 1.11,0 1.73,0.37 2.18,0.64 0.37,0.22 0.6,0.36 1.15,0.36 0.56,0 0.78,-0.13 1.15,-0.36 0.45,-0.27 1.07,-0.64 2.18,-0.64 1.11,0 1.73,0.37 2.18,0.64 0.37,0.22 0.6,0.36 1.15,0.36 0.55,0 0.78,-0.13 1.15,-0.36 0.45,-0.27 1.07,-0.64 2.18,-0.64 1.11,0 1.73,0.37 2.18,0.64 0.37,0.22 0.6,0.36 1.15,0.36 v 2 z M 8.67,12 C 9.23,12 9.45,11.87 9.82,11.64 10.28,11.37 10.9,11 12.01,11 c 1.11,0 1.73,0.37 2.18,0.64 0.37,0.22 0.6,0.36 1.15,0.36 0.55,0 0.78,-0.13 1.15,-0.36 0.12,-0.07 0.26,-0.15 0.41,-0.23 L 10.48,5 C 8.93,3.45 7.5,2.99 5,3 V 5.5 C 6.82,5.49 7.89,5.89 9,7 l 1,1 -3.25,3.25 c 0.31,0.12 0.56,0.27 0.77,0.39 C 7.89,11.87 8.11,12 8.67,12 Z" style="fill:${iconColor};"/><circle id="circle850" r="2.5" cy="5.5" cx="16.5" style="fill:${iconColor};"/><path id="path852" d="M 0,0 H 24 V 24 H 0 Z" style="fill:none" /></g>`,
      bike: `<g transform="matrix(1.1024306,0,0,1.1024306,19.84375,6.6145834)"><path id="path867" d="M 0,0 H 24 V 24 H 0 Z" style="fill:none" /><path id="path869" d="m 15.5,5.5 c 1.1,0 2,-0.9 2,-2 0,-1.1 -0.9,-2 -2,-2 -1.1,0 -2,0.9 -2,2 0,1.1 0.9,2 2,2 z M 5,12 c -2.8,0 -5,2.2 -5,5 0,2.8 2.2,5 5,5 2.8,0 5,-2.2 5,-5 0,-2.8 -2.2,-5 -5,-5 z m 0,8.5 c -1.9,0 -3.5,-1.6 -3.5,-3.5 0,-1.9 1.6,-3.5 3.5,-3.5 1.9,0 3.5,1.6 3.5,3.5 0,1.9 -1.6,3.5 -3.5,3.5 z m 5.8,-10 2.4,-2.4 0.8,0.8 c 1.3,1.3 3,2.1 5.1,2.1 V 9 C 17.6,9 16.4,8.4 15.5,7.5 L 13.6,5.6 C 13.1,5.2 12.6,5 12,5 11.4,5 10.9,5.2 10.6,5.6 L 7.8,8.4 C 7.4,8.8 7.2,9.3 7.2,9.8 c 0,0.6 0.2,1.1 0.6,1.4 L 11,14 v 5 h 2 V 12.8 Z M 19,12 c -2.8,0 -5,2.2 -5,5 0,2.8 2.2,5 5,5 2.8,0 5,-2.2 5,-5 0,-2.8 -2.2,-5 -5,-5 z m 0,8.5 c -1.9,0 -3.5,-1.6 -3.5,-3.5 0,-1.9 1.6,-3.5 3.5,-3.5 1.9,0 3.5,1.6 3.5,3.5 0,1.9 -1.6,3.5 -3.5,3.5 z" style="fill:${iconColor};"/></g>`,
      run: `<g transform="matrix(1.1024306,0,0,1.1024306,19.84375,6.6145834)"><path id="path883" d="M 0,0 H 24 V 24 H 0 Z" style="fill:none" /><path id="path885" d="m 13.49,5.48 c 1.1,0 2,-0.9 2,-2 0,-1.1 -0.9,-2 -2,-2 -1.1,0 -2,0.9 -2,2 0,1.1 0.9,2 2,2 z m -3.6,13.9 1,-4.4 2.1,2 v 6 h 2 v -7.5 l -2.1,-2 0.6,-3 c 1.3,1.5 3.3,2.5 5.5,2.5 v -2 c -1.9,0 -3.5,-1 -4.3,-2.4 l -1,-1.6 c -0.4,-0.6 -1,-1 -1.7,-1 -0.3,0 -0.5,0.1 -0.8,0.1 l -5.2,2.2 v 4.7 h 2 v -3.4 l 1.8,-0.7 -1.6,8.1 -4.9,-1 -0.4,2 z" style="fill:${iconColor};"/></g>`,
      mountain: `<g transform="matrix(1.1024306,0,0,1.1024306,19.84375,6.6145834)"><path id="path947" d="M 0,0 H 24 V 24 H 0 Z" style="fill:none" /><path id="path949" d="m 14,6 -3.75,5 2.85,3.8 -1.6,1.2 C 9.81,13.75 7,10 7,10 l -6,8 h 22 z" style="fill:${iconColor};"/></g>`,
      fitness: `<g transform="matrix(1.1024306,0,0,1.1024306,19.84375,6.6145834)"><path id="path899" d="M 0,0 H 24 V 24 H 0 Z" style="fill:none" /><path id="path901" d="M 20.57,14.86 22,13.43 20.57,12 17,15.57 8.43,7 12,3.43 10.57,2 9.14,3.43 7.71,2 5.57,4.14 4.14,2.71 2.71,4.14 4.14,5.57 2,7.71 3.43,9.14 2,10.57 3.43,12 7,8.43 15.57,17 12,20.57 13.43,22 l 1.43,-1.43 1.43,1.43 2.14,-2.14 1.43,1.43 1.43,-1.43 -1.43,-1.43 2.14,-2.14 z" style="fill:${iconColor};"/></g>`,
      tree: `<g transform="matrix(1.1024306,0,0,1.1024306,19.84375,6.6145834)"><path id="path915" d="M 0,0 H 24 V 24 H 0 Z" style="fill:none" />
      <path id="path917" d="m 13,16.12 c 3.47,-0.41 6.17,-3.36 6.17,-6.95 0,-3.87 -3.13,-7 -7,-7 -3.87,0 -7,3.13 -7,7 0,3.47 2.52,6.34 5.83,6.89 V 20 H 5 v 2 h 14 v -2 h -6 z" style="fill:${iconColor};" /></g>`,
      cross: `<g transform="matrix(1.1024306,0,0,1.1024306,19.84375,6.6145834)"><path id="path877" d="M 19,6.41 17.59,5 12,10.59 6.41,5 5,6.41 10.59,12 5,17.59 6.41,19 12,13.41 17.59,19 19,17.59 13.41,12 Z" style="fill:${iconColor};"/><path id="path879" d="M 0,0 H 24 V 24 H 0 Z" style="fill:none" /></g>`,
      thunder: `<g transform="matrix(1.1024306,0,0,1.1024306,19.84375,6.6145828)"><path d="M 0,0 H 24 V 24 H 0 Z" style="fill: none;" /><path d="m 7,2 v 11 h 3 v 9 l 7,-12 h -4 l 4,-8 z" style="fill:${iconColor};"/></g>`,
    };
  }
  static generateSvgFlag(baseColor, horizontalColor, verticalColor, iconKey, iconColor) {
    let iconSvg = '';
    if (iconKey) {
      const icons = Common.getIcons(iconColor);
      iconSvg = icons[iconKey];
    }
    return `<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="250" height="150" viewBox="0 0 66.145832 39.687502" version="1.1"><g transform="translate(0,-257.31249)" style="display:inline"><rect style="opacity:1.0;fill:${baseColor};fill-opacity:1;stroke:none;stroke-width:1;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" width="66.145836" height="39.6875" x="0" y="257.31046" /></g><g style="display:inline"><rect style="opacity:1.0;fill:${horizontalColor};fill-opacity:1;stroke:none;stroke-width:1;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" width="66.145836" height="19.84375" x="0" y="19.841717" /></g>
    <g style="display:inline"><rect style="opacity:1.0;fill:${verticalColor};fill-opacity:1;stroke:none;stroke-width:1;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" width="33.072918" height="39.6875" x="33.072918" y="-0.0020346777" /></g><g>${iconSvg}</g></svg>`;
  }
  static getImagePrinting() {
    return 'data:image/png;base64,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';
  }
  static buildJSONCheckin(checkpointId, bib, timestamp) {
    if (!checkpointId || !bib || !timestamp) return null;
    return {
      checkpoint: { id: checkpointId },
      timestamp,
      bib,
    };
  }
  static unixTimeNow() {
    return Math.floor(Date.now() / 1000);
  }
}
