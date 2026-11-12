class_name CharacterFactory
extends RefCounted

const TEX_W := 128
const TEX_H := 256
const NECK_Y := 116
const HIP_Y := 170
const FEET_Y := 250

const SKIN_TONES: Array[Color] = [
	Color("#f2d3b3"),
	Color("#e0b184"),
	Color("#c68c5f"),
	Color("#a96b43"),
	Color("#82502f"),
	Color("#623a25"),
	Color("#d8a87f"),
	Color("#b77a4e"),
]

const HAIR_COLORS: Array[Color] = [
	Color("#171313"),
	Color("#241b17"),
	Color("#3d2b20"),
	Color("#60432b"),
	Color("#b48a4b"),
	Color("#d9b877"),
	Color("#8b3a1d"),
	Color("#6b635d"),
]

static var _source_cache: Dictionary = {}
static var _texture_cache: Dictionary = {}


static func texture_for(base_index: int, kit: Dictionary, skin_tone: Color, hair_color: Color) -> ImageTexture:
	var key := "%d|%s|%s|%s|%s|%s|%s|%s" % [
		base_index,
		str(kit.get("primary", "#ffffff")).to_lower(),
		str(kit.get("secondary", "#111827")).to_lower(),
		str(kit.get("shorts", "#f8fafc")).to_lower(),
		str(kit.get("socks", "#f8fafc")).to_lower(),
		str(kit.get("trim", "#f5c451")).to_lower(),
		skin_tone.to_html(),
		hair_color.to_html(),
	]
	if _texture_cache.has(key):
		return _texture_cache[key]
	var body := _source(base_index, "body").duplicate()
	var skin := _source(base_index, "skin").duplicate()
	var hair := _source(base_index, "hair").duplicate()
	_recolour_body(body, kit)
	_tint_skin(skin, skin_tone)
	body.blend_rect(skin, Rect2i(0, 0, TEX_W, TEX_H), Vector2i.ZERO)
	_draw_eyes(body, skin)
	_tint_hair(hair, hair_color)
	body.blend_rect(hair, Rect2i(0, 0, TEX_W, TEX_H), Vector2i.ZERO)
	var texture := ImageTexture.create_from_image(body)
	_texture_cache[key] = texture
	return texture


static func _source(base_index: int, layer: String) -> Image:
	var index := clampi(base_index, 0, 12) + 1
	var path := "res://assets/layers/base_%02d/%s.png" % [index, layer]
	if _source_cache.has(path):
		return _source_cache[path]
	var tex := load(path) as Texture2D
	if tex == null:
		push_error("Camada em falta: %s" % path)
		var blank := Image.create(TEX_W, TEX_H, false, Image.FORMAT_RGBA8)
		blank.fill(Color(0, 0, 0, 0))
		return blank
	var img := tex.get_image()
	if img == null:
		var blank := Image.create(TEX_W, TEX_H, false, Image.FORMAT_RGBA8)
		blank.fill(Color(0, 0, 0, 0))
		return blank
	if img.is_compressed():
		img.decompress()
	img.convert(Image.FORMAT_RGBA8)
	if img.get_width() != TEX_W or img.get_height() != TEX_H:
		img.resize(TEX_W, TEX_H, Image.INTERPOLATE_LANCZOS)
	_source_cache[path] = img
	return img


static func _recolour_body(image: Image, kit: Dictionary) -> void:
	var primary := _color(kit.get("primary", "#f8fafc"))
	var secondary := _color(kit.get("secondary", "#111827"))
	var shorts := _color(kit.get("shorts", "#f8fafc"))
	var socks := _color(kit.get("socks", "#f8fafc"))
	var trim := _color(kit.get("trim", "#f5c451"))
	var pattern := str(kit.get("pattern", "solid"))
	for y in TEX_H:
		for x in TEX_W:
			var src := image.get_pixel(x, y)
			if src.a < 0.035:
				continue
			var lum := (src.r + src.g + src.b) / 3.0
			if lum < 0.045:
				continue
			var target := primary
			if y >= HIP_Y and y < 212:
				target = shorts
			elif y >= 212 and y < 240:
				target = socks
			elif y >= 240:
				target = secondary.darkened(0.35)
			else:
				target = _shirt_color(pattern, primary, secondary, trim, x, y)
			var shade := clampf(0.50 + lum * 0.72, 0.40, 1.08)
			var out := Color(
				clampf(target.r * shade, 0.0, 1.0),
				clampf(target.g * shade, 0.0, 1.0),
				clampf(target.b * shade, 0.0, 1.0),
				src.a
			)
			image.set_pixel(x, y, out)


