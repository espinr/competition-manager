import { Meteor } from 'meteor/meteor';
import { AccountsTemplates } from 'meteor/useraccounts:core';
import { Roles } from 'meteor/alanning:roles';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Tracker } from 'meteor/tracker';
import RoleTypes from '../../../api/users/roles/roleTypes.js';
import Common from '../../../../both/lib/common.js';

// Import needed templates
import '../config.js';

// Components
import '../../../ui/components/spinner/spinner.js';
import '../../../ui/components/header/header.js';
import '../../../ui/components/header/competition-header/competition-header.js';
import '../../../ui/components/accounts/accounts.js';
import '../../../ui/components/clubs/clubs.js';
import '../../../ui/components/clubs/club/new/new.js';
import '../../../ui/components/clubs/club/edit/edit';
import '../../../ui/components/profile/new-profile/new-profile.js';
import '../../../ui/components/profile/edit-profile/edit-profile.js';
import '../../../ui/components/profile/edit-profile-admin/edit-profile-admin.js';
import '../../../ui/components/checkpoints/checkpoints.js';
import '../../../ui/components/races/races.js';
import '../../../ui/components/races/cards/cards';
import '../../../ui/components/races/race/new/new.js';
import '../../../ui/components/races/race/edit/edit.js';
import '../../../ui/components/races/race/view/view.js';
import '../../../ui/components/races/race/starting/starting';
import '../../../ui/components/races/race/results/results';
import '../../../ui/components/races/race/team-results/team-results';
import '../../../ui/components/races/race/relay-results/relay-results';
import '../../../ui/components/races/race/display/display';
import '../../../ui/components/races/race/display/display-relays/display-relays';
import '../../../ui/components/races/race/display/display-header/display-header';
import '../../../ui/components/competition/competition.js';
import '../../../ui/components/competitors/new/new.js';
import '../../../ui/components/competitors/edit/edit';
import '../../../ui/components/competitors/join/join';
import '../../../ui/components/competitors/join-new-profile/join-new-profile';
import '../../../ui/components/checkins/checkins.js';
import '../../../ui/components/stopwatch/stopwatch.js';
import '../../../ui/components/uploader/uploader';
import '../../../ui/components/policies/privacy-policy/privacy-policy.js';
import '../../../ui/components/resultEntries/new/new';
import '../../../ui/components/resultEntries/edit/edit';
import '../../../ui/components/teams/teams';
import '../../../ui/components/teams/team/new/new.js';
import '../../../ui/components/teams/team/edit/edit';
import '../../../ui/components/races/race/replay-relays/replay-relays';
import '../../../ui/components/opentrack/opentrack';
import '../../../ui/components/header/opentrack-header/opentrack-header';
import '../../../ui/components/categories/categories';
import '../../../ui/components/categories/category/new/new';
import '../../../ui/components/categories/category/edit/edit';
import '../../../ui/components/opentrack/categories/categories';
import '../../../ui/components/opentrack/clubs/clubs';
import '../../../ui/components/opentrack/countries/countries';
import '../../../ui/components/opentrack/competitionFeatures/competitionFeatures';
import '../../../ui/components/opentrack/federations/federations';
import '../../../ui/components/opentrack/athletes/athletes';
import '../../../ui/components/opentrack/races/races';
import '../../../ui/components/opentrack/disciplines/disciplines';
import '../../../ui/components/contact/contact';


// Errors
import '../../../ui/components/errors/not-found/not-found.js';

// Layouts
import '../../../ui/layouts/main-layout/main-layout.js';
import '../../../ui/layouts/login/login.js';
import '../../../ui/pages/error/error.js';
import { Competitors } from '../../../api/competitors/competitors.js';
import { StartingListEntries } from '../../../api/client/startingListEntries/startingListEntries.js';
import { ResultLists } from '../../../api/resultLists/resultLists.js';


if (Meteor.isClient) {
  FlowRouter.wait();
  Tracker.autorun(function() {
    if (Roles.subscription.ready() && AccountsTemplates._initialized && !FlowRouter._initialized) {
      FlowRouter.initialize();
    }
  });
}

/* Error handling */
FlowRouter.notFound = {
  action() {
    BlazeLayout.render('errorTemplate', { errorTemplate: 'errorNotFound' });
  },
};

