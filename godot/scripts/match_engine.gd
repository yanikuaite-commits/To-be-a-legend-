class_name LegendMatch
extends RefCounted

const PITCH_HALF_L := 52.5
const PITCH_HALF_W := 34.0
const GOAL_HALF := 3.66
const GOAL_HEIGHT := 2.44
const PLAYER_WORLD_HEIGHT := 4.1
const MINUTES_PER_SECOND := 0.5


class MatchPlayer:
	var id: int = 0
	var team: int = 0
	var slot: int = 0
	var role: String = "MC"
	var name: String = ""
	var number: int = 1
	var is_gk: bool = false
	var is_protagonist: bool = false
	var attrs: Dictionary = {}
	var base_index: int = 0
	var kit: Dictionary = {}
	var x: float = 0.0
	var y: float = 0.0
	var vx: float = 0.0
	var vy: float = 0.0
	var fx: float = 1.0
	var fy: float = 0.0
	var target_x: float = 0.0
	var target_y: float = 0.0
	var max_speed: float = 6.0
	var accel: float = 9.0
	var stamina: float = 100.0
	var think_timer: float = 0.0
	var stride_phase: float = 0.0
	var cooldown: float = 0.0
	var has_ball: bool = false
	var stunned_timer: float = 0.0
	var active: bool = true
	var stats: Dictionary = {}
	var goals: int = 0
	var assists: int = 0

	func pos() -> Vector2:
		return Vector2(x, y)


class BallState:
	var x: float = 0.0
	var y: float = 0.0
	var z: float = 0.0
	var vx: float = 0.0
	var vy: float = 0.0
	var vz: float = 0.0
	var owner_id: int = -1
	var last_touch_id: int = -1
	var last_touch_team: int = 0
	var shot: bool = false
	var shot_by: int = -1
	var intended_for: int = -1
	var pass_by: int = -1
	var pass_team: int = 0
	var spin: float = 0.0

	func pos() -> Vector2:
		return Vector2(x, y)


var setup: Dictionary = {}
var players: Array[MatchPlayer] = []
var protagonist: MatchPlayer
var ball := BallState.new()
var home_kit: Dictionary = {}
var away_kit: Dictionary = {}
var player_team: int = 0
var score: Array[int] = [0, 0]
var minute: float = 0.0
var phase: String = "kickoff"
var phase_timer: float = 0.9
var frozen: bool = false
var freeze_reason: String = ""
var paused: bool = false
var real_time: float = 0.0
var feedback: String = ""
var feedback_until: float = 0.0
var last_event: String = ""
var events: Array = []
var viewport := Vector2(720, 1280)
var camera_x: float = 0.0
var camera_y: float = 0.0
var camera_scale: float = 16.0
var camera_rot: float = 0.0
var rng := RandomNumberGenerator.new()
var pending_tap_id: int = -1
var pending_tap_at: float = 0.0
var gesture_active: bool = false
var gesture_start := Vector2.ZERO
var gesture_current := Vector2.ZERO
var last_kick_time: float = -10.0
var last_pass_by: int = -1
var last_pass_team: int = 0
var last_pass_time: float = -10.0
var last_kickoff_team: int = 0
var last_scoring_team: int = 0
var possession_time: Array[float] = [0.0, 0.0]
var shots_count: Array[int] = [0, 0]
var restart_team: int = 0
var restart_taker_id: int = -1
var restart_kind: String = "throw"
var manual_target := Vector2.ZERO
var manual_until: float = 0.0
var first_half_ended: bool = false


func _init(match_setup: Dictionary) -> void:
	setup = match_setup
	player_team = int(setup.get("player_team", 0))
	var kits: Array = setup.get("kit", [])
	home_kit = kits[0] if kits.size() > 0 else {}
	away_kit = kits[1] if kits.size() > 1 else {}
	rng.seed = int(setup.get("seed", 1))
	camera_rot = _rotation_for(player_team)
	_build_teams()
	kickoff(0)


func _build_teams() -> void:
	var slots: Array = GameData.lineup
	var protagonist_slot := _protagonist_slot(str(setup.get("player", {}).get("position", "PL")))
	for team in [0, 1]:
		var used_numbers := {1: true}
		for slot_index in slots.size():
			var slot: Dictionary = slots[slot_index]
			var role := str(slot.get("role", "MC"))
			var is_player_team: bool = team == player_team
			var is_protagonist := is_player_team and slot_index == protagonist_slot
			if is_protagonist:
				role = str(setup.get("player", {}).get("position", role))
			var p := MatchPlayer.new()
			p.id = team * 20 + slot_index
			p.team = team
			p.slot = slot_index
			p.role = role
			p.is_gk = role == "GK"
			p.is_protagonist = is_protagonist
			p.base_index = rng.randi_range(0, 12)
			if is_protagonist:
				p.base_index = int(setup.get("player", {}).get("base_index", 0))
				p.name = str(setup.get("player", {}).get("name", "Jogador"))
				p.number = int(setup.get("player", {}).get("number", 10))
				p.attrs = _normalise_attrs(setup.get("player", {}).get("attributes", {}))
			else:
				p.name = GameData.random_name(str((setup.get("team_country", ["POR", "POR"]) as Array)[team]), rng)
				if p.is_gk:
					p.number = 1
				else:
					var candidate := rng.randi_range(2, 30)
					var guard := 0
					while used_numbers.has(candidate) and guard < 60:
						candidate = rng.randi_range(2, 30)
						guard += 1
					used_numbers[candidate] = true
					p.number = candidate
				var overall: float = float((setup.get("team_overall", [55.0, 55.0]) as Array)[team])
				p.attrs = _ai_attrs(role, overall)
			p.kit = (setup.get("gk_kit", [{}, {}]) as Array)[team] if p.is_gk else (setup.get("kit", [{}, {}]) as Array)[team]
			var dir: float = 1.0 if team == 0 else -1.0
			p.x = float(slot.get("x", 0.0)) * dir
			p.y = float(slot.get("y", 0.0)) * dir
			p.target_x = p.x
			p.target_y = p.y
			p.fx = dir
			p.max_speed = (5.1 if p.is_gk else 5.4) + ((float(p.attrs.get("speed", 55)) - 50.0) / 50.0) * 1.6
			p.accel = 7.5 + ((float(p.attrs.get("acceleration", 55)) - 50.0) / 50.0) * 5.2
			p.stamina = 100.0
			p.think_timer = rng.randf_range(0.0, 0.25)
			p.stride_phase = rng.randf_range(0.0, TAU)
			p.stats = _empty_stats()
			players.append(p)
			if is_protagonist:
				protagonist = p
	if protagonist == null:
		protagonist = players[0]


