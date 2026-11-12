extends Node


func _ready() -> void:
	var t := TestHelper.new()
	var kit := GameData.kit_for("acad-futuro")
	print("kit=", kit)
	for i in 13:
		var tex := CharacterFactory.texture_for(i, kit, CharacterFactory.skin_for(i), CharacterFactory.hair_for(i))
		t.check(tex != null, "character texture %d is null" % i)
		if tex != null:
			t.check(tex.get_width() == 128 and tex.get_height() == 256, "character texture %d has the wrong size" % i)
	var img := CharacterFactory.texture_for(0, kit, CharacterFactory.skin_for(0), CharacterFactory.hair_for(0)).get_image()
	t.check(img != null, "character image could not be read back")
	img.save_png("user://character_test.png")
	t.check(CharacterFactory._texture_cache.size() > 0, "character texture cache is empty")
	print("character textures ok: ", CharacterFactory._texture_cache.size(), " source: ", CharacterFactory._source_cache.size())
	t.finish(get_tree())
