import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { AutoForm } from 'meteor/aldeed:autoform';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Clubs } from '../../../../../api/clubs/clubs';
import Common from '../../../../../../both/lib/common';

import './new.html';

AutoForm.hooks({
  newClubForm: {
    beginSubmit() {
    },
    formToDoc(doc) {
      const docToInsert = doc;
      const today = new Date();
      docToInsert.createdAt = today;
      docToInsert.logo = this.template.data.currentFlag.toString();
      return docToInsert;
    },
    onSubmit(insertDocum) {
      const doc = insertDocum;
      Meteor.call('clubs.insert', doc, (err, result) => {
        if (err) {
          // Duplicate Alternate Name
          const validationContext = Clubs.simpleSchema().namedContext('newClubForm');
          validationContext.addValidationErrors([{ name: 'alternate', type: 'notUnique' }]);
          this.done(new Error('Club insertion failed'));
        }
        if (result && result.length > 0) {
          this.done(null, result);
        }
      });
      return false;
    },
    onSuccess(formType, result) {
      FlowRouter.go('admin.clubs', {}, { raceId: result });
      Materialize.toast('New club created', 4000);
    },
    onError(formType, error) {
      console.log(error);
    },
  },
});

function removePicture() {
  $('#picture-preview').addClass('placeholder');
  $('#picture-preview').html('<i class="material-icons">photo_camera</i>');
  $('#picture-preview').css('background-image', '');
  $('input[name="picture"]').val('');
  $('input#new-picture-input').val('');
}

Template.newClub.onCreated(function () {
  const template = Template.instance();
  const handlerCountries = template.subscribe('countries.all');
  template.flagIcon = new ReactiveVar(null);
  template.baseColorIcon = new ReactiveVar('#505050');
  template.iconColor = new ReactiveVar('white');
  template.secondColorIcon = new ReactiveVar('black');
  template.typeFlag = new ReactiveVar('Plain');

  template.autorun(function () {
    if (handlerCountries.ready()) {
      $(document).ready(() => {
        $('select').material_select();
      });
    }
  });
});

Template.newClub.helpers({
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

Template.newClub.events({
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
});
