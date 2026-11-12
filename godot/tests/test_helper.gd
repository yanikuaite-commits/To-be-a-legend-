extends RefCounted
class_name TestHelper

## Minimal assertion helper so headless tests can fail the build.
## Godot exits 0 by default, so a test that only prints can never break CI.

var failures := 0


func check(condition: bool, message: String) -> void:
	if not condition:
		failures += 1
		print("FAIL: ", message)


func finish(tree: SceneTree) -> void:
	if failures == 0:
		print("TEST PASSED")
		tree.quit(0)
	else:
		print("TEST FAILED: ", failures, " check(s)")
		tree.quit(1)
