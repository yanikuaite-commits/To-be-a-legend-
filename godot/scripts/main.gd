extends Control

## Entry point for the Godot port: menu → creator → dashboard → match → report.

enum Screen { MENU, CREATOR, DASHBOARD, MATCH, REPORT, SEASON }

const BASE_COUNT := 13

var career: Dictionary = {}
var screen: Screen = Screen.MENU
var current_view: Control = null

var active_fixture: Dictionary = {}
var match_engine: LegendMatch = null
var match_view: MatchView = null
var hud_labels: Dictionary = {}
var pause_panel: Control = null
var match_finished := false

var creator := {
	"first": "Diogo",
	"last": "Cardoso",
	"position": "PL",
	"club": "",
	"nationality": "POR",
	"base": 0,
}
var creator_preview: TextureRect = null


func _ready() -> void:
	theme = AppTheme.build()
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_PASS
	creator["club"] = _default_start_club()
	set_process(false)
	_show_menu()


func _process(_delta: float) -> void:
	if screen == Screen.MATCH and match_engine != null:
		_update_match_hud()
		if match_engine.phase == "fulltime" and not match_finished:
			match_finished = true
			_show_report(match_engine.build_report())


# ---------------------------------------------------------------- screen stack

func _set_view(view: Control) -> void:
	if current_view != null:
		current_view.queue_free()
	current_view = view
	add_child(view)


func _clear_view() -> void:
	if current_view != null:
		current_view.queue_free()
		current_view = null


## Wraps `inner` in a MarginContainer (UIKit.margins adds the margin *into* a parent).
func _margin_box(inner: Control, left: int, top: int, right: int, bottom: int) -> MarginContainer:
	var m := MarginContainer.new()
	m.add_theme_constant_override("margin_left", left)
	m.add_theme_constant_override("margin_top", top)
	m.add_theme_constant_override("margin_right", right)
	m.add_theme_constant_override("margin_bottom", bottom)
	m.add_child(inner)
	return m


## Builds a scrollable page and installs it as the active view.
func _page() -> VBoxContainer:
	var box := UIKit.vbox(14)
	var scroll := UIKit.scroll(box)
	var page := _margin_box(scroll, 18, 20, 18, 24)
	page.set_anchors_preset(Control.PRESET_FULL_RECT)
	_set_view(page)
	return box


## Containers and labels must not swallow pointer events meant for the pitch.
func _passthrough(node: Node) -> void:
	if node is Control and not (node is Button) and not (node is ColorRect):
		(node as Control).mouse_filter = Control.MOUSE_FILTER_IGNORE
	for child in node.get_children():
		_passthrough(child)


# ---------------------------------------------------------------------- menu

func _show_menu() -> void:
	screen = Screen.MENU
	set_process(false)
	_clear_view()
	var box := _page()

	box.add_child(UIKit.spacer(24))
	box.add_child(UIKit.label("TO BE A", "Caps"))
	box.add_child(UIKit.label("LEGEND", "Hero"))
	box.add_child(UIKit.muted("A tua carreira. A tua lenda. Port nativo para Godot 4."))
	box.add_child(UIKit.spacer(18))

	var card := UIKit.panel("HeroCard")
	var inner := UIKit.vbox(10)
	inner.add_child(UIKit.label("Começa a tua história", "H3"))
	inner.add_child(UIKit.muted("Cria um jogador de 16 anos e sobe do fundo da pirâmide até lenda mundial."))
	card.add_child(inner)
	box.add_child(card)

	var has_save := SaveManager.has_save()
	if has_save:
		var cont := UIKit.button("Continuar carreira", "PrimaryButton")
		cont.pressed.connect(_on_continue)
		box.add_child(cont)

	var new_btn := UIKit.button("Nova carreira", "PrimaryButton" if not has_save else "GhostButton")
	new_btn.pressed.connect(_show_creator)
	box.add_child(new_btn)

	if has_save:
		var del := UIKit.button("Apagar carreira guardada", "DangerButton")
		del.pressed.connect(_on_delete_save)
		box.add_child(del)

	box.add_child(UIKit.spacer(12))
	box.add_child(UIKit.small("Simulação: a equipa joga sozinha. Quando recebes a bola, o jogo congela e decides com gestos."))


