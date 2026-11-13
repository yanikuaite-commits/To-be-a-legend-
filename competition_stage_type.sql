ALTER TABLE CompetitionStage RENAME TO CompetitionStage_old;

CREATE TABLE CompetitionStage (
    id INTEGER PRIMARY KEY,
    CompetitionID INT NOT NULL,
    FullName TEXT NOT NULL,
    Name TEXT NOT NULL,
    StartingWeek INT NOT NULL,
    StageType INTEGER NOT NULL,
    NumLegs INT NOT NULL,
    NumRounds INT NOT NULL,
    IsLastStage INTEGER NOT NULL,
    NumGroups INT NOT NULL,
    ImportStandingsFromPreviousStage INTEGER NOT NULL,
    AllowByeTeamsOnDraw INTEGER NOT NULL,
    NumberOfTeams INT,
    PrimaryMatchDay INT NOT NULL,
    SecondaryMatchDay INT NOT NULL,
    Duration INT NOT NULL,
    isWinnerDecisionStage INTEGER NOT NULL,
    Longitude DOUBLE,
    Latitude DOUBLE,
    CountGoalScorers INT NOT NULL
);

INSERT INTO CompetitionStage (id, CompetitionID, FullName, Name, StartingWeek, StageType, NumLegs, NumRounds, IsLastStage, NumGroups, ImportStandingsFromPreviousStage, AllowByeTeamsOnDraw, NumberOfTeams, PrimaryMatchDay, SecondaryMatchDay, Duration, isWinnerDecisionStage, Longitude, Latitude, CountGoalScorers)
SELECT id, CompetitionID, FullName, Name, StartingWeek, KnockOut, NumLegs, NumRounds, IsLastStage, NumGroups, ImportStandingsFromPreviousStage, AllowByeTeamsOnDraw, NumberOfTeams, PrimaryMatchDay, SecondaryMatchDay, Duration, isWinnerDecisionStage, Longitude, Latitude, CountGoalScorers
FROM CompetitionStage_old;

DROP TABLE CompetitionStage_old;