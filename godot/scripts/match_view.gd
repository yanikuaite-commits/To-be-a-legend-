class_name MatchView
extends Control

const PITCH_HALF_L := LegendMatch.PITCH_HALF_L
const PITCH_HALF_W := LegendMatch.PITCH_HALF_W
const GOAL_HALF := LegendMatch.GOAL_HALF
const HIP_Y_SOURCE := 170.0

var engine: LegendMatch
var player_textures: Dictionary = {}
var _press_started := 0
var _mouse_press_started := 0
var _last_touch_ms := 0


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	focus_mode = Control.FOCUS_ALL
	set_process(true)


func setup(match_engine: LegendMatch) -> void:
	engine = match_engine
	engine.set_viewport(size.x, size.y)
	_build_textures()
	queue_redraw()


func _process(delta: float) -> void:
	if engine == null:
		return
	engine.set_viewport(size.x, size.y)
	engine.update(delta)
	queue_redraw()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED and engine != null:
		engine.set_viewport(size.x, size.y)


func _build_textures() -> void:
	if engine == null:
		return
	for p in engine.players:
		var tex := CharacterFactory.texture_for(
			p.base_index,
			p.kit,
			CharacterFactory.skin_for(p.base_index, p.id),
			CharacterFactory.hair_for(p.base_index, p.id)
		)
		player_textures[p.id] = tex


func _draw() -> void:
	if engine == null:
		return
	_draw_pitch()
	_draw_goal(-1.0)
	_draw_goal(1.0)
	_draw_ball()
	_draw_players()
	_draw_pass_options()


func _draw_pitch() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), AppTheme.BG)
	var outer := PackedVector2Array([
		engine.project(-PITCH_HALF_L - 8.0, -PITCH_HALF_W - 7.0),
		engine.project(PITCH_HALF_L + 8.0, -PITCH_HALF_W - 7.0),
		engine.project(PITCH_HALF_L + 8.0, PITCH_HALF_W + 7.0),
		engine.project(-PITCH_HALF_L - 8.0, PITCH_HALF_W + 7.0),
	])
	draw_colored_polygon(outer, Color("#07131c"))

	var pitch_rect := PackedVector2Array([
		engine.project(-PITCH_HALF_L, -PITCH_HALF_W),
		engine.project(PITCH_HALF_L, -PITCH_HALF_W),
		engine.project(PITCH_HALF_L, PITCH_HALF_W),
		engine.project(-PITCH_HALF_L, PITCH_HALF_W),
	])
	draw_colored_polygon(pitch_rect, Color("#153f2a"))

	# Striped mowing pattern.
	var stripe_width := 5.25
	var stripe_count := int((PITCH_HALF_L * 2.0) / stripe_width)
	for i in stripe_count:
		var x0 := -PITCH_HALF_L + i * stripe_width
		var x1 := x0 + stripe_width
		var color := Color("#19492f") if i % 2 == 0 else Color("#16432a")
		var quad := PackedVector2Array([
			engine.project(x0, -PITCH_HALF_W),
			engine.project(x1, -PITCH_HALF_W),
			engine.project(x1, PITCH_HALF_W),
			engine.project(x0, PITCH_HALF_W),
		])
		draw_colored_polygon(quad, color)

	# Advertising boards give the tight camera some stadium context.
	_draw_ad_boards()
	_draw_markings()
	_draw_stadium_edge()


func _draw_ad_boards() -> void:
	var colors := [AppTheme.GOLD, AppTheme.SKY, AppTheme.LIME, Color("#f87171")]
	for side_value in [-1, 1]:
		var side: float = float(side_value)
		var y: float = (PITCH_HALF_W + 1.25) * side
		for i in 10:
			var x0 := -PITCH_HALF_L + 3.0 + i * 10.0
			var x1 := x0 + 9.0
			var quad := PackedVector2Array([
				engine.project(x0, y),
				engine.project(x1, y),
				engine.project(x1, y + 1.5 * signf(y)),
				engine.project(x0, y + 1.5 * signf(y)),
			])
			draw_colored_polygon(quad, colors[(i + (0 if side > 0 else 2)) % colors.size()].darkened(0.45))
	for side_value in [-1, 1]:
		var side: float = float(side_value)
		var x: float = (PITCH_HALF_L + 1.25) * side
		for i in 6:
			var y0 := -PITCH_HALF_W + 4.0 + i * 10.0
			var y1 := y0 + 8.5
			var quad := PackedVector2Array([
				engine.project(x, y0),
				engine.project(x, y1),
				engine.project(x + 1.5 * signf(x), y1),
				engine.project(x + 1.5 * signf(x), y0),
			])
			draw_colored_polygon(quad, colors[(i + 1) % colors.size()].darkened(0.5))


