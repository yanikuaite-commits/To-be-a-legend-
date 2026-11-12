class_name CareerManager
extends RefCounted

const TOTAL_WEEKS := 24
const LEAGUE_ROUNDS := 18
const LEAGUE_START_WEEKS := 18


static func new_career(
	first_name: String,
	last_name: String,
	nationality: String,
	position: String,
	club_id: String,
	base_index: int,
	seed_value: int = 0
) -> Dictionary:
	var rng := RandomNumberGenerator.new()
	var chosen_seed := seed_value if seed_value != 0 else int(Time.get_unix_time_from_system()) + randi()
	rng.seed = chosen_seed
	if not GameData.positions.has(position):
		position = "PL"
	var club := GameData.club(club_id)
	var attrs := _starting_attributes(position, rng)
	var overall := GameData.overall(attrs, position)
	var potential := mini(94, overall + rng.randi_range(12, 22))
	var salary := int(1100 + maxf(0.0, 62.0 - float(club.get("overall", 55))) * 120.0)
	var career := {
		"version": 1,
		"save_version": 1,
		"created_at": int(Time.get_unix_time_from_system()),
		"updated_at": int(Time.get_unix_time_from_system()),
		"seed": chosen_seed,
		"player": {
			"first_name": first_name.strip_edges() if not first_name.strip_edges().is_empty() else "Alex",
			"last_name": last_name.strip_edges() if not last_name.strip_edges().is_empty() else "Silva",
			"nationality": nationality,
			"position": position,
			"number": _number_for_position(position),
			"base_index": clampi(base_index, 0, 12),
			"age": 16,
			"attributes": attrs,
			"potential": potential,
			"overall": overall,
			"energy": 100,
			"morale": 72,
			"form": 60,
			"reputation": 8,
			"coach_trust": 58,
			"specialty": "",
			"injury_weeks": 0,
		},
		"club_id": str(club.get("id", club_id)),
		"contract": {
			"salary": salary,
			"years": 3,
			"role": "Promessa",
			"signed_season": 2026,
		},
		"season": 2026,
		"season_label": "2026/27",
		"week": 1,
		"total_weeks": TOTAL_WEEKS,
		"trained_week": 0,
		"career_stats": _empty_stats(),
		"season_stats": _empty_stats(),
		"season_start_overall": overall,
		"fixtures": [],
		"league": {},
		"news": [],
		"history": [],
		"last_report": {},
		"season_complete": false,
		"season_summary": {},
		"retired": false,
	}
	_build_season(career, rng)
	_add_news(career, "Bem-vindo à Academia", "%s assina o primeiro contrato com o %s. A época começa agora." % [_player_name(career), club.get("name", "clube")], "career")
	career["league"]["position"] = league_position(career)
	return career


static func _starting_attributes(position: String, rng: RandomNumberGenerator) -> Dictionary:
	var attrs := {}
	var weights: Dictionary = GameData.overall_weights.get(position, {})
	for key in GameData.attr_keys:
		var base := rng.randi_range(42, 57)
		if weights.has(key):
			base += rng.randi_range(7, 15)
		attrs[key] = clampi(base, 35, 88)
	# Give every young player a couple of personality spikes.
	var keys: Array = GameData.attr_keys.duplicate()
	keys.shuffle()
	for i in mini(2, keys.size()):
		attrs[keys[i]] = clampi(int(attrs[keys[i]]) + rng.randi_range(3, 7), 40, 92)
	return attrs


static func _number_for_position(position: String) -> int:
	if position == "PL":
		return 9
	if position in ["ED", "EE"]:
		return 7
	if position == "MO":
		return 10
	if position in ["MC", "MD", "ME"]:
		return 8
	if position in ["DC"]:
		return 4
	return 3


static func _empty_stats() -> Dictionary:
	return {
		"apps": 0,
		"starts": 0,
		"minutes": 0,
		"goals": 0,
		"assists": 0,
		"passes": 0,
		"passes_completed": 0,
		"shots": 0,
		"shots_on": 0,
		"dribbles": 0,
		"dribbles_completed": 0,
		"tackles": 0,
		"interceptions": 0,
		"fouls": 0,
		"yellow": 0,
		"red": 0,
		"rating_sum": 0.0,
		"rating_count": 0,
		"motm": 0,
		"best_rating": 0.0,
	}


