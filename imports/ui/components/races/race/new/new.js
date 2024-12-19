import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { AutoForm } from 'meteor/aldeed:autoform';
import { FlowRouter } from 'meteor/kadira:flow-router';
import ImageCompressor from '@xkeshi/image-compressor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Races } from '/imports/api/races/races.js';
import { Categories } from '../../../../../api/categories/categories.js';
import { TeamCategories } from '../../../../../api/teamCategories/teamCategories';
import Common from '../../../../../../both/lib/common.js';
import '../../../categories/category/newModal/newModal';
import './new.html';


function isRelayRace() {
  const typeCompetition = $('select[name="competitionType"]').val();
  return typeCompetition && typeCompetition === 'Relay Race';
}

function hideShowCategories() {
  if (isRelayRace()) {
    // hide individual categories
    $('div.categories').hide();
    $('div.teamCategories').show();
  } else {
    $('div.categories').show();
    $('div.teamCategories').hide();
  }
}

AutoForm.hooks({
  newRaceForm: {
    beginSubmit() {
    },
    formToDoc(doc) {
      const docToInsert = doc;
      const today = new Date();
      docToInsert.createdAt = today;
      return docToInsert;
    },
    onSubmit(insertDocum) {
      const doc = insertDocum;
      // Assigns the categories by default depending on the type of race
      const catDefault = Categories.findOne({ identifier: 'OVERALL' });
      const teamCatDefault = TeamCategories.findOne({ identifier: 'OVERALL' });
      if (isRelayRace()) {
        if (doc.teamCategories && Array.isArray(doc.teamCategories)) {
          doc.teamCategories.push(teamCatDefault._id);
        } else {
          doc.teamCategories = [teamCatDefault._id];
        }
        doc.categories = [];
        doc.categories.push(catDefault._id);
      } else {
        if (doc.categories && Array.isArray(doc.categories)) {
          doc.categories.push(catDefault._id);
        } else {
          doc.categories = [catDefault._id];
        }
        doc.teamCategories = [];
      }
      doc.resultLists = [];
      Meteor.call('races.insert', doc, (err, result) => {
        if (err) {
          console.log(err);
          this.done(new Error('Race insertion failed'));
        }
        if (result && result.length > 0) {
          // Change the raceId of the category
          Meteor.call('categories.update.raceId', this.template.data.tempRaceId, result);
          this.done(null, result);
        }
      });
      return false;
    },
    onSuccess(formType, result) {
      FlowRouter.go('races.dashboard', {}, { raceId: result });
      Materialize.toast('New race created', 4000);
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

Template.newRace.onCreated(function () {
  const template = Template.instance();
  // tempId is the temporary id for this race, used to create temp categories also
  const tempRaceId = Common.getTempId('race_');
  template.tempRaceId = new ReactiveVar(tempRaceId);
  const handlerCats = template.subscribe('categories.all.raceId', tempRaceId);
  const handlerTeamCats = template.subscribe('teamCategories.all');
  const handlerCountries = template.subscribe('countries.all');
  const handlerCheckpoints = template.subscribe('checkpoints.search');


  template.autorun(function () {
    if (handlerCats.ready() && handlerTeamCats.ready() && handlerCheckpoints.ready() && handlerCats.ready() && handlerCountries.ready()) {
      $(document).ready(() => {
        hideShowCategories();
        $('select').material_select();
        $('.collapsible.expandable').collapsible({
          accordion: false,
        });
        $('.modal').modal({
          dismissible: true,
        });
      });
    }
  });
});

Template.newRace.helpers({
  categoryOptions() {
    return Categories.find({ identifier: { $ne: 'OVERALL' } }, { sort: { requiredMinAge: 1, requiredMaxAge: 1, description: 1 } }).map(function (cat) {
      return {
        label: (cat.recognizingAuthorityCode ? `[${cat.recognizingAuthorityCode}] ` : '') + cat.name,
        value: cat._id,
      };
    });
  },
  tempRaceId() {
    return Template.instance().tempRaceId.get();
  },
  teamCategoryOptions() {
    return TeamCategories.find({ identifier: { $ne: 'OVERALL' } }).map(function (cat) {
      return {
        label: cat.name,
        value: cat._id,
      };
    });
  },
  racesCollection() {
    return Races;
  },
});

function getBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/* Returns a Blob compressed */
function compressImageIntoBlob(file) {
  return new Promise((resolve, reject) => {
    const options = {
      maxWidth: 4096,
      maxHeight: 4096,
      quality: 0.8,
      convertSize: 5000000,
    };

    const imageCompressor = new ImageCompressor();
    imageCompressor.compress(file, options)
      .then((result) => { resolve(result); })
      .catch((err) => {
        alert('Error during compression of picture');
        alert(err);
        reject(err);
      });
  });
}

Template.newRace.events({
  'change select[name="competitionType"]'(event) {
    hideShowCategories();
  },
  'change input#new-picture-input'(event) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file !== null) {
        compressImageIntoBlob(file)
          .then((result) => {
            getBase64(result).then((base64String) => {
              $('input[name="picture"]').val(base64String);
              $('#picture-preview').css('background-image', `url(${base64String})`);
              $('#picture-preview').removeClass('placeholder');
              $('#picture-preview').html('<a id="removeImage-button" class="btn-floating tiny red" title="Eliminar imagen"><i class="material-icons">delete_forever</i></a>');
              $('#removeImage-button').bind('click', (event) => {
                $('#modalConfirmDeletePicture').modal('open');
              });
            });
          });
      }
    }
  },
  'click div[data-schema-key="categories"]>p'(event) {
    event.preventDefault();
    event.stopPropagation();
    const checkbox = $(event.currentTarget).find('input[name="categories"]');
    checkbox.prop('checked', !checkbox.prop('checked'));
  },
  'click div[data-schema-key="teamCategories"]>p'(event) {
    event.preventDefault();
    event.stopPropagation();
    const checkbox = $(event.currentTarget).find('input[name="teamCategories"]');
    checkbox.prop('checked', !checkbox.prop('checked'));
  },
  'click #add-new-category'(event) {
    $('#modalNewCategory').modal('open');
  },
});