func _draw_stadium_edge() -> void:
	var edge := PackedVector2Array([
		engine.project(-PITCH_HALF_L - 8.0, -PITCH_HALF_W - 7.0),
		engine.project(PITCH_HALF_L + 8.0, -PITCH_HALF_W - 7.0),
		engine.project(PITCH_HALF_L + 8.0, PITCH_HALF_W + 7.0),
		engine.project(-PITCH_HALF_L - 8.0, PITCH_HALF_W + 7.0),
		engine.project(-PITCH_HALF_L - 8.0, -PITCH_HALF_W - 7.0),
	])
	draw_polyline(edge, Color("#263847"), maxf(1.0, engine.camera_scale * 0.10), true)
	# Crowd flecks outside the boards.
	for i in 46:
		var x := -PITCH_HALF_L - 5.0 + (i * 71.0) % (PITCH_HALF_L * 2.0 + 10.0)
		var y := -PITCH_HALF_W - 5.5 if i % 2 == 0 else PITCH_HALF_W + 5.5
		var pos := engine.project(x, y)
		draw_circle(pos, 2.2, Color(0.50, 0.60, 0.68, 0.28))


func _draw_markings() -> void:
	var line_color := Color(0.92, 0.97, 0.92, 0.66)
	var w := maxf(1.0, engine.camera_scale * 0.11)
	_rect_line(-PITCH_HALF_L, -PITCH_HALF_W, PITCH_HALF_L, PITCH_HALF_W, line_color, w)
	_line(Vector2(0, -PITCH_HALF_W), Vector2(0, PITCH_HALF_W), line_color, w)
	var center := engine.project(0, 0)
	draw_arc(center, 9.15 * engine.camera_scale, 0.0, TAU, 64, line_color, w, true)
	draw_circle(center, maxf(1.5, engine.camera_scale * 0.14), line_color)

	for side_value in [-1, 1]:
		var side: float = float(side_value)
		var goal_line: float = PITCH_HALF_L * side
		var inward: float = -side
		var box_x := goal_line + inward * 16.5
		_rect_line(minf(goal_line, box_x), -20.16, maxf(goal_line, box_x), 20.16, line_color, w)
		var small_x := goal_line + inward * 5.5
		_rect_line(minf(goal_line, small_x), -9.16, maxf(goal_line, small_x), 9.16, line_color, w)
		draw_circle(engine.project(goal_line + inward * 11.0, 0.0), maxf(1.4, engine.camera_scale * 0.11), line_color)
		# Penalty arc.
		var arc_center := Vector2(goal_line + inward * 11.0, 0.0)
		var start_angle := 0.0 if side > 0 else PI
		var points := PackedVector2Array()
		for i in 25:
			var angle := start_angle + (-0.88 + (1.76 * i / 24.0)) * (1.0 if side > 0 else -1.0)
			points.append(engine.project(arc_center.x + cos(angle) * 9.15, arc_center.y + sin(angle) * 9.15))
		draw_polyline(points, line_color, w, true)

	# Corner arcs.
	for sx in [-1, 1]:
		for sy in [-1, 1]:
			var center_corner := engine.project(PITCH_HALF_L * sx, PITCH_HALF_W * sy)
			draw_arc(center_corner, 1.0 * engine.camera_scale, 0.0, TAU, 18, line_color, w, true)


func _rect_line(x0: float, y0: float, x1: float, y1: float, color: Color, width: float) -> void:
	var points := PackedVector2Array([
		engine.project(x0, y0),
		engine.project(x1, y0),
		engine.project(x1, y1),
		engine.project(x0, y1),
		engine.project(x0, y0),
	])
	draw_polyline(points, color, width, true)


