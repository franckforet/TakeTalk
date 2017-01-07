var timerId = 0;

//Initialisation de la fonction de tri par drag'n'drop des speech
var sortableList;

Template.meeting.onRendered(function () {
$(document).ready(function(){
  $('#textareaRich').summernote({
    height: 300,
  });
});
});


Template.meeting.events({
  'click #saveReport' :function(e) {
    // increment the counter when button is clicked
    console.log("I click on Talk");
    var title = $(' #TitleReport').val();
    var data = $('#textareaRich').summernote('code');
    //$('.click2edit').summernote('destroy');
    console.log("title :" + title + " data = " + data);
    var doc = new jsPDF();
    doc.text(10,10,data);
    doc.save(title);
    //Fonctionne mais enregistre en .txt
    //var blob = new Blob([data], {type: "text/plain;charset=utf-8"});
    //saveAs(blob, title+".txt");
  }
});


function computeSortable(element) {
  element.sortable({
    items: "div.speech-item:not(.active)",
    stop: function(e, ui) {
      // get the dragged html element and the one before
      //   and after it
      el = ui.item.get(0);
      before = ui.item.prev().get(0);
      after = ui.item.next().get(0);
      newRank = null;

      //  Blaze.getData takes as a parameter an html element
      //    and will return the data context that was bound when
      //    that html element was rendered!
      if (!before) {
        //if it was dragged into the first position grab the
        // next element's data context and subtract one from the rank
        newRank = parseInt(Blaze.getData(after).rank) - 1;
      } else if (!after) {
        //if it was dragged into the last position grab the
        //  previous element's data context and add one to the rank
        newRank = parseInt(Blaze.getData(before).rank) + 1;
      }
      else {
        //else take the average of the two ranks of the previous
        // and next elements
        newRank = (parseInt(Blaze.getData(after).rank) + parseInt(Blaze.getData(before).rank)) / 2;
      }

      //update the dragged Item's rank
      if (newRank != null) {
        Speeches.update(Speeches.findOne({_id: Blaze.getData(el)._id})._id, {$set: {rank: newRank}});
      }
      else {
        return false;
      }
    }
  })
};


//Appel de la fonction d'initialisation de tri par drag'n'drop à la fin du rendu de la page
Template.meeting.rendered = function () {
  // sortableList = this.$('#speech-list');
  // sortableList.disableSelection();
  // if (Users.findOne({_id: Session.get("userId")}).type == "animator") {
  //   computeSortable(sortableList);
  // }
};