func _protagonist_slot(position: String) -> int:
	var slots: Array = GameData.lineup
	for i in slots.size():
		if str(slots[i].get("role", "")) == position:
			return i
	if position == "ME":
		for i in slots.size():
			if str(slots[i].get("role", "")) == "MD":
				return i
	for i in slots.size():
		if str(slots[i].get("role", "")) == "MC":
			return i
	return 5


func _normalise_attrs(source: Dictionary) -> Dictionary:
	var attrs := {}
	for key in GameData.attr_keys:
		attrs[key] = clampi(int(source.get(key, 55)), 20, 99)
	return attrs


func _ai_attrs(role: String, overall: float) -> Dictionary:
	var attrs := {}
	var weights: Dictionary = GameData.overall_weights.get("DC" if role == "GK" else role, {})
	for key in GameData.attr_keys:
		var value := int(round(overall)) - 8 + rng.randi_range(-5, 7)
		if weights.has(key):
			value += 6
		attrs[key] = clampi(value, 28, 94)
	return attrs


func _empty_stats() -> Dictionary:
	return {
		"apps": 1,
		"starts": 1,
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


func set_viewport(width: float, height: float) -> void:
	viewport = Vector2(maxf(320.0, width), maxf(360.0, height))
	update_camera(0.016)


func start() -> void:
	phase = "kickoff"
	phase_timer = 0.8
	update_camera(0.016)


func set_paused(value: bool) -> void:
	paused = value


func is_playing() -> bool:
	return not paused and phase != "fulltime"


func update(dt: float) -> void:
	var step := minf(dt, 0.05)
	real_time += step
	update_camera(step)
	if paused or phase == "fulltime":
		return
	if phase == "goal":
		phase_timer -= step
		if phase_timer <= 0.0:
			kickoff(1 - last_scoring_team)
		return
	if phase == "halftime":
		phase_timer -= step
		if phase_timer <= 0.0:
			minute = maxf(minute, 45.0)
			kickoff(1 - last_kickoff_team)
		return
	if frozen:
		_update_frozen(step)
		return
	if phase == "kickoff":
		phase_timer -= step
		if phase_timer <= 0.0:
			phase = "play"
			feedback = "Bola ao centro. Joga!"
			feedback_until = real_time + 1.7
		return
	if phase == "restart":
		phase_timer -= step
		_position_for_restart(step)
		if phase_timer <= 0.0:
			_finish_restart()
		return
	if phase != "play":
		return
	minute += step * MINUTES_PER_SECOND
	if not first_half_ended and minute >= 45.0:
		first_half_ended = true
		phase = "halftime"
		phase_timer = 1.3
		frozen = false
		feedback = "Intervalo."
		feedback_until = real_time + 2.0
		_add_event("Intervalo. As equipas vão ao balneário.")
		return
	if minute >= 90.0:
		minute = 90.0
		phase = "fulltime"
		frozen = false
		protagonist.stats["minutes"] = 90
		_feedback_now("Apito final.")
		_add_event("Apito final: %s %d–%d %s." % [
			str((setup.get("team_short", ["CLA", "ADV"]) as Array)[0]), score[0], score[1],
			str((setup.get("team_short", ["CLA", "ADV"]) as Array)[1])
		])
		return
	_simulate_play(step)


func _simulate_play(dt: float) -> void:
	for p in players:
		if not p.active:
			continue
		p.cooldown = maxf(0.0, p.cooldown - dt)
		p.stunned_timer = maxf(0.0, p.stunned_timer - dt)
		p.think_timer -= dt
		if p.think_timer <= 0.0:
			_decide_player(p)
			p.think_timer = rng.randf_range(0.12, 0.28)
	for p in players:
		if p.active:
			_move_player(p, dt)
	_update_ball(dt)
	if phase == "play":
		_resolve_ball_contacts(dt)
	if phase == "play":
		_attempt_ai_tackles(dt)
	if ball.owner_id >= 0:
		var owner := _player_by_id(ball.owner_id)
		if owner != null:
			possession_time[owner.team] += dt


func _decide_player(p: MatchPlayer) -> void:
	if not p.active:
		return
	var owner := _player_by_id(ball.owner_id)
	if p.is_gk:
		if owner == p:
			_gk_distribute(p)
			return
		var own_goal_x := _own_goal_x(p.team)
		var box_edge := own_goal_x + (16.0 if p.team == 0 else -16.0)
		var ball_in_box := ball.x < box_edge if p.team == 0 else ball.x > box_edge
		if ball_in_box and _dist_to_ball(p) < 17.0:
			p.target_x = clampf(ball.x, minf(own_goal_x, box_edge), maxf(own_goal_x, box_edge))
			p.target_y = clampf(ball.y, -13.0, 13.0)
		else:
			p.target_x = own_goal_x + (3.2 if p.team == 0 else -3.2)
			p.target_y = clampf(ball.y * 0.35, -4.4, 4.4)
		return
	if owner == p:
		_ai_owner_decision(p)
		return
	if p.is_protagonist and real_time < manual_until:
		p.target_x = manual_target.x
		p.target_y = manual_target.y
		return
	var slot: Dictionary = (GameData.lineup as Array)[p.slot]
	var dir := 1.0 if p.team == 0 else -1.0
	var base_x := float(slot.get("x", 0.0)) * dir
	var base_y := float(slot.get("y", 0.0)) * dir
	var attack_dir := _attacking_dir(p.team)
	var has_possession := owner != null and owner.team == p.team
	base_x += clampf(ball.x - base_x, -22.0, 22.0) * 0.28
	base_y += (ball.y - base_y) * 0.25
	base_x = clampf(base_x, -PITCH_HALF_L + 4.0, PITCH_HALF_L - 4.0)
	base_y = clampf(base_y, -PITCH_HALF_W + 3.0, PITCH_HALF_W - 3.0)
	p.target_x = base_x
	p.target_y = base_y
	if has_possession and p.role in ["PL", "ED", "EE", "MO"]:
		var run_distance := 20.0 if p.role == "PL" else 16.0
		p.target_x = clampf(ball.x + attack_dir * run_distance + rng.randf_range(-3.0, 3.0), -PITCH_HALF_L + 5.0, PITCH_HALF_L - 5.0)
		p.target_y = clampf(base_y + rng.randf_range(-5.0, 5.0), -PITCH_HALF_W + 4.0, PITCH_HALF_W - 4.0)
	if not has_possession and owner != null and _is_closest_to_owner(p, owner):
		p.target_x = owner.x + ball.vx * 0.04
		p.target_y = owner.y + ball.vy * 0.04
	if owner == null and _should_chase_loose(p):
		p.target_x = ball.x + ball.vx * 0.12
		p.target_y = ball.y + ball.vy * 0.12
	if p.is_protagonist and owner == null and _dist_to_ball(p) < 4.0:
		p.target_x = ball.x
		p.target_y = ball.y


func _should_chase_loose(p: MatchPlayer) -> bool:
	if p.is_gk:
		return false
	var mine := _dist_to_ball(p)
	var closer := 0
	for q in players:
		if not q.active or q.team != p.team or q.id == p.id or q.is_gk:
			continue
		if _dist_to_ball(q) < mine:
			closer += 1
	return closer < 2


func _is_closest_to_owner(p: MatchPlayer, owner: MatchPlayer) -> bool:
	var mine := _dist(p, owner)
	for q in players:
		if not q.active or q.team != p.team or q.id == p.id or q.is_gk:
			continue
		if _dist(q, owner) < mine:
			return false
	return true


func _ai_owner_decision(p: MatchPlayer) -> void:
	if p.cooldown > 0.0:
		_ai_dribble(p)
		return
	var goal := _goal_center(p.team)
	var distance := _dist(p, _fake_player(goal))
	var pressure := _nearest_opponent_dist(p)
	var dir := _attacking_dir(p.team)
	if distance < 29.0 and pressure > 1.2:
		var shoot_chance := 0.55 if distance < 12.0 else (0.30 if distance < 21.0 else 0.08)
		if rng.randf() < shoot_chance:
			p.cooldown = 0.8
			_ai_shoot(p, goal)
			return
	var best: MatchPlayer = null
	var best_score := -INF
	for q in players:
		if not q.active or q.team != p.team or q.id == p.id:
			continue
		var qdist := _dist(p, q)
		if qdist < 3.5 or qdist > 40.0:
			continue
		var openness := _nearest_opponent_dist(q)
		var forward := (q.x - p.x) * dir
		var score := openness * 1.15 + forward * 0.85 - qdist * 0.12 - (18.0 if q.is_gk else 0.0)
		if q.is_protagonist and real_time - _protagonist_last_touch() > 9.0:
			score += 8.0
		if score > best_score:
			best_score = score
			best = q
	var pass_chance := 0.70 if pressure < 3.2 else (0.42 if pressure < 6.0 else 0.20)
	if best != null and rng.randf() < pass_chance:
		p.cooldown = 0.55
		_perform_pass(p, best, _dist(p, best) > 24.0 and rng.randf() < 0.45)
		return
	_ai_dribble(p)


func _ai_dribble(p: MatchPlayer) -> void:
	var dir := _attacking_dir(p.team)
	p.target_x = clampf(p.x + dir * 5.5, -PITCH_HALF_L + 4.0, PITCH_HALF_L - 4.0)
	p.target_y = clampf(p.y + rng.randf_range(-3.0, 3.0), -PITCH_HALF_W + 3.0, PITCH_HALF_W - 3.0)
	var pressure := _nearest_opponent(p)
	if pressure != null and _dist(p, pressure) < 4.5:
		p.target_y = clampf(p.y + (6.0 if p.y > pressure.y else -6.0), -PITCH_HALF_W + 3.0, PITCH_HALF_W - 3.0)


func _ai_shoot(p: MatchPlayer, target: Vector2) -> void:
	var dist := _dist(p, _fake_player(target))
	var aim := target
	aim.y += rng.randf_range(-1.8, 1.8) * clampf(dist / 22.0, 0.4, 1.2)
	var speed := 21.0 + (8.0 if dist > 24.0 else 0.0)
	_kick_ball(p, aim, speed, false, true)
	p.stats["shots"] = int(p.stats.get("shots", 0)) + 1
	shots_count[p.team] += 1
	_add_event("%s remata!" % p.name)


func _gk_distribute(p: MatchPlayer) -> void:
	if p.cooldown > 0.0:
		return
	p.cooldown = 1.3
	var best: MatchPlayer = null
	var best_score := -INF
	for q in players:
		if not q.active or q.team != p.team or q.id == p.id or q.is_gk:
			continue
		var score := _nearest_opponent_dist(q) - _dist(p, q) * 0.08
		if q.is_protagonist:
			score += 2.0
		if score > best_score:
			best_score = score
			best = q
	if best != null:
		_perform_pass(p, best, _dist(p, best) > 28.0)
	else:
		_kick_ball(p, Vector2(0, 0), 19.0, true, false)


func _perform_pass(from: MatchPlayer, to: MatchPlayer, lofted: bool) -> void:
	var distance := _dist(from, to)
	var lead := 0.5 if lofted else 0.35
	var target := Vector2(to.x + to.vx * lead, to.y + to.vy * lead)
	var error_amount := clampf(1.0 - float(from.attrs.get("passing", 55)) / 100.0, 0.02, 0.55) * (0.07 + distance * 0.006)
	target.x += rng.randf_range(-error_amount, error_amount) * 2.0
	target.y += rng.randf_range(-error_amount, error_amount) * 3.2
	var speed := clampf(distance * 0.9, 14.0, 24.0) if lofted else clampf(distance * 1.35, 10.0, 27.0)
	_kick_ball(from, target, speed, lofted, false)
	ball.intended_for = to.id
	ball.pass_by = from.id
	ball.pass_team = from.team
	last_pass_by = from.id
	last_pass_team = from.team
	last_pass_time = real_time
	from.stats["passes"] = int(from.stats.get("passes", 0)) + 1
	if from.is_protagonist:
		feedback = "Passe para %s." % to.name.split(" ")[0]
		feedback_until = real_time + 1.4


func _kick_ball(from: MatchPlayer, target: Vector2, speed: float, lofted: bool, is_shot: bool) -> void:
	var delta := target - Vector2(from.x, from.y)
	var length := maxf(delta.length(), 0.01)
	from.fx = delta.x / length
	from.fy = delta.y / length
	from.has_ball = false
	ball.owner_id = -1
	ball.last_touch_id = from.id
	ball.last_touch_team = from.team
	ball.intended_for = -1
	ball.shot = is_shot
	ball.shot_by = from.id if is_shot else -1
	ball.pass_by = -1 if is_shot else from.id
	ball.pass_team = from.team
	ball.x = from.x + from.fx * 0.7
	ball.y = from.y + from.fy * 0.7
	ball.vx = (delta.x / length) * speed
	ball.vy = (delta.y / length) * speed
	ball.z = 0.4 if lofted else 0.05
	ball.vz = 3.4 + speed * 0.05 if lofted else 0.0
	ball.spin = rng.randf_range(-2.0, 2.0)
	last_kick_time = real_time


func _move_player(p: MatchPlayer, dt: float) -> void:
	if p.stunned_timer > 0.0 and not p.has_ball:
		p.vx *= 0.9
		p.vy *= 0.9
		p.x += p.vx * dt
		p.y += p.vy * dt
		return
	var delta := Vector2(p.target_x - p.x, p.target_y - p.y)
	var dist := delta.length()
	var stamina_factor := 0.68 + (p.stamina / 100.0) * 0.32
	var max_speed := p.max_speed * stamina_factor * (0.9 if p.has_ball else 1.0)
	var desired := Vector2.ZERO
	if dist > 0.35:
		desired = delta / dist * max_speed
	p.vx += clampf(desired.x - p.vx, -p.accel * dt, p.accel * dt)
	p.vy += clampf(desired.y - p.vy, -p.accel * dt, p.accel * dt)
	p.x += p.vx * dt
	p.y += p.vy * dt
	p.x = clampf(p.x, -PITCH_HALF_L + 1.0, PITCH_HALF_L - 1.0)
	p.y = clampf(p.y, -PITCH_HALF_W + 1.0, PITCH_HALF_W - 1.0)
	var speed := Vector2(p.vx, p.vy).length()
	if speed > 0.35:
		p.fx = p.vx / speed
		p.fy = p.vy / speed
		p.stride_phase = fmod(p.stride_phase + speed * dt * 1.45, TAU)
		p.stamina = clampf(p.stamina - (0.8 + speed * 0.2) * dt, 0.0, 100.0)
	if p.has_ball:
		ball.x = p.x + p.fx * 0.6
		ball.y = p.y + p.fy * 0.6
		ball.z = 0.0
		ball.vx = p.vx
		ball.vy = p.vy
	for other in players:
		if other.id == p.id or not other.active:
			continue
		var separation := Vector2(p.x - other.x, p.y - other.y)
		var distance := separation.length()
		if distance > 0.01 and distance < 1.5:
			var push := (1.5 - distance) * 0.5
			p.x += separation.x / distance * push
			p.y += separation.y / distance * push


func _update_ball(dt: float) -> void:
	var owner := _player_by_id(ball.owner_id)
	if owner != null and owner.has_ball:
		ball.vx = owner.vx
		ball.vy = owner.vy
		return
	if ball.owner_id != -1:
		ball.owner_id = -1
	ball.x += ball.vx * dt
	ball.y += ball.vy * dt
	if ball.z > 0.0 or ball.vz != 0.0:
		ball.vz -= 11.0 * dt
		ball.z += ball.vz * dt
		if ball.z < 0.0:
			ball.z = 0.0
			ball.vz = -ball.vz * 0.45 if absf(ball.vz) > 2.0 else 0.0
	var drag := 0.16 if ball.z > 0.2 else 0.28
	var damping := exp(-drag * dt)
	ball.vx *= damping
	ball.vy *= damping
	ball.spin *= exp(-0.8 * dt)
	var in_mouth := absf(ball.y) < GOAL_HALF and ball.z < GOAL_HEIGHT
	if ball.x > PITCH_HALF_L:
		if in_mouth:
			_try_goal(0)
		else:
			_handle_goal_line(0)
		return
	if ball.x < -PITCH_HALF_L:
		if in_mouth:
			_try_goal(1)
		else:
			_handle_goal_line(1)
		return
	if absf(ball.y) > PITCH_HALF_W:
		var team := 1 if ball.last_touch_team == 0 else 0
		_award_restart(team, clampf(ball.x, -PITCH_HALF_L + 2.0, PITCH_HALF_L - 2.0), PITCH_HALF_W - 1.0 if ball.y > 0 else -PITCH_HALF_W + 1.0, "throw")


func _try_goal(attacking_team: int) -> void:
	var gk: MatchPlayer = null
	for p in players:
		if p.active and p.team != attacking_team and p.is_gk:
			gk = p
			break
	var shot_by := _player_by_id(ball.shot_by)
	if gk != null and ball.shot and absf(gk.y - ball.y) < 4.3:
		var save_chance := clampf(0.30 + float(gk.attrs.get("reaction", 55)) / 400.0 - absf(gk.y - ball.y) * 0.05, 0.06, 0.68)
		if rng.randf() < save_chance:
			if shot_by != null and shot_by.is_protagonist:
				shot_by.stats["shots_on"] = int(shot_by.stats.get("shots_on", 0)) + 1
			gk.has_ball = true
			ball.owner_id = gk.id
			ball.shot = false
			ball.x = gk.x
			ball.y = gk.y
			ball.z = 0.0
			_feedback_now("Defesa de %s!" % gk.name)
			_award_restart(gk.team, gk.x, 0.0, "goalKick")
			return
	var scorer := shot_by
	if scorer == null:
		var best_dist := INF
		for p in players:
			if p.active and p.team == attacking_team and p.id != (gk.id if gk != null else -1):
				var d := _dist_to_ball(p)
				if d < best_dist:
					best_dist = d
					scorer = p
	if scorer == null:
		return
	if scorer.is_protagonist:
		scorer.stats["shots_on"] = int(scorer.stats.get("shots_on", 0)) + 1
	var assist: MatchPlayer = null
	if last_pass_team == attacking_team and real_time - last_pass_time < 7.0:
		assist = _player_by_id(last_pass_by)
	score[attacking_team] += 1
	scorer.goals += 1
	scorer.stats["goals"] = int(scorer.stats.get("goals", 0)) + 1
	if assist != null and assist.id != scorer.id:
		assist.assists += 1
		assist.stats["assists"] = int(assist.stats.get("assists", 0)) + 1
	last_scoring_team = attacking_team
	phase = "goal"
	phase_timer = 2.2
	frozen = false
	freeze_reason = ""
	ball.owner_id = -1
	ball.vx = 0.0
	ball.vy = 0.0
	ball.vz = 0.0
	var scorer_team_name := str((setup.get("team_short", ["CLA", "ADV"]) as Array)[attacking_team])
	_feedback_now("GOLO! %s" % scorer_team_name)
	_add_event("GOLO! %s %d–%d %s." % [
		str((setup.get("team_short", ["CLA", "ADV"]) as Array)[0]), score[0], score[1],
		str((setup.get("team_short", ["CLA", "ADV"]) as Array)[1])
	])


func _handle_goal_line(defending_team: int) -> void:
	var attacking_team := 1 - defending_team
	if ball.last_touch_team == attacking_team:
		_award_restart(defending_team, _own_goal_x(defending_team), 0.0, "goalKick")
	else:
		var corner_y := PITCH_HALF_W - 1.0 if ball.y >= 0.0 else -PITCH_HALF_W + 1.0
		_award_restart(attacking_team, _target_goal_x(attacking_team) - _attacking_dir(attacking_team) * 0.5, corner_y, "corner")


func _award_restart(team: int, x: float, y: float, kind: String) -> void:
	phase = "restart"
	phase_timer = 0.7
	restart_team = team
	restart_kind = kind
	ball.x = clampf(x, -PITCH_HALF_L + 0.5, PITCH_HALF_L - 0.5)
	ball.y = clampf(y, -PITCH_HALF_W + 0.5, PITCH_HALF_W - 0.5)
	ball.z = 0.0
	ball.vx = 0.0
	ball.vy = 0.0
	ball.vz = 0.0
	ball.owner_id = -1
	var taker: MatchPlayer = null
	if kind == "goalKick":
		for p in players:
			if p.active and p.team == team and p.is_gk:
				taker = p
				break
	if taker == null:
		var best_dist := INF
		for p in players:
			if not p.active or p.team != team or p.is_gk:
				continue
			var d := p.pos().distance_to(Vector2(ball.x, ball.y))
			if d < best_dist:
				best_dist = d
				taker = p
	if taker != null:
		taker.x = ball.x
		taker.y = ball.y
		taker.has_ball = true
		ball.owner_id = taker.id
		restart_taker_id = taker.id
	_add_event("Reposição: %s." % ("pontapé de baliza" if kind == "goalKick" else ("canto" if kind == "corner" else "lançamento")))


func _position_for_restart(dt: float) -> void:
	for p in players:
		if not p.active:
			continue
		if p.id == ball.owner_id:
			p.target_x = ball.x
			p.target_y = ball.y
		else:
			var slot: Dictionary = (GameData.lineup as Array)[p.slot]
			var dir := 1.0 if p.team == 0 else -1.0
			p.target_x = float(slot.get("x", 0.0)) * dir
			p.target_y = float(slot.get("y", 0.0)) * dir
		_move_player(p, dt)


func _finish_restart() -> void:
	phase = "play"
	var taker := _player_by_id(restart_taker_id)
	if taker == null:
		return
	if taker.is_protagonist:
		_freeze("restart")
		return
	var best: MatchPlayer = null
	var best_score := -INF
	for p in players:
		if not p.active or p.team != taker.team or p.id == taker.id or p.is_gk:
			continue
		var score := _nearest_opponent_dist(p) - _dist(taker, p) * 0.06
		if score > best_score:
			best_score = score
			best = p
	if best != null:
		_perform_pass(taker, best, restart_kind == "goalKick")
	else:
		_kick_ball(taker, Vector2(0, 0), 18.0, true, false)


func _resolve_ball_contacts(dt: float) -> void:
	if ball.owner_id != -1 or ball.z > 2.8:
		return
	if real_time - last_kick_time < 0.2:
		return
	var candidates: Array = []
	for p in players:
		if p.active:
			var d := _dist_to_ball(p)
			if d < 2.2:
				candidates.append({"p": p, "d": d})
	candidates.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return float(a["d"]) < float(b["d"]))
	if candidates.is_empty():
		return
	var picked: MatchPlayer = candidates[0]["p"]
	_give_ball(picked, true)