func _line(a: Vector2, b: Vector2, color: Color, width: float) -> void:
	draw_line(engine.project(a.x, a.y), engine.project(b.x, b.y), color, width, true)


func _draw_goal(goal_side: float) -> void:
	var goal_x := PITCH_HALF_L * goal_side
	var outward := goal_side
	var depth := 4.6
	var height_px := 3.5 * engine.camera_scale
	var front_left := engine.project(goal_x, -GOAL_HALF)
	var front_right := engine.project(goal_x, GOAL_HALF)
	var back_left := engine.project(goal_x + outward * depth, -GOAL_HALF)
	var back_right := engine.project(goal_x + outward * depth, GOAL_HALF)
	var top_left := front_left + Vector2(0, -height_px)
	var top_right := front_right + Vector2(0, -height_px)
	var back_top_left := back_left + Vector2(0, -height_px)
	var back_top_right := back_right + Vector2(0, -height_px)
	var all := PackedVector2Array([front_left, front_right, back_left, back_right, top_left, top_right, back_top_left, back_top_right])
	var min_x := INF
	var max_x := -INF
	var min_y := INF
	var max_y := -INF
	for p in all:
		min_x = minf(min_x, p.x)
		max_x = maxf(max_x, p.x)
		min_y = minf(min_y, p.y)
		max_y = maxf(max_y, p.y)
	if max_x < -60 or min_x > size.x + 60 or max_y < -60 or min_y > size.y + 60:
		return

	# Soft shadow under the frame.
	var shadow := PackedVector2Array([
		front_left + Vector2(4, 7),
		front_right + Vector2(4, 7),
		back_right + Vector2(7, 10),
		back_left + Vector2(7, 10),
	])
	draw_colored_polygon(shadow, Color(0.0, 0.0, 0.0, 0.20))

	var net_bg := Color(0.70, 0.84, 0.90, 0.075)
	draw_colored_polygon(PackedVector2Array([back_left, back_right, back_top_right, back_top_left]), net_bg)
	draw_colored_polygon(PackedVector2Array([front_left, back_left, back_top_left, top_left]), Color(0.7, 0.84, 0.9, 0.055))
	draw_colored_polygon(PackedVector2Array([front_right, back_right, back_top_right, top_right]), Color(0.7, 0.84, 0.9, 0.055))
	draw_colored_polygon(PackedVector2Array([top_left, top_right, back_top_right, back_top_left]), Color(0.7, 0.84, 0.9, 0.045))

	var net := Color(0.84, 0.94, 0.97, 0.24)
	var grid_w := maxf(0.7, engine.camera_scale * 0.055)
	for i in 9:
		var t := i / 8.0
		draw_line(back_left.lerp(back_right, t), back_top_left.lerp(back_top_right, t), net, grid_w, true)
	for i in 5:
		var t := i / 4.0
		draw_line(back_left.lerp(back_top_left, t), back_right.lerp(back_top_right, t), net, grid_w, true)
		draw_line(front_left.lerp(back_left, t), top_left.lerp(back_top_left, t), net.darkened(0.2), grid_w, true)
		draw_line(front_right.lerp(back_right, t), top_right.lerp(back_top_right, t), net.darkened(0.2), grid_w, true)
	for i in 4:
		var t := i / 4.0
		draw_line(back_left.lerp(back_right, t).lerp(back_top_left.lerp(back_top_right, t), 0.0), back_top_left.lerp(back_top_right, t), net.darkened(0.35), grid_w * 0.7, true)

	# Front frame, with a soft glow.
	var frame := Color("#f8fbf3")
	var thick := maxf(2.0, engine.camera_scale * 0.18)
	draw_line(front_left, top_left, Color(1, 1, 1, 0.12), thick * 4.0, true)
	draw_line(front_right, top_right, Color(1, 1, 1, 0.12), thick * 4.0, true)
	draw_line(front_left, front_right, Color(1, 1, 1, 0.08), thick * 3.0, true)
	draw_line(front_left, top_left, frame, thick, true)
	draw_line(front_right, top_right, frame, thick, true)
	draw_line(top_left, top_right, frame, thick * 1.05, true)
	draw_line(front_left, front_right, frame.darkened(0.15), maxf(1.5, thick * 0.8), true)
	# Back stanchions.
	var back_frame := Color(0.82, 0.89, 0.9, 0.34)
	draw_line(back_left, back_top_left, back_frame, maxf(1.0, thick * 0.55), true)
	draw_line(back_right, back_top_right, back_frame, maxf(1.0, thick * 0.55), true)
	draw_line(back_top_left, back_top_right, back_frame, maxf(1.0, thick * 0.55), true)


