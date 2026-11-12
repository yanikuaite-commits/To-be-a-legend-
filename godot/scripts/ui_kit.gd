class_name UIKit
extends RefCounted


static func label(text: String, variation: String = "") -> Label:
	var l := Label.new()
	l.text = text
	if variation != "":
		l.theme_type_variation = variation
	return l


static func body(text: String) -> Label:
	var l := label(text)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return l


static func muted(text: String) -> Label:
	var l := label(text, "Muted")
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return l


static func small(text: String) -> Label:
	var l := label(text, "Small")
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return l


static func caps(text: String) -> Label:
	var l := label(text.to_upper(), "Caps")
	return l


static func button(text: String, variation: String = "PrimaryButton") -> Button:
	var b := Button.new()
	b.text = text
	b.theme_type_variation = variation
	b.custom_minimum_size = Vector2(0, 54)
	b.focus_mode = Control.FOCUS_NONE
	return b


static func icon_button(text: String) -> Button:
	var b := button(text, "GhostButton")
	b.custom_minimum_size = Vector2(46, 44)
	return b


static func panel(variation: String = "Card") -> PanelContainer:
	var p := PanelContainer.new()
	p.theme_type_variation = variation
	return p


static func vbox(separation: int = 12) -> VBoxContainer:
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", separation)
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return v


static func hbox(separation: int = 10) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", separation)
	h.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return h


static func margins(container: Control, left: int, top: int, right: int, bottom: int) -> MarginContainer:
	var m := MarginContainer.new()
	m.add_theme_constant_override("margin_left", left)
	m.add_theme_constant_override("margin_top", top)
	m.add_theme_constant_override("margin_right", right)
	m.add_theme_constant_override("margin_bottom", bottom)
	container.add_child(m)
	return m


static func scroll(body: Control, horizontal: bool = false) -> ScrollContainer:
	var s := ScrollContainer.new()
	s.size_flags_vertical = Control.SIZE_EXPAND_FILL
	s.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED if not horizontal else ScrollContainer.SCROLL_MODE_AUTO
	s.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	s.add_child(body)
	return s


static func spacer(height: float = 8) -> Control:
	var c := Control.new()
	c.custom_minimum_size = Vector2(0, height)
	return c


static func flexible() -> Control:
	var c := Control.new()
	c.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	c.size_flags_vertical = Control.SIZE_EXPAND_FILL
	return c


static func separator() -> HSeparator:
	return HSeparator.new()


static func color_dot(color: Color, size: float = 10) -> ColorRect:
	var c := ColorRect.new()
	c.color = color
	c.custom_minimum_size = Vector2(size, size)
	c.size = Vector2(size, size)
	c.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return c


static func progress(value: float, maximum: float, color: Color, height: float = 8) -> ProgressBar:
	var p := ProgressBar.new()
	p.max_value = maxf(maximum, 1.0)
	p.value = clampf(value, 0.0, p.max_value)
	p.show_percentage = false
	p.custom_minimum_size = Vector2(0, height)
	var fill := StyleBoxFlat.new()
	fill.bg_color = color
	fill.set_corner_radius_all(int(height / 2.0))
	p.add_theme_stylebox_override("fill", fill)
	var bg := StyleBoxFlat.new()
	bg.bg_color = AppTheme.PANEL_3
	bg.set_corner_radius_all(int(height / 2.0))
	p.add_theme_stylebox_override("background", bg)
	return p


static func divider_label(text: String) -> HBoxContainer:
	var row := hbox(8)
	var left := HSeparator.new()
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var l := caps(text)
	l.add_theme_color_override("font_color", AppTheme.MUTED_2)
	var right := HSeparator.new()
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(left)
	row.add_child(l)
	row.add_child(right)
	return row


static func info_row(key: String, value: String, value_color: Color = AppTheme.TEXT) -> HBoxContainer:
	var row := hbox(8)
	var k := muted(key)
	k.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var v := label(value, "Gold")
	v.add_theme_font_override("font", AppTheme.semibold_font())
	v.add_theme_font_size_override("font_size", 16)
	v.add_theme_color_override("font_color", value_color)
	v.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	row.add_child(k)
	row.add_child(v)
	return row


static func pill(text: String, color: Color = AppTheme.GOLD) -> PanelContainer:
	var p := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(color.r, color.g, color.b, 0.13)
	style.border_color = Color(color.r, color.g, color.b, 0.35)
	style.set_border_width_all(1)
	style.set_corner_radius_all(20)
	style.content_margin_left = 10
	style.content_margin_right = 10
	style.content_margin_top = 4
	style.content_margin_bottom = 4
	p.add_theme_stylebox_override("panel", style)
	var l := label(text, "Caps")
	l.add_theme_color_override("font_color", color)
	l.add_theme_font_size_override("font_size", 12)
	p.add_child(l)
	return p


static func money(value: int) -> String:
	if absi(value) >= 1_000_000:
		return "€%.1fM" % (float(value) / 1_000_000.0)
	if absi(value) >= 1_000:
		return "€%.0f mil" % (float(value) / 1_000.0)
	return "€%d" % value


static func ordinal(value: int) -> String:
	return "%d.º" % value