func _on_continue() -> void:
	var loaded := SaveManager.load_game()
	if loaded.is_empty():
		return
	career = loaded
	_show_dashboard()


func _on_delete_save() -> void:
	SaveManager.delete()
	_show_menu()


func _default_start_club() -> String:
	var clubs := GameData.starting_clubs()
	if clubs.is_empty():
		return ""
	return str(clubs[0].get("id", ""))


# ------------------------------------------------------------------- creator

func _show_creator() -> void:
	screen = Screen.CREATOR
	set_process(false)
	_clear_view()
	var box := _page()

	box.add_child(UIKit.caps("Novo jogador"))
	box.add_child(UIKit.label("Cria a tua lenda", "Title"))

	var preview_card := UIKit.panel("HeroCard")
	var preview_box := UIKit.vbox(8)
	creator_preview = TextureRect.new()
	creator_preview.custom_minimum_size = Vector2(0, 220)
	creator_preview.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	creator_preview.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	preview_box.add_child(creator_preview)
	var pick_row := UIKit.hbox(10)
	var prev := UIKit.button("◀ Base", "GhostButton")
	prev.pressed.connect(func() -> void: _cycle_base(-1))
	var next := UIKit.button("Base ▶", "GhostButton")
	next.pressed.connect(func() -> void: _cycle_base(1))
	pick_row.add_child(prev)
	pick_row.add_child(next)
	preview_box.add_child(pick_row)
	preview_card.add_child(preview_box)
	box.add_child(preview_card)

	box.add_child(UIKit.caps("Nome"))
	var name_row := UIKit.hbox(10)
	var first := LineEdit.new()
	first.text = str(creator["first"])
	first.placeholder_text = "Primeiro nome"
	first.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	first.text_changed.connect(func(t: String) -> void: creator["first"] = t)
	var last := LineEdit.new()
	last.text = str(creator["last"])
	last.placeholder_text = "Último nome"
	last.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	last.text_changed.connect(func(t: String) -> void: creator["last"] = t)
	name_row.add_child(first)
	name_row.add_child(last)
	box.add_child(name_row)

	box.add_child(UIKit.caps("Posição"))
	var pos_row := UIKit.hbox(8)
	for code in GameData.positions:
		var code_str := str(code)
		var b := UIKit.button(code_str, "PrimaryButton" if code_str == str(creator["position"]) else "GhostButton")
		b.custom_minimum_size = Vector2(56, 46)
		b.pressed.connect(func() -> void:
			creator["position"] = code_str
			_show_creator()
		)
		pos_row.add_child(b)
	box.add_child(pos_row)
	box.add_child(UIKit.small("%s — %s" % [creator["position"], str(GameData.position_labels.get(creator["position"], ""))]))

	box.add_child(UIKit.caps("Clube de estreia"))
	for club in GameData.starting_clubs():
		var cid := str(club.get("id", ""))
		var label := "%s · %s · OVR %d" % [club.get("name", cid), club.get("city", ""), int(club.get("overall", 50))]
		var cb := UIKit.button(label, "PrimaryButton" if cid == str(creator["club"]) else "GhostButton")
		cb.pressed.connect(func() -> void:
			creator["club"] = cid
			_show_creator()
		)
		box.add_child(cb)

	box.add_child(UIKit.caps("Nacionalidade"))
	var nat_option := OptionButton.new()
	var selected_index := 0
	for i in GameData.countries.size():
		var country: Dictionary = GameData.countries[i]
		nat_option.add_item("%s %s" % [country.get("code", ""), country.get("name", "")], i)
		if str(country.get("code", "")) == str(creator["nationality"]):
			selected_index = i
	nat_option.selected = selected_index
	nat_option.item_selected.connect(func(i: int) -> void:
		creator["nationality"] = str((GameData.countries[i] as Dictionary).get("code", "POR"))
	)
	box.add_child(nat_option)

	box.add_child(UIKit.spacer(8))
	var create := UIKit.button("Assinar contrato e começar", "PrimaryButton")
	create.pressed.connect(_on_create_career)
	box.add_child(create)
	var back := UIKit.button("Voltar", "GhostButton")
	back.pressed.connect(_show_menu)
	box.add_child(back)

	_refresh_creator_preview()


