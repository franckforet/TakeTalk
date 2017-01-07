if (Meetings.find().count() === 0){


  var meetingId = Meetings.insert({
      name: "Workshop Essilor",
      status: "ongoing",
      ordres: ['ordre1', 'ordre2', 'ordre3'],
      ordreTimes: [90, 130, 268],
      password: "pass",
      _id: "test",
      reportLink: 'https://docs.google.com/document/d/15Pcc6L1ofe4bY2uxg0yxvaAZO_XZQPe8JlsnvnDUEaQ/edit?usp=sharing',
  });


}
