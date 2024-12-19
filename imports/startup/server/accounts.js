import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';


/* Email Templates */
Accounts.emailTemplates.siteName = 'pBest';
Accounts.emailTemplates.from = 'pBest <martin@espinr.es>';

Accounts.emailTemplates.resetPassword = {
  subject(user) {
    return 'Recovering password for pBest';
  },
  text(user, url) {
    return `Hi ${user.profile.firstName}:

If you haven't asked for a passworkd recovery of (${user.emails[0].address}) within pBest, please omit this message. 
Otherwise, you can go to the following site to change it:
${url}

The pBest Team
`;
  },
};