static func _shirt_color(pattern: String, primary: Color, secondary: Color, trim: Color, x: int, y: int) -> Color:
	match pattern:
		"stripes":
			return secondary if int(x / 10.0) % 2 == 0 else primary
		"hoops":
			return secondary if int((y - 70) / 13.0) % 2 == 0 else primary
		"halves":
			return secondary if x < TEX_W / 2 else primary
		"sash":
			return secondary if absi(x - int((y - 65) * 1.15) - 25) < 9 else primary
		_:
			if y > 205 and (x < 8 or x > TEX_W - 8):
				return trim
			return primary


static func _tint_skin(image: Image, tone: Color) -> void:
	for y in TEX_H:
		for x in TEX_W:
			var src := image.get_pixel(x, y)
			if src.a < 0.02:
				continue
			var lum := (src.r + src.g + src.b) / 3.0
			var shade := 0.82 + lum * 0.22
			image.set_pixel(x, y, Color(
				clampf(tone.r * shade, 0.0, 1.0),
				clampf(tone.g * shade, 0.0, 1.0),
				clampf(tone.b * shade, 0.0, 1.0),
				src.a
			))


static func _tint_hair(image: Image, tone: Color) -> void:
	for y in TEX_H:
		for x in TEX_W:
			var src := image.get_pixel(x, y)
			if src.a < 0.02:
				continue
			var lum := (src.r + src.g + src.b) / 3.0
			var shade := 0.62 + lum * 0.55
			image.set_pixel(x, y, Color(
				clampf(tone.r * shade, 0.0, 1.0),
				clampf(tone.g * shade, 0.0, 1.0),
				clampf(tone.b * shade, 0.0, 1.0),
				src.a
			))


static func _draw_eyes(target: Image, skin: Image) -> void:
	var min_x := TEX_W
	var max_x := 0
	var min_y := TEX_H
	var max_y := 0
	for y in range(50, NECK_Y + 3):
		for x in TEX_W:
			if skin.get_pixel(x, y).a > 0.4:
				min_x = mini(min_x, x)
				max_x = maxi(max_x, x)
				min_y = mini(min_y, y)
				max_y = maxi(max_y, y)
	if min_x >= max_x or min_y >= max_y:
		return
	var face_w := float(max_x - min_x)
	var face_h := float(max_y - min_y)
	var eye_y := int(round(max_y - face_h * 0.40))
	var eye_dx := int(round(face_w * 0.18))
	var radius := maxi(1, int(round(face_w * 0.055)))
	var center_x := int(round((min_x + max_x) / 2.0))
	for side_value in [-1, 1]:
		var side := int(side_value)
		var cx: int = center_x + side * eye_dx
		for dy in range(-radius, radius + 1):
			for dx in range(-radius, radius + 1):
				if dx * dx + dy * dy > radius * radius + 1:
					continue
				var px: int = cx + dx
				var py: int = eye_y + dy
				if px >= 0 and px < TEX_W and py >= 0 and py < TEX_H:
					target.set_pixel(px, py, Color("#211b18"))
		# Tiny catch-light keeps the face readable at match scale.
		if radius >= 2:
			target.set_pixel(clampi(cx - 1, 0, TEX_W - 1), clampi(eye_y - 1, 0, TEX_H - 1), Color("#fff8e8"))


static func _color(value: Variant) -> Color:
	if value is Color:
		return value
	return Color.from_string(str(value), Color.WHITE)


static func skin_for(base_index: int, id_offset: int = 0) -> Color:
	return SKIN_TONES[(base_index * 3 + id_offset) % SKIN_TONES.size()]


static func hair_for(base_index: int, id_offset: int = 0) -> Color:
	return HAIR_COLORS[(base_index * 5 + id_offset) % HAIR_COLORS.size()]
