import { Races } from '/imports/api/races/races.js';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import omnivore from '@mapbox/leaflet-omnivore';
import './map.html';
import { check } from 'meteor/check';

let map;
let markers;
let currentRace;

function markerDragend(event) {
  const latLongCheckpoint = event.target.getLatLng();
  const {checkpointIndex} = event.target.options;
  if (currentRace && latLongCheckpoint && latLongCheckpoint.lat && latLongCheckpoint.lng) {
    currentRace.checkpoints[checkpointIndex].latitude = latLongCheckpoint.lat;
    currentRace.checkpoints[checkpointIndex].longitude = latLongCheckpoint.lng;
    Races.update({ _id: currentRace._id }, { $set: { checkpoints: currentRace.checkpoints } }, function(error, regs) {
      if (error) {
        Materialize.toast('Error updating the checkpoint', 4000);
      } else {
        Materialize.toast('Checkpoint location updated', 4000);
      }
    });
  }
}

function buildIcon(isFinishLine) {
  const pathIcon = isFinishLine ? '/img/markers/finish.png' : '/img/markers/chronometer.png';
  return L.icon({
    iconUrl: pathIcon,
    iconSize:     [32, 37], // size of the icon
    shadowSize:   [0, 0],   // size of the shadow
    iconAnchor:   [16, 36], // point of the icon which will correspond to marker's location
    shadowAnchor: [0, 0],   // the same for the shadow
    popupAnchor:  [0, -36],// point from which the popup should open relative to the iconAnchor
    tooltipAnchor: [16, -16],
  });
}

Template.checkpointsMap.onRendered(function () {
  currentRace = null;
  const template = Template.instance();
  const raceId = FlowRouter.getParam('raceId');

  Tracker.autorun(function() {
    if (raceId && raceId.length > 0) {
      currentRace = Races.findOne({ _id: raceId });
      if (currentRace) {
        $('document').ready(() => {
          if (!map) {
            map = L.map('mapCheckpoints', {
              zoomControl: true,
            });
            template.currentMap = map;
            L.tileLayer.provider('Hydda.Base').addTo(map);
            //L.tileLayer.provider('Esri.WorldGrayCanvas').addTo(map);
            $(window).resize(function() {
              const navElement = $('nav')[0];
              const heightNav = navElement ? navElement.scrollHeight : 0;
              $('#mapCheckpoints').css('height', window.innerHeight - heightNav);
            });
            $(window).resize(); // trigger resize event
            map.setView([43.54, -5.660949], 15);
            // Loads the KML path
            if (currentRace && currentRace.kmlCourse) {
              const kmlLayer = omnivore.kml.parse(currentRace.kmlCourse);
              kmlLayer.setStyle({
                weight: 4,
                color: '#d81b60',
                opacity: 1,
                fillColor: '#d81b60',
                fillOpacity: 0.5,
              });
              kmlLayer.addTo(map);
              const boundsCourse = kmlLayer.getBounds();
              map.fitBounds(boundsCourse);
              markers = [];

              if (currentRace.checkpoints && currentRace.checkpoints.length > 0) {
                // Loads the checkpoints based on the bounds
                for (let i = 0; i < currentRace.checkpoints.length; i += 1) {
                  const checkpoint = currentRace.checkpoints[i];
                  let latLngMarker = boundsCourse.getCenter();
                  if (checkpoint.latitude && checkpoint.latitude !== 0) {
                    latLngMarker = L.latLng(checkpoint.latitude, checkpoint.longitude);
                  }
                  const marker = L.marker(latLngMarker, {
                    icon: buildIcon(checkpoint.onFinishLine),
                    draggable: true,
                    checkpointIndex: i,
                  }).addTo(map);
                  marker.bindTooltip(checkpoint.deviceId, { permanent: true }).openTooltip();
                  const popup = L.popup().setContent(`<h4>${checkpoint.name}</h4><p>Device ID: <b>${checkpoint.deviceId}</b><br>Laps: <b>${checkpoint.laps}</b></p>`);
                  marker.bindPopup(popup).addTo(map);
                  marker.on('dragend', markerDragend);
                  markers.push(marker);
                }
              }
            }
          }
        });
      }
    }
  });
});

Template.checkpointsMap.helpers({});

Template.checkpointsMap.events({});
