// ---------- utilidades de data ----------
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dt = s => { const [a, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(a, m - 1, d); };
const soma = (s, n) => { const d = dt(s); d.setDate(d.getDate() + n); return iso(d); };
const br = s => dt(s).toLocaleDateString("pt-BR");
const hoje = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const deslocar = n => soma(iso(hoje()), n);
const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- dados fictícios (em memória; no projeto real vêm da API) ----------
const db = {
  tutores: [
    { id: 1, nome: "Ana Paula Ribeiro", cpf: "", tel: "(19) 99871-2204", email: "ana.ribeiro@exemplo.com", end: "Rua das Acácias, 214" },
    { id: 2, nome: "Carlos Menezes", cpf: "", tel: "(19) 98133-4072", email: "", end: "Av. Brasil, 1830" }
  ],
  animais: [
    { id: 1, nome: "Mimi", especie: "Gato", raca: "Sem raça definida", sexo: "Fêmea", nasc: "", idade: "2 anos", peso: 3.8, tutor: 1, obs: "" },
    { id: 2, nome: "Thor", especie: "Cão", raca: "Labrador", sexo: "Macho", nasc: "", idade: "5 anos", peso: 31.2, tutor: 2, obs: "Pós-operatório recente" }
  ],
  // Intervalos fictícios, apenas para teste. 0 = sem intervalo cadastrado.
  vacinas: [
    { id: 1, nome: "Vacina teste A", intervalo: 30 },
    { id: 2, nome: "Vacina teste B", intervalo: 365 },
    { id: 3, nome: "Vacina teste C", intervalo: 90 },
    { id: 4, nome: "Vacina teste D", intervalo: 0 }
  ],
  atend: [
    { animal: 1, data: deslocar(-16) + "T14:30", anamnese: "Apatia e recusa alimentar parcial há 2 dias.", sintomas: "Apatia", diag: "Gastrite leve a esclarecer", proc: "Palpação abdominal", presc: "Probiótico por 5 dias", obs: "" },
    { animal: 2, data: deslocar(-9) + "T10:00", anamnese: "Retorno pós-cirúrgico.", sintomas: "", diag: "Cicatrização adequada", proc: "Revisão de sutura", presc: "", obs: "Manter colar por mais 5 dias" }
  ],
  vac: [
    { animal: 1, vacina: 1, data: deslocar(-45), lote: "L-88213", obs: "" },
    { animal: 1, vacina: 2, data: deslocar(-100), lote: "L-71005", obs: "" },
    { animal: 2, vacina: 3, data: deslocar(-20), lote: "L-45120", obs: "" },
    { animal: 2, vacina: 1, data: deslocar(-25), lote: "L-88190", obs: "Leve sonolência" }
  ]
};
let seq = { tutor: 3, animal: 3 };

// ---------- regras da vacinação ----------
const LIMITE_AVISO = 15; // dias antes da data prevista para marcar "vence em breve"
const vacina = id => db.vacinas.find(v => v.id === Number(id));
const animal = id => db.animais.find(a => a.id === Number(id));
const tutor = id => db.tutores.find(t => t.id === Number(id));

function proximaDose(dataAplicacao, intervalo) {
  return intervalo > 0 ? soma(dataAplicacao, intervalo) : null;
}
function situacao(prox) {
  if (!prox) return { txt: "Sem previsão", cls: "neutral", ordem: 1 };
  const dias = Math.round((dt(prox) - hoje()) / 864e5);
  if (dias < 0) return { txt: "Atrasada", cls: "brick", ordem: 4, dias };
  if (dias <= LIMITE_AVISO) return { txt: "Vence em breve", cls: "honey", ordem: 3, dias };
  return { txt: "Em dia", cls: "sage", ordem: 2, dias };
}
// Última aplicação de cada vacina de um animal, com próxima dose e situação.
function doses(animalId) {
  const ultimas = {};
  db.vac.filter(v => v.animal === Number(animalId)).forEach(v => {
    if (!ultimas[v.vacina] || v.data > ultimas[v.vacina].data) ultimas[v.vacina] = v;
  });
  return Object.values(ultimas).map(v => {
    const vc = vacina(v.vacina), prox = proximaDose(v.data, vc.intervalo);
    return { ...v, nome: vc.nome, prox, sit: situacao(prox) };
  }).sort((a, b) => b.sit.ordem - a.sit.ordem);
}
const piorSituacao = id => {
  const d = doses(id);
  return d.length ? d[0].sit : { txt: "Sem vacinas", cls: "neutral" };
};
const tag = s => `<span class="status status-${s.cls}">${s.txt}</span>`;

// ---------- navegação, aviso e erros ----------
const titulos = { painel: "Clínica VetSync, Americana", tutores: "Tutores", animais: "Animais", atendimento: "Novo atendimento", vacinacao: "Registrar vacinação", historico: "Histórico clínico" };
function navegar(alvo) {
  if (!$("screen-" + alvo)) return;
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("is-active", s.id === "screen-" + alvo));
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("is-active", b.dataset.go === alvo));
  $("screen-title").textContent = titulos[alvo];
  window.scrollTo({ top: 0 });
  renderTudo();
}
let timer;
function aviso(msg, erro) {
  const t = $("toast");
  t.textContent = msg; t.className = "toast" + (erro ? " erro" : ""); t.hidden = false;
  clearTimeout(timer); timer = setTimeout(() => (t.hidden = true), 3500);
}
function erro(id, msgs, campos = []) {
  const box = $(id);
  box.innerHTML = msgs.length ? msgs.map(esc).join("<br>") : "";
  box.hidden = !msgs.length;
  campos.forEach(c => $(c).classList.add("invalid"));
}
function limpar(form) {
  form.querySelectorAll(".invalid").forEach(e => e.classList.remove("invalid"));
  form.querySelectorAll(".alert-error").forEach(e => (e.hidden = true));
}
const vazio = (...ids) => ids.filter(id => !$(id).value.trim());

