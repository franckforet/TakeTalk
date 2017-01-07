/** The events that create template contains */
Template.create.events({

    //Création d'un nouveau champ de saisie lorsqu'un caractère est renseigné
    'keyup .participant-email-input': function(e) {
        var input = $(e.target);

        if (input.val().length > 0) {
            var rank = input.parents(".participant-email")[0].getAttribute('rank');
            var form = input.parents("#create-form");
            var nextRank = parseInt(rank) + 1;

            if ($(form).find('.participant-email[rank="'+nextRank+'"]').length < 1) {
                var newInput = $(input.parents(".participant-email")[0].cloneNode(true));
                newInput.find(".participant-email-input").val("");
                newInput.attr('rank', nextRank);
                $(input.parents(".participant-email-group")[0]).append(newInput)
            }
        }
    },

    //Création d'un nouveau champ de saisie lorsqu'un caractère est renseigné
    'keyup .agenda-name-input': function(e) {
        var input = $(e.target);

        if (input.val().length > 0) {
            var rank = input.parents(".agenda-group")[0].getAttribute('rank');
            var form = input.parents("#create-form");
            var nextRank = parseInt(rank) + 1;

            if ($(form).find('.agenda-group[rank="'+nextRank+'"]').length < 1) {
                var newInput = $(input.parents(".agenda-group")[0].cloneNode(true));
                newInput.find(".agenda-name-input").val("");
                newInput.find(".agenda-time-input").val("");
                newInput.attr('rank', nextRank);
                $(input.parents(".agenda-group")[0]).after(newInput)
            }
        }
    },

    'submit form': function(e) {
        e.preventDefault();
        //Récupération des éléments DOM des champs de saisie
        var ordreInputs = e.target.ordreDuJour;
        var ordreTimeInputs = e.target.ordreDuJourTemps;
        var participantsInputs = e.target.participantsEmails;

        //Récupération des valeurs de l'ordre du jour, temps estimés et des emails d'invitation
        var ordres = [];
        var ordreTimes = [];
        var participantsEmails = [];

        for (i = 0; i < participantsInputs.length; i++) {
            if (participantsInputs[i].value != "") {
                participantsEmails.push(participantsInputs[i].value);
            }
        }
        for (i = 0; i < ordreInputs.length; i++) {
            if (ordreInputs[i].value != "") {
                ordres.push(ordreInputs[i].value);
                ordreTimes.push(ordreTimeInputs[i].value);
            }
        }

        //Création du mot de passe du meeting
        var pass = Math.floor((Math.random() * 10000) + 1);
        if(pass < 10){
            pass = '000' + pass;
        }else if(pass < 100){
            pass = '00' + pass;
        }else if(pass < 1000){
            pass = '0' + pass;
        }

        //Création du meeting
        var meetingId = Meetings.insert({
            name: e.target.meetingName.value,
            status: "ongoing",
            //ordres: ordres,
            //ordreTimes: ordreTimes,
            password: pass,
            reportLink: (e.target.reportLink.value !== undefined) ? e.target.reportLink.value : ""
        });

        //Création de l'utilisateur animateur
        var userId = Users.insert({
            name: e.target.animatorName.value,
            email: e.target.animatorEmail.value,
            type: "animator",
            status: "online",
            meeting: meetingId
        });

        localStorage.setItem(meetingId, meetingId);

        //Définition du corp du mail envoyé à l'animateur et aux invités
        var emailBody = 'Here is the link for the meeting : taketalk.meteor.com/join/' + meetingId + '/' + userId + '\n';
        emailBody += (e.target.reportLink.value !== undefined) ? 'Here is the link of the report : ' + e.target.reportLink.value + '\n\n' : "";
        emailBody += 'If you quit the meeting and want to return, here is the password : ' + pass;

        //Alimentation des variable de la session
        Session.set("meetingId", meetingId);
        Session.set("userId", userId);
        Session.set("ordres", ordres);
        Session.set("ordreTimes", ordreTimes);

        //Envoi du mail à l'animateur
        Meteor.call('sendEmail',
            e.target.animatorEmail.value,
            'noreply@taketalk.com',
            'TakeTalk session created',
            'You have just created a session of TakeTalk. \n\n' + emailBody
        );

        //Envoi des mails aux invités
        for(var i = 0; i < participantsEmails.length; i++) {
            userId = Users.insert({name: 'participant pending', email: participantsEmails[i], type: "participant", status: "pending", meeting: meetingId});
            Meteor.call('sendEmail', participantsEmails[i], 'noreply@taketalk.com', 'TakeTalk invitation',
                'You are invited to a session of TakeTalk. \n\n' + emailBody
            );
        }

        //Redirection vers la page du meeting
        Router.go('/meeting/' + meetingId);
    }
});
