extends Node

func _ready() -> void:
	print("clubs: ", GameData.clubs.size())
	var career := CareerManager.new_career("Diogo", "Teste", "POR", "PL", "acad-futuro", 0, 12345)
	print("fixtures: ", career.get("fixtures", []).size(), " week: ", career.get("week"))
	var guard := 0
	while not bool(career.get("season_complete", false)) and guard < 40:
		guard += 1
		var fixture := CareerManager.next_fixture(career)
		if not fixture.is_empty():
			CareerManager.simulate_fixture(career)
		else:
			CareerManager.advance_rest_week(career)
	print("guard: ", guard, " week: ", career.get("week"), " complete: ", career.get("season_complete"))
	print("summary: ", career.get("season_summary"))
	print("table: ", CareerManager.league_rows(career).size())
	print("history: ", career.get("history", []).size())
	CareerManager.start_next_season(career)
	print("next season: ", career.get("season_label"), " week: ", career.get("week"), " fixtures: ", career.get("fixtures", []).size())
	SaveManager.save(career)
	print("save exists: ", SaveManager.has_save())
	get_tree().quit()