/** The events that meeting template contains */
Template.meeting.events({
  'click #talkCancel': function(e) {
    console.log("I click on Talk");
    //à modifier
      var userId = Session.get("userId");
      var rank = 1;
      console.log("userId = " + userId);
      //Recherche du speech ayant le plus haut rang
      speeches = Speeches.find({meeting: Session.get("meetingId")}, {sort: {rank: -1}}).fetch();
      if (speeches.length > 0) {
          rank = speeches[0].rank+1;
      }
      Speeches.insert({
          user: userId,
          timeLeft: 0,
          status: "pending",
          meeting: Session.get("meetingId"),
          rank: rank
      });
  },


  /** A click on waitProceed starts or stops the timer */
  'click #waitProceed': function(e) {
    //Arret du timer
    if(e.target.value == "Wait") {
      Meteor.clearInterval(timerId);
      Speeches.update(
        Speeches.findOne({meeting: Session.get("meetingId"), status: "ongoing"})._id,
        {$set: {status: "pending"}}
      );
    } else {
      Speeches.update(
        Speeches.findOne({meeting: Session.get("meetingId"), status: "pending"}, {sort: {rank: 1}})._id,
        {$set: {status: "ongoing"}}
      );

      //Lancement du timer
      timerId = Meteor.setInterval(function() {
        var currentSpeech = Speeches.findOne({meeting: Session.get("meetingId"), status: "ongoing"});
        var user = Users.findOne({_id:currentSpeech.user});
        var paroles = [];
        var time = 1;

        //Incrémentation du compteur associé a l'ordre du speech
        if (user.paroles === undefined) {
          paroles.push({"order": currentSpeech.orderChoose, "time": 1});
        } else {
          var paroleFound = false;
          paroles = user.paroles;
          paroles.forEach(function (el) {
            if (el['order'] == currentSpeech.orderChoose) {
              paroleFound = true;
              el['time'] = parseInt(el['time'])+1;
            }
          });
          if (!paroleFound) {
            paroles.push({"order": currentSpeech.orderChoose, "time": 1});
          }
        }

        Users.update(user._id,  {$set: {paroles: paroles}});

        //Update du temps restant du speech
        Speeches.update(
          currentSpeech._id,
          {$set: {timeLeft: Speeches.findOne({meeting: Session.get("meetingId"), status: "ongoing"}).timeLeft + 1}}
        );
        //Update du statut du speech si celui ci est terminé
        if(Speeches.findOne({meeting: Session.get("meetingId"), status: "ongoing"}).timeLeft == Speeches.findOne({meeting: Session.get("meetingId"), status: "ongoing"}).time){
          Speeches.update(
            Speeches.findOne({meeting: Session.get("meetingId"), status: "ongoing"})._id,
            {$set: {status: "done"}}
          );
          Meteor.clearInterval(timerId);
        }
      } , 1000);
    }
    //Rafraichi la fonction de drag'n'drop
    //Utile pour empêcher le déplacement du premier meeting quand on clique sur 'proceed'
    //trouver une autre solution (la méthode "refresh" semble inefficace)
    setTimeout(function () {
      sortableList.sortable("destroy");
      computeSortable(sortableList);
    }, 100)
    ;
  },

  /** A click on next goes to the next speech */
  'click #next': function() {
    Meteor.clearInterval(timerId);
    Speeches.update(Speeches.findOne({meeting: Session.get("meetingId"), status: {$in: ["ongoing", "pending"]}})._id, {$set: {status: "done"}});
  },

  /** A click on closeMeeting closes the meeting */
  'click #closeMeeting': function() {
    Meetings.update(Session.get("meetingId"), {$set: {status: "done"}});
    Session.set("meetingId", "");
    Session.set("userId", "");
    Router.go("end");
  },

  //Ajout d'un nouveau champ de saisie lorsqu'un caractère est renseigné
  'keyup .participantsEmails': function(e) {
    var input = $(e.target);

    if (input.val().length > 0) {
      var rank = input.parents(".participantEmailInput")[0].getAttribute('rank');
      var form = input.parents("#inviteForm");
      var nextRank = parseInt(rank) + 1;

      if ($(form).find('.participantEmailInput[rank="'+nextRank+'"]').length < 1) {
        var newInput = $(input.parents(".participantEmailInput")[0].cloneNode(true));
        newInput.find(".participantsEmails").val("");
        newInput.attr('rank', nextRank);
        $(input.parents(".email-input-group")[0]).append(newInput);
      }
    }
  },

  //Ajout d'un nouveau champ de saisie lorsqu'un caractère est renseigné
  'keyup .participantsName': function(e) {
    var input = $(e.target);

    if (input.val().length > 0) {
      var rank = input.parents(".participantNameInput")[0].getAttribute('rank');
      var form = input.parents("#localForm");
      var nextRank = parseInt(rank) + 1;

      if ($(form).find('.participantNameInput[rank="'+nextRank+'"]').length < 1) {
        var newInput = $(input.parents(".participantNameInput")[0].cloneNode(true));
        newInput.find(".participantsName").val("");
        newInput.attr('rank', nextRank);
        $(input.parents(".name-input-group")[0]).append(newInput);
      }
    }
  },

  'submit #inviteForm': function(e) {
    e.preventDefault();
    var meetingId = Session.get("meetingId");
    var meeting = Meetings.findOne({_id:meetingId});
    var dialog = $("#invitationModal");
    dialog.modal("hide");

    var participantsInputs = $('.participantsEmails');
    var participantsEmails = [];

    for (i = 0; i < participantsInputs.length; i++) {
      if (participantsInputs[i].value != "") {
        participantsEmails.push(participantsInputs[i].value);
      }
    }

    // remove already invited emails from emails to invite
    var invitedParticipants = Session.get('invitedParticipants');
    if (typeof invitedParticipants != 'undefined') {
      for (i = 0; i < invitedParticipants.length; i++) {
        for (var j = 0; j < participantsEmails.length; j++) {
          if (invitedParticipants[i] == participantsEmails[j]) {
            participantsEmails.splice(j,1);
          }
        }
      }
      invitedParticipants = invitedParticipants.concat(participantsEmails);
      Session.set('invitedParticipants', invitedParticipants);
    } else {
      Session.set('invitedParticipants', participantsEmails);
    }

    var userId = "";
    for(var i = 0; i < participantsEmails.length; i++) {
      //Création des utilisateurs invités
      userId = Users.insert({
        name: 'participant pending',
        email: participantsEmails[i],
        type: "participant",
        status: "pending",
        meeting: meetingId
      });

      //Envoi d'un mail aux invités pour qu'ils puissent rejoindre le meeting
      Meteor.call('sendEmail', participantsEmails[i], 'noreply@taketalk.com', 'TakeTalk invitation',
      'You are invited to a session of TakeTalk. \n\n' +
      'Please follow this link : taketalk.meteor.com/join/' + meetingId + '/' + userId + '\n' +
      'Here is the link of the report : ' + meeting.reportLink + '\n\n' +
      'If you quit the meeting and want to return here is the password : ' + meeting.password
    );
    //console.log('taketalk.meteor.com/join/' + meetingId + '/' + userId + ' -> ' + meeting.password);
  }

  //
  $(".participantEmailInput[rank!='1']").remove();
  participantsInputs.val("");
},

'submit #localForm': function(e) {
  e.preventDefault();
  var meetingId = Session.get("meetingId");
  var dialog = $("#localModal");
  dialog.modal("hide");

  var nameInputs = $('.participantsName');
  var participantsName = [];

  for (var i = 0; i < nameInputs.length; i++) {
    if (nameInputs[i].value != "") {
      participantsName.push(nameInputs[i].value);
    }
  }

  //* remove already invited emails from emails to invite
  var localParticipants = Session.get("guests");
  if (typeof localParticipants != 'undefined') {
    for (i = 0; i < localParticipants.length; i++) {
      for (var j = 0; j < participantsName.length; j++) {
        if (localParticipants[i] == participantsName[j]) {
          participantsName.splice(j,1);
        }
      }
    }
    localParticipants = localParticipants.concat(participantsName);
    Session.set("guests", localParticipants);
  } else {
    Session.set("guests", participantsName);
  }

  $(".participantNameInput[rank!='1']").remove();
  nameInputs.val("");

  //Création des utilisateurs ajoutés en local
  for (i = 0; i < participantsName.length; i++) {
    Users.insert({
      name: participantsName[i],
      type: "",
      status: "online",
      meeting: meetingId,
      _id: participantsName[i]
    });
  }
},

'click .removeGuest': function(e) {
  e.preventDefault();
  var guests = Session.get("guests");
  var guestToRemove = $(e.target).parents( ".guestRemove" ).attr("guest");
  guests.splice(guests.indexOf(guestToRemove),1);
  Session.set("guests", guests);
  Users.remove({_id: guestToRemove});
},

'click .remove-speech': function(e) {
  e.preventDefault();
  var speechId = $(e.target).parents( ".speechRemove" ).attr("speech-id");
  Speeches.remove({_id: speechId});
}
});