/* -----------------
 * Public Routes
 * -----------------
*/
const publicRoutes = FlowRouter.group({
  name: 'public',
  triggersEnter: [
    function(context, redirect) {
      // If the user is logged in but his profile was not set
      if (Common.isLoggedUser() && !Common.hasSetUpProfile()) {
        FlowRouter.go('App.newProfile');
      }
    },
  ],
});

publicRoutes.route('/', {
  name: 'App.home',
  onBack(details, origin) {
    BlazeLayout.render('App.home');
  },
  action(params, queryParams) {
    if (Common.hasAnyOfUserRoles([RoleTypes.ADMIN])) {
      FlowRouter.go('races.dashboard');
    } else {
      FlowRouter.go('races.cards');
    }
  },
});


publicRoutes.route('/use-terms', {
  name: 'useTerms',
  action() {
    BlazeLayout.render('useTerms');
  },
});

publicRoutes.route('/privacy', {
  name: 'privacy',
  action() {
    BlazeLayout.render('privacy');
  },
});

publicRoutes.route('/new-profile', {
  name: 'App.newProfile',
  action() {
    // If NOT loggedIn -> redirected to /login
    if (!Common.isLoggedUser()) {
      FlowRouter.go('App.login');
    }
    BlazeLayout.render('loginLayout', { main: 'newProfile', nav: 'loginHeader' });
  },
});

publicRoutes.route('/my-profile', {
  name: 'App.editProfile',
  onBack(details, origin) {
    FlowRouter.go('App.home');
  },
  // If NOT loggedIn -> redirected to /login
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action() {
    BlazeLayout.render('appMainLayout', { main: 'editProfile', nav: 'editionFormHeader' });
  },
});

/*
  RACES
*/
publicRoutes.route('/races/cards', {
  name: 'races.cards',
  action(params, queryParams) {
    BlazeLayout.render('appMainLayout', { main: 'racesCards', nav: 'mainNav' });
  },
});

publicRoutes.route('/races/view/:raceId', {
  name: 'races.view',
  onBack(details, origin) {
    FlowRouter.go('App.home');
  },
  action(params, queryParams) {
    if (params.raceId) {
      BlazeLayout.render('appMainLayout', { main: 'raceView', nav: 'competitionHeader' });
    } else {
      FlowRouter.go('races.dashboard');
    }
  },
});

// checkpointID is optional
publicRoutes.route('/races/display/:raceId/:checkpointId?', {
  name: 'races.display',
  action(params, queryParams) {
    // At least raceID
    if (params.raceId) {
      BlazeLayout.render('appMainLayout', { main: 'raceDisplayResults', nav: 'displayHeader' });
    } else {
      FlowRouter.go('races.dashboard');
    }
  },
});

publicRoutes.route('/races/display-relays/:raceId/:checkpointId?', {
  name: 'races.displayRelays',
  action(params, queryParams) {
    // At least raceID
    if (params.raceId) {
      BlazeLayout.render('appMainLayout', { main: 'raceDisplayRelayResults', nav: 'displayHeader' });
    } else {
      FlowRouter.go('races.dashboard');
    }
  },
});

publicRoutes.route('/races/replay-relays/:raceId/:checkpointId?', {
  name: 'races.replayRelays',
  action(params, queryParams) {
    // At least raceID
    if (params.raceId) {
      BlazeLayout.render('appMainLayout', { main: 'raceReplayRelays', nav: 'displayHeader' });
    } else {
      FlowRouter.go('races.dashboard');
    }
  },
});

/* -----------------
 * Routes for admins
 * -----------------
*/
const adminRoutes = FlowRouter.group({
  name: 'admin',
  triggersEnter: [
    function(context, redirect) {
      if (Common.hasAnyOfUserRoles([RoleTypes.ADMIN])) {
        this.route = FlowRouter.current();
        //const { path } = this.route;
        //console.log(`Granted access to ${path}`);
      } else {
        console.log('Access denied. Redirected to /');
        FlowRouter.go('App.home');
      }
    },
  ],
});

adminRoutes.route('/admin/checkpoints/:raceId', {
  name: 'admin.checkpoints.map',
  onBack(details, origin) {
    FlowRouter.go('races.dashboard');
  },
  action(params, queryParams) {
    const raceId = (queryParams.raceId ? queryParams.raceId : null);
    BlazeLayout.render('appMainLayout', { main: 'checkpointsMain', nav: 'editionFormHeader', raceId });
  },
});

adminRoutes.route('/admin/races', {
  name: 'races.dashboard',
  action(params, queryParams) {
    BlazeLayout.render('appMainLayout', { main: 'racesMain', nav: 'racesNav' });
  },
});

