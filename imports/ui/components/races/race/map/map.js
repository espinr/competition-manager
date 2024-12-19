import { Races } from '/imports/api/races/races.js';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import omnivore from '@mapbox/leaflet-omnivore';
import './map.html';


Template.raceViewMap.onRendered(function () {
  currentRace = null;
  const template = Template.instance();
  const raceId = FlowRouter.getParam('raceId');
  template.currentMap = null;
  template.currentRace = null;

  this.autorun(function() {
    if (raceId && raceId.length > 0) {
      template.currentRace = Races.findOne({ _id: raceId });
      if (template.currentRace) {
        $('document').ready(() => {
          if (!template.currentMap) {
            template.currentMap = L.map('raceViewMap', {
              zoomControl: false,
            });
            L.tileLayer.provider('Hydda.Base').addTo(template.currentMap);
            //L.tileLayer.provider('Esri.WorldGrayCanvas').addTo(map);
            $(window).resize(function() {
              const navElement = $('nav')[0];
              const heightNav = navElement ? navElement.scrollHeight : 0;
              $('#mapCheckpoints').css('height', window.innerHeight - heightNav);
            });
            // Loads the KML path
            if (template.currentRace && template.currentRace.kmlCourse) {
              const kmlLayer = omnivore.kml.parse(template.currentRace.kmlCourse);
              kmlLayer.setStyle({
                weight: 4,
                color: '#d81b60',
                opacity: 1,
                fillColor: '#d81b60',
                fillOpacity: 0.5,
              });
              kmlLayer.addTo(template.currentMap);
              const boundsCourse = kmlLayer.getBounds();
              template.currentMap.fitBounds(boundsCourse);
            } else if (template.currentRace && template.currentRace.location && template.currentRace.location.latitude && template.currentRace.location.longitude) {
              // The lat/long by default
              template.currentMap.setView([template.currentRace.location.latitude, template.currentRace.location.longitude], 15);
            } else {
              // The lat/long by default
              template.currentMap.setView([43.54, -5.660949], 15);
            }
            $(window).resize(); // trigger resize event
          }
        });
      }
    }
  });
});

Template.raceViewMap.helpers({});

Template.raceViewMap.events({});
