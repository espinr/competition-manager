import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { AutoForm } from 'meteor/aldeed:autoform';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Teams } from '../../../../../api/teams/teams';
import Common from '../../../../../../both/lib/common';
import { StartingListEntries } from '../../../../../api/client/startingListEntries/startingListEntries';
import { TeamCategories } from '../../../../../api/teamCategories/teamCategories';

import './edit.html';


AutoForm.hooks({
  editTeamForm: {
    before: {
      update(docUpdate) {
        const doc = docUpdate;
        // Assigns the category by default
        doc.$set.logo = this.template.data.currentFlag.toString();
        if (doc.$unset) {
          delete doc.$unset.logo;
          delete doc.$unset.teamCategories;
        }
        return doc;
      },
    },
    formToDoc(doc) {
      const docToUpdate = doc;
      return docToUpdate;
    },
    after: {
      update(error, result) {
        if (error) {
          if (error.reason) {
            console.log(error.reason);
          }
        } else if (result) {
          FlowRouter.go('admin.teams', { raceId: this.currentDoc.raceId });
          Materialize.toast('The team was successfully updated', 4000);
        }
      },
    },
  },
});


Template.editTeam.onCreated(function () {
  const teamId = FlowRouter.getParam('teamId');
  const raceId = FlowRouter.getParam('raceId');
  if (!teamId && !raceId) {
    console.log('No teamId or raceId received!');
    return;
  }
  const template = Template.instance();

  const handlerCountries = template.subscribe('countries.all');
  const handlerTeams = template.subscribe('teams.raceId', raceId);
  const handlerCompetitors = template.subscribe('competitors.startingList', raceId);
  const handlerCats = template.subscribe('teamCategories.race', raceId);

  template.flagIcon = new ReactiveVar(null);
  template.baseColorIcon = new ReactiveVar('#505050');
  template.iconColor = new ReactiveVar('white');
  template.secondColorIcon = new ReactiveVar('black');
  template.typeFlag = new ReactiveVar('Plain');
  template.originalFlag = new ReactiveVar(true);
  template.currentTeam = new ReactiveVar(null);

  template.autorun(function () {
    if (handlerCountries.ready() && handlerTeams.ready() && handlerCats.ready() && handlerCompetitors.ready()) {
      const currentTeam = Teams.findOne(teamId);
      template.currentTeam.set(currentTeam);
      $(document).ready(() => {
        $('select').material_select();
        $('#modalConfirmDeleteTeam').modal({
          dismissible: true,
          opacity: 0.5,
          startingTop: '40%',
          ready(modal, trigger) {
            $('#modalConfirmDeleteTeam .modal-ok').bind('click', (event) => {
              console.log('deleting team');
              $('#modalConfirmDeleteTeam').modal('close');
            });
          },
        });
      });  
    }
  });
});

Template.editTeam.helpers({
  currentDocument() {
    return Template.instance().currentTeam.get();
  },
  currentFlag() {
    const template = Template.instance();
    const currentTeam = template.currentTeam.get();
    if (template.originalFlag.get() === true) {
      if (!currentTeam || !currentTeam.logo) return '';
      return new Spacebars.SafeString(currentTeam.logo);
    }
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
  categoryOptions() {
    const template = Template.instance();
    const currentTeam = template.currentTeam.get();
    if (!currentTeam) return null;
    return TeamCategories.find({
      identifier: { $ne: 'OVERALL' },
    }).map(function (cat) {
      return {
        label: (cat.recognizingAuthorityCode ? `[${cat.recognizingAuthorityCode}] ` : '') + cat.name,
        value: cat._id,
      };
    });
  },
  competitorOptions() {
    // Only those who are not already listed in the team
    // Finds all competitors already included in teams
    let competitorIdsIncluded = [];
    const currentTeam = Template.instance().currentTeam.get();
    if (!currentTeam) return [];
    const registeredTeams = Teams.find({ _id: { $ne: currentTeam._id } }).fetch();
    for (let i = 0; i < registeredTeams.length; i += 1) {
      competitorIdsIncluded = competitorIdsIncluded.concat(registeredTeams[i].competitorIds);
    }
    const options = StartingListEntries.find({
      competitorId: { $nin: competitorIdsIncluded },
    }).map(function(entry) {
      return {
        value: entry.competitorId,
        label: `(${entry.bib}) ${entry.athleteLastName}, ${entry.athleteFirstName}`,
      };
    });
    Meteor.setTimeout(function() {
      $('select[name="competitorIds"]').material_select();
    }, 1000);
    return options;
  },
});

Template.editTeam.events({
  'change #iconSelector'(event) {
    const template = Template.instance();
    template.originalFlag.set(false);
    template.flagIcon.set($('#iconSelector').val());
  },
  'input #baseColor'(event) {
    const template = Template.instance();
    template.originalFlag.set(false);
    template.baseColorIcon.set($('#baseColor').val());
  },
  'input #secondColor'(event) {
    const template = Template.instance();
    template.originalFlag.set(false);
    template.secondColorIcon.set($('#secondColor').val());
  },
  'input #iconColor'(event) {
    const template = Template.instance();
    template.originalFlag.set(false);
    template.iconColor.set($('#iconColor').val());
  },
  'change select[id="flagTypeSelector"]'(event) {
    const template = Template.instance();
    template.originalFlag.set(false);
    template.typeFlag.set($('#flagTypeSelector').val());
  },
  'click div[data-schema-key="teamCategories"]>p'(event) {
    event.preventDefault();
    event.stopPropagation();
    const checkbox = $(event.currentTarget).find('input[name="teamCategories"]');
    checkbox.prop('checked', !checkbox.prop('checked'));
  },
});
