DROP VIEW IF EXISTS NationalTeamSquadPlayer;

ALTER TABLE Player ADD COLUMN PrimaryTacticRole INT NOT NULL DEFAULT 0;
ALTER TABLE Player ADD COLUMN SecondaryTacticRole INT;
ALTER TABLE Player ADD COLUMN SecondaryTacticRoleStrength INT;

UPDATE Player SET PrimaryTacticRole =
    CASE
        WHEN PrimaryTacticRolesDetailed & (1 << 0) THEN 1 -- GK
        WHEN PrimaryTacticRolesDetailed & (1 << 1) THEN 2 -- RB
        WHEN PrimaryTacticRolesDetailed & (1 << 2) THEN 3 -- LB
        WHEN PrimaryTacticRolesDetailed & (1 << 3) THEN 4 -- CB
        WHEN PrimaryTacticRolesDetailed & (1 << 4) THEN 5 -- DM
        WHEN PrimaryTacticRolesDetailed & (1 << 8) THEN 6 -- LW
        WHEN PrimaryTacticRolesDetailed & (1 << 9) THEN 7 -- RW
        WHEN PrimaryTacticRolesDetailed & (1 << 5) THEN 8 -- CM -> AM (CM, LM, RM) 
        WHEN PrimaryTacticRolesDetailed & (1 << 6) THEN 8 -- LM -> AM (CM, LM, RM)
        WHEN PrimaryTacticRolesDetailed & (1 << 7) THEN 8 -- RM -> AM (CM, LM, RM)
        WHEN PrimaryTacticRolesDetailed & (1 << 10) THEN 8 -- AM
        WHEN PrimaryTacticRolesDetailed & (1 << 11) THEN 9 -- ST -> CF (LF, RF, ST)
        WHEN PrimaryTacticRolesDetailed & (1 << 12) THEN 9 -- LF -> CF (LF, RF, ST)
        WHEN PrimaryTacticRolesDetailed & (1 << 13) THEN 9 -- RF -> CF (LF, RF, ST)
        WHEN PrimaryTacticRolesDetailed & (1 << 14) THEN 9 -- CF
        ELSE NULL
    END;

UPDATE Player SET SecondaryTacticRole =
    CASE
        WHEN (PrimaryTacticRolesDetailed & (PrimaryTacticRolesDetailed - 1)) > 0 THEN 
            CASE
                WHEN PrimaryTacticRolesDetailed & (1 << 0) AND PrimaryTacticRole <> 1 THEN 1 -- GK
                WHEN PrimaryTacticRolesDetailed & (1 << 1) AND PrimaryTacticRole <> 2 THEN 2 -- RB
                WHEN PrimaryTacticRolesDetailed & (1 << 2) AND PrimaryTacticRole <> 3 THEN 3 -- LB
                WHEN PrimaryTacticRolesDetailed & (1 << 3) AND PrimaryTacticRole <> 4 THEN 4 -- CB
                WHEN PrimaryTacticRolesDetailed & (1 << 4) AND PrimaryTacticRole <> 5 THEN 5 -- DM
				
                WHEN PrimaryTacticRolesDetailed & (1 << 5) AND PrimaryTacticRole <> 8 THEN 8 -- CM -> AM (CM, LM, RM) 
                WHEN PrimaryTacticRolesDetailed & (1 << 6) AND PrimaryTacticRole <> 8 THEN 8 -- LM -> AM (CM, LM, RM) 
                WHEN PrimaryTacticRolesDetailed & (1 << 7) AND PrimaryTacticRole <> 8 THEN 8 -- RM -> AM (CM, LM, RM) 
				
                WHEN PrimaryTacticRolesDetailed & (1 << 8) AND PrimaryTacticRole <> 6 THEN 6 -- LW
                WHEN PrimaryTacticRolesDetailed & (1 << 9) AND PrimaryTacticRole <> 7 THEN 7 -- RW
                WHEN PrimaryTacticRolesDetailed & (1 << 10) AND PrimaryTacticRole <> 8 THEN 8 -- AM
				
                WHEN PrimaryTacticRolesDetailed & (1 << 11) AND PrimaryTacticRole <> 9 THEN 9 -- ST -> CF (LF, RF, ST)
                WHEN PrimaryTacticRolesDetailed & (1 << 12) AND PrimaryTacticRole <> 9 THEN 9 -- LF -> CF (LF, RF, ST)
                WHEN PrimaryTacticRolesDetailed & (1 << 13) AND PrimaryTacticRole <> 9 THEN 9 -- RF -> CF (LF, RF, ST)
                WHEN PrimaryTacticRolesDetailed & (1 << 14) AND PrimaryTacticRole <> 9 THEN 9 -- CF
                ELSE NULL
            END
        ELSE NULL
    END;