// ---------- renderização ----------
const opcoesAnimais = sel => {
  const atual = sel.value;
  sel.innerHTML = `<option value="">Selecione</option>` + db.animais.map(a => `<option value="${a.id}">${esc(a.nome)} (${esc(tutor(a.tutor).nome)})</option>`).join("");
  sel.value = atual;
};

function renderPainel() {
  const todas = db.animais.flatMap(a => doses(a.id).map(d => ({ ...d, a })));
  const atras = todas.filter(d => d.sit.cls === "brick").length;
  const breve = todas.filter(d => d.sit.cls === "honey").length;
  const h = new Date().getHours();
  const saud = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const partes = [];
  if (atras) partes.push(`<strong>${atras}</strong> vacina${atras > 1 ? "s" : ""} atrasada${atras > 1 ? "s" : ""}`);
  if (breve) partes.push(`<strong>${breve}</strong> vencendo nos próximos ${LIMITE_AVISO} dias`);
  $("resumo").innerHTML = `<h2>${saud}, Renata.</h2><p>${partes.length ? partes.join(" e ") : "Nenhuma vacina pendente"}. A clínica tem ${db.animais.length} animais no cadastro.</p>`;

  const pend = todas.filter(d => d.sit.ordem >= 3).sort((x, y) => x.prox.localeCompare(y.prox));
  const quando = d => { const n = Math.abs(d.sit.dias), u = n === 1 ? "dia" : "dias"; return d.sit.dias < 0 ? `há ${n} ${u}` : d.sit.dias === 0 ? "hoje" : `em ${n} ${u}`; };
  $("painel-vacinas").innerHTML = pend.length
    ? `<ul class="agenda">` + pend.map(d => `<li><div class="quando">${quando(d)}</div><div><strong>${esc(d.a.nome)}</strong><span>${esc(d.nome)}, tutor ${esc(tutor(d.a.tutor).nome)}, ${esc(tutor(d.a.tutor).tel)}</span></div>${tag(d.sit)}</li>`).join("") + `</ul>`
    : `<p class="vazio">Ninguém com vacina atrasada ou perto de vencer.</p>`;

  const rec = [...db.atend].sort((x, y) => y.data.localeCompare(x.data)).slice(0, 4);
  $("painel-atend").innerHTML = rec.length
    ? `<ul class="timeline">` + rec.map(x => `<li><time>${br(x.data)}</time><strong>${esc(animal(x.animal).nome)}</strong><p>${esc(x.diag)}</p></li>`).join("") + `</ul>`
    : `<p class="vazio">Nenhum atendimento registrado ainda.</p>`;
}