func _draw_players() -> void:
	var render_list: Array = []
	for p in engine.players:
		if not p.active:
			continue
		var screen := engine.project(p.x, p.y)
		if screen.x < -90 or screen.x > size.x + 90:
			continue
		var h := engine.camera_scale * 4.1
		if screen.y + h * 0.3 < -40 or screen.y - h > size.y + 80:
			continue
		render_list.append({"p": p, "s": screen})
	render_list.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return float(a["s"].y) < float(b["s"].y))
	for item in render_list:
		var p := item["p"] as LegendMatch.MatchPlayer
		var screen: Vector2 = item["s"]
		_draw_character(p, screen)
	# A second pass puts the protagonist marker above every shirt.
	for item in render_list:
		var p := item["p"] as LegendMatch.MatchPlayer
		if p.is_protagonist:
			var screen: Vector2 = item["s"]
			var h := engine.camera_scale * 4.1
			var marker_y := screen.y - h - 9.0
			draw_colored_polygon(PackedVector2Array([
				Vector2(screen.x, marker_y + 8.0),
				Vector2(screen.x - 6.0, marker_y),
				Vector2(screen.x + 6.0, marker_y),
			]), AppTheme.GOLD)
			draw_circle(screen, maxf(5.0, engine.camera_scale * 0.22), Color(0, 0, 0, 0), false, maxf(1.0, engine.camera_scale * 0.08), true)


func _draw_character(p: LegendMatch.MatchPlayer, screen: Vector2) -> void:
	var tex: ImageTexture = player_textures.get(p.id)
	if tex == null:
		return
	var h := engine.camera_scale * 4.1
	var s := h / 256.0
	var speed := Vector2(p.vx, p.vy).length()
	var stride_amount := clampf(speed / 5.5, 0.0, 1.0)
	var phase := p.stride_phase
	var hip := screen.y - (256.0 - HIP_Y_SOURCE) * s
	var left_angle := sin(phase) * 0.52 * stride_amount
	var right_angle := -sin(phase) * 0.52 * stride_amount
	var lift := absf(cos(phase)) * 2.0 * stride_amount

	# Ground shadow.
	_draw_ellipse(Vector2(screen.x, screen.y + 1.0), maxf(5.0, h * 0.22), maxf(2.0, h * 0.07), Color(0, 0, 0, 0.28))

	# Back leg.
	draw_set_transform(Vector2(screen.x, hip - lift), right_angle, Vector2(s, s))
	draw_texture_rect_region(tex, Rect2(0.0, -5.0, 64.0, 91.0), Rect2(64.0, 165.0, 64.0, 91.0), Color.WHITE, false)
	# Front leg.
	draw_set_transform(Vector2(screen.x, hip), left_angle, Vector2(s, s))
	draw_texture_rect_region(tex, Rect2(-64.0, -5.0, 64.0, 91.0), Rect2(0.0, 165.0, 64.0, 91.0), Color.WHITE, false)
	# Torso, arms and head overlap the hips.
	draw_set_transform(Vector2(screen.x, hip), sin(phase) * 0.018 * stride_amount, Vector2(s, s))
	draw_texture_rect_region(tex, Rect2(-64.0, -HIP_Y_SOURCE, 128.0, 174.0), Rect2(0.0, 0.0, 128.0, 174.0), Color.WHITE, false)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

	# Ball owner halo.
	if p.id == engine.ball.owner_id:
		draw_arc(Vector2(screen.x, screen.y - 2.0), maxf(6.0, h * 0.17), 0.0, TAU, 24, Color(1, 1, 1, 0.18), maxf(1.0, s * 2.0), true)