func _give_ball(p: MatchPlayer, count_interception: bool) -> void:
	var intended := ball.intended_for
	var passer := _player_by_id(ball.pass_by)
	if intended == p.id and passer != null:
		passer.stats["passes_completed"] = int(passer.stats.get("passes_completed", 0)) + 1
	elif count_interception and ball.pass_by >= 0 and ball.pass_team != p.team:
		p.stats["interceptions"] = int(p.stats.get("interceptions", 0)) + 1
	ball.owner_id = p.id
	ball.last_touch_id = p.id
	ball.last_touch_team = p.team
	ball.intended_for = -1
	ball.pass_by = -1
	ball.shot = false
	ball.z = 0.0
	ball.vx = 0.0
	ball.vy = 0.0
	ball.vz = 0.0
	for q in players:
		q.has_ball = false
	p.has_ball = true
	p.cooldown = 0.25
	if p.is_protagonist:
		_freeze("receive")


func _freeze(reason: String) -> void:
	if phase == "fulltime" or protagonist == null:
		return
	frozen = true
	freeze_reason = reason
	pending_tap_id = -1
	manual_until = 0.0
	feedback = "Tens a bola. Decide: conduzir, passar ou rematar."
	feedback_until = real_time + 4.0


func _update_frozen(dt: float) -> void:
	if pending_tap_id >= 0 and real_time - pending_tap_at > 0.7:
		var target_id := pending_tap_id
		pending_tap_id = -1
		var mate := _player_by_id(target_id)
		if mate != null:
			_perform_pass(protagonist, mate, false)
			_resume()
			return
	update_camera(dt)