UPDATE Player SET SecondaryTacticRole =
    CASE
        WHEN (SecondaryTacticRole IS NULL AND SecondaryTacticRolesDetailed > 0) THEN
            CASE
                WHEN SecondaryTacticRolesDetailed & (1 << 0) AND PrimaryTacticRole <> 1 THEN 1 -- GK
                WHEN SecondaryTacticRolesDetailed & (1 << 1) AND PrimaryTacticRole <> 2 THEN 2 -- RB
                WHEN SecondaryTacticRolesDetailed & (1 << 2) AND PrimaryTacticRole <> 3 THEN 3 -- LB
                WHEN SecondaryTacticRolesDetailed & (1 << 3) AND PrimaryTacticRole <> 4 THEN 4 -- CB
                WHEN SecondaryTacticRolesDetailed & (1 << 4) AND PrimaryTacticRole <> 5 THEN 5 -- DM
				
                WHEN SecondaryTacticRolesDetailed & (1 << 5) AND PrimaryTacticRole <> 8 THEN 8 -- CM -> AM (CM, LM, RM) 
                WHEN SecondaryTacticRolesDetailed & (1 << 6) AND PrimaryTacticRole <> 8 THEN 8 -- LM -> AM (CM, LM, RM) 
                WHEN SecondaryTacticRolesDetailed & (1 << 7) AND PrimaryTacticRole <> 8 THEN 8 -- RM -> AM (CM, LM, RM) 

                WHEN SecondaryTacticRolesDetailed & (1 << 6) AND PrimaryTacticRole <> 6 THEN 6 -- LM -> LW (only if already AM)
                WHEN SecondaryTacticRolesDetailed & (1 << 7) AND PrimaryTacticRole <> 7 THEN 7 -- RM -> RW (only if already AM)
				
                WHEN SecondaryTacticRolesDetailed & (1 << 8) AND PrimaryTacticRole <> 6 THEN 6 -- LW
                WHEN SecondaryTacticRolesDetailed & (1 << 9) AND PrimaryTacticRole <> 7 THEN 7 -- RW
                WHEN SecondaryTacticRolesDetailed & (1 << 10) AND PrimaryTacticRole <> 8 THEN 8 -- AM
				
                WHEN SecondaryTacticRolesDetailed & (1 << 11) AND PrimaryTacticRole <> 9 THEN 9 -- ST -> CF (LF, RF, ST)
                WHEN SecondaryTacticRolesDetailed & (1 << 12) AND PrimaryTacticRole <> 9 THEN 9 -- LF -> CF (LF, RF, ST)
                WHEN SecondaryTacticRolesDetailed & (1 << 13) AND PrimaryTacticRole <> 9 THEN 9 -- RF -> CF (LF, RF, ST)

                WHEN SecondaryTacticRolesDetailed & (1 << 14) AND PrimaryTacticRole <> 9 THEN 9 -- CF
                ELSE NULL
            END
        ELSE SecondaryTacticRole
    END;

UPDATE Player SET SecondaryTacticRoleStrength =
    CASE
        WHEN SecondaryTacticRolesPenalty > 0 THEN (100 - SecondaryTacticRolesPenalty)
        ELSE NULL
    END
WHERE SecondaryTacticRole IS NOT NULL;