Template.meeting.helpers ({
  //Retourne l'ordre du jour et les temps estimés
  ordres: function () {
    var meeting = Meetings.findOne({_id: Session.get("meetingId")});
    var ordres = meeting.ordres;
    var times = meeting.ordreTimes;
    var lengthOrdres = ordres.length;
    var ordreAndTimes = new Array(lengthOrdres);
    for (var i = 0; i < lengthOrdres; i++) {
      ordreAndTimes[i] = {"ordre" : ordres[i], "time" :times[i]};
    }
    return ordreAndTimes;
  },

  //Retourne le ien du rapport du meeting
  reportLink: function () {
    var meeting = Meetings.findOne({_id: Session.get("meetingId")});
    return meeting.reportLink;
  },

  //Retourne vrai si un lien de rapport a été renseigné a la création
  isReportLink: function() {
    return Meetings.findOne({_id: Session.get("meetingId")}).reportLink != "";
  },

  isTimeNull: function (time) {
    return time == '0:00';
  },

  //Retourne les utilisateurs ajoutés en local
  guests: function () {
    return Session.get("guests");
  },

  //Retourne vrai si le paramètre est le nom d'un utilisateur ajouté localement
  isSessionGuest: function (name) {
    var guests = Session.get("guests");
    if (guests !== undefined) {
      return (guests.indexOf(name) >= 0);
    }
    return false;
  },

  //Retourne vrai si l'utilisateur local est animateur
  isAnimator: function() {
    return Users.findOne({_id: Session.get("userId")}).type == "animator";
  },

  //Retourne vrai si le speech a des mots clé
  isSubject: function(id) {
    return Speeches.findOne({_id: id}).subject != "";
  },

  //Retourne les speech triés par rang
  sortedSpeeches: function() {
    return Speeches.find({}, {sort: {rank: 1}});
  }
});


Template.parole.helpers ({
  displayTime: function(time) {
    var response;
    if (time < 60) {
      response = time +' secondes';
    } else {
      amount = Math.floor(parseInt(time)/60);
      response =  amount+' minute';
      if (amount > 1) {
        response += 's';
      }
    }
    return response;
  }
});


/*
// ******************************************************************************************************************
// Fonction de QRCode à partir de la library qrcodejs disponible sur le site http://davidshimjs.github.io/qrcodejs/
// ******************************************************************************************************************
$(document).ready(function(){

var meetingId = Session.get("meetingId");
var userId = Users.insert({
name: 'participant pending',
email: "temp@taketalk.fr",
type: "participant",
status: "pending",
meeting: meetingId
});
console.log('taketalk.meteor.com/join/' + meetingId + '/' + userId);

//new QRCode(document.getElementById("qrcode"), "http://taketalk.meteor.com/join/" + meetingId + "/" + userId);
var qrcode = new QRCode(document.getElementById("qrcode"), {
text: "http://taketalk.meteor.com/join/" + meetingId + "/" + userId,
width: 128,
height: 128,
colorDark: "#000000",
colorLight: "#ffffff",
correctLevel: QRCode.CorrectLevel.H
});
//qrcode.makeCode("http://taketalk.meteor.com/join/" + meetingId + "/" + userId);
}); //*/
