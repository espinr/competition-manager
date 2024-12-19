import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { AutoForm } from 'meteor/aldeed:autoform';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Clubs } from '../../../../../api/clubs/clubs';
import Common from '../../../../../../both/lib/common';

import './edit.html';

AutoForm.hooks({
  editClubForm: {
    before: {
      update(docUpdate) {
        const doc = docUpdate;
        doc.$set.logo = this.template.data.currentFlag.toString();
        if (doc.$unset) {
          delete doc.$unset.logo;
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
          FlowRouter.go('admin.clubs');
          Materialize.toast('The club was successfully updated', 4000);
        }
      },
    },
  },
});


Template.editClub.onCreated(function () {
  const template = Template.instance();

  const clubId = FlowRouter.getParam('clubId');
  if (!clubId) {
    console.log('No clubId received');
    return;
  }
  const handlerCountries = template.subscribe('countries.all');
  const handlerClubs = template.subscribe('clubs.id', clubId);

  template.flagIcon = new ReactiveVar(null);
  template.baseColorIcon = new ReactiveVar('#505050');
  template.iconColor = new ReactiveVar('white');
  template.secondColorIcon = new ReactiveVar('black');
  template.typeFlag = new ReactiveVar('Plain');
  template.originalFlag = new ReactiveVar(true);

  template.autorun(function () {
    if (handlerCountries.ready() && handlerClubs.ready()) {
      $(document).ready(() => {
        $('select').material_select();
      });
    }
  });
});

Template.editClub.helpers({
  currentDocument() {
    return Clubs.findOne(FlowRouter.getParam('clubId'));
  },
  currentFlag() {
    const template = Template.instance();
    if (template.originalFlag.get() === true) {
      const thisClub = Clubs.findOne(FlowRouter.getParam('clubId'));
      if (!thisClub || !thisClub.logo) return '';
      return new Spacebars.SafeString(thisClub.logo);
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
  clubsCollection() {
    return Clubs;
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
});

Template.editClub.events({
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
});