adminRoutes.route('/admin/races/new', {
  name: 'admin.races.new',
  action() {
    BlazeLayout.render('appMainLayout', { main: 'newRace', nav: 'editionFormHeader' });
  },
});

adminRoutes.route('/admin/races/edit/:raceId', {
  name: 'admin.races.edit',
  onBack(details, origin) {
    FlowRouter.go('races.dashboard');
  },
  action(params, queryParams) {
    if (params.raceId) {
      BlazeLayout.render('appMainLayout', { main: 'editRace', nav: 'editionFormHeader' });
    } else {
      FlowRouter.go('races.dashboard');
    }
  },
});

/*
  Starting lists
*/

publicRoutes.route('/races/startinglist/:raceId', {
  name: 'races.startingList',
  onBack(details, origin) {
    FlowRouter.go('races.dashboard');
  },
  action(params, queryParams) {
    if (params.raceId) {
      BlazeLayout.render('appMainLayout', { main: 'raceStartingList', nav: 'competitionHeader' });
    } else {
      FlowRouter.go('races.dashboard');
    }
  },
});

adminRoutes.route('/admin/races/:raceId/new-competitor/', {
  name: 'admin.competitors.new',
  onBack(details, origin) {
    FlowRouter.go('races.startingList', { raceId: FlowRouter.getParam('raceId') });
  },
  action(params, queryParams) {
    if (params.raceId) {
      BlazeLayout.render('appMainLayout', { main: 'newCompetitor', nav: 'competitionHeader' });
    } else {
      FlowRouter.go('races.startingList');
    }
  },
});

adminRoutes.route('/admin/races/:raceId/edit-competitor/:competitorId', {
  name: 'admin.competitors.edit',
  onBack(details, origin) {
    FlowRouter.go('races.startingList', { raceId: FlowRouter.getParam('raceId') });
  },
  action(params, queryParams) {
    if (params.competitorId && params.raceId) {
      BlazeLayout.render('appMainLayout', { main: 'editCompetitor', nav: 'competitionHeader' });
    } else {
      FlowRouter.go('races.startingList');
    }
  },
});

/*
  Results
*/

// checkpointID is optional
publicRoutes.route('/races/results/:raceId/:checkpointId?', {
  name: 'races.results',
  onBack(details, origin) {
    FlowRouter.go('races.view', { raceId: FlowRouter.getParam('raceId') });
  },
  action(params, queryParams) {
    // At least raceID
    if (params.raceId) {
      BlazeLayout.render('appMainLayout', { main: 'raceResults', nav: 'competitionHeader' });
    } else {
      FlowRouter.go('races.dashboard');
    }
  },
});

// checkpointID is optional
publicRoutes.route('/races/relay-results/:raceId/:checkpointId?', {
  name: 'races.relayResults',
  onBack(details, origin) {
    FlowRouter.go('races.view', { raceId: FlowRouter.getParam('raceId') });
  },
  action(params, queryParams) {
    // At least raceID
    if (params.raceId) {
      BlazeLayout.render('appMainLayout', { main: 'raceRelayResults', nav: 'competitionHeader' });
    } else {
      FlowRouter.go('races.dashboard');
    }
  },
});


publicRoutes.route('/races/team-results/:raceId/:checkpointId?', {
  name: 'races.teamResults',
  onBack(details, origin) {
    FlowRouter.go('races.view', { raceId: FlowRouter.getParam('raceId') });
  },
  action(params, queryParams) {
    // At least raceID
    if (params.raceId) {
      BlazeLayout.render('appMainLayout', { main: 'raceTeamResults', nav: 'competitionHeader' });
    } else {
      FlowRouter.go('races.dashboard');
    }
  },
});


adminRoutes.route('/admin/races/new-result-entry/:raceId/:checkpointId?', {
  name: 'admin.races.newResultEntry',
  onBack(details, origin) {
    FlowRouter.go('races.results', { raceId: FlowRouter.getParam('raceId'), checkpointId: FlowRouter.getParam('checkpointId') });
  },
  action(params, queryParams) {
    if (params.checkpointId && params.raceId) {
      BlazeLayout.render('appMainLayout', { main: 'newResultsEntry', nav: 'competitionHeader' });
    } else {
      FlowRouter.go('races.dashboard');
    }
  },
});