static func _build_season(career: Dictionary, rng: RandomNumberGenerator) -> void:
	var club_id := str(career.get("club_id", ""))
	var club := GameData.club(club_id)
	var league_id := str(club.get("league_id", "por3"))
	var league := GameData.league(league_id)
	var ids: Array = []
	for c in GameData.league_clubs(league_id):
		ids.append(str(c.get("id", "")))
	if not ids.has(club_id):
		ids.append(club_id)
	var rounds := _round_robin(ids)
	var table := {}
	for id in ids:
		table[id] = {
			"played": 0,
			"won": 0,
			"drawn": 0,
			"lost": 0,
			"goals_for": 0,
			"goals_against": 0,
			"points": 0,
		}
	career["league"] = {
		"league_id": league_id,
		"league_name": league.get("name", "Liga"),
		"rounds": rounds,
		"table": table,
		"updated_rounds": [],
		"position": 1,
	}
	var fixtures: Array = []
	for round_index in rounds.size():
		for fixture_match in rounds[round_index]:
			var home_id := str(fixture_match.get("home", ""))
			var away_id := str(fixture_match.get("away", ""))
			if home_id == club_id or away_id == club_id:
				var opponent_id := away_id if home_id == club_id else home_id
				var opponent := GameData.club(opponent_id)
				fixtures.append({
					"id": "s%d-r%d" % [career.get("season", 2026), round_index + 1],
					"week": round_index + 1,
					"round": round_index,
					"competition": "league",
					"competition_name": league.get("name", "Liga"),
					"home_id": home_id,
					"away_id": away_id,
					"home": home_id == club_id,
					"opponent_id": opponent_id,
					"opponent_name": opponent.get("name", "Adversário"),
					"opponent_short": opponent.get("short", "ADV"),
					"opponent_overall": opponent.get("overall", 55),
					"played": false,
					"home_goals": 0,
					"away_goals": 0,
					"player_goals": 0,
					"player_assists": 0,
					"player_rating": 0.0,
				})
	career["fixtures"] = fixtures
	career["week"] = 1
	career["trained_week"] = 0
	career["season_complete"] = false
	career["season_summary"] = {}
	career["season_stats"] = _empty_stats()
	career["season_start_overall"] = int(career["player"].get("overall", 55))


static func _round_robin(ids: Array) -> Array:
	var teams := ids.duplicate()
	if teams.size() % 2 == 1:
		teams.append("BYE")
	var n := teams.size()
	var first_leg: Array = []
	for round_index in n - 1:
		var matches: Array = []
		for i in int(n / 2):
			var home := str(teams[i])
			var away := str(teams[n - 1 - i])
			if home == "BYE" or away == "BYE":
				continue
			if (round_index + i) % 2 == 1:
				var tmp := home
				home = away
				away = tmp
			matches.append({"home": home, "away": away, "played": false, "home_goals": 0, "away_goals": 0})
		first_leg.append(matches)
		var last: String = str(teams.pop_back())
		teams.insert(1, last)
	var second_leg: Array = []
	for matches in first_leg:
		var reverse: Array = []
		for entry in matches:
			reverse.append({
				"home": entry.get("away", ""),
				"away": entry.get("home", ""),
				"played": false,
				"home_goals": 0,
				"away_goals": 0,
			})
		second_leg.append(reverse)
	return first_leg + second_leg


static func player_name(career: Dictionary) -> String:
	return _player_name(career)


static func _player_name(career: Dictionary) -> String:
	var p: Dictionary = career.get("player", {})
	return "%s %s" % [p.get("first_name", "Alex"), p.get("last_name", "Silva")]


static func player_short(career: Dictionary) -> String:
	var p: Dictionary = career.get("player", {})
	return "%s. %s" % [str(p.get("first_name", "A")).left(1), p.get("last_name", "Silva")]


static func current_club(career: Dictionary) -> Dictionary:
	return GameData.club(str(career.get("club_id", "")))


static func next_fixture(career: Dictionary) -> Dictionary:
	var week := int(career.get("week", 1))
	for fixture in career.get("fixtures", []):
		if int(fixture.get("week", 0)) == week and not bool(fixture.get("played", false)):
			return fixture
	return {}


static func fixture_for_week(career: Dictionary, week: int) -> Dictionary:
	for fixture in career.get("fixtures", []):
		if int(fixture.get("week", 0)) == week:
			return fixture
	return {}


