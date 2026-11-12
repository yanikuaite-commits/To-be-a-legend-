extends Node

const DATA_PATH := "res://data/game_data.json"

var db: Dictionary = {}
var clubs: Array = []
var leagues: Array = []
var countries: Array = []
var club_by_id: Dictionary = {}
var league_by_id: Dictionary = {}
var country_by_code: Dictionary = {}
var attr_keys: Array[String] = []
var positions: Array = []
var position_labels: Dictionary = {}
var position_short: Dictionary = {}
var overall_weights: Dictionary = {}
var training: Array = []
var lineup: Array = []
var name_pools: Dictionary = {}
var start_club_ids: Array = []


func _ready() -> void:
	var file := FileAccess.open(DATA_PATH, FileAccess.READ)
	if file == null:
		push_error("Não foi possível abrir %s" % DATA_PATH)
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("Base de dados inválida.")
		return
	db = parsed as Dictionary
	clubs = db.get("clubs", [])
	leagues = db.get("leagues", [])
	countries = db.get("countries", [])
	positions = db.get("positions", [])
	position_labels = db.get("position_labels", {})
	position_short = db.get("position_short", {})
	overall_weights = db.get("overall_weights", {})
	training = db.get("training", [])
	lineup = db.get("lineup", [])
	name_pools = db.get("name_pools", {})
	start_club_ids = db.get("start_clubs", [])

	for club in clubs:
		club_by_id[club.get("id", "")] = club
	for league in leagues:
		league_by_id[league.get("id", "")] = league
	for country in countries:
		country_by_code[country.get("code", "")] = country

	var attrs: Dictionary = db.get("attr_meta", {})
	attr_keys.clear()
	for key in attrs.keys():
		attr_keys.append(str(key))


func club(id: String) -> Dictionary:
	return club_by_id.get(id, clubs[0] if not clubs.is_empty() else {})


func league(id: String) -> Dictionary:
	return league_by_id.get(id, leagues[0] if not leagues.is_empty() else {})


func country(code: String) -> Dictionary:
	return country_by_code.get(code, {"code": code, "name": code})


func league_clubs(league_id: String) -> Array:
	return clubs.filter(func(c: Dictionary) -> bool: return c.get("league_id", "") == league_id)


func starting_clubs() -> Array:
	return start_club_ids.map(func(id: String) -> Dictionary: return club(id))


func attr_label(key: String) -> String:
	var meta: Dictionary = db.get("attr_meta", {}).get(key, {})
	return str(meta.get("label", key.capitalize()))


func attr_short(key: String) -> String:
	var meta: Dictionary = db.get("attr_meta", {}).get(key, {})
	return str(meta.get("short", key.left(3).to_upper()))


func attr_group(key: String) -> String:
	var meta: Dictionary = db.get("attr_meta", {}).get(key, {})
	return str(meta.get("group", "Geral"))


func overall(attrs: Dictionary, position: String) -> int:
	var weights: Dictionary = overall_weights.get(position, {})
	var total := 0.0
	var weight_sum := 0.0
	for key in weights.keys():
		total += float(attrs.get(key, 55)) * float(weights[key])
		weight_sum += float(weights[key])
	if weight_sum <= 0.0:
		var average := 0.0
		for key in attrs.keys():
			average += float(attrs[key])
		return int(round(average / maxf(1.0, attrs.size())))
	return int(round(total / weight_sum))


func training_program(id: String) -> Dictionary:
	for program in training:
		if str(program.get("id", "")) == id:
			return program
	return {}


func random_name(country_code: String, rng: RandomNumberGenerator) -> String:
	var pool: Dictionary = name_pools.get(country_code, name_pools.get("POR", {}))
	var firsts: Array = pool.get("first", ["Alex"])
	var lasts: Array = pool.get("last", ["Silva"])
	var first := str(firsts[rng.randi_range(0, firsts.size() - 1)])
	var last := str(lasts[rng.randi_range(0, lasts.size() - 1)])
	return "%s %s" % [first, last]


func kit_for(club_id: String, goalkeeper: bool = false) -> Dictionary:
	if goalkeeper:
		var gk_primary := Color("#f97316")
		var gk_secondary := Color("#111827")
		if club_id.hash() % 2 == 0:
			gk_primary = Color("#a3e635")
			gk_secondary = Color("#1f2937")
		return {
			"primary": gk_primary,
			"secondary": gk_secondary,
			"shorts": gk_secondary,
			"socks": gk_primary,
			"trim": Color.WHITE,
			"number": Color("#111827"),
			"pattern": "solid",
			"gk": true,
		}
	var c := club(club_id)
	var colors: Dictionary = c.get("colors", {})
	var primary := Color.from_string(str(colors.get("primary", "#f8fafc")), Color.WHITE)
	var secondary := Color.from_string(str(colors.get("secondary", "#111827")), Color.BLACK)
	var accent := Color.from_string(str(colors.get("accent", "#f5c451")), AppTheme.GOLD)
	var shorts := primary
	if primary.get_luminance() > 0.72:
		shorts = secondary
	var socks := primary
	if primary.get_luminance() > 0.8:
		socks = secondary
	var number := Color("#111827") if primary.get_luminance() > 0.55 else Color.WHITE
	var patterns := ["solid", "stripes", "halves", "sash", "hoops"]
	return {
		"primary": primary,
		"secondary": secondary,
		"shorts": shorts,
		"socks": socks,
		"trim": accent,
		"number": number,
		"pattern": patterns[absi(club_id.hash()) % patterns.size()],
		"gk": false,
	}


func contrast_kit(primary: Dictionary, opponent: Dictionary) -> Dictionary:
	var a: Color = primary.get("primary", Color.WHITE)
	var b: Color = opponent.get("primary", Color.BLACK)
	var d := absf(a.r - b.r) + absf(a.g - b.g) + absf(a.b - b.b)
	if d > 0.48:
		return primary
	var copy := primary.duplicate(true)
	copy["primary"] = primary.get("secondary", Color("#111827"))
	copy["shorts"] = primary.get("primary", Color.WHITE)
	copy["socks"] = primary.get("secondary", Color("#111827"))
	return copy


func money(value: int) -> String:
	return UIKit.money(value)
