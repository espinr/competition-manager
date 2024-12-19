import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import hljs from 'highlight.js/lib/highlight';
import json from 'highlight.js/lib/languages/json';
import moment from  'moment';
import { ReactiveVar } from 'meteor/reactive-var';
//import 'highlight.js/styles/github.css';
import 'highlight.js/styles/monokai-sublime.css';
import './uploader.html';
import Common from '../../../../both/lib/common';
import OpenTrack from '../../../../both/lib/opentrack';



function highlightCode() {
  $('#editor').each(function(i, block) {
    hljs.highlightBlock(block);
  });
}

Template.uploader.onCreated(function () {
  const template = Template.instance();
  template.entities = new ReactiveVar(null);
  hljs.registerLanguage('json', json);
  hljs.configure({
    tabReplace: '  ',
  });
  $(document).ready(function() {
    highlightCode();
  });
});

Template.uploader.helpers({
  entities() {
    return Template.instance().entities.get();
  },
});

function getAthleteItem(athlete) {
  let html = '';
  let yearsOld = '';
  if (athlete.birthDate) {
    try {
      yearsOld = ` (${Common.getYearsOldNow(athlete.birthDate)} years old)`;
    } catch (e) {
      yearsOld = '<mark>Birth date in ISO format</mark>';
    }
  }
  if (athlete.image) {
    html += `<img src="${athlete.image}" alt="${athlete.name}" class="circle">`;
  } else {
    html += '<i class="material-icons circle grey">face</i>';
  }
  if (athlete.name) {
    const alternate = athlete.alternateName ? ` (${athlete.alternateName})` : '';
    html += `<span class="title">${athlete.name}${alternate}</span>`;
  } else if (athlete.firstName) {
    let name = athlete.firstName;
    if (athlete.lastName) {
      name += ` ${athlete.lastName}`;
    }
    html += `<span class="title">${name}</span>`;
  } else {
    html += '<span class="title"><mark>no name</mark></span>';
  }
  html += '<p>';
  if (athlete.gender) {
    html += `${athlete.gender}${yearsOld}<br>`;
  }
/*  if (athlete.club) {
    html += `${athlete.club}<br>`;
  }
*/  
  if (athlete.url) {
    html += `<a href="${athlete.url}">${athlete.url}</a><br>`;
  }
  html += '<a href="#!" class="secondary-content"><i class="material-icons">directions_run</i></a>';
  html += '</p>';
  return new Spacebars.SafeString(html);
}

function processAddress(add) {
  let html = '';
  if (add.name) { html += `${add.name}<br>`; }
  if (add.streetAddress) { html += `${add.streetAddress}<br>`; }
  if (add.addressLocality) { html += `${add.addressLocality} `; }
  if (add.postalCode) { html += `- ${add.postalCode} `; }
  if (add.addressCountry) { html += `- ${add.addressCountry} `; }
  return new Spacebars.SafeString(html);
}

function processOrganization(org, type) {
  let html = '';
  if (org.logo) {
    html += `<img src="${org.logo}" alt="${org.name}" class="circle">`;
  } else {
    html += '<i class="material-icons circle grey">domain</i>';
  }
  if (org.name) {
    const alternate = org.alternateName ? ` (${org.alternateName})` : '';
    html += `<span class="title">${org.name}${alternate}</span>`;
  } else {
    html += '<span class="title"><mark>no name</mark></span>';
  }
  html += '<p>';
  if (org.url) { html += `<a href="${org.url}" target="_blank">website</a> `; }
  if (org.telephone) { html += `phone: ${org.telephone}`; }
  html += '<br>';
  if (org.address) { html += processAddress(org.address); }
  html += '</p>';
/*
  address	schema:address	Postal address where an organization is located.	Postal Address or Text
  memberOf	schema:memberOf	Organization, such as higher-level federation(s), to which an organization is attached to.	Organization
  member	schema:member	Person or organization attached to an organization.	Person or Organization  
  */
 html += '<a href="#!" class="secondary-content"><i class="material-icons">domain</i></a>';
 return new Spacebars.SafeString(html);
}


function processSportsClub(org) {
  let html = processOrganization(org, 'Club');
  return html;
}

function processEntity(entity) {
  const type = OpenTrack.getTypeEntity(entity);
  switch (type) {
    case 'Athlete':
      return getAthleteItem(entity);
    case 'Club':
      console.log('this is a club');
      return processOrganization(entity);
      break;
    case 'SportsEvent':
      console.log('this is a competition');
      break;
    default:
      break;
  }
  return null;
}

function processJSON(jsonString) {
  const arrayEntities = [];
  if (Common.isValidJSON(jsonString)) {
    const json = JSON.parse(jsonString);
    if (Array.isArray(json)) {
      for (let i = 0; i < json.length; i++) {
        arrayEntities.push(processEntity(json[i]));
      }
    } else {
      arrayEntities.push(processEntity(json));
    }
  } else {
    Materialize.toast('The JSON document is not valid. Please, fix it', 4000);
  }
  return arrayEntities;
}

Template.uploader.events({
  'click #reload-button'(event) {
    highlightCode();
    Template.instance().entities.set(processJSON($('pre#editor')[0].innerText));
  },
});