static func simulate_fixture(career: Dictionary) -> Dictionary:
	var fixture := next_fixture(career)
	if fixture.is_empty():
		return {}
	var rng := _rng_for(career, "sim-%d-%d" % [career.get("season", 0), career.get("week", 0)])
	var report := _simulate_player_report(career, fixture, rng)
	apply_match(career, report)
	return report


static func _simulate_player_report(career: Dictionary, fixture: Dictionary, rng: RandomNumberGenerator) -> Dictionary:
	var club := current_club(career)
	var opponent := GameData.club(str(fixture.get("opponent_id", "")))
	var player: Dictionary = career.get("player", {})
	var player_team := 0 if bool(fixture.get("home", true)) else 1
	var home_overall := float(club.get("overall", 55)) if player_team == 0 else float(opponent.get("overall", 55))
	var away_overall := float(opponent.get("overall", 55)) if player_team == 0 else float(club.get("overall", 55))
	var player_boost := (float(player.get("overall", 55)) - float(club.get("overall", 55))) * 0.18
	if player_team == 0:
		home_overall += player_boost
	else:
		away_overall += player_boost
	var home_goals := _poisson(rng, _expected_goals(home_overall, away_overall, true))
	var away_goals := _poisson(rng, _expected_goals(away_overall, home_overall, false))
	var team_goals := home_goals if player_team == 0 else away_goals
	var opp_goals := away_goals if player_team == 0 else home_goals
	var attrs: Dictionary = player.get("attributes", {})
	var position := str(player.get("position", "PL"))
	var attack := _attack_factor(position)
	var expected_player_goals := float(team_goals) * attack * (0.55 + float(attrs.get("finishing", 50)) / 180.0)
	var goals := mini(team_goals, _poisson(rng, maxf(0.02, expected_player_goals)))
	var assist_chance := 0.12 + float(attrs.get("passing", 50)) / 380.0 + attack * 0.16
	var assists := 0
	if team_goals > goals and rng.randf() < assist_chance:
		assists = rng.randi_range(1, mini(2, team_goals - goals))
	var passes := rng.randi_range(17, 38) + int(float(attrs.get("passing", 50)) / 12.0)
	var completion := clampf(0.56 + float(attrs.get("passing", 50)) / 260.0 + rng.randf_range(-0.06, 0.08), 0.45, 0.94)
	var shots := goals + rng.randi_range(0, 3)
	var shots_on := mini(shots, goals + rng.randi_range(0, 2))
	var result_bonus := 0.5 if team_goals > opp_goals else (0.12 if team_goals == opp_goals else -0.4)
	var rating := 6.0 + goals * 1.05 + assists * 0.65 + float(shots_on) * 0.05 - rng.randf_range(0.0, 0.55) + result_bonus
	rating = clampf(rating, 4.2, 9.8)
	var stats := _empty_stats()
	stats["apps"] = 1
	stats["starts"] = 1
	stats["minutes"] = 90
	stats["goals"] = goals
	stats["assists"] = assists
	stats["passes"] = passes
	stats["passes_completed"] = int(round(passes * completion))
	stats["shots"] = shots
	stats["shots_on"] = shots_on
	stats["dribbles"] = rng.randi_range(0, 5)
	stats["dribbles_completed"] = rng.randi_range(0, int(stats["dribbles"]))
	stats["tackles"] = rng.randi_range(0, 4) if position in ["DC", "DD", "DE", "MD", "MC"] else rng.randi_range(0, 2)
	stats["interceptions"] = rng.randi_range(0, 3)
	stats["fouls"] = rng.randi_range(0, 2)
	stats["rating_sum"] = rating
	stats["rating_count"] = 1
	stats["motm"] = 1 if rating >= 8.2 and team_goals >= opp_goals else 0
	stats["best_rating"] = rating
	return {
		"fixture_id": str(fixture.get("id", "")),
		"simulated": true,
		"home_name": str(club.get("name", "")) if player_team == 0 else str(opponent.get("name", "")),
		"away_name": str(opponent.get("name", "")) if player_team == 0 else str(club.get("name", "")),
		"home_short": str(club.get("short", "")) if player_team == 0 else str(opponent.get("short", "")),
		"away_short": str(opponent.get("short", "")) if player_team == 0 else str(club.get("short", "")),
		"home_goals": home_goals,
		"away_goals": away_goals,
		"player_team": player_team,
		"player_played": true,
		"player_minutes": 90,
		"goals": goals,
		"assists": assists,
		"rating": snappedf(rating, 0.1),
		"motm": bool(stats["motm"]),
		"stats": stats,
		"events": [],
		"possession": [50, 50],
	}