func release_ai() -> void:
	if not frozen:
		return
	pending_tap_id = -1
	_resume()
	feedback = "A IA continua a jogada."
	feedback_until = real_time + 1.5


func _resume() -> void:
	frozen = false
	freeze_reason = ""
	pending_tap_id = -1


func has_ball_for_overlay() -> bool:
	return frozen and ball.owner_id == protagonist.id


func dribble_to(target: Vector2) -> void:
	if not frozen:
		return
	var tx := clampf(target.x, -PITCH_HALF_L + 1.0, PITCH_HALF_L - 1.0)
	var ty := clampf(target.y, -PITCH_HALF_W + 1.0, PITCH_HALF_W - 1.0)
	protagonist.target_x = tx
	protagonist.target_y = ty
	manual_target = Vector2(tx, ty)
	manual_until = real_time + 3.0
	protagonist.stats["dribbles"] = int(protagonist.stats.get("dribbles", 0)) + 1
	_resume()


func pass_to(teammate_id: int, lofted: bool) -> void:
	if not frozen:
		return
	var mate := _player_by_id(teammate_id)
	if mate == null:
		return
	_perform_pass(protagonist, mate, lofted)
	_resume()


func tap_at(target: Vector2) -> void:
	if not frozen or ball.owner_id != protagonist.id:
		return
	var mate := _find_teammate_near(target, 7.5)
	if mate != null:
		if pending_tap_id == mate.id and real_time - pending_tap_at < 0.8:
			pending_tap_id = -1
			pass_to(mate.id, true)
		else:
			pending_tap_id = mate.id
			pending_tap_at = real_time
			feedback = "Toca outra vez no colega para passe aéreo."
			feedback_until = real_time + 1.4
		return
	dribble_to(target)


