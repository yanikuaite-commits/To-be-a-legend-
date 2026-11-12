extends Node


func _ready() -> void:
	var t := TestHelper.new()
	t.check(GameData.clubs.size() == 50, "expected 50 clubs, got %d" % GameData.clubs.size())
	print("clubs: ", GameData.clubs.size())
	var career := CareerManager.new_career("Diogo", "Teste", "POR", "PL", "acad-futuro", 0, 12345)
	t.check(career.get("fixtures", []).size() > 0, "new career has no fixtures")
	print("fixtures: ", career.get("fixtures", []).size(), " week: ", career.get("week"))
	var guard := 0
	while not bool(career.get("season_complete", false)) and guard < 40:
		guard += 1
		var fixture := CareerManager.next_fixture(career)
		if not fixture.is_empty():
			CareerManager.simulate_fixture(career)
		else:
			CareerManager.advance_rest_week(career)
	t.check(bool(career.get("season_complete", false)), "season did not complete within the guard window")
	t.check(CareerManager.league_rows(career).size() > 0, "league table is empty")
	print("guard: ", guard, " week: ", career.get("week"), " complete: ", career.get("season_complete"))
	print("summary: ", career.get("season_summary"))
	print("table: ", CareerManager.league_rows(career).size())
	print("history: ", career.get("history", []).size())
	t.check(career.get("history", []).size() == 1, "season history should hold one entry")
	CareerManager.start_next_season(career)
	t.check(career.get("season_label") == "2027/28", "season rollover expected 2027/28, got %s" % career.get("season_label"))
	t.check(int(career.get("week")) == 1, "new season should start at week 1")
	print("next season: ", career.get("season_label"), " week: ", career.get("week"), " fixtures: ", career.get("fixtures", []).size())
	SaveManager.save(career)
	t.check(SaveManager.has_save(), "save file was not written")
	print("save exists: ", SaveManager.has_save())
	t.finish(get_tree())