func _cycle_base(delta: int) -> void:
	creator["base"] = wrapi(int(creator["base"]) + delta, 0, BASE_COUNT)
	_refresh_creator_preview()


func _refresh_creator_preview() -> void:
	if creator_preview == null:
		return
	var kit := GameData.kit_for(str(creator["club"]))
	var base := int(creator["base"])
	creator_preview.texture = CharacterFactory.texture_for(
		base, kit, CharacterFactory.skin_for(base), CharacterFactory.hair_for(base)
	)


func _on_create_career() -> void:
	career = CareerManager.new_career(
		str(creator["first"]),
		str(creator["last"]),
		str(creator["nationality"]),
		str(creator["position"]),
		str(creator["club"]),
		int(creator["base"]),
	)
	SaveManager.save(career)
	_show_dashboard()


# ----------------------------------------------------------------- dashboard

func _show_dashboard() -> void:
	screen = Screen.DASHBOARD
	set_process(false)
	_clear_view()
	var box := _page()

	var club := CareerManager.current_club(career)
	var player: Dictionary = career.get("player", {})
	var retired := bool(career.get("retired", false))
	var season_complete := bool(career.get("season_complete", false))
	var league_name := str(career.get("league", {}).get("league_name", "Liga"))

	var header := UIKit.hbox(10)
	var head_left := UIKit.vbox(2)
	head_left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head_left.add_child(UIKit.caps("%s · %s" % [career.get("season_label", ""), club.get("name", "")]))
	head_left.add_child(UIKit.label(CareerManager.player_name(career), "H2"))
	head_left.add_child(UIKit.small("Semana %d de %d · %s" % [
		int(career.get("week", 1)),
		int(career.get("total_weeks", 24)),
		"Época terminada" if season_complete else league_name,
	]))
	header.add_child(head_left)
	var ovr_card := UIKit.panel("GoldCard")
	var ovr_box := UIKit.vbox(0)
	var ovr_value := UIKit.label(str(int(player.get("overall", 50))), "H2")
	ovr_value.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ovr_box.add_child(ovr_value)
	var ovr_caps := UIKit.caps("OVR")
	ovr_caps.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	ovr_box.add_child(ovr_caps)
	ovr_card.add_child(ovr_box)
	header.add_child(ovr_card)
	box.add_child(header)

	var status := UIKit.panel("Card")
	var status_box := UIKit.vbox(8)
	status_box.add_child(_bar_row("Energia", int(player.get("energy", 0)), AppTheme.LIME))
	status_box.add_child(_bar_row("Moral", int(player.get("moral", player.get("morale", 0))), AppTheme.GOLD))
	status_box.add_child(_bar_row("Forma", int(player.get("form", 0)), AppTheme.SKY))
	status_box.add_child(_bar_row("Confiança do treinador", int(player.get("coach_trust", 0)), AppTheme.GREEN))
	status_box.add_child(UIKit.info_row("Reputação", str(int(player.get("reputation", 0))), AppTheme.GOLD))
	status_box.add_child(UIKit.info_row("Potencial", str(int(player.get("potential", 50))), AppTheme.LIME))
	status_box.add_child(UIKit.info_row("Salário", UIKit.money(int(career.get("contract", {}).get("salary", 0))) + " / semana"))
	status.add_child(status_box)
	box.add_child(status)

	if retired:
		box.add_child(_notice_card("Carreira terminada", "Penduraste as botas. Consulta o histórico do teu legado.", "GoldCard"))

	box.add_child(_next_action_section())
	box.add_child(_fixtures_section())
	box.add_child(_table_section())
	box.add_child(_attributes_section())
	if not retired and not season_complete:
		box.add_child(_training_section())
	box.add_child(_news_section())

	box.add_child(UIKit.spacer(10))
	var exit := UIKit.button("Guardar e sair", "GhostButton")
	exit.pressed.connect(func() -> void:
		SaveManager.save(career)
		_show_menu()
	)
	box.add_child(exit)


