extends Node

func test_instance() -> int:
	return GameData.clubs.size()

func _ready() -> void:
	print(test_instance())