static func _expected_goals(attack_overall: float, defence_overall: float, home: bool) -> float:
	var diff := attack_overall - defence_overall
	var expected := 1.22 + diff * 0.045 + (0.18 if home else 0.0)
	return clampf(expected, 0.25, 3.8)


static func _poisson(rng: RandomNumberGenerator, mean: float) -> int:
	if mean <= 0.0:
		return 0
	var limit := exp(-mean)
	var product := 1.0
	var count := 0
	while product > limit and count < 8:
		count += 1
		product *= rng.randf()
	return count - 1


static func _attack_factor(position: String) -> float:
	match position:
		"PL":
			return 0.42
		"ED", "EE":
			return 0.30
		"MO":
			return 0.24
		"MC", "MD", "ME":
			return 0.13
		"DD", "DE":
			return 0.09
		_:
			return 0.05


static func apply_match(career: Dictionary, report: Dictionary) -> void:
	var fixture := next_fixture(career)
	if fixture.is_empty():
		return
	var home_goals := int(report.get("home_goals", 0))
	var away_goals := int(report.get("away_goals", 0))
	fixture["played"] = true
	fixture["home_goals"] = home_goals
	fixture["away_goals"] = away_goals
	fixture["player_goals"] = int(report.get("goals", 0))
	fixture["player_assists"] = int(report.get("assists", 0))
	fixture["player_rating"] = float(report.get("rating", 6.0))
	var round_index := int(fixture.get("round", 0))
	var league_state: Dictionary = career.get("league", {})
	var rounds: Array = league_state.get("rounds", [])
	if round_index >= 0 and round_index < rounds.size():
		for round_match in rounds[round_index]:
			if str(round_match.get("home", "")) == str(fixture.get("home_id", "")) and str(round_match.get("away", "")) == str(fixture.get("away_id", "")):
				round_match["played"] = true
				round_match["home_goals"] = home_goals
				round_match["away_goals"] = away_goals
				break
		_simulate_rest_of_round(career, round_index)
		_update_table_for_round(career, round_index)
	var player: Dictionary = career.get("player", {})
	var stats: Dictionary = report.get("stats", {})
	_merge_stats(career.get("career_stats", {}), stats)
	_merge_stats(career.get("season_stats", {}), stats)
	var player_is_home := bool(fixture.get("home", true))
	var won := (home_goals > away_goals) if player_is_home else (away_goals > home_goals)
	var drew := home_goals == away_goals
	player["morale"] = clampi(int(player.get("morale", 60)) + (5 if won else (1 if drew else -5)), 0, 100)
	player["form"] = clampi(int(player.get("form", 60)) + (4 if won else (-4 if not drew else 0)), 0, 100)
	player["energy"] = clampi(int(player.get("energy", 70)) - 24, 0, 100)
	player["coach_trust"] = clampi(int(player.get("coach_trust", 55)) + (2 if won else (-2 if not drew else 0)), 0, 100)
	player["reputation"] = clampi(int(player.get("reputation", 8)) + (1 if won else 0), 0, 100)
	career["last_report"] = report
	career["league"]["position"] = league_position(career)
	_add_news(
		career,
		"Resultado: %s %d–%d %s" % [
			report.get("home_short", "CLA"), home_goals, away_goals, report.get("away_short", "ADV")
		],
		"%s marcou %.1f. Próxima semana: novo desafio." % [_player_name(career), float(report.get("rating", 6.0))],
		"match"
	)
	career["week"] = int(career.get("week", 1)) + 1
	career["trained_week"] = 0
	player["energy"] = clampi(int(player.get("energy", 70)) + 12, 0, 100)
	if int(career.get("week", 1)) > TOTAL_WEEKS:
		_finalize_season(career)


static func _simulate_rest_of_round(career: Dictionary, round_index: int) -> void:
	var league_state: Dictionary = career.get("league", {})
	var rounds: Array = league_state.get("rounds", [])
	if round_index < 0 or round_index >= rounds.size():
		return
	var rng := _rng_for(career, "round-%d-%d" % [career.get("season", 0), round_index])
	for round_match in rounds[round_index]:
		if bool(round_match.get("played", false)):
			continue
		var home := GameData.club(str(round_match.get("home", "")))
		var away := GameData.club(str(round_match.get("away", "")))
		round_match["home_goals"] = _poisson(rng, _expected_goals(float(home.get("overall", 55)), float(away.get("overall", 55)), true))
		round_match["away_goals"] = _poisson(rng, _expected_goals(float(away.get("overall", 55)), float(home.get("overall", 55)), false))
		round_match["played"] = true