func _notice_card(title: String, body: String, variation := "Card") -> Control:
	var card := UIKit.panel(variation)
	var box := UIKit.vbox(6)
	box.add_child(UIKit.label(title, "H3"))
	box.add_child(UIKit.muted(body))
	card.add_child(box)
	return card


func _bar_row(label: String, value: int, color: Color) -> Control:
	var row := UIKit.vbox(4)
	var head := UIKit.hbox(8)
	var l := UIKit.small(label)
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(l)
	head.add_child(UIKit.small(str(value)))
	row.add_child(head)
	row.add_child(UIKit.progress(value, 100, color))
	return row


func _next_action_section() -> Control:
	if bool(career.get("retired", false)):
		return _notice_card("Fim de linha", "A tua carreira terminou. A história está escrita.", "GoldCard")

	if bool(career.get("season_complete", false)):
		var done_card := UIKit.panel("GoldCard")
		var done_box := UIKit.vbox(8)
		done_box.add_child(UIKit.label("Época concluída", "H3"))
		done_box.add_child(UIKit.muted("Avança para a próxima época ou revê o resumo."))
		var next := UIKit.button("Iniciar nova época", "PrimaryButton")
		next.pressed.connect(func() -> void:
			CareerManager.start_next_season(career)
			SaveManager.save(career)
			_show_dashboard()
		)
		done_box.add_child(next)
		var summary := UIKit.button("Ver resumo da época", "GhostButton")
		summary.pressed.connect(_show_season_summary)
		done_box.add_child(summary)
		done_card.add_child(done_box)
		return done_card

	var card := UIKit.panel("GoldCard")
	var box := UIKit.vbox(8)
	box.add_child(UIKit.caps("Próximo desafio"))
	var fixture := CareerManager.next_fixture(career)
	if fixture.is_empty():
		box.add_child(UIKit.label("Semana de descanso", "H3"))
		box.add_child(UIKit.muted("Não há jogo esta semana. Aproveita para treinar e recuperar."))
	else:
		box.add_child(UIKit.small(str(fixture.get("competition_name", "Liga"))))
		box.add_child(UIKit.label("%s  vs  %s" % [
			CareerManager.current_club(career).get("short", "CLA"),
			fixture.get("opponent_short", "ADV"),
		], "H3"))
		box.add_child(UIKit.muted("%s · %s (OVR %d)" % [
			"Em casa" if bool(fixture.get("home", true)) else "Fora",
			fixture.get("opponent_name", "Adversário"),
			int(fixture.get("opponent_overall", 50)),
		]))
		var play := UIKit.button("Jogar partida", "PrimaryButton")
		play.pressed.connect(func() -> void: _start_match(fixture))
		box.add_child(play)
		var sim := UIKit.button("Simular partida", "GhostButton")
		sim.pressed.connect(func() -> void:
			var report := CareerManager.simulate_fixture(career)
			SaveManager.save(career)
			if report.is_empty():
				_show_dashboard()
			else:
				_show_report(report, true)
		)
		box.add_child(sim)

	var advance := UIKit.button("Avançar semana", "GhostButton")
	advance.pressed.connect(_advance_week)
	box.add_child(advance)
	card.add_child(box)
	return card


func _advance_week() -> void:
	if bool(career.get("season_complete", false)):
		_show_dashboard()
		return
	var fixture := CareerManager.next_fixture(career)
	if fixture.is_empty():
		CareerManager.advance_rest_week(career)
	else:
		CareerManager.simulate_fixture(career)
	SaveManager.save(career)
	_show_dashboard()