func _find_teammate_near(target: Vector2, radius: float) -> MatchPlayer:
	var best: MatchPlayer = null
	var best_dist := radius
	for p in players:
		if not p.active or p.team != protagonist.team or p.id == protagonist.id:
			continue
		var d := p.pos().distance_to(target)
		if d < best_dist:
			best_dist = d
			best = p
	return best


func shoot_at(target: Vector2, power: float = 1.0) -> void:
	if not frozen:
		return
	var goal := _goal_center(protagonist.team)
	var distance := _dist(protagonist, _fake_player(goal))
	var pressure := _nearest_opponent_dist(protagonist)
	var aim := target
	var accuracy := float(protagonist.attrs.get("finishing", 55)) * 0.55 + float(protagonist.attrs.get("positioning", 55)) * 0.2 + float(protagonist.attrs.get("vision", 55)) * 0.1 + clampf(pressure * 5.0, 0.0, 45.0) * 0.15
	var error_scale := clampf((100.0 - accuracy) / 100.0, 0.02, 0.75)
	var err := (rng.randf() - 0.5) * error_scale * minf(1.4, distance / 18.0 + 0.25)
	aim.y += err * 4.2
	aim.x += err * 1.2
	var speed := clampf((24.0 if distance > 24.0 else 21.0) * (0.75 + power * 0.35), 15.0, 32.0)
	_kick_ball(protagonist, aim, speed, false, true)
	protagonist.stats["shots"] = int(protagonist.stats.get("shots", 0)) + 1
	shots_count[protagonist.team] += 1
	_resume()
	feedback = "Remate!"
	feedback_until = real_time + 1.3
	_add_event("%s remata!" % protagonist.name)