function renderTutores() {
  const q = $("busca-tutor").value.trim().toLowerCase();
  const lista = db.tutores.filter(t => (t.nome + t.tel).toLowerCase().includes(q));
  $("lista-tutores").innerHTML = lista.length
    ? `<table class="table"><thead><tr><th>Nome</th><th>Contato</th><th>Animais</th><th></th></tr></thead><tbody>` +
      lista.map(t => {
        const n = db.animais.filter(a => a.tutor === t.id).length;
        return `<tr><td>${esc(t.nome)}<small>${esc(t.end)}</small></td><td>${esc(t.tel)}<small>${esc(t.email)}</small></td><td>${n}</td><td class="r"><button class="btn btn-ghost btn-sm btn-danger" data-del-tutor="${t.id}">Excluir</button></td></tr>`;
      }).join("") + `</tbody></table>`
    : `<p class="vazio">Nenhum tutor encontrado. Cadastre o primeiro no formulário ao lado.</p>`;
}

function renderAnimais() {
  const q = $("busca-animal").value.trim().toLowerCase();
  const lista = db.animais.filter(a => (a.nome + tutor(a.tutor).nome).toLowerCase().includes(q));
  $("lista-animais").innerHTML = lista.length
    ? `<table class="table"><thead><tr><th>Animal</th><th>Tutor</th><th>Vacinas</th><th></th></tr></thead><tbody>` +
      lista.map(a => `<tr><td>${esc(a.nome)}<small>${esc(a.especie)}, ${esc(a.raca || "raça não informada")}</small></td><td>${esc(tutor(a.tutor).nome)}</td><td>${tag(piorSituacao(a.id))}</td><td class="r"><button class="btn btn-ghost btn-sm" data-hist="${a.id}">Ver histórico</button></td></tr>`).join("") + `</tbody></table>`
    : `<p class="vazio">Nenhum animal encontrado.</p>`;
  const sel = $("a-tutor"), atual = sel.value;
  sel.innerHTML = `<option value="">Selecione</option>` + db.tutores.map(t => `<option value="${t.id}">${esc(t.nome)}</option>`).join("");
  sel.value = atual;
}

