class_name SaveManager
extends RefCounted

const SAVE_PATH := "user://career.json"
const SAVE_VERSION := 1


static func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)


static func save(career: Dictionary) -> bool:
	career["save_version"] = SAVE_VERSION
	career["updated_at"] = Time.get_unix_time_from_system()
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_error("Não foi possível criar o save.")
		return false
	file.store_string(JSON.stringify(career, "\t"))
	file.close()
	return true


static func load_game() -> Dictionary:
	if not FileAccess.file_exists(SAVE_PATH):
		return {}
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return {}
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("Save inválido.")
		return {}
	return parsed as Dictionary


static func delete() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_PATH))
