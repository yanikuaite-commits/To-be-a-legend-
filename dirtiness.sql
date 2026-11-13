ALTER TABLE Player ADD SkillDirtiness int NOT NULL default 0;

--recreate the view NationalTeamSquadPlayer to include SkillDirtiness
DROP VIEW NationalTeamSquadPlayer;
CREATE VIEW NationalTeamSquadPlayer                                 
    AS SELECT 	                                
        Player.ID, Name, CountryID, NationalTeamSquad.ClubID, PlayerBodyElements, TacticRole, Rating,  	                                
        NationalTeamSquad.Number, NationalTeamSquad.PositionNumber, SkillStamina, SkillShoot,                                      
        SkillPass, SkillSpeed, SkillTackle, SkillGK, RatingPotential, SkillDirtiness, DOB,                                      
        PrimaryTacticRole, SecondaryTacticRole, SecondaryTacticRoleStrength,                                     
        InternationalCaps, ResignedFromNationalTeam                                 
        FROM Player                                 
        INNER JOIN NationalTeamSquad ON NationalTeamSquad.PlayerID = Player.ID;

--SkillDirtiness is empty now, so use it to calculate a random value
UPDATE Player SET SkillDirtiness = ABS(RANDOM() % 1000);

UPDATE Player
SET SkillDirtiness = CASE 
    WHEN SkillDirtiness < 436 THEN 1 + ABS(RANDOM() % 4)   
    WHEN SkillDirtiness < (436 + 388) THEN 5 + ABS(RANDOM() % 5)
    WHEN SkillDirtiness < (436 + 388 + 129) THEN 10 + ABS(RANDOM() % 5)
    WHEN SkillDirtiness < (436 + 388 + 129 + 34) THEN 15 + ABS(RANDOM() % 5)
    WHEN SkillDirtiness < (436 + 388 + 129 + 34 + 8) THEN 20 + ABS(RANDOM() % 5)
    ELSE 30 -- This case shouldn't be hit, but we provide a default just in case
    END
WHERE PrimaryTacticRole = 1; --GK

UPDATE Player
SET SkillDirtiness = CASE 
    WHEN SkillDirtiness < 18 THEN (1 + ABS(RANDOM() % 4))
    WHEN SkillDirtiness < (18 + 82) THEN (5 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (18 + 82 + 193) THEN (10 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (18 + 82 + 193 + 254) THEN (15 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (18 + 82 + 193 + 254 + 206) THEN (20 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (18 + 82 + 193 + 254 + 206 + 138) THEN (25 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (18 + 82 + 193 + 254 + 206 + 138 + 105) THEN (30 + ABS(RANDOM() % 5))
    ELSE 40 + ABS(RANDOM() % 10) -- This will cover 30-100
END
WHERE PrimaryTacticRole = 4; -- CB

UPDATE Player
SET SkillDirtiness = CASE 
    WHEN SkillDirtiness < 26 THEN (1 + ABS(RANDOM() % 4))
    WHEN SkillDirtiness < (26 + 131) THEN (5 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (26 + 131 + 204) THEN (10 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (26 + 131 + 204 + 264) THEN (15 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (26 + 131 + 204 + 264 + 180) THEN (20 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (26 + 131 + 204 + 264 + 180 + 115) THEN (25 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (26 + 131 + 204 + 264 + 180 + 115 + 77) THEN (30 + ABS(RANDOM() % 5))
    ELSE 40 + ABS(RANDOM() % 10) -- This will cover 30-100
END
WHERE PrimaryTacticRole = 3; -- LB

UPDATE Player
SET SkillDirtiness = CASE 
    WHEN SkillDirtiness < 26 THEN (1 + ABS(RANDOM() % 4))
    WHEN SkillDirtiness < (26 + 112) THEN (5 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (26 + 112 + 225) THEN (10 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (26 + 112 + 225 + 250) THEN (15 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (26 + 112 + 225 + 250 + 193) THEN (20 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (26 + 112 + 225 + 250 + 193 + 108) THEN (25 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (26 + 112 + 225 + 250 + 193 + 108 + 83) THEN (30 + ABS(RANDOM() % 5))
    ELSE 40 + ABS(RANDOM() % 10) -- This will cover 30-100
END
WHERE PrimaryTacticRole = 2; -- RB

UPDATE Player
SET SkillDirtiness = CASE 
    WHEN SkillDirtiness < 11 THEN (1 + ABS(RANDOM() % 4))
    WHEN SkillDirtiness < (11 + 45) THEN (5 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (11 + 45 + 109) THEN (10 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (11 + 45 + 109 + 187) THEN (15 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (11 + 45 + 109 + 187 + 202) THEN (20 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (11 + 45 + 109 + 187 + 202 + 186) THEN (25 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (11 + 45 + 109 + 187 + 202 + 186 + 242) THEN (30 + ABS(RANDOM() % 5))
    ELSE 40 + ABS(RANDOM() % 10) -- This will cover 30-100
END
WHERE PrimaryTacticRole = 5; -- DM

UPDATE Player
SET SkillDirtiness = CASE 
    WHEN SkillDirtiness < 62 THEN (1 + ABS(RANDOM() % 4))
    WHEN SkillDirtiness < (62 + 185) THEN (5 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (62 + 185 + 253) THEN (10 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (62 + 185 + 253 + 208) THEN (15 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (62 + 185 + 253 + 208 + 147) THEN (20 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (62 + 185 + 253 + 208 + 147 + 75) THEN (25 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (62 + 185 + 253 + 208 + 147 + 75 + 69) THEN (30 + ABS(RANDOM() % 5))
    ELSE 40 + ABS(RANDOM() % 10) -- This will cover 30-100
END
WHERE PrimaryTacticRole IN (6, 7); -- RW, LW

UPDATE Player
SET SkillDirtiness = CASE 
    WHEN SkillDirtiness < 34 THEN (1 + ABS(RANDOM() % 4))
    WHEN SkillDirtiness < (34 + 111) THEN (5 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (34 + 111 + 191) THEN (10 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (34 + 111 + 191 + 214) THEN (15 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (34 + 111 + 191 + 214 + 187) THEN (20 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (34 + 111 + 191 + 214 + 187 + 127) THEN (25 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (34 + 111 + 191 + 214 + 187 + 127 + 125) THEN (30 + ABS(RANDOM() % 5))
    ELSE 40 + ABS(RANDOM() % 10) -- This will cover 30-100
END
WHERE PrimaryTacticRole = 8; -- AM

UPDATE Player
SET SkillDirtiness = CASE 
    WHEN SkillDirtiness < 51 THEN (1 + ABS(RANDOM() % 4))
    WHEN SkillDirtiness < (51 + 168) THEN (5 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (51 + 168 + 251) THEN (10 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (51 + 168 + 251 + 222) THEN (15 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (51 + 168 + 251 + 222 + 146) THEN (20 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (51 + 168 + 251 + 222 + 146 + 82) THEN (25 + ABS(RANDOM() % 5))
    WHEN SkillDirtiness < (51 + 168 + 251 + 222 + 146 + 82 + 73) THEN (30 + ABS(RANDOM() % 5))
    ELSE 40 + ABS(RANDOM() % 10) -- This will cover 30-100
END
WHERE PrimaryTacticRole = 9; -- CF
