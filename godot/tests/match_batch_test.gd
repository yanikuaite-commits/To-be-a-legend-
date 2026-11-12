extends Node

func _ready() -> void:
	var career := CareerManager.new_career("Rafa", "Lote", "POR", "PL", "acad-futuro", 4, 4242)
	var total_goals := 0
	var total_shots := 0
	for i in 3:
		var fixtures: Array = career.get("fixtures", [])
		var fixture: Dictionary = fixtures[i]
		var setup := CareerManager.build_match_setup(career, fixture)
		var engine := LegendMatch.new(setup)
		engine.set_viewport(390, 844)
		var guard := 0
		while engine.phase != "fulltime" and guard < 5000:
			guard += 1
			engine.update(0.05)
			if engine.frozen:
				engine.release_ai()
		total_goals += int(engine.score[0]) + int(engine.score[1])
		total_shots += int(engine.shots_count[0]) + int(engine.shots_count[1])
		var p = engine.protagonist
		print("match ", i + 1, ": ", engine.score, " shots=", engine.shots_count, " poss=", engine.possession_percent(), " pass=", p.stats["passes_completed"], "/", p.stats["passes"], " int=", p.stats["interceptions"], " rating=", engine.live_rating())
	print("TOTAL goals=", total_goals, " shots=", total_shots)
	get_tree().quit()
