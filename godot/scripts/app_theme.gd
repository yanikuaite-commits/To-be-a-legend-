class_name AppTheme
extends RefCounted

const BG := Color("#071019")
const BG_2 := Color("#0a141f")
const PANEL := Color("#0e1a26")
const PANEL_2 := Color("#132231")
const PANEL_3 := Color("#1a2c3d")
const LINE := Color("#263747")
const TEXT := Color("#f4f7f0")
const MUTED := Color("#8ea1b2")
const MUTED_2 := Color("#5f7385")
const GOLD := Color("#f5c451")
const LIME := Color("#b6f36a")
const SKY := Color("#38bdf8")
const RED := Color("#f87171")
const GREEN := Color("#4ade80")
const ORANGE := Color("#fb923c")

static var _display: Font
static var _body: Font


static func display_font() -> Font:
	if _display == null:
		_display = load("res://assets/fonts/barlow-condensed-latin-900-normal.woff2") as Font
		if _display == null:
			_display = ThemeDB.fallback_font
	return _display


static func body_font() -> Font:
	if _body == null:
		_body = load("res://assets/fonts/inter-latin-400-normal.woff2") as Font
		if _body == null:
			_body = ThemeDB.fallback_font
	return _body


static func semibold_font() -> Font:
	var f := load("res://assets/fonts/inter-latin-600-normal.woff2") as Font
	return f if f != null else body_font()