func on_pointer_down(sx: float, sy: float) -> void:
	gesture_active = true
	gesture_start = Vector2(sx, sy)
	gesture_current = gesture_start


func on_pointer_move(sx: float, sy: float) -> void:
	if gesture_active:
		gesture_current = Vector2(sx, sy)


func on_pointer_up(sx: float, sy: float, duration: float) -> void:
	if not gesture_active:
		return
	gesture_active = false
	var delta := Vector2(sx, sy) - gesture_start
	var screen_distance := delta.length()
	var world := unproject(sx, sy)
	if frozen:
		if ball.owner_id != protagonist.id:
			return
		if screen_distance > 26.0:
			var start_world := unproject(gesture_start.x, gesture_start.y)
			var meter_distance := world.distance_to(start_world)
			shoot_at(world, clampf(meter_distance / 34.0, 0.2, 1.3))
		else:
			tap_at(world)
		return
	if screen_distance > 26.0 and duration < 1.2:
		_attempt_user_tackle(world)
	else:
		manual_target = world
		manual_until = real_time + 2.4
		protagonist.target_x = world.x
		protagonist.target_y = world.y


func _attempt_user_tackle(target: Vector2) -> void:
	var owner := _player_by_id(ball.owner_id)
	if owner == null or owner.team == protagonist.team:
		return
	var dist := _dist(protagonist, owner)
	if dist > 5.0:
		feedback = "Demasiado longe para desarmar."
		feedback_until = real_time + 1.2
		return
	var direction := (target - protagonist.pos()).normalized()
	var to_owner := (owner.pos() - protagonist.pos()).normalized()
	if direction.dot(to_owner) < 0.15:
		feedback = "Desliza na direção do adversário."
		feedback_until = real_time + 1.2
		return
	_attempt_tackle(protagonist, owner, true)


func _attempt_ai_tackles(dt: float) -> void:
	var owner := _player_by_id(ball.owner_id)
	if owner == null or owner.is_protagonist:
		return
	for p in players:
		if not p.active or p.team == owner.team or p.is_gk or p.cooldown > 0.0:
			continue
		var d := _dist(p, owner)
		if d < 1.7 and rng.randf() < 0.55 * dt:
			_attempt_tackle(p, owner, false)


func _attempt_tackle(tackler: MatchPlayer, owner: MatchPlayer, by_user: bool) -> void:
	if tackler.cooldown > 0.0:
		return
	tackler.cooldown = 0.8
	var attack := float(tackler.attrs.get("tackling", 55)) * 0.55 + float(tackler.attrs.get("defending", 55)) * 0.3 + float(tackler.attrs.get("strength", 55)) * 0.15
	var protect := float(owner.attrs.get("dribbling", 55)) * 0.5 + float(owner.attrs.get("ball_control", 55)) * 0.35 + float(owner.attrs.get("strength", 55)) * 0.15
	var chance := clampf(0.20 + (attack - protect) / 190.0, 0.08, 0.62)
	if by_user:
		chance += 0.06
		tackler.stats["tackles"] = int(tackler.stats.get("tackles", 0)) + 1
	if rng.randf() < chance:
		_give_ball(tackler, false)
		if by_user:
			feedback = "Desarme limpo!"
			feedback_until = real_time + 1.3
			_resume()
	else:
		tackler.stunned_timer = 0.45
		if by_user:
			feedback = "Passaste ao lado. Recupera posição."
			feedback_until = real_time + 1.4


