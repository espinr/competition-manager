import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { AutoForm } from 'meteor/aldeed:autoform';
import { FlowRouter } from 'meteor/kadira:flow-router';
import ImageCompressor from '@xkeshi/image-compressor';
import { Races } from '/imports/api/races/races.js';
import { Categories } from '/imports/api/categories/categories.js';
import { TeamCategories } from '../../../../../api/teamCategories/teamCategories';
import '../../../categories/category/newModal/newModal';
import './edit.html';

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
  editRaceForm: {
    before: {
      update(docUpdate) {
        // Assigns the category by default
        const doc = docUpdate;
        // Assigns the categories by default depending on the type of race
        const catDefault = Categories.findOne({ identifier: 'OVERALL' });
        const teamCatDefault = TeamCategories.findOne({ identifier: 'OVERALL' });
        if (isRelayRace()) {
          if (doc.$set.teamCategories && Array.isArray(doc.$set.teamCategories)) {
            doc.$set.teamCategories.push(teamCatDefault._id);
          } else {
            doc.$set.teamCategories = [teamCatDefault._id];
          }
          if (doc.$set.categories) {
            doc.$set.categories = [catDefault._id];
          }
        } else if (doc.$set.categories && Array.isArray(doc.$set.categories)) {
          doc.$set.categories.push(catDefault._id);
        } else {
          doc.$set.categories = [catDefault._id];
        }
        if (doc.$unset) {
          delete doc.$unset.categories;
        }
        return doc;
      },
    },
    formToDoc(doc) {
      const docToUpdate = doc;
      const today = new Date();
      docToUpdate.createdAt = today;
      const checkpoints = $('input[type=checkbox]:checked');
      const checkpointsToInsert = [];
      if (checkpoints && checkpoints.length) {
        for (let i= 0; i < checkpoints.length; i += 1) {
          const idCheckpoint = checkpoints[i].getAttribute('id')
          const lapsInput = $(`#${idCheckpoint}_laps`);
          let laps = 1;
          if (lapsInput && lapsInput.length > 0) {
            laps = parseInt(lapsInput[0].value, 10);
          }
          const intermediateCheckpoint = {
            id: checkpoints[i].getAttribute('id'),
            name: checkpoints[i].getAttribute('data-name'),
            laps,
          };
          if (!docToUpdate.checkpoints) {
            docToUpdate.checkpoints = [];
          }
          checkpointsToInsert.push(intermediateCheckpoint);
        }
      }
      docToUpdate.checkpoints = checkpointsToInsert;

      // Now the final checkpoint
      const finalCheckpoint = $('input[name=finalCheckpoint]:checked');
      if (finalCheckpoint && finalCheckpoint.length > 0) {
        docToUpdate.finalCheckpoint = { id: finalCheckpoint[0].value, name: finalCheckpoint[0].getAttribute('data-name')};
      }
      //console.log(docToUpdate);
      return docToUpdate;
    },
    after: {
      update(error, result) {
        if (error) {
          if (error.reason) {
            alert(error.reason);
          }
        } else if (result) {
          FlowRouter.go('races.dashboard');
          Materialize.toast('The race was successfully updated', 4000);
        }
      },
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

function removeRace() {
  const raceId = FlowRouter.getParam('raceId');
  if (raceId && raceId.length > 0) {
    Meteor.call('races.delete', raceId);
    FlowRouter.go('races.dashboard');
    Materialize.toast('The race was marked as deleted', 4000);
  }
}

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

function loadPicture(base64String) {
  $('input[name="picture"]').val(base64String);
  $('#picture-preview').css('background-image', `url(${base64String})`);
  $('#picture-preview').removeClass('placeholder');
  $('#picture-preview').html('<a id="removeImage-button" class="btn-floating tiny red" title="Eliminar imagen"><i class="material-icons">delete_forever</i></a>');
  $('#removeImage-button').bind('click', (event) => {
    $('#modalConfirmDeletePicture').modal('open');
  });
}

Template.editRace.onCreated(function () {
  const template = Template.instance();
  const raceId = FlowRouter.getParam('raceId');

  const handlerRaces = template.subscribe('races.id', raceId);
  const handlerCats = template.subscribe('categories.all.raceId', raceId);
  const handlerTeamCats = template.subscribe('teamCategories.all');
  const handlerCheckpoints = template.subscribe('checkpoints.search');
  const handlerCountries = template.subscribe('countries.all');

  template.autorun(function () {
    if (handlerRaces.ready() && handlerCheckpoints.ready() && handlerTeamCats.ready() && handlerCats.ready() && handlerCountries.ready()) {
      $(document).ready(() => {
        hideShowCategories();
        $('select').material_select();
        // Loads the image within the thumbnail
        const pictureBase64 = $('input[name="picture"]').val();
        if (pictureBase64 && pictureBase64.trim().length > 0) {
          loadPicture(pictureBase64);
        }
        $('.collapsible.expandable').collapsible({
          accordion: false,
        });
        $('.modal').modal({
          dismissible: true,
        });
        $('#modalConfirmDeletePicture').modal({
          dismissible: true,
          opacity: 0.5,
          startingTop: '40%',
          ready(modal, trigger) {
            $('#modalConfirmDeletePicture .modal-ok').bind('click', (event) => {
              removePicture();
              $('#modalConfirmDeletePicture').modal('close');
            });
          },
        });
        $('#modalConfirmDeleteRace').modal({
          dismissible: true,
          opacity: 0.5,
          startingTop: '40%',
          ready(modal, trigger) {
            $('#modalConfirmDeleteRace .modal-ok').bind('click', (event) => {
              $('#modalConfirmDeleteRace').modal('close');
              removeRace();
            });
          },
        });
      });
    }
  });
});

Template.editRace.helpers({
  categoryOptions() {
    return Categories.find({ identifier: { $ne: 'OVERALL' } }, { sort: { requiredMinAge: 1, requiredMaxAge: 1, description: 1 } }).map(function (cat) {
      return {
        label: cat.name,
        value: cat._id,
      };
    });
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
  raceId() {
    return FlowRouter.getParam('raceId');
  },
  currentRace() {
    // Load the races specified on the param
    const raceId = FlowRouter.getParam('raceId');
    if (raceId && raceId.length > 0) {
      const currentRace = Races.findOne({ _id: raceId });
      return currentRace;
    }
    FlowRouter.go('races.dashboard');
    return null;
  },
});

Template.editRace.events({
  'change select[name="competitionType"]'(event) {
    hideShowCategories();
  },
  'change input#new-picture-input'(event) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file !== null) {
        compressImageIntoBlob(file)
          .then((result) => {
            getBase64(result).then(loadPicture);
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
  'click .delete-race-button'(event) {
    $('#modalConfirmDeleteRace').modal('open');
  },
  'click #add-new-category'(event) {
    $('#modalNewCategory').modal('open');
  },

});