static func build() -> Theme:
	var t := Theme.new()
	t.default_font = body_font()
	t.default_font_size = 17

	_label_variation(t, "Hero", 58, TEXT, display_font())
	_label_variation(t, "Title", 38, TEXT, display_font())
	_label_variation(t, "H2", 28, TEXT, display_font())
	_label_variation(t, "H3", 22, TEXT, display_font())
	_label_variation(t, "Gold", 18, GOLD, semibold_font())
	_label_variation(t, "Muted", 15, MUTED, body_font())
	_label_variation(t, "Small", 13, MUTED, body_font())
	_label_variation(t, "Caps", 14, MUTED, semibold_font())
	_label_variation(t, "Lime", 17, LIME, semibold_font())

	var normal := _box(PANEL_2, LINE, 12, 1, 18)
	var hover := _box(PANEL_3, GOLD.darkened(0.15), 12, 1, 18)
	var pressed := _box(GOLD.darkened(0.18), GOLD, 12, 1, 18)
	var disabled := _box(PANEL.darkened(0.08), LINE.darkened(0.25), 12, 1, 18)
	t.set_stylebox("normal", "Button", normal)
	t.set_stylebox("hover", "Button", hover)
	t.set_stylebox("pressed", "Button", pressed)
	t.set_stylebox("disabled", "Button", disabled)
	t.set_stylebox("focus", "Button", StyleBoxEmpty.new())
	t.set_font("font", "Button", semibold_font())
	t.set_font_size("font_size", "Button", 18)
	t.set_color("font_color", "Button", TEXT)
	t.set_color("font_hover_color", "Button", GOLD)
	t.set_color("font_pressed_color", "Button", BG)
	t.set_color("font_disabled_color", "Button", MUTED_2)
	t.set_color("font_focus_color", "Button", TEXT)

	t.set_type_variation("PrimaryButton", "Button")
	t.set_stylebox("normal", "PrimaryButton", _box(GOLD, GOLD, 12, 1, 20))
	t.set_stylebox("hover", "PrimaryButton", _box(GOLD.lightened(0.12), GOLD.lightened(0.18), 12, 1, 20))
	t.set_stylebox("pressed", "PrimaryButton", _box(GOLD.darkened(0.15), GOLD, 12, 1, 20))
	t.set_stylebox("disabled", "PrimaryButton", _box(PANEL_2, LINE, 12, 1, 20))
	t.set_font("font", "PrimaryButton", semibold_font())
	t.set_font_size("font_size", "PrimaryButton", 19)
	t.set_color("font_color", "PrimaryButton", BG)
	t.set_color("font_hover_color", "PrimaryButton", BG)
	t.set_color("font_pressed_color", "PrimaryButton", BG)
	t.set_color("font_disabled_color", "PrimaryButton", MUTED_2)

	t.set_type_variation("GhostButton", "Button")
	t.set_stylebox("normal", "GhostButton", _box(Color(0, 0, 0, 0), LINE, 12, 1, 18))
	t.set_stylebox("hover", "GhostButton", _box(PANEL_2, LINE.lightened(0.18), 12, 1, 18))
	t.set_stylebox("pressed", "GhostButton", _box(PANEL_3, GOLD, 12, 1, 18))
	t.set_color("font_color", "GhostButton", TEXT)
	t.set_color("font_hover_color", "GhostButton", GOLD)

	t.set_type_variation("DangerButton", "Button")
	t.set_stylebox("normal", "DangerButton", _box(Color(0, 0, 0, 0), RED.darkened(0.35), 12, 1, 16))
	t.set_stylebox("hover", "DangerButton", _box(RED.darkened(0.7), RED, 12, 1, 16))
	t.set_color("font_color", "DangerButton", RED)

	var card := _box(PANEL, LINE, 18, 1, 20)
	t.set_stylebox("panel", "PanelContainer", card)
	t.set_type_variation("Card", "PanelContainer")
	t.set_stylebox("panel", "Card", card)
	t.set_type_variation("HeroCard", "PanelContainer")
	t.set_stylebox("panel", "HeroCard", _box(PANEL_2, LINE, 22, 1, 24))
	t.set_type_variation("DarkCard", "PanelContainer")
	t.set_stylebox("panel", "DarkCard", _box(BG_2, LINE, 16, 1, 18))
	t.set_type_variation("GoldCard", "PanelContainer")
	t.set_stylebox("panel", "GoldCard", _box(Color("#1d2630"), GOLD.darkened(0.2), 18, 1, 20))

	var line_edit := _box(BG_2, LINE, 12, 1, 14)
	t.set_stylebox("normal", "LineEdit", line_edit)
	t.set_stylebox("focus", "LineEdit", _box(BG_2, GOLD, 12, 1, 14))
	t.set_color("font_color", "LineEdit", TEXT)
	t.set_color("font_placeholder_color", "LineEdit", MUTED_2)
	t.set_color("caret_color", "LineEdit", GOLD)
	t.set_font("font", "LineEdit", body_font())
	t.set_font_size("font_size", "LineEdit", 18)

	t.set_stylebox("normal", "OptionButton", line_edit)
	t.set_stylebox("hover", "OptionButton", _box(PANEL_2, GOLD.darkened(0.2), 12, 1, 14))
	t.set_stylebox("pressed", "OptionButton", _box(PANEL_3, GOLD, 12, 1, 14))
	t.set_color("font_color", "OptionButton", TEXT)
	t.set_font("font", "OptionButton", body_font())
	t.set_font_size("font_size", "OptionButton", 17)

	t.set_stylebox("background", "ProgressBar", _box(PANEL_3, LINE, 6, 0, 0))
	t.set_stylebox("fill", "ProgressBar", _box(GOLD, GOLD, 6, 0, 0))
	t.set_color("font_color", "ProgressBar", BG)
	t.set_font_size("font_size", "ProgressBar", 12)

	t.set_color("font_color", "RichTextLabel", TEXT)
	t.set_font("normal_font", "RichTextLabel", body_font())
	t.set_font_size("normal_font_size", "RichTextLabel", 16)
	t.set_color("default_color", "RichTextLabel", TEXT)

	var sep := StyleBoxLine.new()
	sep.color = LINE
	sep.thickness = 1
	t.set_stylebox("separator", "HSeparator", sep)

	t.set_color("font_color", "Label", TEXT)
	return t


static func _label_variation(t: Theme, variation: String, size: int, color: Color, font: Font) -> void:
	t.set_type_variation(variation, "Label")
	t.set_font("font", variation, font)
	t.set_font_size("font_size", variation, size)
	t.set_color("font_color", variation, color)


static func _box(bg: Color, border: Color, radius: int, border_width: int, margin: int) -> StyleBoxFlat:
	var s := StyleBoxFlat.new()
	s.bg_color = bg
	s.border_color = border
	s.set_border_width_all(border_width)
	s.set_corner_radius_all(radius)
	s.content_margin_left = margin
	s.content_margin_right = margin
	s.content_margin_top = margin
	s.content_margin_bottom = margin
	s.anti_aliasing = true
	return s
