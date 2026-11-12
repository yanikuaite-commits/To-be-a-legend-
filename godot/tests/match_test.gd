extends Node


func _ready() -> void:
	var t := TestHelper.new()
	var career := CareerManager.new_career("Rafa", "Motor", "POR", "PL", "acad-futuro", 2, 777)
	var fixture := CareerManager.next_fixture(career)
	t.check(not fixture.is_empty(), "no fixture available for the match test")
	var setup := CareerManager.build_match_setup(career, fixture)
	var engine := LegendMatch.new(setup)
	engine.set_viewport(390, 844)
	var elapsed := 0.0
	var guard := 0
	while engine.phase != "fulltime" and guard < 5000:
		guard += 1
		engine.update(0.05)
		elapsed += 0.05
		if engine.frozen:
			engine.release_ai()
		if guard % 900 == 0:
			print("t=", elapsed, " minute=", engine.minute, " phase=", engine.phase, " score=", engine.score)
	t.check(engine.phase == "fulltime", "match did not reach fulltime (phase=%s)" % engine.phase)
	t.check(guard < 5000, "match loop hit the guard limit")
	print("finished=", engine.phase, " real=", elapsed, " minute=", engine.minute, " score=", engine.score, " guards=", guard)
	t.check(engine.players.size() == 22, "expected 22 players, got %d" % engine.players.size())
	print("players=", engine.players.size(), " possession=", engine.possession_percent(), " shots=", engine.shots_count)
	var project_ok := true
	for p in engine.players:
		var s: Vector2 = engine.project(p.x, p.y)
		if not is_finite(s.x) or not is_finite(s.y):
			project_ok = false
	t.check(project_ok, "camera projection produced non-finite coordinates")
	print("projections=", project_ok, " camera=", engine.camera_scale, " rot=", engine.camera_rot)
	var report := engine.build_report()
	t.check(int(report.get("stats", {}).get("apps", 0)) == 1, "player should be credited with one appearance")
	print("report=", report.get("home_short"), " ", report.get("home_goals"), "-", report.get("away_goals"), " rating=", report.get("rating"), " stats=", report.get("stats"))
	CareerManager.apply_match(career, report)
	t.check(CareerManager.league_position(career) > 0, "player has no league position after the match")
	print("week after=", career.get("week"), " table position=", CareerManager.league_position(career))
	t.finish(get_tree())