function renderHistorico() {
  opcoesAnimais($("h-animal"));
  const id = $("h-animal").value, corpo = $("hist-corpo");
  if (!id) { corpo.innerHTML = `<p class="vazio">Escolha um animal para ver o histórico completo.</p>`; return; }
  const a = animal(id), t = tutor(a.tutor), d = doses(id);
  const eventos = [
    ...db.atend.filter(x => x.animal === a.id).map(x => ({ data: x.data, html: `<strong>Atendimento: ${esc(x.diag)}</strong><p>${esc(x.anamnese)}${x.proc ? " Procedimentos: " + esc(x.proc) + "." : ""}${x.presc ? " Prescrição: " + esc(x.presc) + "." : ""}</p>` })),
    ...db.vac.filter(x => x.animal === a.id).map(x => ({ data: x.data, html: `<strong>Vacinação: ${esc(vacina(x.vacina).nome)}</strong><p>Lote ${esc(x.lote)}.${x.obs ? " " + esc(x.obs) : ""}</p>` }))
  ].sort((x, y) => y.data.localeCompare(x.data));
  const idade = a.nasc ? `nascido em ${br(a.nasc)}` : a.idade;
  corpo.innerHTML =
    `<div class="ficha"><div><h2>${esc(a.nome)}</h2><p>${esc(a.especie)}, ${esc(a.sexo)}, ${esc(idade || "idade não informada")}${a.peso ? ", " + a.peso + " kg" : ""}</p><p>Tutor: ${esc(t.nome)}, ${esc(t.tel)}</p></div>${tag(piorSituacao(a.id))}</div>` +
    (a.obs ? `<p class="lead">${esc(a.obs)}</p>` : "") +
    `<div class="grid" style="margin-top:20px"><div class="panel"><h2>Linha do tempo</h2>` +
    (eventos.length ? `<ol class="timeline">` + eventos.map(e => `<li><time>${br(e.data)}</time>${e.html}</li>`).join("") + `</ol>` : `<p class="vazio">Ainda não há registros. Comece por um atendimento ou uma vacinação.</p>`) +
    `</div><div class="panel"><h2>Próximas doses</h2><div class="doses">` +
    (d.length ? d.map(x => `<div><div>${esc(x.nome)}<small>${x.prox ? "Prevista para " + br(x.prox) : "Sem intervalo cadastrado"}</small></div>${tag(x.sit)}</div>`).join("") : `<p class="vazio">Nenhuma vacina registrada.</p>`) +
    `</div></div></div>`;
}

function renderTudo() {
  renderPainel(); renderTutores(); renderAnimais(); renderHistorico();
  opcoesAnimais($("at-animal")); opcoesAnimais($("v-animal"));
  const sel = $("v-vacina"), atual = sel.value;
  sel.innerHTML = `<option value="">Selecione</option>` + db.vacinas.map(v => `<option value="${v.id}">${esc(v.nome)}${v.intervalo ? ", " + v.intervalo + " dias" : ", sem intervalo"}</option>`).join("");
  sel.value = atual;
  calcular();
}

// ---------- vacinação: cálculo da próxima dose ----------
function calcular() {
  const vc = vacina($("v-vacina").value), data = $("v-data").value;
  $("aviso-vac").hidden = !(vc && vc.intervalo === 0);
  if (!vc || !data) { $("calc-result").textContent = "Escolha a vacina e a data"; return; }
  const prox = proximaDose(data, vc.intervalo);
  $("calc-result").textContent = prox ? br(prox) : "Não calculada";
}

// ---------- formulários ----------
$("form-tutor").addEventListener("submit", e => {
  e.preventDefault(); limpar(e.target);
  const falta = vazio("t-nome", "t-tel"), msgs = [];
  if (falta.length) msgs.push("Preencha nome e telefone.");
  const cpf = $("t-cpf").value.replace(/\D/g, "");
  if (cpf && cpf.length !== 11) { msgs.push("O CPF deve ter 11 números."); falta.push("t-cpf"); }
  if (cpf && db.tutores.some(t => t.cpf === cpf)) { msgs.push("Já existe um tutor com este CPF."); falta.push("t-cpf"); }
  if (msgs.length) return erro("erro-tutor", msgs, falta);
  db.tutores.push({ id: seq.tutor++, nome: $("t-nome").value.trim(), cpf, tel: $("t-tel").value.trim(), email: $("t-email").value.trim(), end: $("t-end").value.trim() });
  e.target.reset(); renderTudo(); aviso("Tutor salvo.");
});

$("form-animal").addEventListener("submit", e => {
  e.preventDefault(); limpar(e.target);
  const falta = vazio("a-nome", "a-especie", "a-sexo", "a-tutor");
  if (falta.length) return erro("erro-animal", ["Preencha nome, espécie, sexo e tutor."], falta);
  if ($("a-peso").value && Number($("a-peso").value) <= 0) return erro("erro-animal", ["O peso deve ser maior que zero."], ["a-peso"]);
  db.animais.push({ id: seq.animal++, nome: $("a-nome").value.trim(), especie: $("a-especie").value, raca: $("a-raca").value.trim(), sexo: $("a-sexo").value, nasc: $("a-nasc").value, idade: $("a-idade").value.trim(), peso: Number($("a-peso").value) || null, tutor: Number($("a-tutor").value), obs: $("a-obs").value.trim() });
  e.target.reset(); renderTudo(); aviso("Animal salvo.");
});