adminRoutes.route('/admin/races/edit-result-entry/:raceId/:checkpointId/:resultEntryId', {
  name: 'admin.races.editResultEntry',
  onBack(details, origin) {
    FlowRouter.go('races.results', { raceId: FlowRouter.getParam('raceId'), checkpointId: FlowRouter.getParam('checkpointId') });
  },
  action(params, queryParams) {
    if (params.resultEntryId && params.raceId && params.checkpointId) {
      BlazeLayout.render('appMainLayout', { main: 'editResultsEntry', nav: 'competitionHeader' });
    } else {
      FlowRouter.go('races.dashboard');
    }
  },
});

adminRoutes.route('/admin/competition/:raceId', {
  name: 'admin.races.competition',
  onBack(details, origin) {
    FlowRouter.go('races.dashboard');
  },
  action(params, queryParams) {
    //let currentCheckpoint = null;
    if (params.raceId) {
      BlazeLayout.render('appMainLayout', { main: 'competitionMain', nav: 'competitionHeader'});
    } else {
      FlowRouter.go('races.dashboard');
    }
  },
});

adminRoutes.route('/admin/checkins/:raceId/:checkpointId', {
  name: 'races.checkins',
  action(params, queryParams) {
    if (params.raceId && params.checkpointId) {
      BlazeLayout.render('appMainLayout', { main: 'competitionCheckins', nav: 'competitionHeader' });
    } else {
      FlowRouter.go('races.dashboard');
    }
  },
});

/*
  Athletes, Clubs and Teams
*/

adminRoutes.route('/admin/athletes', {
  name: 'admin.users',
  action() {
    BlazeLayout.render('appMainLayout', { main: 'adminAccounts', nav: 'mainNav' });
  },
});

adminRoutes.route('/admin/athletes/:userId', {
  name: 'admin.editProfileAdmin',
  onBack(details, origin) {
    FlowRouter.go('admin.users');
  },
  action(params) {
    if (params.userId) {
      BlazeLayout.render('appMainLayout', { main: 'editProfileAdmin', nav: 'editionFormHeader' });
    } else {
      FlowRouter.go('admin.users');
    }
  },
});

adminRoutes.route('/admin/clubs', {
  name: 'admin.clubs',
  action() {
    BlazeLayout.render('appMainLayout', { main: 'adminClubs', nav: 'mainNav' });
  },
});

adminRoutes.route('/admin/clubs/new', {
  name: 'admin.clubs.new',
  onBack(details, origin) {
    FlowRouter.go('admin.clubs');
  },
  action(params) {
    BlazeLayout.render('appMainLayout', { main: 'newClub', nav: 'editionFormHeader' });
  },
});

adminRoutes.route('/admin/clubs/edit/:clubId', {
  name: 'admin.clubs.edit',
  onBack(details, origin) {
    FlowRouter.go('admin.clubs');
  },
  action(params) {
    if (params.clubId) {
      BlazeLayout.render('appMainLayout', { main: 'editClub', nav: 'editionFormHeader' });
    } else {
      FlowRouter.go('admin.clubs');
    }
  },
});

adminRoutes.route('/admin/teams/:raceId', {
  name: 'admin.teams',
  onBack(details, origin) {
    FlowRouter.go('races.dashboard');
  },
  action(params) {
    if (params.raceId) {
      BlazeLayout.render('appMainLayout', { main: 'adminTeams', nav: 'competitionHeader' });
    } else {
      FlowRouter.go('races.dashboard');
    }
  },
});

adminRoutes.route('/admin/teams/new/:raceId', {
  name: 'teams.new',
  onBack(details, origin) {
    FlowRouter.go('admin.teams', { raceId: this.params.raceId });
  },
  // If NOT loggedIn -> redirected to /login
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action(params) {
    if (params.raceId) {
      BlazeLayout.render('appMainLayout', { main: 'newTeam', nav: 'competitionHeader' });
    } else {
      FlowRouter.go('races.dashboard');
    }
  },
});

adminRoutes.route('/admin/teams/edit/:raceId/:teamId', {
  name: 'admin.teams.edit',
  onBack(details, origin) {
    FlowRouter.go('admin.teams', { raceId: this.params.raceId, teamId: this.params.teamId });
  },
  // If NOT loggedIn -> redirected to /login
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action(params) {
    if (params.teamId && params.raceId) {
      BlazeLayout.render('appMainLayout', { main: 'editTeam', nav: 'competitionHeader' });
    } else {
      FlowRouter.go('races.dashboard');
    }
  },
});