func _fixtures_section() -> Control:
	var card := UIKit.panel("Card")
	var box := UIKit.vbox(6)
	box.add_child(UIKit.label("Calendário", "H3"))
	var current_week := int(career.get("week", 1))
	for fixture in career.get("fixtures", []):
		var week := int(fixture.get("week", 0))
		var played := bool(fixture.get("played", false))
		var row := UIKit.hbox(8)
		var marker := UIKit.caps("S%d" % week)
		marker.custom_minimum_size = Vector2(38, 0)
		row.add_child(marker)
		var text := "%s %s" % ["H" if bool(fixture.get("home", true)) else "F", fixture.get("opponent_short", "ADV")]
		if played:
			text += "   %d–%d   nota %.1f" % [
				int(fixture.get("home_goals", 0)),
				int(fixture.get("away_goals", 0)),
				float(fixture.get("player_rating", 0.0)),
			]
		elif week == current_week:
			text += "   (esta semana)"
		var l := UIKit.small(text)
		l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		l.modulate = AppTheme.MUTED if played else AppTheme.TEXT
		row.add_child(l)
		box.add_child(row)
	card.add_child(box)
	return card


func _table_section() -> Control:
	var card := UIKit.panel("Card")
	var box := UIKit.vbox(4)
	box.add_child(UIKit.label("Classificação", "H3"))
	var my_club := str(career.get("club_id", ""))
	var rows := CareerManager.league_rows(career)
	for i in rows.size():
		var r: Dictionary = rows[i]
		var is_me := str(r.get("club_id", "")) == my_club
		var row := UIKit.hbox(6)
		var pos := UIKit.caps(str(i + 1))
		pos.custom_minimum_size = Vector2(28, 0)
		row.add_child(pos)
		var name_l := UIKit.small(str(r.get("name", "?")))
		name_l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		name_l.modulate = AppTheme.GOLD if is_me else AppTheme.TEXT
		row.add_child(name_l)
		var pts := UIKit.small("%d pts" % int(r.get("points", 0)))
		pts.modulate = AppTheme.GOLD if is_me else AppTheme.MUTED
		row.add_child(pts)
		box.add_child(row)
	card.add_child(box)
	return card


func _attributes_section() -> Control:
	var card := UIKit.panel("Card")
	var box := UIKit.vbox(4)
	box.add_child(UIKit.label("Atributos", "H3"))
	var attrs: Dictionary = career.get("player", {}).get("attributes", {})
	for key in GameData.attr_keys:
		var value := int(attrs.get(key, 0))
		var row := UIKit.hbox(8)
		var name_l := UIKit.small("%s (%s)" % [GameData.attr_label(str(key)), GameData.attr_short(str(key))])
		name_l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(name_l)
		var val_l := UIKit.small(str(value))
		val_l.modulate = AppTheme.LIME if value >= 70 else (AppTheme.GOLD if value >= 55 else AppTheme.MUTED)
		row.add_child(val_l)
		box.add_child(row)
	card.add_child(box)
	return card


func _training_section() -> Control:
	var card := UIKit.panel("Card")
	var box := UIKit.vbox(6)
	box.add_child(UIKit.label("Treino da semana", "H3"))
	var trained := int(career.get("trained_week", 0)) == int(career.get("week", 1))
	box.add_child(UIKit.muted("Já treinaste esta semana." if trained else "Escolhe o foco para evoluir atributos."))

	var row := UIKit.hbox(8)
	var count := 0
	for program in GameData.training:
		var pid := str(program.get("id", ""))
		var b := UIKit.button(str(program.get("name", pid)), "GhostButton")
		b.disabled = trained
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.pressed.connect(func() -> void:
			CareerManager.train(career, pid)
			SaveManager.save(career)
			_show_dashboard()
		)
		row.add_child(b)
		count += 1
		if count % 2 == 0:
			box.add_child(row)
			row = UIKit.hbox(8)
	if row.get_child_count() > 0:
		box.add_child(row)
	card.add_child(box)
	return card


