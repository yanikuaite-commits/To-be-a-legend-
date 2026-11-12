extends Node

## Drives the full UI flow headless: menu → creator → dashboard → match → report.

var main: Control


func _ready() -> void:
	var scene: PackedScene = load("res://scenes/Main.tscn")
	main = scene.instantiate()
	add_child(main)
	await get_tree().process_frame
	print("menu built, view=", main.current_view != null)

	main._show_creator()
	await get_tree().process_frame
	print("creator built, club=", main.creator["club"])

	main._on_create_career()
	await get_tree().process_frame
	print("career created: ", main.career.get("season_label"), " fixtures=", main.career.get("fixtures", []).size())

	var fixture: Dictionary = CareerManager.next_fixture(main.career)
	main._start_match(fixture)
	await get_tree().process_frame
	print("match started: engine=", main.match_engine != null, " view=", main.match_view != null)

	for i in 20:
		await get_tree().process_frame
	print("hud score=", main.hud_labels["score"].text, " clock=", main.hud_labels["clock"].text)

	main._open_pause_menu()
	await get_tree().process_frame
	print("pause menu open=", main.pause_panel != null)
	main._resume_match()
	await get_tree().process_frame

	main._finish_match_early()
	await get_tree().process_frame
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
	get_tree().quit()