/* Uploader */
adminRoutes.route('/admin/uploader', {
  name: 'admin.uploader',
  onBack(details, origin) {
    FlowRouter.go('races.dashboard');
  },
  action(params, queryParams) {
    BlazeLayout.render('appMainLayout', { main: 'uploader', nav: 'editionFormHeader' });
  },
});

/* Categories */
adminRoutes.route('/admin/categories', {
  name: 'admin.categories',
  action() {
    BlazeLayout.render('appMainLayout', { main: 'categoriesMain', nav: 'mainNav' });
  },
});

adminRoutes.route('/admin/categories/new', {
  name: 'admin.categories.new',
  onBack(details, origin) {
    FlowRouter.go('admin.categories');
  },
  action(params) {
    BlazeLayout.render('appMainLayout', { main: 'newCategory', nav: 'editionFormHeader' });
  },
});

adminRoutes.route('/admin/categories/edit/:categoryIdentifier', {
  name: 'admin.categories.edit',
  onBack(details, origin) {
    FlowRouter.go('admin.categories');
  },
  action(params) {
    if (params.categoryIdentifier) {
      BlazeLayout.render('appMainLayout', { main: 'editCategory', nav: 'editionFormHeader' });
    } else {
      FlowRouter.go('admin.categories');
    }
  },
});

/* Categories Open to the public */
publicRoutes.route('/opentrack', {
  name: 'opentrack.menu',
  action(params, queryParams) {
    BlazeLayout.render('appMainLayout', { main: 'opentrackMenu', nav: 'opentrackMainHeader' });
  },
});

publicRoutes.route('/opentrack/categories', {
  name: 'opentrack.categories.list',
  onBack(details, origin) {
    FlowRouter.go('opentrack.menu');
  },
  action(params, queryParams) {
    BlazeLayout.render('appMainLayout', { main: 'opentrackCategories', nav: 'opentrackSubHeader' });
  },
});

publicRoutes.route('/opentrack/clubs', {
  name: 'opentrack.clubs.list',
  onBack(details, origin) {
    FlowRouter.go('opentrack.menu');
  },
  action(params, queryParams) {
    BlazeLayout.render('appMainLayout', { main: 'opentrackClubs', nav: 'opentrackSubHeader' });
  },
});

publicRoutes.route('/opentrack/countries', {
  name: 'opentrack.countries.list',
  onBack(details, origin) {
    FlowRouter.go('opentrack.menu');
  },
  action(params, queryParams) {
    BlazeLayout.render('appMainLayout', { main: 'opentrackCountries', nav: 'opentrackSubHeader' });
  },
});

publicRoutes.route('/opentrack/competitionFeatures', {
  name: 'opentrack.competitionFeatures.list',
  onBack(details, origin) {
    FlowRouter.go('opentrack.menu');
  },
  action(params, queryParams) {
    BlazeLayout.render('appMainLayout', { main: 'opentrackCompetitionFeatures', nav: 'opentrackSubHeader' });
  },
});

publicRoutes.route('/opentrack/federations', {
  name: 'opentrack.federations.list',
  onBack(details, origin) {
    FlowRouter.go('opentrack.menu');
  },
  action(params, queryParams) {
    BlazeLayout.render('appMainLayout', { main: 'opentrackFederations', nav: 'opentrackSubHeader' });
  },
});

publicRoutes.route('/opentrack/athletes', {
  name: 'opentrack.athletes.list',
  onBack(details, origin) {
    FlowRouter.go('opentrack.menu');
  },
  action(params, queryParams) {
    BlazeLayout.render('appMainLayout', { main: 'opentrackAthletes', nav: 'opentrackSubHeader' });
  },
});

publicRoutes.route('/opentrack/races', {
  name: 'opentrack.races.list',
  onBack(details, origin) {
    FlowRouter.go('opentrack.menu');
  },
  action(params, queryParams) {
    BlazeLayout.render('appMainLayout', { main: 'opentrackRaces', nav: 'opentrackSubHeader' });
  },
});

publicRoutes.route('/opentrack/disciplines', {
  name: 'opentrack.disciplines.list',
  onBack(details, origin) {
    FlowRouter.go('opentrack.menu');
  },
  action(params, queryParams) {
    BlazeLayout.render('appMainLayout', { main: 'opentrackDisciplines', nav: 'opentrackSubHeader' });
  },
});