static func _update_table_for_round(career: Dictionary, round_index: int) -> void:
	var league_state: Dictionary = career.get("league", {})
	var updated: Array = league_state.get("updated_rounds", [])
	if updated.has(round_index):
		return
	var rounds: Array = league_state.get("rounds", [])
	if round_index < 0 or round_index >= rounds.size():
		return
	var table: Dictionary = league_state.get("table", {})
	for round_match in rounds[round_index]:
		if not bool(round_match.get("played", false)):
			continue
		_apply_table_result(table, str(round_match.get("home", "")), str(round_match.get("away", "")), int(round_match.get("home_goals", 0)), int(round_match.get("away_goals", 0)))
	updated.append(round_index)
	league_state["updated_rounds"] = updated
	league_state["table"] = table
	career["league"] = league_state


static func _apply_table_result(table: Dictionary, home_id: String, away_id: String, home_goals: int, away_goals: int) -> void:
	if not table.has(home_id) or not table.has(away_id):
		return
	var h: Dictionary = table[home_id]
	var a: Dictionary = table[away_id]
	h["played"] = int(h.get("played", 0)) + 1
	a["played"] = int(a.get("played", 0)) + 1
	h["goals_for"] = int(h.get("goals_for", 0)) + home_goals
	h["goals_against"] = int(h.get("goals_against", 0)) + away_goals
	a["goals_for"] = int(a.get("goals_for", 0)) + away_goals
	a["goals_against"] = int(a.get("goals_against", 0)) + home_goals
	if home_goals > away_goals:
		h["won"] = int(h.get("won", 0)) + 1
		h["points"] = int(h.get("points", 0)) + 3
		a["lost"] = int(a.get("lost", 0)) + 1
	elif home_goals == away_goals:
		h["drawn"] = int(h.get("drawn", 0)) + 1
		a["drawn"] = int(a.get("drawn", 0)) + 1
		h["points"] = int(h.get("points", 0)) + 1
		a["points"] = int(a.get("points", 0)) + 1
	else:
		a["won"] = int(a.get("won", 0)) + 1
		a["points"] = int(a.get("points", 0)) + 3
		h["lost"] = int(h.get("lost", 0)) + 1
	table[home_id] = h
	table[away_id] = a


static func _merge_stats(target: Dictionary, addition: Dictionary) -> void:
	for key in target.keys():
		if typeof(target[key]) == TYPE_FLOAT:
			target[key] = float(target[key]) + float(addition.get(key, 0.0))
		else:
			target[key] = int(target[key]) + int(addition.get(key, 0))
	if addition.has("best_rating"):
		target["best_rating"] = maxf(float(target.get("best_rating", 0.0)), float(addition.get("best_rating", 0.0)))


static func league_rows(career: Dictionary) -> Array:
	var league_state: Dictionary = career.get("league", {})
	var table: Dictionary = league_state.get("table", {})
	var rows: Array = []
	for id in table.keys():
		var row: Dictionary = table[id]
		var club := GameData.club(str(id))
		var row_copy := row.duplicate(true)
		row_copy["club_id"] = str(id)
		row_copy["name"] = club.get("name", id)
		row_copy["short"] = club.get("short", "???")
		row_copy["color"] = club.get("colors", {}).get("primary", "#f5c451")
		row_copy["goal_difference"] = int(row.get("goals_for", 0)) - int(row.get("goals_against", 0))
		rows.append(row_copy)
	rows.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		if int(a["points"]) != int(b["points"]):
			return int(a["points"]) > int(b["points"])
		if int(a["goal_difference"]) != int(b["goal_difference"]):
			return int(a["goal_difference"]) > int(b["goal_difference"])
		if int(a["goals_for"]) != int(b["goals_for"]):
			return int(a["goals_for"]) > int(b["goals_for"])
		return str(a["name"]) < str(b["name"])
	)
	return rows


