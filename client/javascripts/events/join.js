/** The events that join template contains */
Template.join.events({
    /** An interaction on input checks if the form is properly filled */
    'input': function(e, t) {
        if(t.find("#participantName").value != "") {
            t.find("#join").disabled = "";
        } else {
            t.find("#join").disabled = "disabled";
        }
    },
    /** A form submission updates the user's name and opens the meeting page */
    'submit form': function(e) {
        e.preventDefault();
        var meetingId = Session.get("meetingId");
        var meeting = Meetings.findOne({_id: meetingId});

        if (meeting.password != e.target.pass.value) {
            Session.set("joinError", 'The password you entered is incorrect.');
            Router.go('/join/'+ meetingId +'/' + Session.get("userId"));
        } else {
            Users.update(Session.get("userId"), {$set: {name: e.target.participantName.value, status: "online"}});
            Router.go('/meeting/' + meetingId);
        }
    }
});

Template.join.helpers({
    joinError: function() { return Session.get('joinError'); }
});

