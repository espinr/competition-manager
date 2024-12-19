import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Races } from '../../../api/races/races.js';

import './races.html';
import Common from '../../../../both/lib/common.js';


Template.racesMain.onCreated(function () {
  const template = Template.instance();
  template.loading = new ReactiveVar(true);

  template.autorun(() => {
    const handler = template.subscribe('races.search');
    if (handler.ready()) {
      template.loading.set(false);
      $('document').ready(function() {
        $('select').material_select();
      });    
    }
  });
});

Template.racesMain.helpers({
  loading() {
    return Template.instance().loading.get();
  },
  races() {
    return Races.find({ identifier: { $not: '_bydefault_' }, deleted: { $ne: true } });
  },
  settings() {
    return {
      fields: [
        {
          key: 'identifier',
          label: 'Id',
          sortOrder: 2,
          cellClass: 'raceIdentifier',
          headerClass: 'raceIdentifier',
          sortDirection: 'ascending',
        },
        {
          key: 'startDate',
          label: 'Date',
          sortOrder: 1,
          sortDirection: 'ascending',
          fn(value) {
            return moment(value).format('DD-MM-YYYY');
          },
        },
        {
          key: 'competitionType',
          label: '',
          sortable: false,
          fn(value) {
            if (value && value === 'Relay Race') {
              return new Spacebars.SafeString('<i class="material-icons">group</i>');
            }
            return new Spacebars.SafeString('<i class="material-icons">person</i>');
          },
        },        
        {
          key: 'name',
          label: 'Name',
          sortOrder: 1,
          sortDirection: 'ascending',
        },
        {
          key: 'description',
          label: 'Description',
          cellClass: 'truncate description',
          sortOrder: 1,
        },
        {
          key: '_id',
          label: '',
          cellClass: 'raceOptions',
          fn(value, object) {
            const beforeStarting = object.status === 'Ready';
            if (!object.checkpoints || !object.checkpoints.length > 0) { return ''; }
            const lastCheckpoint = object.checkpoints[object.checkpoints.length - 1];
            let resultsLinks = beforeStarting ? '' : `<a href="${FlowRouter.path('races.results')}/${value}/${lastCheckpoint.deviceId}" title="Results"><i class="material-icons">format_list_numbered</i></a>`;
            let startingList = `<a href="${FlowRouter.path('races.startingList')}/${value}" title="Starting List"><i class="material-icons">format_list_bulleted</i></a>`;
            let displayLinks = beforeStarting ? '' : `<a target="_blank" href="${FlowRouter.path('races.display', { raceId: value, checkpointId: lastCheckpoint.deviceId })}" title="Display"><i class="material-icons">live_tv</i></a>`;
            if (object.competitionType && object.competitionType === 'Relay Race') {
              resultsLinks = beforeStarting ? '' : `<a href="${FlowRouter.path('races.relayResults', { idRace: value, checkpointId: lastCheckpoint.deviceId })}" title="Results"><i class="material-icons">format_list_numbered</i></a>`;
              startingList += `<a href="${FlowRouter.path('admin.teams', { raceId: value })}" title="Teams"><i class="material-icons">group</i></a>`;
              displayLinks = beforeStarting ? '' : `<a target="_blank" href="${FlowRouter.path('races.displayRelays', { raceId: value, checkpointId: lastCheckpoint.deviceId })}" title="Display"><i class="material-icons">live_tv</i></a>`;
            } else if (object.competitionType && object.competitionType === 'Individual + Teams Race') {
              resultsLinks += beforeStarting ? '' : `<a href="${FlowRouter.path('races.teamResults', { raceId: value, checkpointId: lastCheckpoint.deviceId })}" title="Team Results"><i class="material-icons">format_list_numbered</i></a>`;
              startingList += `<a href="${FlowRouter.path('admin.teams', { raceId: value })}" title="Teams"><i class="material-icons">group</i></a>`;
            }
            return new Spacebars.SafeString(`
            <a href="${FlowRouter.path('races.view', { raceId: value })}" title="View Race"><i class="material-icons">pageview</i></a>
            <a href="${FlowRouter.path('admin.races.edit', { raceId: value })}" title="Edit race"><i class="material-icons">edit</i></a>
            <a href="${FlowRouter.path('admin.checkpoints.map', { raceId: value })}" title="Checkpoints"><i class="material-icons">edit_location</i></a>
            ${startingList}
            ${resultsLinks}
            <a href="${FlowRouter.path('admin.races.competition', { raceId: value })}" title="Start Competition"><i class="material-icons">play_circle_filled</i></a>
            ${displayLinks}`);
          },
        },
      ],
    };
  },
});

/*
Template.racesMain.events({

});
*/