static func league_position(career: Dictionary) -> int:
	var club_id := str(career.get("club_id", ""))
	var rows := league_rows(career)
	for i in rows.size():
		if str(rows[i].get("club_id", "")) == club_id:
			return i + 1
	return 1


static func train(career: Dictionary, program_id: String) -> Dictionary:
	var week := int(career.get("week", 1))
	if int(career.get("trained_week", 0)) == week:
		return {"ok": false, "message": "Já treinaste esta semana."}
	if bool(career.get("season_complete", false)):
		return {"ok": false, "message": "A época terminou."}
	var program := GameData.training_program(program_id)
	if program.is_empty():
		return {"ok": false, "message": "Treino indisponível."}
	var player: Dictionary = career.get("player", {})
	var energy := int(player.get("energy", 100))
	var cost := int(program.get("energy", 14))
	if energy < cost:
		return {"ok": false, "message": "Energia insuficiente. Recupera primeiro."}
	var attrs: Dictionary = player.get("attributes", {})
	var target_keys: Array = program.get("attrs", [])
	if target_keys.is_empty():
		var weights: Dictionary = GameData.overall_weights.get(str(player.get("position", "PL")), {})
		target_keys = weights.keys()
	var rng := _rng_for(career, "train-%d-%d-%s" % [career.get("season", 0), week, program_id])
	var gains: Array = []
	for key in target_keys:
		if not attrs.has(key):
			continue
		if rng.randf() < 0.78:
			var gain := rng.randi_range(1, 2)
			attrs[key] = clampi(int(attrs[key]) + gain, 20, 99)
			gains.append("%s +%d" % [GameData.attr_short(str(key)), gain])
	player["attributes"] = attrs
	player["overall"] = GameData.overall(attrs, str(player.get("position", "PL")))
	player["energy"] = clampi(energy - cost, 0, 100)
	player["morale"] = clampi(int(player.get("morale", 60)) + 1, 0, 100)
	player["coach_trust"] = clampi(int(player.get("coach_trust", 55)) + 1, 0, 100)
	career["trained_week"] = week
	_add_news(career, "Treino: %s" % program.get("name", "Sessão"), "Ganhos: %s." % (", ".join(gains) if not gains.is_empty() else "Trabalho consistente, sem aumento visível."), "training")
	return {"ok": true, "message": "Treino concluído.", "gains": gains}


static func advance_rest_week(career: Dictionary) -> bool:
	var week := int(career.get("week", 1))
	if week > 24 or week > 18 and not bool(career.get("season_complete", false)):
		week += 1
		career["week"] = week
		career["trained_week"] = 0
		var player: Dictionary = career.get("player", {})
		player["energy"] = clampi(int(player.get("energy", 70)) + 14, 0, 100)
		player["morale"] = clampi(int(player.get("morale", 60)) + 1, 0, 100)
		if week > TOTAL_WEEKS:
			_finalize_season(career)
		return true
	return false


static func _finalize_season(career: Dictionary) -> void:
	if bool(career.get("season_complete", false)):
		return
	var rows := league_rows(career)
	var club_id := str(career.get("club_id", ""))
	var position := 1
	var champion: Dictionary = rows[0] if not rows.is_empty() else {}
	for i in rows.size():
		if str(rows[i].get("club_id", "")) == club_id:
			position = i + 1
			break
	var player: Dictionary = career.get("player", {})
	var season_stats: Dictionary = career.get("season_stats", _empty_stats())
	var avg_rating := 0.0
	if int(season_stats.get("rating_count", 0)) > 0:
		avg_rating = float(season_stats.get("rating_sum", 0.0)) / float(season_stats.get("rating_count", 1))
	var history_entry := {
		"season": career.get("season", 2026),
		"season_label": career.get("season_label", "2026/27"),
		"club_name": current_club(career).get("name", ""),
		"league_name": career.get("league", {}).get("league_name", "Liga"),
		"position": position,
		"apps": int(season_stats.get("apps", 0)),
		"goals": int(season_stats.get("goals", 0)),
		"assists": int(season_stats.get("assists", 0)),
		"rating": snappedf(avg_rating, 0.1),
		"overall_start": int(career.get("season_start_overall", player.get("overall", 55))),
		"overall_end": int(player.get("overall", 55)),
		"trophy": champion.get("name", "") if position == 1 else "",
	}
	var history: Array = career.get("history", [])
	history.append(history_entry)
	career["history"] = history
	var summary := {
		"position": position,
		"champion": champion.get("name", ""),
		"apps": history_entry["apps"],
		"goals": history_entry["goals"],
		"assists": history_entry["assists"],
		"rating": history_entry["rating"],
		"overall_start": history_entry["overall_start"],
		"overall_end": history_entry["overall_end"],
	}
	career["season_complete"] = true
	career["season_summary"] = summary
	_add_news(career, "Época terminada", "%s terminou em %d.º com %d golos. %s" % [_player_name(career), position, int(history_entry["goals"]), ("Campeão: " + str(champion.get("name", ""))) if position == 1 else "Nova época à porta."], "career")