func _news_section() -> Control:
	var card := UIKit.panel("Card")
	var box := UIKit.vbox(6)
	box.add_child(UIKit.label("Notícias", "H3"))
	var news: Array = career.get("news", [])
	if news.is_empty():
		box.add_child(UIKit.muted("Sem novidades."))
	for item in news.slice(0, 8):
		var entry := UIKit.vbox(2)
		entry.add_child(UIKit.label(str(item.get("title", "")), "Gold"))
		entry.add_child(UIKit.small(str(item.get("body", ""))))
		box.add_child(entry)
		box.add_child(UIKit.separator())
	card.add_child(box)
	return card


# --------------------------------------------------------------------- match

func _start_match(fixture: Dictionary) -> void:
	if fixture.is_empty():
		return
	screen = Screen.MATCH
	active_fixture = fixture
	match_finished = false

	var setup := CareerManager.build_match_setup(career, fixture)
	match_engine = LegendMatch.new(setup)
	match_engine.set_viewport(size.x, size.y)

	_clear_view()
	var layer := Control.new()
	layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	layer.mouse_filter = Control.MOUSE_FILTER_PASS

	match_view = MatchView.new()
	match_view.set_anchors_preset(Control.PRESET_FULL_RECT)
	layer.add_child(match_view)

	layer.add_child(_build_match_overlay())

	_set_view(layer)
	match_view.setup(match_engine)
	match_engine.start()
	set_process(true)
	_update_match_hud()


func _build_match_overlay() -> Control:
	var overlay := Control.new()
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)

	var top_margin := _margin_box(UIKit.hbox(10), 16, 14, 16, 0)
	top_margin.set_anchors_preset(Control.PRESET_TOP_WIDE)
	var top := top_margin.get_child(0) as HBoxContainer

	var score_card := UIKit.panel("DarkCard")
	var score_box := UIKit.vbox(2)
	hud_labels["score"] = UIKit.label("0 - 0", "H3")
	hud_labels["score"].horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	score_box.add_child(hud_labels["score"])
	hud_labels["clock"] = UIKit.caps("0'")
	hud_labels["clock"].horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	score_box.add_child(hud_labels["clock"])
	score_card.add_child(score_box)
	top.add_child(score_card)

	var right := UIKit.vbox(2)
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hud_labels["competition"] = UIKit.caps("")
	hud_labels["competition"].horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	right.add_child(hud_labels["competition"])
	hud_labels["rating"] = UIKit.label("Nota 6.0", "Gold")
	hud_labels["rating"].horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	right.add_child(hud_labels["rating"])
	hud_labels["stamina"] = UIKit.small("Energia 100")
	hud_labels["stamina"].horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	right.add_child(hud_labels["stamina"])
	top.add_child(right)
	overlay.add_child(top_margin)

	var bottom_margin := _margin_box(UIKit.vbox(8), 16, 0, 16, 20)
	bottom_margin.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	var bottom := bottom_margin.get_child(0) as VBoxContainer

	hud_labels["feedback"] = UIKit.label("", "Gold")
	hud_labels["feedback"].horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hud_labels["feedback"].autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	bottom.add_child(hud_labels["feedback"])

	var buttons := UIKit.hbox(10)
	var ai_btn := UIKit.button("Deixar a IA decidir", "GhostButton")
	ai_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	ai_btn.pressed.connect(func() -> void:
		if match_engine != null:
			match_engine.release_ai()
	)
	buttons.add_child(ai_btn)

	var finish_btn := UIKit.button("Pausa", "GhostButton")
	finish_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	finish_btn.pressed.connect(_open_pause_menu)
	buttons.add_child(finish_btn)
	bottom.add_child(buttons)

	overlay.add_child(bottom_margin)
	_passthrough(overlay)
	return overlay