func _nearest_opponent(p: MatchPlayer) -> MatchPlayer:
	var best: MatchPlayer = null
	var best_dist := INF
	for q in players:
		if not q.active or q.team == p.team:
			continue
		var d := _dist(p, q)
		if d < best_dist:
			best_dist = d
			best = q
	return best


func _nearest_opponent_dist(p: MatchPlayer) -> float:
	var q := _nearest_opponent(p)
	return _dist(p, q) if q != null else 30.0


func _player_by_id(id: int) -> MatchPlayer:
	if id < 0:
		return null
	for p in players:
		if p.id == id:
			return p
	return null


func _dist(a: MatchPlayer, b: MatchPlayer) -> float:
	return Vector2(a.x - b.x, a.y - b.y).length()


func _dist_to_ball(p: MatchPlayer) -> float:
	return Vector2(p.x - ball.x, p.y - ball.y).length()


func _fake_player(position: Vector2) -> MatchPlayer:
	var p := MatchPlayer.new()
	p.x = position.x
	p.y = position.y
	return p


func _attacking_dir(team: int) -> float:
	return 1.0 if team == 0 else -1.0


func _own_goal_x(team: int) -> float:
	return -PITCH_HALF_L if team == 0 else PITCH_HALF_L


func _target_goal_x(team: int) -> float:
	return PITCH_HALF_L if team == 0 else -PITCH_HALF_L


func _goal_center(team: int) -> Vector2:
	return Vector2(_target_goal_x(team), 0.0)


func kickoff(team: int) -> void:
	phase = "kickoff"
	phase_timer = 0.9
	ball.x = 0.0
	ball.y = 0.0
	ball.z = 0.0
	ball.vx = 0.0
	ball.vy = 0.0
	ball.vz = 0.0
	ball.owner_id = -1
	ball.shot = false
	ball.intended_for = -1
	pending_tap_id = -1
	for p in players:
		var slot: Dictionary = (GameData.lineup as Array)[p.slot]
		var dir := 1.0 if p.team == 0 else -1.0
		p.x = float(slot.get("x", 0.0)) * dir
		p.y = float(slot.get("y", 0.0)) * dir
		p.vx = 0.0
		p.vy = 0.0
		p.target_x = p.x
		p.target_y = p.y
		p.has_ball = false
		p.stamina = clampf(p.stamina + 4.0, 0.0, 100.0)
		p.fx = dir
		p.fy = 0.0
	var taker: MatchPlayer = null
	if team == player_team and protagonist != null and protagonist.active:
		taker = protagonist
	if taker == null:
		for p in players:
			if p.active and p.team == team and p.role == "MC":
				taker = p
				break
	if taker == null:
		for p in players:
			if p.active and p.team == team and not p.is_gk:
				taker = p
				break
	if taker != null:
		taker.x = -0.7 * _attacking_dir(team)
		taker.y = 0.0
		taker.has_ball = true
		ball.owner_id = taker.id
		ball.x = taker.x
		ball.y = taker.y
		ball.last_touch_team = team
	last_kickoff_team = team
	frozen = false
	freeze_reason = ""
	if minute < 1.0:
		_add_event("%s começa com a bola." % str((setup.get("team_name", ["Casa", "Fora"]) as Array)[team]))
	if taker != null and taker.is_protagonist:
		_freeze("kickoff")


func _update_frozen_clock(_delta: float) -> void:
	pass


func _feedback_now(text: String) -> void:
	feedback = text
	feedback_until = real_time + 3.0


func _add_event(text: String) -> void:
	last_event = text
	events.push_front({"minute": int(round(minute)), "text": text})
	if events.size() > 40:
		events.resize(40)


func _protagonist_last_touch() -> float:
	if ball.last_touch_id == protagonist.id:
		return real_time
	return real_time - 12.0


func live_rating() -> float:
	var s: Dictionary = protagonist.stats
	return clampf(
		6.0 +
		float(protagonist.goals) * 1.1 +
		float(protagonist.assists) * 0.7 +
		float(s.get("tackles", 0)) * 0.07 +
		float(s.get("interceptions", 0)) * 0.05 +
		float(s.get("passes_completed", 0)) * 0.006 -
		float(s.get("fouls", 0)) * 0.08,
		4.0, 10.0
	)


func has_tackle_opportunity() -> bool:
	if phase != "play" or frozen:
		return false
	var owner := _player_by_id(ball.owner_id)
	if owner == null or owner.team == protagonist.team:
		return false
	return _dist(owner, protagonist) < 8.5


func possession_percent() -> Array:
	var total := possession_time[0] + possession_time[1]
	if total <= 0.0:
		return [50, 50]
	return [int(round(possession_time[0] / total * 100.0)), int(round(possession_time[1] / total * 100.0))]


func get_pass_options() -> Array:
	var options: Array = []
	for p in players:
		if not p.active or p.team != protagonist.team or p.id == protagonist.id:
			continue
		var distance := _dist(protagonist, p)
		if distance < 55.0:
			options.append({
				"id": p.id,
				"screen": project(p.x, p.y),
				"distance": distance,
				"name": p.name,
				"number": p.number,
			})
	options.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return float(a["distance"]) < float(b["distance"]))
	return options


func get_goal_screen() -> Vector2:
	return project(_target_goal_x(protagonist.team), 0.0)


func get_hud() -> Dictionary:
	var owner := _player_by_id(ball.owner_id)
	return {
		"home_short": str((setup.get("team_short", ["CLA", "ADV"]) as Array)[0]),
		"away_short": str((setup.get("team_short", ["CLA", "ADV"]) as Array)[1]),
		"home_name": str((setup.get("team_name", ["Casa", "Fora"]) as Array)[0]),
		"away_name": str((setup.get("team_name", ["Casa", "Fora"]) as Array)[1]),
		"home_score": score[0],
		"away_score": score[1],
		"minute": mini(90, int(round(minute))),
		"phase": phase,
		"frozen": frozen,
		"competition": str(setup.get("competition_name", "Liga")),
		"player_name": protagonist.name,
		"player_number": protagonist.number,
		"player_rating": live_rating(),
		"player_goals": protagonist.goals,
		"player_assists": protagonist.assists,
		"player_stamina": int(round(protagonist.stamina)),
		"has_ball": has_ball_for_overlay(),
		"tackle_opportunity": has_tackle_opportunity(),
		"pass_options": get_pass_options() if frozen and ball.owner_id == protagonist.id else [],
		"feedback": feedback if real_time < feedback_until else last_event,
		"possession": possession_percent(),
		"shots": shots_count.duplicate(),
		"home_kit": (setup.get("kit", [{}, {}]) as Array)[0],
		"away_kit": (setup.get("kit", [{}, {}]) as Array)[1],
		"paused": paused,
		"finished": phase == "fulltime",
		"owner_team": owner.team if owner != null else -1,
	}


