import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { AutoForm } from 'meteor/aldeed:autoform';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Teams } from '../../../../../api/teams/teams';
import Common from '../../../../../../both/lib/common';
import { StartingListEntries } from '../../../../../api/client/startingListEntries/startingListEntries';
import { TeamCategories } from '../../../../../api/teamCategories/teamCategories';
import './new.html';

AutoForm.hooks({
  newTeamForm: {
    beginSubmit() {
    },
    formToDoc(doc) {
      const docToInsert = doc;
      const today = new Date();
      docToInsert.createdAt = today;
      docToInsert.logo = this.template.data.currentFlag.toString();
      docToInsert.raceId = docToInsert.raceId ? docToInsert.raceId : FlowRouter.getParam('raceId');
      return docToInsert;
    },
    onSubmit(insertDocum) {
      const doc = insertDocum;
      Meteor.call('teams.insert', doc, (err, result) => {
        if (err) {
          this.done(new Error('Team insertion failed'));
        }
        if (result && result.length > 0) {
          this.done(null, result);
        }
      });
      return false;
    },
    onSuccess(formType, result) {
      FlowRouter.go('admin.teams', { raceId: FlowRouter.getParam('raceId') });
      Materialize.toast('New team created', 4000);
    },
    onError(formType, error) {
      console.log(error);
    },
  },
});


Template.newTeam.onCreated(function () {
  const raceId = FlowRouter.getParam('raceId');
  if (!raceId) {
    console.log('No raceId received!');
    return;
  }
  const template = Template.instance();
  template.raceId = new ReactiveVar(raceId);

  const handlerCountries = template.subscribe('countries.all');
  const handlerCompetitors = template.subscribe('competitors.startingList', raceId);
  const handlerTeams = template.subscribe('teams.raceId', raceId);
  const handlerCats = template.subscribe('teamCategories.race', raceId);
  template.flagIcon = new ReactiveVar(null);
  template.baseColorIcon = new ReactiveVar('#505050');
  template.iconColor = new ReactiveVar('white');
  template.secondColorIcon = new ReactiveVar('black');
  template.typeFlag = new ReactiveVar('Plain');

  template.autorun(function () {
    if (handlerCountries.ready() && handlerCompetitors.ready() && handlerTeams.ready() && handlerCats.ready()) {
      $(document).ready(() => {
        $('select').material_select();
      });
    }
  });
});

Template.newTeam.helpers({
  currentFlag() {
    const template = Template.instance();
    const iconColor = template.iconColor.get();
    let verticalColor = template.secondColorIcon.get();
    let horizontalColor = template.secondColorIcon.get();
    const baseColor = template.baseColorIcon.get();
    const iconKey = Template.instance().flagIcon.get();
    switch (Template.instance().typeFlag.get()) {
      case 'Plain':
        verticalColor = 'transparent';
        horizontalColor = 'transparent';
        break;
      case 'Vertical':
        horizontalColor = 'transparent';
        break;
      case 'Horizontal':
        verticalColor = 'transparent';
        break;
      default:
        break;
    }
    const svgFlag = Common.generateSvgFlag(baseColor, horizontalColor, verticalColor, iconKey, iconColor);
    return new Spacebars.SafeString(svgFlag);
  },
  teamsCollection() {
    return Teams;
  },
  categoryOptions() {
    return TeamCategories.find({
      identifier: { $ne: 'OVERALL' },
    }).map(function (cat) {
      return {
        label: (cat.recognizingAuthorityCode ? `[${cat.recognizingAuthorityCode}] ` : '') + cat.name,
        value: cat._id,
      };
    });
  },
  optionsLogoLayout() {
    const icons = Common.getIcons('black');
    const arrayImages = [];
    const iconKeys = Object.keys(icons);
    for (let i = 0; i < iconKeys.length; i += 1) {
      const key = iconKeys[i];
      const svg = Common.generateSvgFlag('transparent', 'transparent', 'transparent', key, 'black');
      arrayImages.push({
        id: key,
        svg: new Spacebars.SafeString(`data:image/svg+xml;base64,${window.btoa(svg)}`),
      });
    }
    return arrayImages;
  },
  optionsFlagTypes () {
    return [
      { id: 'Plain', src: '/img/flags/flag_plain.png', selected: 'selected' },
      { id: 'Horizontal', src: '/img/flags/flag_horizontal.png' },
      { id: 'Vertical', src: '/img/flags/flag_vertical.png' },
      { id: 'Square', src: '/img/flags/flag_square.png' },
    ];
  },
  competitorOptions() {
    // Only those who are not already listed in the team
    // Finds all competitors already included in teams
    let competitorIdsIncluded = [];
    const registeredTeams = Teams.find().fetch();
    for (let i = 0; i < registeredTeams.length; i += 1) {
      competitorIdsIncluded = competitorIdsIncluded.concat(registeredTeams[i].competitorIds);
    }
    const options = StartingListEntries.find(
      { competitorId: { $nin: competitorIdsIncluded } },
      { sort: { athleteClub: -1 } }).map(function(entry) {
      const nameClub = entry.athleteClub ? ` (${entry.athleteClub.toUpperCase()})` : '';
      return {
        value: entry.competitorId,
        label: `#${entry.bib} ${entry.athleteLastName.toUpperCase()}, ${entry.athleteFirstName.toUpperCase()}${nameClub}`,
      };
    });
    Meteor.setTimeout(function() {
      $('select[name="competitorIds"]').material_select();
    }, 1000);
    return options;
  },
});

Template.newTeam.events({
  'change #iconSelector'(event) {
    Template.instance().flagIcon.set($('#iconSelector').val());
  },
  'input #baseColor'(event) {
    Template.instance().baseColorIcon.set($('#baseColor').val());
  },
  'input #secondColor'(event) {
    Template.instance().secondColorIcon.set($('#secondColor').val());
  },
  'input #iconColor'(event) {
    Template.instance().iconColor.set($('#iconColor').val());
  },
  'change select[id="flagTypeSelector"]'(event) {
    Template.instance().typeFlag.set($('#flagTypeSelector').val());
  },
  'click div[data-schema-key="teamCategories"]>p'(event) {
    event.preventDefault();
    event.stopPropagation();
    const checkbox = $(event.currentTarget).find('input[name="teamCategories"]');
    checkbox.prop('checked', !checkbox.prop('checked'));
  },
});