func _draw_ellipse(center: Vector2, rx: float, ry: float, color: Color) -> void:
	var points := PackedVector2Array()
	for i in 20:
		var angle := TAU * i / 20.0
		points.append(center + Vector2(cos(angle) * rx, sin(angle) * ry))
	draw_colored_polygon(points, color)


func _draw_ball() -> void:
	if engine == null:
		return
	var ground := engine.project(engine.ball.x, engine.ball.y)
	var radius := clampf(engine.camera_scale * 0.34, 4.0, 10.0)
	_draw_ellipse(ground, radius * 1.1, radius * 0.45, Color(0, 0, 0, 0.28))
	var ball_pos := ground + Vector2(0, -engine.ball.z * engine.camera_scale * 0.55 - radius)
	var shadow_radius := clampf(engine.camera_scale * 0.29, 3.0, 8.0)
	draw_circle(ball_pos, radius + 1.5, Color("#f7f6ee"))
	draw_circle(ball_pos, radius, Color("#fbfaf1"))
	draw_arc(ball_pos, radius, 0.0, TAU, 20, Color("#26313b"), maxf(1.0, radius * 0.12), true)
	draw_circle(ball_pos + Vector2(-radius * 0.26, -radius * 0.18), radius * 0.20, Color("#252c32"))
	draw_circle(ball_pos + Vector2(radius * 0.30, radius * 0.06), radius * 0.17, Color("#252c32"))
	draw_circle(ball_pos + Vector2(-radius * 0.05, radius * 0.38), radius * 0.14, Color("#252c32"))
	if engine.ball.z > 0.4:
		draw_arc(ground, shadow_radius, 0.0, TAU, 16, Color(1, 1, 1, 0.1), 1.0, true)


func _draw_pass_options() -> void:
	if not engine.frozen or engine.ball.owner_id != engine.protagonist.id:
		return
	var options := engine.get_pass_options()
	var font := AppTheme.semibold_font()
	for i in mini(3, options.size()):
		var option: Dictionary = options[i]
		var screen: Vector2 = option["screen"]
		var radius := clampf(engine.camera_scale * 0.55, 11.0, 17.0)
		draw_circle(screen, radius + 3.0, Color(0.03, 0.06, 0.09, 0.68))
		draw_circle(screen, radius, Color(0.98, 0.82, 0.38, 0.16))
		draw_arc(screen, radius, 0.0, TAU, 24, AppTheme.GOLD, 1.5, true)
		var label := str(option["number"])
		var text_size := font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, 12)
		draw_string(font, screen + Vector2(-text_size.x / 2.0, 4.0), label, HORIZONTAL_ALIGNMENT_LEFT, -1, 12, AppTheme.GOLD)


func _gui_input(event: InputEvent) -> void:
	if engine == null:
		return
	if event is InputEventScreenTouch:
		_last_touch_ms = Time.get_ticks_msec()
		if event.pressed:
			_press_started = _last_touch_ms
			engine.on_pointer_down(event.position.x, event.position.y)
		else:
			var duration := (_last_touch_ms - _press_started) / 1000.0
			engine.on_pointer_up(event.position.x, event.position.y, duration)
		accept_event()
	elif event is InputEventScreenDrag:
		_last_touch_ms = Time.get_ticks_msec()
		engine.on_pointer_move(event.position.x, event.position.y)
		accept_event()
	elif event is InputEventMouseButton:
		if Time.get_ticks_msec() - _last_touch_ms < 120:
			return
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				_mouse_press_started = Time.get_ticks_msec()
				engine.on_pointer_down(event.position.x, event.position.y)
			else:
				var duration := (Time.get_ticks_msec() - _mouse_press_started) / 1000.0
				engine.on_pointer_up(event.position.x, event.position.y, duration)
			accept_event()
	elif event is InputEventMouseMotion:
		if Time.get_ticks_msec() - _last_touch_ms < 120:
			return
		engine.on_pointer_move(event.position.x, event.position.y)