func update_camera(dt: float) -> void:
	var target_scale := _camera_zoom()
	camera_scale += (target_scale - camera_scale) * minf(1.0, dt * 5.0)
	var owner := _player_by_id(ball.owner_id)
	var focus_team := owner.team if owner != null else (ball.last_touch_team if ball.last_touch_id >= 0 else protagonist.team)
	var attack_goal := _goal_center(focus_team)
	var goal_delta := attack_goal - Vector2(ball.x, ball.y)
	var goal_distance := goal_delta.length()
	var near_goal := clampf(1.0 - goal_distance / 36.0, 0.0, 1.0)
	var lead := 2.2 + near_goal * 4.8
	var lead_x := (signf(goal_delta.x) if absf(goal_delta.x) > 0.01 else _attacking_dir(focus_team)) * lead
	var lead_y := signf(goal_delta.y) * lead * 0.35
	var hero_distance := Vector2(ball.x - protagonist.x, ball.y - protagonist.y).length()
	var hero_weight := 0.46 if frozen else clampf(0.32 - hero_distance * 0.006, 0.12, 0.3)
	var look := Vector2(clampf(ball.vx * 0.16, -2.4, 2.4), clampf(ball.vy * 0.16, -2.4, 2.4))
	var target := Vector2(ball.x, ball.y) * (1.0 - hero_weight) + protagonist.pos() * hero_weight + Vector2(lead_x, lead_y) + look
	target.x = clampf(target.x, -PITCH_HALF_L + 4.0, PITCH_HALF_L - 4.0)
	target.y = clampf(target.y, -PITCH_HALF_W + 4.0, PITCH_HALF_W - 4.0)
	var k := 1.0 - exp(-dt * (5.0 if frozen else 6.5))
	camera_x += (target.x - camera_x) * k
	camera_y += (target.y - camera_y) * k
	camera_rot = _rotation_for(player_team)


func _camera_zoom() -> float:
	var portrait := viewport.y > viewport.x * 1.05
	var base := minf(viewport.y / 52.0, viewport.x / 24.0) if portrait else minf(viewport.x / 54.0, viewport.y / 34.0)
	var goal_dist := minf(
		Vector2(ball.x - _goal_center(0).x, ball.y - _goal_center(0).y).length(),
		Vector2(ball.x - _goal_center(1).x, ball.y - _goal_center(1).y).length()
	)
	var near_goal := clampf(1.0 - goal_dist / 30.0, 0.0, 1.0)
	var scale := base * (1.0 + near_goal * 0.12) * (0.95 if frozen else 1.0)
	return clampf(scale, 8.0, 32.0)


func _rotation_for(team: int) -> float:
	var portrait := viewport.y > viewport.x * 1.05
	if portrait:
		return -PI / 2.0 if team == 0 else PI / 2.0
	return 0.0 if team == 0 else PI


func project(x: float, y: float) -> Vector2:
	var dx := x - camera_x
	var dy := y - camera_y
	var cos_r := cos(camera_rot)
	var sin_r := sin(camera_rot)
	return Vector2(
		viewport.x / 2.0 + (dx * cos_r - dy * sin_r) * camera_scale,
		viewport.y / 2.0 + (dx * sin_r + dy * cos_r) * camera_scale
	)


func unproject(sx: float, sy: float) -> Vector2:
	var u := (sx - viewport.x / 2.0) / camera_scale
	var v := (sy - viewport.y / 2.0) / camera_scale
	var cos_r := cos(camera_rot)
	var sin_r := sin(camera_rot)
	return Vector2(
		camera_x + u * cos_r + v * sin_r,
		camera_y - u * sin_r + v * cos_r
	)


func build_report() -> Dictionary:
	var s: Dictionary = protagonist.stats.duplicate(true)
	s["minutes"] = 90
	var player_score := score[protagonist.team]
	var opponent_score := score[1 - protagonist.team]
	var result_bonus := 0.45 if player_score > opponent_score else (0.1 if player_score == opponent_score else -0.4)
	var base := (
		6.0 +
		float(protagonist.goals) * 1.05 +
		float(protagonist.assists) * 0.65 +
		float(s.get("passes_completed", 0)) * 0.012 +
		float(s.get("tackles", 0)) * 0.08 +
		float(s.get("interceptions", 0)) * 0.06 +
		float(s.get("shots_on", 0)) * 0.06 +
		result_bonus
	)
	var rating := clampf(snappedf(base, 0.1), 3.2, 10.0)
	var motm := rating >= 8.2 and player_score >= opponent_score
	s["rating_sum"] = rating
	s["rating_count"] = 1
	s["best_rating"] = rating
	s["motm"] = 1 if motm else 0
	return {
		"fixture_id": str(setup.get("fixture_id", "")),
		"simulated": false,
		"home_name": str((setup.get("team_name", ["Casa", "Fora"]) as Array)[0]),
		"away_name": str((setup.get("team_name", ["Casa", "Fora"]) as Array)[1]),
		"home_short": str((setup.get("team_short", ["CLA", "ADV"]) as Array)[0]),
		"away_short": str((setup.get("team_short", ["CLA", "ADV"]) as Array)[1]),
		"home_goals": score[0],
		"away_goals": score[1],
		"player_team": protagonist.team,
		"player_played": true,
		"player_minutes": 90,
		"goals": protagonist.goals,
		"assists": protagonist.assists,
		"rating": rating,
		"motm": motm,
		"stats": s,
		"events": events.duplicate(true),
		"possession": possession_percent(),
	}


func finish_early() -> void:
	minute = 90.0
	phase = "fulltime"
	frozen = false
	protagonist.stats["minutes"] = 90
	_add_event("O árbitro termina a partida.")