--some players have multiple primary positions (from the previous version)
UPDATE Player SET SecondaryTacticRoleStrength = 100 WHERE SecondaryTacticRoleStrength IS NULL AND SecondaryTacticRole IS NOT NULL;

-- Step 1: Create a new table without the old PrimaryTacticRolesDetailed
CREATE TABLE Player_new (ID INTEGER PRIMARY KEY, Name TEXT NOT NULL, CountryID INT NOT NULL, ClubID INT, PlayerBodyElements INT NOT NULL,
TacticRole INT NOT NULL, Rating INT NOT NULL, Number INT NOT NULL, PositionNumber INT NOT NULL, SkillStamina INT NOT NULL, SkillShoot INT NOT NULL, 
SkillPass INT NOT NULL, SkillSpeed INT NOT NULL, SkillTackle INT NOT NULL, SkillGK INT NOT NULL, RatingPotential INT NOT NULL, DOB INT NOT NULL, 
TransferListed INTEGER NOT NULL DEFAULT 0, InternationalCaps INTEGER NOT NULL DEFAULT 0,
ResignedFromNationalTeam INTEGER NOT NULL DEFAULT 0, PrimaryTacticRole INT NOT NULL DEFAULT 0, SecondaryTacticRole INT, SecondaryTacticRoleStrength INT);

INSERT INTO Player_new SELECT ID, Name, CountryID, ClubID, PlayerBodyElements, TacticRole, Rating, Number, PositionNumber, SkillStamina, SkillShoot, SkillPass, SkillSpeed, 
SkillTackle, SkillGK, RatingPotential, DOB, TransferListed, COALESCE(InternationalCaps, 0), ResignedFromNationalTeam, 
PrimaryTacticRole, SecondaryTacticRole, SecondaryTacticRoleStrength FROM Player;

--creates the NationalTeamSquad table only for the case where it doesn't exist (db version < 36). to make the rest of the script execute without errors
CREATE TABLE IF NOT EXISTS NationalTeamSquad (
    ClubID INTEGER NOT NULL, PlayerID INTEGER NOT NULL, Number INTEGER NOT NULL, PositionNumber INTEGER NOT NULL, PRIMARY KEY (ClubID, PlayerID)
);

--to allow Player table to be removed, the foreign key from player has to be removed from table NationalTeamSquad
-- Step 1: Create a temporary table with the desired structure (without the foreign key constraints)
CREATE TABLE NationalTeamSquad_temp (
    ClubID INTEGER NOT NULL,
    PlayerID INTEGER NOT NULL,
    Number INTEGER NOT NULL,
    PositionNumber INTEGER NOT NULL,
    PRIMARY KEY (ClubID, PlayerID)
);
-- Step 2: Copy the data from the original table to the temporary table
INSERT INTO NationalTeamSquad_temp (ClubID, PlayerID, Number, PositionNumber)
SELECT ClubID, PlayerID, Number, PositionNumber FROM NationalTeamSquad;
-- Step 3: Drop the original table
DROP TABLE IF EXISTS NationalTeamSquad;
-- Step 4: Rename the temporary table to the original table name
ALTER TABLE NationalTeamSquad_temp RENAME TO NationalTeamSquad;

--------------------------------------------------------------------

DROP TABLE Player;

ALTER TABLE Player_new RENAME TO Player;

CREATE VIEW NationalTeamSquadPlayer
    AS SELECT
    Player.ID, Name, CountryID, NationalTeamSquad.ClubID, PlayerBodyElements, TacticRole, Rating,
    NationalTeamSquad.Number, NationalTeamSquad.PositionNumber, SkillStamina, SkillShoot,
    SkillPass, SkillSpeed, SkillTackle, SkillGK, RatingPotential, DOB,
    PrimaryTacticRole, SecondaryTacticRole, SecondaryTacticRoleStrength,
    InternationalCaps, ResignedFromNationalTeam
    FROM Player
    INNER JOIN NationalTeamSquad ON NationalTeamSquad.PlayerID = Player.ID;