func _update_match_hud() -> void:
	var hud := match_engine.get_hud()
	if hud_labels.has("score"):
		hud_labels["score"].text = "%s %d - %d %s" % [
			hud.get("home_short", "CLA"),
			int(hud.get("home_score", 0)),
			int(hud.get("away_score", 0)),
			hud.get("away_short", "ADV"),
		]
	if hud_labels.has("clock"):
		hud_labels["clock"].text = "%d'" % int(hud.get("minute", 0))
	if hud_labels.has("competition"):
		hud_labels["competition"].text = str(hud.get("competition", ""))
	if hud_labels.has("rating"):
		hud_labels["rating"].text = "Nota %.1f" % float(hud.get("player_rating", 6.0))
	if hud_labels.has("stamina"):
		hud_labels["stamina"].text = "Energia %d · %d golos" % [
			int(hud.get("player_stamina", 100)),
			int(hud.get("player_goals", 0)),
		]
	if hud_labels.has("feedback"):
		hud_labels["feedback"].text = str(hud.get("feedback", ""))


func _open_pause_menu() -> void:
	if match_engine == null or pause_panel != null:
		return
	match_engine.set_paused(true)

	pause_panel = Control.new()
	pause_panel.set_anchors_preset(Control.PRESET_FULL_RECT)
	var dim := ColorRect.new()
	dim.color = Color(0.01, 0.03, 0.06, 0.82)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	pause_panel.add_child(dim)

	var center := UIKit.vbox(10)
	center.set_anchors_preset(Control.PRESET_CENTER)
	center.custom_minimum_size = Vector2(320, 0)
	var card := UIKit.panel("HeroCard")
	var box := UIKit.vbox(10)
	box.add_child(UIKit.label("Partida em pausa", "H3"))
	var resume := UIKit.button("Continuar a jogar", "PrimaryButton")
	resume.pressed.connect(_resume_match)
	box.add_child(resume)
	var finish := UIKit.button("Terminar jogo (simular resto)", "GhostButton")
	finish.pressed.connect(_finish_match_early)
	box.add_child(finish)
	var quit := UIKit.button("Sair sem guardar", "DangerButton")
	quit.pressed.connect(_abandon_match)
	box.add_child(quit)
	card.add_child(box)
	center.add_child(card)
	pause_panel.add_child(center)
	current_view.add_child(pause_panel)


func _resume_match() -> void:
	_close_pause_menu()
	if match_engine != null:
		match_engine.set_paused(false)


func _close_pause_menu() -> void:
	if pause_panel != null:
		pause_panel.queue_free()
		pause_panel = null


func _finish_match_early() -> void:
	_close_pause_menu()
	if match_engine == null:
		return
	match_engine.set_paused(false)
	match_engine.finish_early()
	match_finished = true
	_show_report(match_engine.build_report())


func _abandon_match() -> void:
	_close_pause_menu()
	match_engine = null
	match_view = null
	match_finished = false
	set_process(false)
	_show_dashboard()


# -------------------------------------------------------------------- report

