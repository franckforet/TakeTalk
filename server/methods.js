/**
 * This methods alows us to send an e-mail to someone
 * @param {string} to - The receiver's e-mail
 * @param {string} from - The sender's e-mail
 * @param {string} subject - The e-mail's header
 * @param {string} text - The e-mail's body
*/
Meteor.methods({
  //Envoi d'email aux utilisateurs invités
  sendEmail: function(to, from, subject, text) {
    check([to, from, subject, text], [String]);
    this.unblock();
    Email.send({to: to, from: from, subject: subject, text: text});
  },

  //Permet de réinitiliser la base de données
  // resetAll: function() {
  //     Session.set("meetingId", "");
  //     Session.set("userId", "");
  //     Speeches.remove({});
  //     Users.remove({});
  //     Meetings.remove({});
  // }
});
