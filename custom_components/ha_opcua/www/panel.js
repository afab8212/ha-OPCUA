/* Native Home Assistant configuration panel. No external scripts or styles. */
const TEXT = {
  it: {
    version: "Versione",
    alwaysAvailable: "Sempre disponibile",
    alwaysAvailableHelp:
      "Mantiene l’ultimo valore noto quando il PLC è scollegato o la connessione è disabilitata. Senza un valore salvato lo stato è sconosciuto. Le scritture richiedono la connessione e una lettura aggiornata.",
    invalid_availability: "Impostazione di disponibilità non valida.",
    precision: "Decimali",
    precisionHelp:
      "REAL/LREAL: da 0 a 10 decimali. Lascia vuoto per non arrotondare. Si applica al valore in Home Assistant, inclusi storico e automazioni; non modifica le scritture al PLC.",
    invalid_precision:
      "Inserisci un numero intero da 0 a 10 per un nodo REAL/LREAL.",
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
    auto: "Automatico",
    min: "Valore minimo",
    max: "Valore massimo",
    step: "Passo",
    min_length: "Lunghezza minima",
    max_length: "Lunghezza massima",
    categoryHelp:
      "Cambiare categoria può cambiare l’ID dell’entità. Aggiorna automazioni e dashboard; le entità della categoria precedente resteranno disabilitate.",
    excludeHelp:
      "Il nodo sarà escluso dalla lettura periodica. Potrai riattivarlo da questo pannello.",
    limitsHelp:
      "I limiti controllano i valori impostabili in Home Assistant. Per il testo usa la capacità configurata nel PLC, fino a 255 caratteri.",
    invalid_limits: "Limiti non compatibili con la categoria selezionata.",
    invalid_number_limits:
      "Usa valori finiti, minimo inferiore al massimo e passo positivo non superiore all’intervallo.",
    integer_limits_required: "Questo nodo richiede limiti e passo interi.",
    unsafe_integer_limits:
      "I limiti interi devono rientrare in ±9007199254740991.",
    invalid_text_limits:
      "Usa lunghezze intere tra 0 e 255, con minimo non superiore al massimo.",
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
    state: "Stato",
    stateUnknown: "Sconosciuto",
    stateUnavailable: "Non disponibile",
    statePending: "Non ancora registrata",
    stateExcluded: "Esclusa",
    stateEmpty: "Testo vuoto",
    stateOn: "Acceso",
    stateOff: "Spento",
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
    manual: "Manuale",
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
    info: "Configura categoria e limiti da Modifica. Le impostazioni di connessione restano nelle opzioni dell’integrazione.",
  },
  en: {
    version: "Version",
    alwaysAvailable: "Always available",
    alwaysAvailableHelp:
      "Keeps the last known value when the PLC is disconnected or the connection is disabled. Without a saved value the state is unknown. Writes require a connection and a fresh reading.",
    invalid_availability: "Invalid availability setting.",
    precision: "Decimal places",
    precisionHelp:
      "REAL/LREAL: 0 to 10 decimal places. Leave empty for no rounding. Applies to the Home Assistant value, including history and automations; PLC writes are unchanged.",
    invalid_precision: "Enter an integer from 0 to 10 for a REAL/LREAL node.",
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
    auto: "Automatic",
    min: "Minimum value",
    max: "Maximum value",
    step: "Step",
    min_length: "Minimum length",
    max_length: "Maximum length",
    categoryHelp:
      "Changing category may change the entity ID. Update automations and dashboards; entities from the previous category remain disabled.",
    excludeHelp:
      "The node will be excluded from periodic reads. You can enable it again from this panel.",
    limitsHelp:
      "Limits control values editable in Home Assistant. For text use the PLC string capacity, up to 255 characters.",
    invalid_limits: "Limits are incompatible with the selected category.",
    invalid_number_limits:
      "Use finite values, minimum below maximum, and a positive step no greater than the range.",
    integer_limits_required: "This node requires integer limits and step.",
    unsafe_integer_limits: "Integer limits must be within ±9007199254740991.",
    invalid_text_limits:
      "Use integer lengths from 0 to 255, with minimum no greater than maximum.",
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
    state: "State",
    stateUnknown: "Unknown",
    stateUnavailable: "Unavailable",
    statePending: "Not registered yet",
    stateExcluded: "Excluded",
    stateEmpty: "Empty text",
    stateOn: "On",
    stateOff: "Off",
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
    manual: "Manual",
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
    info: "Configure categories and limits with Edit. Connection settings remain in the integration options.",
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
function emptyMessage(text) {
  const div = element("div", undefined, { class: "message empty" });
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "28");
  svg.setAttribute("height", "28");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.6");
  svg.innerHTML =
    '<path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z" stroke-linejoin="round"/><path d="M3 8.5V16l9 4.5 9-4.5V8.5" stroke-linejoin="round"/><path d="M12 13v7.5"/>';
  div.append(svg, element("span", text));
  return div;
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
:host{display:block;height:100%;color:var(--primary-text-color,#243346);background:var(--primary-background-color,#f5f7fb);font:14px var(--paper-font-body1_-_font-family,Roboto,Arial,sans-serif);--accent-sensor:#0f9d8a;--accent-binary_sensor:#6366f1;--accent-switch:#d97a06;--accent-number:#7c4fd6;--accent-text:#e0447a;--accent-datetime:#0891b2;--accent-disabled:var(--disabled-text-color,#9aa5b1);--speed:180ms}
@media(prefers-reduced-motion:reduce){:host{--speed:0ms}}
*{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer;border:1px solid var(--divider-color,#dce2ea);border-radius:10px;padding:10px 15px;background:var(--card-background-color,#fff);color:inherit;min-height:42px}button:hover{border-color:var(--primary-color,#009ac0)}button:disabled{opacity:.5;cursor:default}button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--primary-color,#009ac0);outline-offset:2px}.primary{background:var(--primary-color,#008fac);border-color:transparent;color:var(--text-primary-color,#fff)}
header{display:flex;gap:16px;align-items:center;padding:20px 28px;background:var(--card-background-color,#fff);border-bottom:1px solid var(--divider-color,#e0e6ee)}h1{font-size:23px;margin:0 0 4px}p{margin:0;color:var(--secondary-text-color,#637487);line-height:1.5}.headerText{flex:1;min-width:0}.titleRow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.version{white-space:nowrap}.menu{display:none;border:0;background:none;font-size:22px;padding:4px 10px}.content{max-width:1400px;margin:auto;padding:24px 28px 48px;height:calc(100% - 92px);overflow:auto}.toolbar{display:grid;grid-template-columns:minmax(200px,1fr) minmax(200px,1fr);gap:18px;align-items:end;margin-bottom:18px}.field{display:flex;flex-direction:column;gap:7px}.field>span{font-weight:600}input,select{width:100%;min-width:0;padding:12px;border:1px solid var(--divider-color,#d8e0e8);border-radius:9px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#243346)}.endpointMeta{display:flex;gap:12px;align-items:center;flex-wrap:wrap;overflow-wrap:anywhere;margin-bottom:20px;color:var(--secondary-text-color,#637487)}.badge{display:inline-flex;align-items:center;gap:7px;font-size:12px;border-radius:30px;padding:5px 10px;background:var(--secondary-background-color,#e9eef5);color:var(--secondary-text-color,#637487)}[data-connection]::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;flex-shrink:0}.online{color:var(--success-color,#138260);background:color-mix(in srgb,var(--success-color,#138260) 12%,transparent)}@media(prefers-reduced-motion:no-preference){.online::before{animation:pulse 2.4s ease-in-out infinite}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
nav{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:22px;padding:5px;background:var(--secondary-background-color,#e9eef5);border-radius:12px;width:fit-content;max-width:100%}nav button{border:0;background:none;border-radius:8px;padding:8px 13px;min-height:auto;color:var(--secondary-text-color,#637487)}nav button:hover{border-color:transparent;background:color-mix(in srgb,var(--primary-text-color,#243346) 6%,transparent)}nav .selected,nav .selected:hover{background:var(--card-background-color,#fff);color:var(--primary-text-color,#243346);font-weight:600;box-shadow:0 1px 3px color-mix(in srgb,var(--primary-text-color,#243346) 14%,transparent)}
.group{margin-bottom:24px}.group>summary{cursor:pointer;font-size:17px;font-weight:600;padding:8px 0 14px;display:flex;align-items:center;gap:10px;list-style:none}.group>summary::-webkit-details-marker{display:none}.group>summary::before{content:"";width:10px;height:10px;border-radius:3px;background:var(--accent,var(--secondary-text-color,#637487));flex-shrink:0}.group>summary::after{content:"";margin-left:auto;width:9px;height:9px;border-right:2px solid var(--secondary-text-color,#8a97a8);border-bottom:2px solid var(--secondary-text-color,#8a97a8);transform:rotate(-45deg);transition:transform var(--speed) ease}.group:not([open])>summary::after{transform:rotate(45deg)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr));gap:14px}.card{position:relative;background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#e2e7ef);border-left:3px solid var(--accent,var(--divider-color,#e2e7ef));border-radius:10px;padding:18px;min-width:0;transition:border-color var(--speed) ease}.card:hover{border-color:color-mix(in srgb,var(--accent,var(--primary-color)) 45%,var(--divider-color,#e2e7ef));border-left-color:var(--accent,var(--divider-color,#e2e7ef))}.cardTop{display:flex;align-items:start;gap:8px;flex-wrap:wrap}.cardTitle{flex:1;min-width:0}.card h3{font-size:16px;margin:0 0 7px;overflow-wrap:anywhere}.manualTag{font-size:11px;font-weight:600;color:var(--accent,var(--primary-color));background:color-mix(in srgb,var(--accent,var(--primary-color)) 15%,transparent);padding:3px 8px;border-radius:20px;white-space:nowrap}.address{font:12px ui-monospace,monospace;overflow-wrap:anywhere;color:var(--secondary-text-color,#637487);line-height:1.6}.limits{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}.entityState{margin-top:16px;padding:12px;border-radius:9px;background:var(--secondary-background-color,#f3f6fa);min-width:0}.stateLabel{display:block;font-size:12px;color:var(--secondary-text-color,#637487);margin-bottom:5px}.stateValue{display:block;font-size:20px;font-weight:500;line-height:1.4;white-space:pre-wrap;overflow-wrap:anywhere;max-height:8em;overflow:auto}.stateValue[data-kind="unavailable"],.stateValue[data-kind="unknown"],.stateValue[data-kind="pending"],.stateValue[data-kind="disabled"]{font-size:16px;color:var(--secondary-text-color,#637487)}.actions{display:flex;gap:8px;flex-wrap:wrap}.danger{color:var(--error-color,#be3131)}.cardBottom{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-top:15px}.meta{color:var(--secondary-text-color,#637487);font-size:12px}.message{padding:13px 16px;margin-bottom:16px;border-radius:10px;background:var(--secondary-background-color,#eaf0f7);line-height:1.5}.message.empty{display:flex;gap:12px;align-items:center;color:var(--secondary-text-color,#637487)}.message.empty svg{flex-shrink:0;opacity:.7}.error{color:var(--error-color,#be3131)}.hint{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#637487)}
[data-platform="sensor"]{--accent:var(--accent-sensor)}[data-platform="binary_sensor"]{--accent:var(--accent-binary_sensor)}[data-platform="switch"]{--accent:var(--accent-switch)}[data-platform="number"]{--accent:var(--accent-number)}[data-platform="text"]{--accent:var(--accent-text)}[data-platform="datetime"]{--accent:var(--accent-datetime)}[data-platform="disabled"]{--accent:var(--accent-disabled)}
dialog{border:1px solid var(--divider-color,#dce2ea);border-radius:18px;width:min(620px,calc(100vw - 24px));max-height:calc(100dvh - 32px);padding:0;background:var(--card-background-color,#fff);color:var(--primary-text-color,#243346);opacity:0;transform:translateY(10px) scale(.98);transition:opacity var(--speed) ease,transform var(--speed) ease}dialog[open]{opacity:1;transform:none}dialog::backdrop{background:#10223480;backdrop-filter:blur(1px)}form{padding:24px;display:flex;flex-direction:column;gap:17px}form h2{margin:0;font-size:21px;overflow-wrap:anywhere}footer{display:flex;justify-content:flex-end;gap:10px;margin-top:6px}.toggle{display:flex;gap:10px;align-items:center}.toggle input{width:20px;height:20px;min-width:20px;accent-color:var(--primary-color,#008fac)}[hidden]{display:none!important}
@media(max-width:870px){.menu{display:inline-flex;align-items:center;justify-content:center}}
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
        type: "ha_opcua/panel",
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
    const titleRow = element("div", undefined, { class: "titleRow" });
    titleRow.append(element("h1", this._t("title")));
    if (this._data?.version) {
      titleRow.append(
        element("span", `${this._t("version")} ${this._data.version}`, {
          class: "badge version",
        }),
      );
    }
    title.append(titleRow, element("p", this._t("subtitle")));
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
      main.append(emptyMessage(this._t("noEndpoints")));
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
        emptyMessage(this._t(endpoint.loaded ? "noNodes" : "notLoaded")),
      );
      return;
    }
    const query = this._query.toLowerCase();
    const rows = endpoint.rows.filter(
      (r) =>
        (this._filter === "all" || r.platform === this._filter) &&
        `${r.name} ${r.node_id} ${r.entity_id}`.toLowerCase().includes(query),
    );
    if (!rows.length) this._rows.append(emptyMessage(this._t("empty")));
    for (const group of GROUPS) {
      const items = rows.filter((r) => r.platform === group);
      if (!items.length) continue;
      const details = element("details", undefined, {
        class: "group",
        open: "",
        "data-platform": group,
      });
      details.append(element("summary", `${this._t(group)} · ${items.length}`));
      const grid = element("div", undefined, { class: "grid" });
      for (const row of items) {
        const card = element("article", undefined, {
          class: "card",
          "data-platform": row.platform,
        });
        const top = element("div", undefined, { class: "cardTop" });
        const text = element("div", undefined, { class: "cardTitle" });
        text.append(
          element("h3", row.name || row.node_id),
          element("div", row.node_id, { class: "address" }),
        );
        top.append(text, element("span", row.variant_type, { class: "badge" }));
        if (row.manual)
          top.append(
            element("span", this._t("manual"), { class: "manualTag" }),
          );
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
        const state = element("div", undefined, { class: "entityState" });
        state.append(
          element("span", this._t("state"), { class: "stateLabel" }),
          element("span", "", {
            class: "stateValue",
            "data-entity-state": row.entity_id || "",
            "data-platform": row.platform,
          }),
        );
        card.append(top, state, bottom);
        grid.append(card);
      }
      details.append(grid);
      this._rows.append(details);
    }
    this._paintStates();
  }
  _paintStates() {
    const states = this._hass?.states || {};
    for (const value of this.shadowRoot.querySelectorAll(
      "[data-entity-state]",
    )) {
      const id = value.dataset.entityState;
      const platform = value.dataset.platform;
      const entity = states[id];
      let kind = "value";
      let label;
      if (platform === "disabled") {
        kind = "disabled";
        label = this._t("stateExcluded");
      } else if (!id) {
        kind = "pending";
        label = this._t("statePending");
      } else if (!entity || entity.state === "unavailable") {
        kind = "unavailable";
        label = this._t("stateUnavailable");
      } else if (entity.state === "unknown") {
        kind = "unknown";
        label = this._t("stateUnknown");
      } else if (entity.state === "") {
        label = this._t("stateEmpty");
      } else {
        // HA applies device-class labels, units, locale and timezone preferences.
        label = this._hass.formatEntityState?.(entity);
        if (label == null) {
          if (
            ["switch", "binary_sensor"].includes(platform) &&
            ["on", "off"].includes(entity.state)
          )
            label = this._t(entity.state === "on" ? "stateOn" : "stateOff");
          else {
            const unit = entity.attributes?.unit_of_measurement;
            label = `${entity.state}${unit ? ` ${unit}` : ""}`;
          }
        }
      }
      if (value.textContent !== label) value.textContent = label;
      if (value.dataset.kind !== kind) value.dataset.kind = kind;
    }
    for (const badge of this.shadowRoot.querySelectorAll("[data-connection]")) {
      const state = states[badge.dataset.connection];
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
          type: "ha_opcua/node/remove",
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
          type: "ha_opcua/node/inspect",
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
    row = { ...row };
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
    const availableNodes = manual ? [manual.node] : endpoint.nodes;
    const originalPlatform = row.platform;
    const category = element("select");
    const nodeFilter = element("input", undefined, {
      type: "search",
      placeholder: this._t("filterNodes"),
      "aria-label": this._t("filterNodes"),
    });
    const nodes = element("select", undefined, {
      name: "node_id",
      required: "",
    });
    const selectedNode = () =>
      availableNodes.find((n) => n.node_id === nodes.value);
    const choices = (node) => {
      if (!node) return manual ? ["sensor"] : ["auto", "sensor", "disabled"];
      return [
        ...(manual ? [] : ["auto"]),
        "sensor",
        ...["binary_sensor", "switch", "number", "text", "datetime"].filter(
          (platform) => compatible({ platform }, node),
        ),
        ...(manual ? [] : ["disabled"]),
      ];
    };
    const populateCategories = (
      chosen = category.value || row.settings?.platform || row.platform,
    ) => {
      const allowed = choices(
        selectedNode() || availableNodes.find((n) => n.node_id === row.node_id),
      );
      category.replaceChildren(
        ...allowed.map((p) => element("option", this._t(p), { value: p })),
      );
      category.value = allowed.includes(chosen) ? chosen : allowed[0];
    };
    const populate = () => {
      const chosen = nodes.value || row.node_id;
      nodes.replaceChildren();
      for (const node of availableNodes.filter(
        (n) =>
          compatible({ platform: category.value }, n) &&
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
    populateCategories();
    populate();
    form.append(this._field("category", category));
    const categoryHelp = element("p", "", { class: "hint" });
    form.append(categoryHelp);
    nodeFilter.addEventListener("input", populate);
    if (!manual) form.append(this._field("filterNodes", nodeFilter));
    nodes.disabled = !!manual;
    form.append(this._field("node", nodes));
    if (!manual)
      form.append(element("p", this._t("nodeHelp"), { class: "hint" }));
    const effective = () =>
      category.value === "auto"
        ? selectedNode()?.writable
          ? { Boolean: "switch", DateTime: "datetime" }[
              selectedNode().variant_type
            ] || "sensor"
          : "sensor"
        : category.value;
    const limitInputs = {};
    const limitGroups = {};
    const initial = row.settings || {};
    const alwaysAvailable = element("input", undefined, {
      type: "checkbox",
      name: "always_available",
    });
    alwaysAvailable.checked = initial.always_available === true;
    const availabilityToggle = element("label", undefined, { class: "toggle" });
    availabilityToggle.append(
      alwaysAvailable,
      element("span", this._t("alwaysAvailable")),
    );
    form.append(
      availabilityToggle,
      element("p", this._t("alwaysAvailableHelp"), { class: "hint" }),
    );
    const defaults = {
      min: 0,
      max: 100,
      step: ["Float", "Double"].includes(selectedNode()?.variant_type)
        ? 0.1
        : 1,
      min_length: 0,
      max_length: 255,
    };
    for (const [platform, keys] of Object.entries({
      number: ["min", "max", "step"],
      text: ["min_length", "max_length"],
    })) {
      const group = element("div", undefined, { class: "limits" });
      for (const key of keys) {
        const input = element("input", undefined, {
          type: "number",
          step: platform === "text" ? "1" : "any",
        });
        if (platform === "text") {
          input.min = "0";
          input.max = "255";
        }
        input.value = initial[key] ?? defaults[key];
        limitInputs[key] = input;
        group.append(this._field(key, input));
      }
      limitGroups[platform] = group;
      form.append(group);
    }
    const limitsHelp = element("p", this._t("limitsHelp"), { class: "hint" });
    form.append(limitsHelp);
    const precision = element("input", undefined, {
      type: "number",
      name: "precision",
      min: "0",
      max: "10",
      step: "1",
    });
    precision.value = initial.precision ?? "";
    const precisionField = this._field("precision", precision);
    const precisionHelp = element("p", this._t("precisionHelp"), {
      class: "hint",
    });
    form.append(precisionField, precisionHelp);
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
    form.append(classField);
    const invert = element("input", undefined, {
      type: "checkbox",
      name: "invert",
    });
    invert.checked = row.invert_state;
    const toggle = element("label", undefined, { class: "toggle" });
    toggle.append(invert, element("span", this._t("invert")));
    const invertHelp = element("p", this._t("invertHelp"), { class: "hint" });
    form.append(toggle, invertHelp);
    const updateFields = () => {
      const platform = effective();
      classField.hidden = platform !== "binary_sensor";
      precisionField.hidden = precisionHelp.hidden = ![
        "Float",
        "Double",
      ].includes(selectedNode()?.variant_type);
      precision.disabled = precisionField.hidden;
      toggle.hidden = invertHelp.hidden =
        selectedNode()?.variant_type !== "Boolean";
      for (const [kind, group] of Object.entries(limitGroups)) {
        group.hidden = kind !== platform;
        for (const input of group.querySelectorAll("input")) {
          input.disabled = group.hidden;
          input.required = !group.hidden;
        }
      }
      limitsHelp.hidden = !["number", "text"].includes(platform);
      categoryHelp.hidden = !!manual || platform === originalPlatform;
      categoryHelp.textContent = this._t(
        platform === "disabled" ? "excludeHelp" : "categoryHelp",
      );
    };
    category.addEventListener("change", () => {
      populate();
      updateFields();
    });
    nodes.addEventListener("change", () => {
      populateCategories();
      updateFields();
    });
    updateFields();
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
          type: `ha_opcua/entity/${manual ? "create" : "update"}`,
          entry_id: endpoint.entry_id,
          revision,
          ...(manual ? {} : { key: row.key }),
          platform: category.value,
          ...(alwaysAvailable.checked || initial.always_available !== undefined
            ? { always_available: alwaysAvailable.checked }
            : {}),
          ...(["number", "text"].includes(effective())
            ? {
                limits: Object.fromEntries(
                  (effective() === "number"
                    ? ["min", "max", "step"]
                    : ["min_length", "max_length"]
                  ).map((key) => [key, Number(limitInputs[key].value)]),
                ),
              }
            : {}),
          ...(!precision.disabled || initial.precision != null
            ? {
                precision:
                  precision.disabled || precision.value === ""
                    ? null
                    : Number(precision.value),
              }
            : {}),
          name: name.value,
          area_id: area.value || null,
          node_id: nodes.value,
          device_class:
            effective() === "binary_sensor" ? deviceClass.value || null : null,
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
