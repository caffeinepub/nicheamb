import Map "mo:core/Map";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Order "mo:core/Order";

actor {
  type Subject = {
    id : Nat;
    name : Text;
    strengthScore : Nat; // 0-100
    timeInvested : Nat; // Minutes
    lastStudied : Time.Time;
    priority : Priority;
    confidenceLabel : ConfidenceLabel;
    revisionDueDate : ?Time.Time;
  };

  type Priority = {
    #must_do;
    #should_do;
    #drop;
  };

  module Priority {
    public func compare(priority1 : Priority, priority2 : Priority) : Order.Order {
      switch (priority1, priority2) {
        case (#must_do, #must_do) { #equal };
        case (#must_do, _) { #less };
        case (#should_do, #must_do) { #greater };
        case (#should_do, #should_do) { #equal };
        case (#should_do, #drop) { #less };
        case (#drop, #drop) { #equal };
        case (#drop, _) { #greater };
      };
    };
  };

  type ConfidenceLabel = {
    #low;
    #medium;
    #high;
  };

  type StudySession = {
    id : Nat;
    subjectId : Nat;
    startTime : Time.Time;
    endTime : Time.Time;
    durationMinutes : Nat;
    focusRating : Nat; // 1-5
    completed : Bool;
    topic : Text;
  };

  type Goal = {
    id : Nat;
    subjectId : Nat;
    targetScore : Nat; // 0-100
    currentScore : Nat; // 0-100
    deadline : Time.Time;
  };

  type CalendarEvent = {
    id : Nat;
    subjectId : Nat;
    dayOfWeek : Nat; // 0-6
    startHour : Nat; // 0-23
    durationMinutes : Nat;
    topic : Text;
    completed : Bool;
  };

  let subjects = Map.empty<Nat, Subject>();
  let studySessions = Map.empty<Nat, StudySession>();
  let goals = Map.empty<Nat, Goal>();
  let calendarEvents = Map.empty<Nat, CalendarEvent>();

  var nextSubjectId = 1;
  var nextSessionId = 1;
  var nextGoalId = 1;
  var nextEventId = 1;

  public shared ({ caller }) func createSubject(name : Text) : async Nat {
    let id = nextSubjectId;
    nextSubjectId += 1;

    let subject : Subject = {
      id;
      name;
      strengthScore = 50;
      timeInvested = 0;
      lastStudied = Time.now();
      priority = #must_do;
      confidenceLabel = #medium;
      revisionDueDate = null;
    };

    subjects.add(id, subject);
    id;
  };

  public type UpdateSubject = {
    id : Nat;
    name : Text;
    strengthScore : Nat;
    timeInvested : Nat;
    lastStudied : Time.Time;
    priority : Priority;
    confidenceLabel : ConfidenceLabel;
    revisionDueDate : ?Time.Time;
  };

  public shared ({ caller }) func updateSubject(input : UpdateSubject) : async () {
    if (not subjects.containsKey(input.id)) { Runtime.trap("Subject does not exist") };
    let subject : Subject = {
      id = input.id;
      name = input.name;
      strengthScore = input.strengthScore;
      timeInvested = input.timeInvested;
      lastStudied = input.lastStudied;
      priority = input.priority;
      confidenceLabel = input.confidenceLabel;
      revisionDueDate = input.revisionDueDate;
    };
    subjects.add(input.id, subject);
  };

  public shared ({ caller }) func deleteSubject(id : Nat) : async () {
    if (not subjects.containsKey(id)) { Runtime.trap("Subject does not exist") };
    subjects.remove(id);
  };

  public query ({ caller }) func getSubject(id : Nat) : async Subject {
    switch (subjects.get(id)) {
      case (null) { Runtime.trap("Subject does not exist") };
      case (?subject) { subject };
    };
  };

  public query ({ caller }) func getAllSubjects() : async [Subject] {
    subjects.values().toArray();
  };

  public shared ({ caller }) func createStudySession(subjectId : Nat, startTime : Time.Time, endTime : Time.Time, focusRating : Nat, topic : Text) : async Nat {
    if (not subjects.containsKey(subjectId)) { Runtime.trap("Subject does not exist") };
    let duration = if (endTime > startTime) {
      ((endTime - startTime) / (60 * 1_000_000_000)) : Int;
    } else { 0 };
    let id = nextSessionId;
    nextSessionId += 1;

    let session : StudySession = {
      id;
      subjectId;
      startTime;
      endTime;
      durationMinutes = duration.toNat();
      focusRating;
      completed = true;
      topic;
    };

    studySessions.add(id, session);
    id;
  };

  public type UpdateSession = {
    id : Nat;
    subjectId : Nat;
    startTime : Time.Time;
    endTime : Time.Time;
    durationMinutes : Nat;
    focusRating : Nat;
    completed : Bool;
    topic : Text;
  };

  public shared ({ caller }) func updateStudySession(input : UpdateSession) : async () {
    if (not studySessions.containsKey(input.id)) { Runtime.trap("Study session does not exist") };
    let session : StudySession = {
      id = input.id;
      subjectId = input.subjectId;
      startTime = input.startTime;
      endTime = input.endTime;
      durationMinutes = input.durationMinutes;
      focusRating = input.focusRating;
      completed = input.completed;
      topic = input.topic;
    };
    studySessions.add(input.id, session);
  };

  public shared ({ caller }) func deleteStudySession(id : Nat) : async () {
    if (not studySessions.containsKey(id)) { Runtime.trap("Study session does not exist") };
    studySessions.remove(id);
  };

  public query ({ caller }) func getStudySession(id : Nat) : async StudySession {
    switch (studySessions.get(id)) {
      case (null) { Runtime.trap("Study session does not exist") };
      case (?session) { session };
    };
  };

  public query ({ caller }) func getAllStudySessions() : async [StudySession] {
    studySessions.values().toArray();
  };

  public shared ({ caller }) func createGoal(subjectId : Nat, targetScore : Nat, currentScore : Nat, deadline : Time.Time) : async Nat {
    if (not subjects.containsKey(subjectId)) { Runtime.trap("Subject does not exist") };
    let id = nextGoalId;
    nextGoalId += 1;

    let goal : Goal = {
      id;
      subjectId;
      targetScore;
      currentScore;
      deadline;
    };

    goals.add(id, goal);
    id;
  };

  public type UpdateGoal = {
    id : Nat;
    subjectId : Nat;
    targetScore : Nat;
    currentScore : Nat;
    deadline : Time.Time;
  };

  public shared ({ caller }) func updateGoal(input : UpdateGoal) : async () {
    if (not goals.containsKey(input.id)) { Runtime.trap("Goal does not exist") };
    let goal : Goal = {
      id = input.id;
      subjectId = input.subjectId;
      targetScore = input.targetScore;
      currentScore = input.currentScore;
      deadline = input.deadline;
    };
    goals.add(input.id, goal);
  };

  public shared ({ caller }) func deleteGoal(id : Nat) : async () {
    if (not goals.containsKey(id)) { Runtime.trap("Goal does not exist") };
    goals.remove(id);
  };

  public query ({ caller }) func getGoal(id : Nat) : async Goal {
    switch (goals.get(id)) {
      case (null) { Runtime.trap("Goal does not exist") };
      case (?goal) { goal };
    };
  };

  public query ({ caller }) func getAllGoals() : async [Goal] {
    goals.values().toArray();
  };

  public shared ({ caller }) func createCalendarEvent(subjectId : Nat, dayOfWeek : Nat, startHour : Nat, durationMinutes : Nat, topic : Text) : async Nat {
    if (not subjects.containsKey(subjectId)) { Runtime.trap("Subject does not exist") };
    let id = nextEventId;
    nextEventId += 1;

    let event : CalendarEvent = {
      id;
      subjectId;
      dayOfWeek;
      startHour;
      durationMinutes;
      topic;
      completed = false;
    };

    calendarEvents.add(id, event);
    id;
  };

  public type UpdateEvent = {
    id : Nat;
    subjectId : Nat;
    dayOfWeek : Nat;
    startHour : Nat;
    durationMinutes : Nat;
    topic : Text;
    completed : Bool;
  };

  public shared ({ caller }) func updateCalendarEvent(input : UpdateEvent) : async () {
    if (not calendarEvents.containsKey(input.id)) { Runtime.trap("Calendar event does not exist") };
    let event : CalendarEvent = {
      id = input.id;
      subjectId = input.subjectId;
      dayOfWeek = input.dayOfWeek;
      startHour = input.startHour;
      durationMinutes = input.durationMinutes;
      topic = input.topic;
      completed = input.completed;
    };
    calendarEvents.add(input.id, event);
  };

  public shared ({ caller }) func deleteCalendarEvent(id : Nat) : async () {
    if (not calendarEvents.containsKey(id)) { Runtime.trap("Calendar event does not exist") };
    calendarEvents.remove(id);
  };

  public query ({ caller }) func getCalendarEvent(id : Nat) : async CalendarEvent {
    switch (calendarEvents.get(id)) {
      case (null) { Runtime.trap("Calendar event does not exist") };
      case (?event) { event };
    };
  };

  public query ({ caller }) func getAllCalendarEvents() : async [CalendarEvent] {
    calendarEvents.values().toArray();
  };

  // Helper function to update subject's lastStudied time

  public shared ({ caller }) func updateSubjectLastStudied(subjectId : Nat, timestamp : Time.Time) : async () {
    switch (subjects.get(subjectId)) {
      case (null) { Runtime.trap("Subject does not exist") };
      case (?subject) {
        let updatedSubject : Subject = {
          id = subjectId;
          name = subject.name;
          strengthScore = subject.strengthScore;
          timeInvested = subject.timeInvested;
          lastStudied = timestamp;
          priority = subject.priority;
          confidenceLabel = subject.confidenceLabel;
          revisionDueDate = subject.revisionDueDate;
        };
        subjects.add(subjectId, updatedSubject);
      };
    };
  };

  public query ({ caller }) func getSubjectsByPriority() : async [Subject] {
    let subjectsArray = subjects.values().toArray();
    subjectsArray.sort(
      func(s1, s2) {
        switch (Priority.compare(s1.priority, s2.priority)) {
          case (#equal) { Nat.compare(s1.strengthScore, s2.strengthScore) };
          case (order) { order };
        };
      }
    );
  };

  public query ({ caller }) func getRevisionDueSubjects() : async [Subject] {
    let now = Time.now();
    subjects.values().toArray().filter(
      func(subject) {
        switch (subject.revisionDueDate) {
          case (null) { false };
          case (?date) { date <= now };
        };
      }
    );
  };

  public query ({ caller }) func getAvoidedSubjects() : async [Subject] {
    let threeDaysNanos = 3 * 24 * 60 * 60 * 1_000_000_000;
    let now = Time.now();
    subjects.values().toArray().filter(
      func(subject) {
        now - subject.lastStudied > threeDaysNanos;
      }
    );
  };
};
