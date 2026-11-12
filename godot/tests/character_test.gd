extends Node

func _ready() -> void:
	var kit := GameData.kit_for("acad-futuro")
	print("kit=", kit)
	for i in 13:
		var tex := CharacterFactory.texture_for(i, kit, CharacterFactory.skin_for(i), CharacterFactory.hair_for(i))
		if tex == null or tex.get_width() != 128 or tex.get_height() != 256:
			print("FAIL base ", i)
	var img := CharacterFactory.texture_for(0, kit, CharacterFactory.skin_for(0), CharacterFactory.hair_for(0)).get_image()
	img.save_png("user://character_test.png")
	print("character textures ok: ", CharacterFactory._texture_cache.size(), " source: ", CharacterFactory._source_cache.size())
	get_tree().quit()