static func start_next_season(career: Dictionary) -> void:
	if not bool(career.get("season_complete", false)):
		return
	var player: Dictionary = career.get("player", {})
	player["age"] = int(player.get("age", 16)) + 1
	if int(player.get("age", 16)) >= 37:
		career["retired"] = true
		_add_news(career, "Fim de carreira", "Aos 37 anos, %s pendura as botas." % _player_name(career), "career")
		return
	var contract: Dictionary = career.get("contract", {})
	contract["years"] = int(contract.get("years", 1)) - 1
	if int(contract.get("years", 1)) <= 0:
		contract["years"] = 3
		contract["salary"] = int(float(contract.get("salary", 1500)) * 1.12)
		_add_news(career, "Renovação", "O clube renovou automaticamente por três épocas.", "club")
	career["contract"] = contract
	career["season"] = int(career.get("season", 2026)) + 1
	career["season_label"] = "%d/%s" % [career["season"], str(career["season"] + 1).right(2)]
	var rng := _rng_for(career, "season-%d" % career["season"])
	_build_season(career, rng)
	career["season_start_overall"] = int(player.get("overall", 55))
	career["league"]["position"] = league_position(career)
	_add_news(career, "Nova época", "O balneário volta ao trabalho. Objetivo: subir de nível.", "career")


static func _rng_for(career: Dictionary, salt: String) -> RandomNumberGenerator:
	var rng := RandomNumberGenerator.new()
	var base := int(career.get("seed", 123456))
	rng.seed = base + salt.hash() + int(career.get("season", 0)) * 7919
	return rng


static func _add_news(career: Dictionary, title: String, body: String, kind: String) -> void:
	var news: Array = career.get("news", [])
	news.push_front({
		"week": int(career.get("week", 1)),
		"season": int(career.get("season", 2026)),
		"title": title,
		"body": body,
		"kind": kind,
	})
	if news.size() > 24:
		news.resize(24)
	career["news"] = news


static func build_match_setup(career: Dictionary, fixture: Dictionary) -> Dictionary:
	var club := current_club(career)
	var opponent := GameData.club(str(fixture.get("opponent_id", "")))
	var player_team := 0 if bool(fixture.get("home", true)) else 1
	var home := club if player_team == 0 else opponent
	var away := opponent if player_team == 0 else club
	var home_kit := GameData.kit_for(str(home.get("id", "")))
	var away_kit := GameData.contrast_kit(GameData.kit_for(str(away.get("id", ""))), home_kit)
	var player: Dictionary = career.get("player", {})
	return {
		"fixture_id": str(fixture.get("id", "")),
		"competition_name": str(fixture.get("competition_name", "Liga")),
		"player_team": player_team,
		"team_name": [str(home.get("name", "")), str(away.get("name", ""))],
		"team_short": [str(home.get("short", "CLA")), str(away.get("short", "ADV"))],
		"team_overall": [float(home.get("overall", 55)), float(away.get("overall", 55))],
		"team_country": [str(home.get("country", "POR")), str(away.get("country", "POR"))],
		"team_id": [str(home.get("id", "")), str(away.get("id", ""))],
		"kit": [home_kit, away_kit],
		"gk_kit": [GameData.kit_for(str(home.get("id", "")), true), GameData.kit_for(str(away.get("id", "")), true)],
		"player": {
			"name": _player_name(career),
			"short": player_short(career),
			"position": str(player.get("position", "PL")),
			"number": int(player.get("number", 10)),
			"attributes": player.get("attributes", {}).duplicate(true),
			"base_index": int(player.get("base_index", 0)),
			"nationality": str(player.get("nationality", "POR")),
		},
		"seed": _rng_for(career, "match-%d-%d" % [career.get("season", 0), career.get("week", 0)]).seed,
	}