$("form-atend").addEventListener("submit", e => {
  e.preventDefault(); limpar(e.target);
  const falta = vazio("at-animal", "at-data", "at-anamnese", "at-diag");
  if (falta.length) return erro("erro-atend", ["Preencha animal, data, anamnese e diagnóstico."], falta);
  db.atend.push({ animal: Number($("at-animal").value), data: $("at-data").value, anamnese: $("at-anamnese").value.trim(), sintomas: $("at-sintomas").value.trim(), diag: $("at-diag").value.trim(), proc: $("at-proc").value.trim(), presc: $("at-presc").value.trim(), obs: $("at-obs").value.trim() });
  const id = $("at-animal").value;
  e.target.reset(); $("at-animal").value = id; definirDatas();
  renderTudo(); aviso("Atendimento salvo.");
});

$("form-vac").addEventListener("submit", e => {
  e.preventDefault(); limpar(e.target);
  const falta = vazio("v-animal", "v-vacina", "v-data", "v-lote");
  if (falta.length) return erro("erro-vac", ["Preencha animal, vacina, data da aplicação e lote."], falta);
  if (dt($("v-data").value) > hoje()) return erro("erro-vac", ["A data da aplicação não pode estar no futuro."], ["v-data"]);
  const vc = vacina($("v-vacina").value), data = $("v-data").value;
  db.vac.push({ animal: Number($("v-animal").value), vacina: vc.id, data, lote: $("v-lote").value.trim(), obs: $("v-obs").value.trim() });
  const prox = proximaDose(data, vc.intervalo), id = $("v-animal").value;
  e.target.reset(); $("v-animal").value = id; definirDatas();
  renderTudo();
  aviso(prox ? `Vacinação registrada. Próxima dose em ${br(prox)}.` : "Vacinação registrada, sem próxima dose prevista.");
});

["v-vacina", "v-data"].forEach(id => $(id).addEventListener("change", calcular));
$("busca-tutor").addEventListener("input", renderTutores);
$("busca-animal").addEventListener("input", renderAnimais);
$("h-animal").addEventListener("change", renderHistorico);

// ---------- cliques delegados ----------
document.addEventListener("click", e => {
  const go = e.target.closest("[data-go]");
  if (go) return navegar(go.dataset.go);
  const h = e.target.closest("[data-hist]");
  if (h) { $("h-animal").value = h.dataset.hist; return navegar("historico"); }
  const del = e.target.closest("[data-del-tutor]");
  if (del) {
    const id = Number(del.dataset.delTutor);
    if (db.animais.some(a => a.tutor === id)) return aviso("Este tutor tem animais cadastrados e não pode ser excluído.", true);
    db.tutores = db.tutores.filter(t => t.id !== id); renderTudo(); aviso("Tutor excluído.");
  }
});

// ---------- boas-vindas ----------
$("comecar").addEventListener("click", () => {
  $("welcome").classList.add("sai");
  setTimeout(() => { $("welcome").hidden = true; $("login").hidden = false; $("l-email").focus(); }, 400);
});

// ---------- login ----------
$("login-form").addEventListener("submit", e => {
  e.preventDefault();
  if (!$("l-email").value.trim() || !$("l-senha").value) { $("login-erro").hidden = false; return; }
  $("login-erro").hidden = true; $("login").hidden = true; $("app").hidden = false; navegar("painel");
});
$("sair").addEventListener("click", () => { $("app").hidden = true; $("login").hidden = false; $("l-senha").value = ""; });

// ---------- início ----------
function definirDatas() {
  const n = new Date();
  $("v-data").value = iso(n);
  $("at-data").value = `${iso(n)}T${pad(n.getHours())}:${pad(n.getMinutes())}`;
}
$("hoje").textContent = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
definirDatas();
renderTudo();