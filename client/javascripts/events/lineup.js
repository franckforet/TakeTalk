/** The events that lineup template contains */
Template.lineup.events({
    /** A click on cancelLineup goes back to the meeting page */
    'click #cancelLineup': function(e) {
        e.preventDefault();
        Router.go('/meeting/' + Session.get("meetingId"));
    },

    /** A click on lineup creates a speech and goes back to the meeting page */
    'click .lineUp': function(e, t) {
        e.preventDefault();
		      //var order = t.find("#order").value;
        var submitTime = t.find(".timeButton:checked").value;
        var userId = $(e.target).attr("user-id");
        var rank = 1;

        //Recherche du speech ayant le plus haut rang
        speeches = Speeches.find({meeting: Session.get("meetingId")}, {sort: {rank: -1}}).fetch();
        if (speeches.length > 0) {
            rank = speeches[0].rank+1;
        }

        if (submitTime == 'rapide') {
            submitTime = "intervention rapide"
        }
        if (submitTime == 'plus') {
            submitTime = "plus de 10 minutes"
        }

        //Création de la demande de parole
        if (isNaN(submitTime)) {
            Speeches.insert({
                subject: t.find("#keywords").value,
                timeLeft: 0,
                time: 0,
				        //orderChoose: order,
                timeString: submitTime,
                status: "pending",
                user: userId,
                meeting: Session.get("meetingId"),
                rank: rank
            });
        } else {
            Speeches.insert({
                subject: t.find("#keywords").value,
                timeLeft: 0,
                time: submitTime,
				        //orderChoose: order,
                timeString: "",
                status: "pending",
                user: userId,
                meeting: Session.get("meetingId"),
                rank: rank
            });
        }

        //redirection vers la page du meeting
        Router.go('/meeting/' + Session.get("meetingId"));
    }
});

Template.lineup.helpers ({

    //Retourne la liste des utilisateurs ajoutés en local
    guests: function () {
        var guests = Session.get("guests");
        var names = new Array(guests.length);

        for (i = 0; i < guests.length; i++) {
            names[i] = {"name" : guests[i]};
        }

        return names;
    },

    //Retourne l'ordre du jour
    // ordres: function () {
    //     return Session.get("ordres");
    // },

    //Retourne vrai si dse utilisateurs ont été ajoutés en local
    hasGuest: function () {
        if (Session.get("guests") === undefined) {
            return false;
        }
        return Session.get("guests").length > 0;
    },

    //Retourne l'utilisateur local
    currentUser: function(){
        return Users.findOne({_id: Session.get("userId")});
    }
});
