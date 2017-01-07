/** The configuration for the main layout */
Router.configure({
  layoutTemplate: 'layout'
});

/** The route to the home page */
Router.route('/', {name:'home'});

/** The route to the tutorial page*/
Router.route('/tutorial', {name: 'tutorial'});

Router.route('/create', {name: 'create'});

/** The route to the downloads page */
Router.route('/downloads', {name: 'downloads'});

/** The route to the create page
Router.route('/create', function () {
  this.render('create');
});*/

/** The route to the meeting page */
Router.route('/meeting/:_meetingId', {
  name: 'meeting',
  data: function() {
      // Ajout d'un meeting pour les tests accessible via /meeting/test
      // !!! A commenter en prod !!!
      var id = 'test';
      if (this.params._meetingId == id && Meetings.findOne({_id: id, status: "ongoing"}) === undefined) {
          //Meteor.call('resetAll');

          Meetings.insert({
              name: 'WorkShop Evry',
              status: "ongoing",
              password: '0000',
              reportLink: 'https://docs.google.com/document/d/15Pcc6L1ofe4bY2uxg0yxvaAZO_XZQPe8JlsnvnDUEaQ/edit?usp=sharing',
              _id: id
          });
          Users.insert({ name:'Franck FORET',
              email: 'franckforet@test.com',
              type: "animator",
              status: "online",
              meeting: id,
              _id: 'fforet'
          });

          Session.set("meetingId", id);
          //Session.set("ordres", ['Motiver les élèves', 'Former les participants', 'Préparer le repas du soir']);
          //Session.set("ordreTimes", [90, 130, 268]);
          Session.set("userId", 'fforet');

          /* Ajout d'une ligne dans le fichier d'historisation (log.txt)
          var fs = require('fs');
          var date = new Date();
          fs.writeFile("/log.txt", "[ " + date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear() + " - " +
              date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + " ] " +
              "Ajout du meeting \"" + Session.get("meetingId") + "\" pour test.", function(err) {
              if(err) {
                  return console.log("Erreur dans l'enregistrement des logs : " + err);
              }
              console.log("The file was saved!");
          }); //*/
      } // FIN ajout meeting test
      else{
          Session.set("meetingId", this.params._meetingId);
      }

  // Recherche du meeting dont l'id est passé en paramètre
  // Redirection vers une page d'erreur "404 not found" lorsqu'aucun meeting n'est trouvé
    var meeting = Meetings.findOne({_id: this.params._meetingId, status: "ongoing"});
    if(meeting === undefined){
        console.log('undefined meeting...');
        Router.configure({layoutTemplate: 'layout', notFoundTemplate: '404'});
    }

    //Alimentation du tableau users avec les utilisateur présent au meeting
    var users = [];
    Users.find({meeting: this.params._meetingId}).forEach(function(user) {
        var paroles = [];
        if(user.paroles !== undefined) {
            paroles = user.paroles;
        }
        users.push({name: user.name, paroles: paroles});
    });

    //Alimentation du tableau speeches avec les demandes de parole du meeting
    var speeches = [];
    Speeches.find({meeting: this.params._meetingId, status: {$in: ["ongoing", "pending"]}}, {sort: {rank: 1}}).forEach(function(speech) {
        var minutesLeft = Math.floor(speech.timeLeft / 60);
        var secondsLeft = speech.timeLeft % 60;
        var minutes = Math.floor(speech.time / 60);
        var seconds = speech.time % 60;

        if(secondsLeft < 10) {
            secondsLeft = "0" + secondsLeft;
        }
        if(seconds < 10) {
            seconds = "0" + seconds;
        }
        console.log(Users.findOne({_id: speech.user}).name);

        speeches.push({
            user: Users.findOne({_id: speech.user}).name,
            timeLeft: minutesLeft + ":" + secondsLeft,
            //timeString: speech.timeString,
            //time: minutes + ":" + seconds,
            //orderChoose: speech.orderChoose,
            //subject: speech.subject,
            status: speech.status == "ongoing",
            _id: speech._id,
            rank : speech.rank
        });
    });

    // Alimentation de la variable user avec l'utilisateur actuel
    var user = Users.findOne({_id: Session.get("userId")});
    var isAnimator = false;
    if(user !== undefined){
        if(user.type == "animator") isAnimator = true;
    }

    var talk = "Talk";

    //Variable definissant le statut du bouton permettant de lancer le décompte d'un speech ou de l'arrêter
    var proceed = "Wait";
    if(Speeches.findOne({meeting: this.params._meetingId, status: "ongoing"}) == undefined) {
      proceed = "Proceed";
    }

    //Variable de statut des bouton 'proceed/wait' et 'next'
    var disabled = "";
    if(Speeches.findOne({meeting: this.params._meetingId, status: {$in: ["ongoing", "pending"]}}) == undefined) {
      disabled = "disabled";
    }

    Speeches.find({user: Session.get("userId")}).observe({
      removed: function(speech) {
          if (!isAnimator) {
              $("#speech-delete-modal").modal("show");
          }
      }
    });

    return {
      meeting:    meeting.name,
      users:      users,
      speeches:   speeches,
      isAnimator: isAnimator,
      talk:       talk,
      proceed:    proceed,
      disabled:   disabled
    };
  }
});

/** The route to the join page */
Router.route('/join/:_meetingId/:_userId', {
    name: 'join',
    data: function() {

        // Recherche du meeting dont l'id est passé en paramètre
        // Redirection vers une page d'erreur "404 not found" lorsqu'aucun meeting n'est trouvé
        var meeting = Meetings.findOne({_id: this.params._meetingId});
        if(meeting === undefined){
            console.log('meeting undefined');
            Router.configure({layoutTemplate: 'layout', notFoundTemplate: '404'});
        }

        //Recherche de l'utilisateur
        //Redirection vers une page d'erreur "404 not found" lorsqu'aucun utilisateur n'est trouvé
        //Ne permet qu'aux utilisateurs invités de rejoindre un meeting
        var user = Users.findOne({_id: this.params._userId});
        if(user === undefined){
            console.log('user undefined');
            Router.configure({layoutTemplate: 'layout', notFoundTemplate: '404'});
        }

        Session.set("meetingId", this.params._meetingId);
        Session.set("userId", this.params._userId);

        return {};
    }
});

/** The route to the lineup page */
Router.route('/meeting/:_meetingId/lineup', function () {
    this.render('lineup');
});

/** The route to the end page */
Router.route('/end', function () {
    this.render('end');
});
