/* Native Home Assistant configuration panel. No external scripts or styles. */
const TEXT = {
  it: {
    remove: "Rimuovi",
    removing: "Rimozione…",
    removeTitle: "Rimuovi nodo manuale",
    removeHelp:
      "Verranno eliminate la configurazione manuale e le relative entità da Home Assistant. Le automazioni che le usano andranno aggiornate. Il nodo sul PLC non viene modificato. Se il discovery lo ritrova, resterà escluso.",
    removed: "Nodo manuale rimosso.",
    removedReloading: "Nodo manuale rimosso. L’endpoint si sta ricaricando.",
    not_manual_node: "Puoi rimuovere soltanto un nodo configurato manualmente.",
    node_in_use:
      "Altre entità sono associate a questo nodo. Riassegnale prima di rimuoverlo, anche se sono escluse.",
    add: "Aggiungi entità",
    verify: "Verifica nodo",
    verifying: "Verifica…",
    category: "Categoria",
    manualHelp:
      "Inserisci il NodeId completo, anche fuori dal discovery. La verifica legge il nodo senza modificarlo.",
    invalid_node_id: "NodeId non valido. Esempio: ns=4;i=2",
    unsupported_node:
      "Seleziona una variabile scalare booleana, numerica, stringa o DateTime.",
    node_unreadable:
      "Il nodo non esiste o non è leggibile con le credenziali configurate.",
    node_already_configured:
      "Questo nodo ha già un’entità. Modificala dall’elenco o dalle opzioni dell’integrazione.",
    connection_disabled:
      "Abilita la connessione per verificare e aggiungere il nodo.",
    connection_failed:
      "Impossibile raggiungere l’endpoint. Verifica la connessione.",
    title: "Nodi OPC UA",
    subtitle: "Configura le entità dei tuoi endpoint",
    endpoint: "Endpoint",
    refresh: "Aggiorna",
    search: "Cerca nome o NodeId",
    all: "Tutte",
    sensor: "Sensori",
    binary_sensor: "Sensori binari",
    switch: "Switch",
    number: "Numeri",
    text: "Testi",
    datetime: "Data e ora",
    disabled: "Esclusi",
    connected: "Connesso",
    disconnected: "Disconnesso",
    edit: "Modifica",
    name: "Nome",
    area: "Area",
    inherit: "Eredita dal dispositivo",
    node: "NodeId associato",
    filterNodes: "Cerca tra i nodi scoperti",
    deviceClass: "Classe dispositivo",
    none: "Nessuna",
    invert: "Inverti stato booleano",
    invertHelp: "Per gli switch si invertono anche i comandi inviati al PLC.",
    save: "Salva",
    cancel: "Annulla",
    saving: "Salvataggio…",
    loading: "Caricamento…",
    empty: "Nessuna entità corrisponde alla ricerca.",
    noEndpoints:
      "Nessun endpoint configurato. Aggiungi una connessione dalle integrazioni.",
    noNodes:
      "Nessuna entità disponibile. Verifica connessione e scoperta nelle opzioni dell’integrazione.",
    notLoaded:
      "Endpoint in ricaricamento o non caricato. Aggiorna per riprovare.",
    notReady: "Entità non ancora registrata o esclusa",
    saved: "Configurazione salvata.",
    reloading: "Configurazione salvata. L’endpoint si sta ricaricando.",
    nameHelp: "Lascia vuoto per usare il nome originale.",
    nodeHelp:
      "L’identità dell’entità rimane invariata. Scegli un nodo compatibile scoperto su questo endpoint.",
    admin: "Pannello riservato agli amministratori.",
    error: "Operazione non riuscita. Riprova.",
    stale_configuration:
      "La configurazione è cambiata. Annulla, aggiorna l’elenco e riprova.",
    node_not_found: "NodeId non presente tra i nodi scoperti.",
    incompatible_platform:
      "Il nodo selezionato non è compatibile con questa categoria.",
    area_not_found: "L’area non esiste più. Aggiorna l’elenco.",
    invalid_device_class: "Classe dispositivo non compatibile.",
    invalid_inversion: "L’inversione richiede un nodo booleano.",
    entity_not_ready: "Entità non ancora disponibile per la configurazione.",
    endpoint_not_loaded: "Endpoint non caricato. Attendi e riprova.",
    endpoint_not_found: "Endpoint non più disponibile.",
    invalid_name: "Il nome deve contenere al massimo 255 caratteri.",
    limits_outside_type:
      "I limiti numerici configurati superano quelli del nodo scelto.",
    info: "La categoria e i limiti number/text si gestiscono ancora dalle opzioni dell’integrazione.",
  },
  en: {
    remove: "Remove",
    removing: "Removing…",
    removeTitle: "Remove manual node",
    removeHelp:
      "The manual configuration and its Home Assistant entities will be deleted. Automations using them will need updating. The PLC node is unchanged. If discovery finds it again, it stays excluded.",
    removed: "Manual node removed.",
    removedReloading: "Manual node removed. The endpoint is reloading.",
    not_manual_node: "Only manually configured nodes can be removed here.",
    node_in_use:
      "Other entities are associated with this node. Reassign them before removing it, including excluded entities.",
    add: "Add entity",
    verify: "Verify node",
    verifying: "Verifying…",
    category: "Category",
    manualHelp:
      "Enter the complete NodeId, including nodes outside discovery. Verification reads the node without changing it.",
    invalid_node_id: "Invalid NodeId. Example: ns=4;i=2",
    unsupported_node:
      "Choose a scalar boolean, numeric, string or DateTime variable.",
    node_unreadable:
      "The node does not exist or cannot be read with the configured credentials.",
    node_already_configured:
      "This node already has an entity. Edit it in the list or integration options.",
    connection_disabled: "Enable the connection to verify and add the node.",
    connection_failed: "Cannot reach the endpoint. Check the connection.",
    title: "OPC UA nodes",
    subtitle: "Configure entities for your endpoints",
    endpoint: "Endpoint",
    refresh: "Refresh",
    search: "Search name or NodeId",
    all: "All",
    sensor: "Sensors",
    binary_sensor: "Binary sensors",
    switch: "Switches",
    number: "Numbers",
    text: "Text",
    datetime: "Date and time",
    disabled: "Excluded",
    connected: "Connected",
    disconnected: "Disconnected",
    edit: "Edit",
    name: "Name",
    area: "Area",
    inherit: "Inherit from device",
    node: "Associated NodeId",
    filterNodes: "Search discovered nodes",
    deviceClass: "Device class",
    none: "None",
    invert: "Invert boolean state",
    invertHelp: "For switches, commands sent to the PLC are also inverted.",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving…",
    loading: "Loading…",
    empty: "No entities match your search.",
    noEndpoints: "No configured endpoints. Add a connection from Integrations.",
    noNodes:
      "No available entities. Check connection and discovery in the integration options.",
    notLoaded: "Endpoint is reloading or not loaded. Refresh to try again.",
    notReady: "Entity not registered yet or excluded",
    saved: "Configuration saved.",
    reloading: "Configuration saved. The endpoint is reloading.",
    nameHelp: "Leave empty to use the original name.",
    nodeHelp:
      "Entity identity is preserved. Choose a compatible node discovered on this endpoint.",
    admin: "This panel requires administrator access.",
    error: "Operation failed. Please try again.",
    stale_configuration:
      "Configuration changed. Cancel, refresh the list and try again.",
    node_not_found: "NodeId is not among the discovered nodes.",
    incompatible_platform:
      "The selected node is incompatible with this category.",
    area_not_found: "Area no longer exists. Refresh the list.",
    invalid_device_class: "Incompatible device class.",
    invalid_inversion: "Inversion requires a boolean node.",
    entity_not_ready: "Entity is not ready for configuration.",
    endpoint_not_loaded: "Endpoint is not loaded. Wait and try again.",
    endpoint_not_found: "Endpoint no longer exists.",
    invalid_name: "Names must contain at most 255 characters.",
    limits_outside_type:
      "Configured numeric limits exceed the selected node’s range.",
    info: "Category and number/text limits are still managed from the integration options.",
  },
};
const GROUPS = [
  "sensor",
  "binary_sensor",
  "switch",
  "number",
  "text",
  "datetime",
  "disabled",
];
const NUMERIC = new Set([
  "SByte",
  "Byte",
  "Int16",
  "UInt16",
  "Int32",
  "UInt32",
  "Int64",
  "UInt64",
  "Float",
  "Double",
]);
function element(tag, text, attributes = {}) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  for (const [key, value] of Object.entries(attributes))
    node.setAttribute(key, value);
  return node;
}
function compatible(row, node) {
  if (row.platform === "binary_sensor") return node.variant_type === "Boolean";
  if (row.platform === "switch")
    return node.variant_type === "Boolean" && node.writable;
  if (row.platform === "number")
    return NUMERIC.has(node.variant_type) && node.writable;
  if (row.platform === "text")
    return node.variant_type === "String" && node.writable;
  if (row.platform === "datetime")
    return node.variant_type === "DateTime" && node.writable;
  return true;
}
const CSS = `
:host{display:block;height:100%;color:var(--primary-text-color,#243346);background:var(--primary-background-color,#f5f7fb);font:14px var(--paper-font-body1_-_font-family,Roboto,Arial,sans-serif)}
*{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer;border:1px solid var(--divider-color,#dce2ea);border-radius:10px;padding:10px 15px;background:var(--card-background-color,#fff);color:inherit;min-height:42px}button:hover{border-color:var(--primary-color,#009ac0)}button:disabled{opacity:.5;cursor:default}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--primary-color,#009ac0);outline-offset:2px}.primary{background:var(--primary-color,#008fac);border-color:transparent;color:var(--text-primary-color,#fff)}
header{display:flex;gap:16px;align-items:center;padding:20px 28px;background:var(--card-background-color,#fff);border-bottom:1px solid var(--divider-color,#e0e6ee)}h1{font-size:23px;margin:0 0 4px}p{margin:0;color:var(--secondary-text-color,#637487);line-height:1.5}.headerText{flex:1}.menu{border:0;background:none;font-size:22px;padding:4px 10px}.content{max-width:1400px;margin:auto;padding:24px 28px 48px;height:calc(100% - 92px);overflow:auto}.toolbar{display:grid;grid-template-columns:minmax(200px,1fr) minmax(200px,1fr);gap:18px;align-items:end;margin-bottom:18px}.field{display:flex;flex-direction:column;gap:7px}.field>span{font-weight:600}input,select{width:100%;min-width:0;padding:12px;border:1px solid var(--divider-color,#d8e0e8);border-radius:9px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#243346)}.endpointMeta{display:flex;gap:12px;align-items:center;flex-wrap:wrap;overflow-wrap:anywhere;margin-bottom:20px;color:var(--secondary-text-color,#637487)}.badge{font-size:12px;border-radius:30px;padding:5px 10px;background:var(--secondary-background-color,#e9eef5);color:var(--secondary-text-color,#637487)}.online{color:var(--success-color,#138260);background:color-mix(in srgb,var(--success-color,#138260) 12%,transparent)}nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px}nav .selected{background:var(--primary-color,#008fac);color:var(--text-primary-color,#fff);border-color:transparent}.group{margin-bottom:24px}.group>summary{cursor:pointer;font-size:17px;font-weight:600;padding:8px 0 14px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr));gap:14px}.card{background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#e2e7ef);border-radius:14px;padding:18px;min-width:0}.cardTop{display:flex;align-items:start;gap:12px}.cardTitle{flex:1;min-width:0}.card h3{font-size:16px;margin:0 0 7px;overflow-wrap:anywhere}.address{font:12px ui-monospace,monospace;overflow-wrap:anywhere;color:var(--secondary-text-color,#637487);line-height:1.6}.actions{display:flex;gap:8px;flex-wrap:wrap}.danger{color:var(--error-color,#be3131)}.cardBottom{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-top:15px}.meta{color:var(--secondary-text-color,#637487);font-size:12px}.message{padding:13px 16px;margin-bottom:16px;border-radius:10px;background:var(--secondary-background-color,#eaf0f7);line-height:1.5}.error{color:var(--error-color,#be3131)}.hint{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#637487)}
dialog{border:1px solid var(--divider-color,#dce2ea);border-radius:18px;width:min(620px,calc(100vw - 24px));max-height:calc(100dvh - 32px);padding:0;background:var(--card-background-color,#fff);color:var(--primary-text-color,#243346)}dialog::backdrop{background:#10223480}form{padding:24px;display:flex;flex-direction:column;gap:17px}form h2{margin:0;font-size:21px;overflow-wrap:anywhere}footer{display:flex;justify-content:flex-end;gap:10px;margin-top:6px}.toggle{display:flex;gap:10px;align-items:center}.toggle input{width:20px;height:20px;min-width:20px;accent-color:var(--primary-color,#008fac)}[hidden]{display:none!important}
@media(max-width:650px){header{padding:14px 12px;gap:8px}h1{font-size:20px}.content{padding:18px 12px}.toolbar{grid-template-columns:1fr;gap:12px}.grid{grid-template-columns:1fr}nav button{padding:8px 10px}.card{padding:15px}form{padding:20px}.headerText p{font-size:12px}}
`;
class OpcuaNodePanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._filter = "all";
    this._query = "";
    this._selected = "";
    this._generation = 0;
  }
  set hass(value) {
    this._hass = value;
    if (!this._started && this.isConnected) this._start();
    else this._paintStates();
  }
  get hass() {
    return this._hass;
  }
  connectedCallback() {
    if (this._hass) this._start();
  }
  disconnectedCallback() {
    clearTimeout(this._timer);
    this._generation++;
    this._started = false;
  }
  _t(key) {
    return (
      TEXT[this._hass?.language?.startsWith("it") ? "it" : "en"][key] || key
    );
  }
  _start() {
    if (this._started) return;
    this._started = true;
    this._render();
    this._load();
  }
  _button(key, action, cls = "") {
    const b = element("button", this._t(key), { type: "button", class: cls });
    b.addEventListener("click", action);
    return b;
  }
  _field(key, input) {
    input.setAttribute("aria-label", this._t(key));
    const label = element("label", undefined, { class: "field" });
    label.append(element("span", this._t(key)), input);
    return label;
  }
  _endpoint() {
    return this._data?.endpoints.find((e) => e.entry_id === this._selected);
  }
  async _load() {
    if (!this._hass?.user?.is_admin) {
      this._error = this._t("admin");
      this._render();
      return;
    }
    const generation = ++this._generation;
    try {
      const data = await this._hass.callWS({
        type: "ha_opcua_discovery/panel",
      });
      if (generation !== this._generation || !this.isConnected) return;
      this._data = data;
      this._error = "";
      if (!data.endpoints.some((e) => e.entry_id === this._selected))
        this._selected = data.endpoints[0]?.entry_id || "";
      this._render();
    } catch (error) {
      if (generation !== this._generation) return;
      this._error = this._t(error.code in TEXT.en ? error.code : "error");
      this._render();
    }
  }
  _render() {
    if (this._dialog?.open) return;
    const root = this.shadowRoot;
    root.replaceChildren(element("style", CSS));
    const header = element("header");
    const menu = this._button(
      "☰",
      () =>
        this.dispatchEvent(
          new CustomEvent("hass-toggle-menu", {
            bubbles: true,
            composed: true,
          }),
        ),
      "menu",
    );
    menu.setAttribute("aria-label", "Menu");
    const title = element("div", undefined, { class: "headerText" });
    title.append(
      element("h1", this._t("title")),
      element("p", this._t("subtitle")),
    );
    header.append(
      menu,
      title,
      this._button("refresh", () => this._load()),
    );
    root.append(header);
    const main = element("main", undefined, { class: "content" });
    root.append(main);
    if (this._error)
      main.append(
        element("div", this._error, { class: "message error", role: "alert" }),
      );
    if (this._notice)
      main.append(
        element("div", this._notice, { class: "message", role: "status" }),
      );
    if (!this._data) {
      if (!this._error) main.append(element("p", this._t("loading")));
      return;
    }
    if (!this._data.endpoints.length) {
      main.append(element("div", this._t("noEndpoints"), { class: "message" }));
      return;
    }
    const toolbar = element("div", undefined, { class: "toolbar" });
    const endpoints = element("select", undefined, {
      "aria-label": this._t("endpoint"),
    });
    for (const endpoint of this._data.endpoints)
      endpoints.append(
        element("option", endpoint.title, { value: endpoint.entry_id }),
      );
    endpoints.value = this._selected;
    endpoints.addEventListener("change", () => {
      this._selected = endpoints.value;
      this._notice = "";
      this._filter = "all";
      this._render();
    });
    const search = element("input", undefined, {
      type: "search",
      placeholder: this._t("search"),
      "aria-label": this._t("search"),
    });
    search.value = this._query;
    search.addEventListener("input", () => {
      this._query = search.value;
      this._renderRows();
    });
    toolbar.append(
      this._field("endpoint", endpoints),
      this._field("search", search),
    );
    main.append(toolbar);
    const endpoint = this._endpoint();
    const meta = element("div", undefined, { class: "endpointMeta" });
    const status = element(
      "span",
      this._t(endpoint.connected ? "connected" : "disconnected"),
      {
        class: `badge ${endpoint.connected ? "online" : ""}`,
        "data-connection": endpoint.status_entity || "",
      },
    );
    meta.append(status, element("span", endpoint.endpoint || endpoint.title));
    const add = this._button("add", () => this._add(), "primary");
    add.disabled = !endpoint.loaded;
    meta.append(add);
    main.append(meta);
    const nav = element("nav", undefined, { "aria-label": this._t("all") });
    for (const group of ["all", ...GROUPS]) {
      const count = endpoint.rows.filter(
        (r) => group === "all" || r.platform === group,
      ).length;
      if (!count && group !== "all") continue;
      const button = this._button(
        group,
        () => {
          this._filter = group;
          this._render();
        },
        this._filter === group ? "selected" : "",
      );
      button.textContent += ` · ${count}`;
      button.setAttribute("aria-pressed", String(this._filter === group));
      nav.append(button);
    }
    main.append(nav);
    this._rows = element("section");
    main.append(this._rows);
    this._renderRows();
    main.append(element("p", this._t("info"), { class: "hint" }));
    this._paintStates();
  }
  _renderRows() {
    if (!this._rows) return;
    this._rows.replaceChildren();
    const endpoint = this._endpoint();
    if (!endpoint) return;
    if (!endpoint.rows.length) {
      this._rows.append(
        element("div", this._t(endpoint.loaded ? "noNodes" : "notLoaded"), {
          class: "message",
        }),
      );
      return;
    }
    const query = this._query.toLowerCase();
    const rows = endpoint.rows.filter(
      (r) =>
        (this._filter === "all" || r.platform === this._filter) &&
        `${r.name} ${r.node_id} ${r.entity_id}`.toLowerCase().includes(query),
    );
    if (!rows.length) this._rows.append(element("p", this._t("empty")));
    for (const group of GROUPS) {
      const items = rows.filter((r) => r.platform === group);
      if (!items.length) continue;
      const details = element("details", undefined, {
        class: "group",
        open: "",
      });
      details.append(element("summary", `${this._t(group)} · ${items.length}`));
      const grid = element("div", undefined, { class: "grid" });
      for (const row of items) {
        const card = element("article", undefined, { class: "card" });
        const top = element("div", undefined, { class: "cardTop" });
        const text = element("div", undefined, { class: "cardTitle" });
        text.append(
          element("h3", row.name || row.node_id),
          element("div", row.node_id, { class: "address" }),
        );
        top.append(text, element("span", row.variant_type, { class: "badge" }));
        const bottom = element("div", undefined, { class: "cardBottom" });
        const area =
          this._data.areas.find((a) => a.id === row.area_id)?.name ||
          this._t("inherit");
        bottom.append(element("span", area, { class: "meta" }));
        const edit = this._button("edit", () => this._edit(row));
        edit.disabled = !row.editable;
        if (!row.editable) edit.title = this._t("notReady");
        const actions = element("div", undefined, { class: "actions" });
        actions.append(edit);
        if (row.manual)
          actions.append(
            this._button("remove", () => this._remove(row), "danger"),
          );
        bottom.append(actions);
        card.append(top, bottom);
        grid.append(card);
      }
      details.append(grid);
      this._rows.append(details);
    }
  }
  _paintStates() {
    if (!this._hass?.states) return;
    for (const badge of this.shadowRoot.querySelectorAll("[data-connection]")) {
      const state = this._hass.states[badge.dataset.connection];
      if (!state) continue;
      const online = state.state === "on";
      badge.textContent = this._t(online ? "connected" : "disconnected");
      badge.classList.toggle("online", online);
    }
  }
  _remove(row) {
    const endpoint = this._endpoint();
    const dialog = element("dialog");
    this._dialog = dialog;
    const form = element("form");
    dialog.append(form);
    const error = element("div", "", { class: "error", role: "alert" });
    const cancel = this._button("cancel", () => dialog.close());
    const remove = element("button", this._t("remove"), {
      type: "submit",
      class: "danger",
    });
    const footer = element("footer");
    footer.append(cancel, remove);
    form.append(
      element("h2", this._t("removeTitle")),
      element("strong", row.name || row.node_id),
      element("div", row.node_id, { class: "address" }),
      element("p", this._t("removeHelp")),
      error,
      footer,
    );
    let busy = false;
    dialog.addEventListener("cancel", (event) => {
      if (busy) event.preventDefault();
    });
    dialog.addEventListener("close", () => {
      dialog.remove();
      if (this._dialog === dialog) this._dialog = null;
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (busy) return;
      busy = true;
      remove.disabled = cancel.disabled = true;
      remove.textContent = this._t("removing");
      error.textContent = "";
      try {
        const result = await this._hass.callWS({
          type: "ha_opcua_discovery/node/remove",
          entry_id: endpoint.entry_id,
          revision: endpoint.revision,
          key: row.key,
        });
        this._notice = this._t(result.reload ? "removedReloading" : "removed");
        dialog.close();
        await this._load();
        if (result.reload) {
          clearTimeout(this._timer);
          this._timer = setTimeout(() => this._load(), 2500);
        }
      } catch (err) {
        error.textContent = this._t(err.code in TEXT.en ? err.code : "error");
      } finally {
        busy = false;
        remove.disabled = cancel.disabled = false;
        remove.textContent = this._t("remove");
      }
    });
    this.shadowRoot.append(dialog);
    dialog.showModal();
    cancel.focus();
  }
  _add() {
    const endpoint = this._endpoint();
    const dialog = element("dialog");
    this._dialog = dialog;
    const form = element("form");
    dialog.append(form);
    const nodeId = element("input", undefined, {
      required: "",
      placeholder: "ns=4;i=2",
    });
    const error = element("div", "", { class: "error", role: "alert" });
    const cancel = this._button("cancel", () => dialog.close());
    const verify = element("button", this._t("verify"), {
      type: "submit",
      class: "primary",
    });
    const footer = element("footer");
    footer.append(cancel, verify);
    form.append(
      element("h2", this._t("add")),
      this._field("node", nodeId),
      element("p", this._t("manualHelp"), { class: "hint" }),
      error,
      footer,
    );
    let busy = false;
    dialog.addEventListener("cancel", (event) => {
      if (busy) event.preventDefault();
    });
    dialog.addEventListener("close", () => {
      dialog.remove();
      if (this._dialog === dialog) this._dialog = null;
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (busy) return;
      busy = true;
      verify.disabled = cancel.disabled = nodeId.disabled = true;
      verify.textContent = this._t("verifying");
      error.textContent = "";
      try {
        const result = await this._hass.callWS({
          type: "ha_opcua_discovery/node/inspect",
          entry_id: endpoint.entry_id,
          node_id: nodeId.value,
        });
        if (!this.isConnected) return;
        dialog.close();
        this._edit(
          {
            name: result.node.name,
            node_id: result.node.node_id,
            platform: result.platforms[0],
            invert_state: false,
          },
          result,
          endpoint,
        );
      } catch (err) {
        error.textContent = this._t(err.code in TEXT.en ? err.code : "error");
      } finally {
        busy = false;
        verify.disabled = cancel.disabled = nodeId.disabled = false;
        verify.textContent = this._t("verify");
      }
    });
    this.shadowRoot.append(dialog);
    dialog.showModal();
    nodeId.focus();
  }
  _edit(row, manual = null, endpoint = this._endpoint()) {
    const revision = endpoint.revision;
    const dialog = element("dialog");
    this._dialog = dialog;
    const form = element("form");
    dialog.append(form);
    form.append(
      element(
        "h2",
        `${this._t(manual ? "add" : "edit")} · ${row.name || row.node_id}`,
      ),
    );
    const name = element("input", undefined, {
      type: "text",
      maxlength: "255",
      name: "name",
    });
    name.value = row.custom_name ?? "";
    name.placeholder = row.name || "";
    form.append(
      this._field("name", name),
      element("p", this._t("nameHelp"), { class: "hint" }),
    );
    const area = element("select", undefined, { name: "area" });
    area.append(element("option", this._t("inherit"), { value: "" }));
    for (const item of this._data.areas)
      area.append(element("option", item.name, { value: item.id }));
    area.value = row.area_id || "";
    form.append(this._field("area", area));
    const category = element("select");
    if (manual) {
      for (const platform of manual.platforms)
        category.append(
          element("option", this._t(platform), { value: platform }),
        );
      category.value = row.platform;
      form.append(this._field("category", category));
    }
    const availableNodes = manual ? [manual.node] : endpoint.nodes;
    const nodeFilter = element("input", undefined, {
      type: "search",
      placeholder: this._t("filterNodes"),
      "aria-label": this._t("filterNodes"),
    });
    const nodes = element("select", undefined, {
      name: "node_id",
      required: "",
    });
    const populate = () => {
      const chosen = nodes.value || row.node_id;
      nodes.replaceChildren();
      for (const node of availableNodes.filter(
        (n) =>
          compatible(row, n) &&
          (n.node_id === chosen ||
            `${n.name} ${n.node_id}`
              .toLowerCase()
              .includes(nodeFilter.value.toLowerCase())),
      ))
        nodes.append(
          element("option", `${node.name} · ${node.node_id}`, {
            value: node.node_id,
          }),
        );
      nodes.value = chosen;
    };
    populate();
    nodeFilter.addEventListener("input", populate);
    if (!manual) form.append(this._field("filterNodes", nodeFilter));
    nodes.disabled = !!manual;
    form.append(this._field("node", nodes));
    if (!manual)
      form.append(element("p", this._t("nodeHelp"), { class: "hint" }));
    const deviceClass = element("select", undefined, { name: "device_class" });
    deviceClass.append(element("option", this._t("none"), { value: "" }));
    for (const cls of this._data.device_classes)
      deviceClass.append(
        element(
          "option",
          this._hass.localize?.(
            `component.binary_sensor.entity_component.${cls}.name`,
          ) || cls,
          { value: cls },
        ),
      );
    deviceClass.value = row.device_class || "";
    const classField = this._field("deviceClass", deviceClass);
    classField.hidden = row.platform !== "binary_sensor";
    form.append(classField);
    category.addEventListener("change", () => {
      row.platform = category.value;
      classField.hidden = row.platform !== "binary_sensor";
    });
    const invert = element("input", undefined, {
      type: "checkbox",
      name: "invert",
    });
    invert.checked = row.invert_state;
    const toggle = element("label", undefined, { class: "toggle" });
    toggle.append(invert, element("span", this._t("invert")));
    const invertHelp = element("p", this._t("invertHelp"), { class: "hint" });
    form.append(toggle, invertHelp);
    const updateBoolean = () => {
      const node = availableNodes.find((n) => n.node_id === nodes.value);
      toggle.hidden = invertHelp.hidden = node?.variant_type !== "Boolean";
    };
    nodes.addEventListener("change", updateBoolean);
    updateBoolean();
    const error = element("div", "", { class: "error", role: "alert" });
    form.append(error);
    const footer = element("footer");
    const cancel = this._button("cancel", () => dialog.close());
    const save = element("button", this._t("save"), {
      type: "submit",
      class: "primary",
    });
    footer.append(cancel, save);
    form.append(footer);
    let saving = false;
    dialog.addEventListener("cancel", (event) => {
      if (saving) event.preventDefault();
    });
    dialog.addEventListener("close", () => {
      dialog.remove();
      if (this._dialog === dialog) this._dialog = null;
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (saving) return;
      saving = true;
      save.disabled = cancel.disabled = true;
      save.textContent = this._t("saving");
      error.textContent = "";
      try {
        const result = await this._hass.callWS({
          type: `ha_opcua_discovery/entity/${manual ? "create" : "update"}`,
          entry_id: endpoint.entry_id,
          revision,
          ...(manual ? { platform: row.platform } : { key: row.key }),
          name: name.value,
          area_id: area.value || null,
          node_id: nodes.value,
          device_class:
            row.platform === "binary_sensor" ? deviceClass.value || null : null,
          invert_state: !toggle.hidden && invert.checked,
        });
        this._notice = this._t(result.reload ? "reloading" : "saved");
        dialog.close();
        await this._load();
        if (result.reload) {
          clearTimeout(this._timer);
          this._timer = setTimeout(() => this._load(), 2500);
        }
      } catch (err) {
        error.textContent = this._t(err.code in TEXT.en ? err.code : "error");
      } finally {
        saving = false;
        save.disabled = cancel.disabled = false;
        save.textContent = this._t("save");
      }
    });
    this.shadowRoot.append(dialog);
    dialog.showModal();
    name.focus();
  }
}
if (!customElements.get("opcua-node-panel"))
  customElements.define("opcua-node-panel", OpcuaNodePanel);
