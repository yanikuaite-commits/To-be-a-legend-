extends Node

## Drives the full UI flow headless: menu -> creator -> dashboard -> match -> report.

var main: Control
var t: TestHelper


func _ready() -> void:
	t = TestHelper.new()
	var scene: PackedScene = load("res://scenes/Main.tscn")
	t.check(scene != null, "Main.tscn could not be loaded")
	main = scene.instantiate()
	add_child(main)
	await get_tree().process_frame
	t.check(main.current_view != null, "menu view was not built")
	print("menu built, view=", main.current_view != null)

	main._show_creator()
	await get_tree().process_frame
	t.check(main.creator.get("club") != null, "creator state is empty")
	print("creator built, club=", main.creator["club"])

	main._on_create_career()
	await get_tree().process_frame
	t.check(main.career != null, "career was not created")
	t.check(main.career.get("fixtures", []).size() > 0, "created career has no fixtures")
	print("career created: ", main.career.get("season_label"), " fixtures=", main.career.get("fixtures", []).size())

	var fixture: Dictionary = CareerManager.next_fixture(main.career)
	main._start_match(fixture)
	await get_tree().process_frame
	t.check(main.match_engine != null and main.match_view != null, "match did not start")
	print("match started: engine=", main.match_engine != null, " view=", main.match_view != null)

	for i in 20:
		await get_tree().process_frame
	print("hud score=", main.hud_labels["score"].text, " clock=", main.hud_labels["clock"].text)

	main._open_pause_menu()
	await get_tree().process_frame
	t.check(main.pause_panel != null, "pause menu did not open")
	print("pause menu open=", main.pause_panel != null)
	main._resume_match()
	await get_tree().process_frame

	main._finish_match_early()
	await get_tree().process_frame
	t.check(main.career.get("last_report") != null, "match report was not recorded")
	print("report shown, week=", main.career.get("week"), " last_report=", main.career.get("last_report", {}).get("home_goals"))

	main._show_dashboard()
	await get_tree().process_frame
	print("dashboard built")

	var report: Dictionary = CareerManager.simulate_fixture(main.career)
	main._show_report(report, true)
	await get_tree().process_frame
	print("sim report shown, week=", main.career.get("week"))

	main._show_season_summary()
	await get_tree().process_frame
	main._show_menu()
	await get_tree().process_frame
	print("UI smoke test OK")
	t.finish(get_tree())