func _show_report(report: Dictionary, simulated := false) -> void:
	screen = Screen.REPORT
	set_process(false)
	if not simulated:
		CareerManager.apply_match(career, report)
	SaveManager.save(career)
	_clear_view()
	var box := _page()

	box.add_child(UIKit.caps("Relatório da partida"))
	box.add_child(UIKit.label("Resultado final", "Title"))

	var card := UIKit.panel("HeroCard")
	var card_box := UIKit.vbox(8)
	var score := UIKit.hbox(10)
	var home := UIKit.vbox(0)
	home.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	home.add_child(UIKit.label(str(report.get("home_short", "CLA")), "H3"))
	home.add_child(UIKit.small(str(report.get("home_name", ""))))
	score.add_child(home)
	score.add_child(UIKit.label("%d – %d" % [int(report.get("home_goals", 0)), int(report.get("away_goals", 0))], "H2"))
	var away := UIKit.vbox(0)
	away.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var away_l := UIKit.label(str(report.get("away_short", "ADV")), "H3")
	away_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	away.add_child(away_l)
	var away_name := UIKit.small(str(report.get("away_name", "")))
	away_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	away.add_child(away_name)
	score.add_child(away)
	card_box.add_child(score)

	var player_team := int(report.get("player_team", 0))
	var my := int(report.get("home_goals", 0)) if player_team == 0 else int(report.get("away_goals", 0))
	var opp := int(report.get("away_goals", 0)) if player_team == 0 else int(report.get("home_goals", 0))
	var result := "Vitória" if my > opp else ("Derrota" if my < opp else "Empate")
	var tags := UIKit.hbox(8)
	tags.add_child(UIKit.pill(result, AppTheme.LIME if result == "Vitória" else (AppTheme.RED if result == "Derrota" else AppTheme.GOLD)))
	if bool(report.get("motm", false)):
		tags.add_child(UIKit.pill("MVP", AppTheme.GOLD))
	tags.add_child(UIKit.pill("%d'" % int(report.get("player_minutes", 0))))
	card_box.add_child(tags)

	var stats: Dictionary = report.get("stats", {})
	card_box.add_child(UIKit.info_row("Nota", "%.1f" % float(report.get("rating", 6.0)), AppTheme.GOLD))
	card_box.add_child(UIKit.info_row("Golos", str(int(report.get("goals", 0))), AppTheme.LIME))
	card_box.add_child(UIKit.info_row("Assistências", str(int(report.get("assists", 0)))))
	card_box.add_child(UIKit.info_row("Passes", "%d/%d" % [int(stats.get("passes_completed", 0)), int(stats.get("passes", 0))]))
	card_box.add_child(UIKit.info_row("Remates", str(int(stats.get("shots", 0)))))
	card_box.add_child(UIKit.info_row("Desarmes", str(int(stats.get("tackles", 0)))))
	card.add_child(card_box)
	box.add_child(card)

	var events: Array = report.get("events", [])
	if not events.is_empty():
		var ev_card := UIKit.panel("Card")
		var ev_box := UIKit.vbox(4)
		ev_box.add_child(UIKit.label("Lances", "H3"))
		for event in events.slice(0, 8):
			if event is Dictionary:
				ev_box.add_child(UIKit.small("%d′  %s" % [int(event.get("minute", 0)), event.get("text", "")]))
			else:
				ev_box.add_child(UIKit.small(str(event)))
		ev_card.add_child(ev_box)
		box.add_child(ev_card)

	box.add_child(UIKit.spacer(6))
	var cont := UIKit.button("Continuar carreira", "PrimaryButton")
	cont.pressed.connect(_show_dashboard)
	box.add_child(cont)


# ------------------------------------------------------------ season summary

func _show_season_summary() -> void:
	screen = Screen.SEASON
	set_process(false)
	_clear_view()
	var box := _page()

	box.add_child(UIKit.caps("Fim de época"))
	box.add_child(UIKit.label("Resumo da temporada", "Title"))

	var summary: Dictionary = career.get("season_summary", {})
	var card := UIKit.panel("HeroCard")
	var card_box := UIKit.vbox(6)
	card_box.add_child(UIKit.info_row("Posição final", UIKit.ordinal(int(summary.get("position", 0))), AppTheme.GOLD))
	card_box.add_child(UIKit.info_row("Campeão", str(summary.get("champion", "—"))))
	card_box.add_child(UIKit.info_row("Jogos", str(int(summary.get("apps", 0)))))
	card_box.add_child(UIKit.info_row("Golos", str(int(summary.get("goals", 0))), AppTheme.LIME))
	card_box.add_child(UIKit.info_row("Assistências", str(int(summary.get("assists", 0)))))
	card_box.add_child(UIKit.info_row("Nota média", "%.1f" % float(summary.get("rating", 0.0))))
	card_box.add_child(UIKit.info_row("Evolução OVR", "%d → %d" % [
		int(summary.get("overall_start", 0)),
		int(summary.get("overall_end", 0)),
	], AppTheme.LIME))
	card.add_child(card_box)
	box.add_child(card)

	if bool(career.get("retired", false)):
		box.add_child(_notice_card("Fim de carreira", "Penduraste as botas. O teu legado ficou registado.", "GoldCard"))

	box.add_child(UIKit.spacer(6))
	var cont := UIKit.button("Continuar", "PrimaryButton")
	cont.pressed.connect(_show_dashboard)
	box.add_child(cont)
