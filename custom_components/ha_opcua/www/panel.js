/* Native Home Assistant configuration panel. No external scripts or styles. */
// Bump for every frontend change; displayed from the loaded JavaScript bundle.
const PANEL_VERSION = "1.4.0";
const TEXT = {
  it: {
    version: "Integrazione",
    panelVersion: "Pannello",
    customizations: "Personalizzazioni salvate",
    invertedBadge: "Stato invertito",
    classBadge: "Classe",
    rangeBadge: "Limiti",
    lengthBadge: "Caratteri",
    remappedBadge: "NodeId riassegnato",
    subscriptionBadge: "Subscription configurata",
    valueLabel: "Valore",
    textLabel: "Testo",
    dateLabel: "Data e ora",
    retainedValue: "Ultimo valore",
    retainedHelp: "Valore conservato: in attesa di una nuova lettura dal PLC.",
    alwaysAvailable: "Sempre disponibile",
    alwaysAvailableHelp:
      "Mantiene l’ultimo valore noto quando il PLC è scollegato o la connessione è disabilitata. Senza un valore salvato lo stato è sconosciuto. Le scritture richiedono la connessione e una lettura aggiornata.",
    invalid_availability: "Impostazione di disponibilità non valida.",
    endpointSubscription: "Auto-Subscription endpoint",
    endpointSubscriptionHelp:
      "Abilita le subscription per le entità selezionate di questo endpoint. Il polling rimane attivo.",
    subscriptionUnavailable:
      "Controllo non disponibile. Verifica che l’integrazione e l’entità Auto-Subscription siano abilitate.",
    subscriptionFailed: "Impossibile modificare Auto-Subscription. Riprova.",
    subscriptionSaving: "Salvataggio…",
    updateMode: "Modalità aggiornamento",
    polling: "Solo polling",
    subscription: "Polling + subscription",
    updateModeHelp:
      "Le notifiche richiedono anche lo switch Auto-Subscription dell’endpoint acceso. Il polling continua in entrambe le modalità. Spegnere lo switch non cancella questa scelta.",
    invalid_update_mode: "Modalità aggiornamento non valida.",
    precision: "Decimali",
    precisionHelp:
      "REAL/LREAL: da 0 a 10 decimali. Lascia vuoto per non arrotondare. Si applica al valore in Home Assistant, inclusi storico e automazioni; non modifica le scritture al PLC.",
    invalid_precision:
      "Inserisci un numero intero da 0 a 10 per un nodo REAL/LREAL.",
    invalid_deadband:
      "Usa un deadband finito maggiore o uguale a 0 (intero per i tipi interi).",
    deadband: "Deadband",
    deadbandHelp:
      "Solo Auto-Subscription: sopprime un aggiornamento push più piccolo di questa variazione assoluta (es. 0,01 nasconde il rumore in virgola mobile oltre la 2ª cifra decimale). 0 disattiva il filtro. Il polling non è interessato e legge sempre il valore esatto.",
    orphan: "Nodo mancante",
    deleteEntity: "Elimina entità",
    deleting: "Eliminazione…",
    deleteTitle: "Elimina entità orfana",
    deleteHelp:
      "Il PLC non fornisce più questo nodo dopo una rilevazione completa, oppure l’entità è rimasta da un cambio di categoria. L’entità Home Assistant verrà eliminata. Le automazioni e le dashboard che la usano dovranno essere aggiornate. Il PLC non viene modificato. Le impostazioni necessarie a un'entità sostitutiva vengono mantenute; le impostazioni di un nodo confermato come assente possono invece essere rimosse se nessun'altra entità lo referenzia.",
    deleted: "Entità orfana eliminata.",
    deleteAll: "Elimina tutte le mancanti",
    deleteAllTitle: "Elimina tutte le entità orfane",
    deleteAllHelp:
      "Tutte le entità il cui nodo non è più fornito dal PLC dopo una rilevazione completa, e quelle rimaste da un cambio di categoria, verranno eliminate. Le automazioni e le dashboard che le usano dovranno essere aggiornate. Il PLC non viene modificato. Le impostazioni necessarie a entità sostitutive vengono mantenute; le impostazioni di nodi confermati come assenti possono invece essere rimosse se nessun'altra entità le referenzia.",
    deletedAll: "Entità orfane eliminate.",
    reclassifyBooleans: "Riclassifica come binary_sensor",
    reclassifyBooleansTitle: "Riclassifica i sensori Boolean esistenti",
    reclassifyBooleansHelp:
      "I nodi Boolean di sola lettura lasciati su Automatico possono essere convertiti in binary_sensor invece di sensor, così da mostrare Acceso/Spento invece di un valore grezzo True/False: vengono modificati solo quelli selezionati qui sotto. Sono idonei solo i nodi ancora su Automatico: una scelta esplicita, incluso sensor, non viene mai sovrascritta. Ogni vecchia entità sensor risultante dalla conversione compare come entità orfana, pronta per “Elimina tutte le mancanti”.",
    reclassifySelectAll: "Seleziona tutti",
    reclassifyConvert: "Converti selezionati",
    reclassifying: "Riclassificazione…",
    reclassified: "Sensori Boolean riclassificati.",
    groupedArrays: "Array raggruppati",
    groupModeLabel: "Raggruppamento",
    groupByCategory: "Per categoria",
    groupByArray: "Per elemento array",
    renameArrayFields: "Rinomina campi array",
    renameArrayFieldsTitle: "Disambigua i campi degli array esistenti",
    renameArrayFieldsHelp:
      "Ogni campo di un array di struct del PLC (es. “astMeldungen[10].xAktiv”) condivide lo stesso nome con ogni altro elemento: rinominare i campi selezionati qui sotto aggiunge l'indice dell'array al nome, così da poterli distinguere. Vengono modificati solo i nomi delle entità selezionate; un nome già personalizzato manualmente non viene mai sovrascritto.",
    renameConfirm: "Rinomina selezionati",
    renaming: "Ridenominazione…",
    renamed: "Campi rinominati.",
    not_orphan:
      "L’entità non è più orfana o non può essere verificata ora (connessione assente o rilevazione incompleta). Nulla è stato eliminato.",
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
    title: "OPC UA Connect",
    subtitle: "Configura le entità dei tuoi endpoint",
    endpoint: "Endpoint",
    refresh: "Aggiorna",
    search: "Cerca nome o NodeId",
    gridView: "Vista a riquadri",
    listView: "Vista a elenco",
    rediscover: "Rileva di nuovo",
    rediscovering: "Rilevamento…",
    rediscovered: "Nuova rilevazione dei nodi PLC completata.",
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
    version: "Integration",
    panelVersion: "Panel",
    customizations: "Saved customizations",
    invertedBadge: "Inverted state",
    classBadge: "Class",
    rangeBadge: "Limits",
    lengthBadge: "Characters",
    remappedBadge: "Reassigned NodeId",
    subscriptionBadge: "Subscription configured",
    valueLabel: "Value",
    textLabel: "Text",
    dateLabel: "Date and time",
    retainedValue: "Last known value",
    retainedHelp: "Retained value: waiting for a fresh reading from the PLC.",
    alwaysAvailable: "Always available",
    alwaysAvailableHelp:
      "Keeps the last known value when the PLC is disconnected or the connection is disabled. Without a saved value the state is unknown. Writes require a connection and a fresh reading.",
    invalid_availability: "Invalid availability setting.",
    endpointSubscription: "Endpoint Auto-Subscription",
    endpointSubscriptionHelp:
      "Enable subscriptions for the selected entities on this endpoint. Polling remains active.",
    subscriptionUnavailable:
      "Control unavailable. Check that the integration and Auto-Subscription entity are enabled.",
    subscriptionFailed: "Could not change Auto-Subscription. Please retry.",
    subscriptionSaving: "Saving…",
    updateMode: "Update mode",
    polling: "Polling only",
    subscription: "Polling + subscription",
    updateModeHelp:
      "Notifications also require the endpoint’s Auto-Subscription switch to be on. Polling continues in both modes. Turning the switch off preserves this choice.",
    invalid_update_mode: "Invalid update mode.",
    precision: "Decimal places",
    precisionHelp:
      "REAL/LREAL: 0 to 10 decimal places. Leave empty for no rounding. Applies to the Home Assistant value, including history and automations; PLC writes are unchanged.",
    invalid_precision: "Enter an integer from 0 to 10 for a REAL/LREAL node.",
    invalid_deadband:
      "Use a finite deadband of 0 or more (an integer for integer node types).",
    deadband: "Deadband",
    deadbandHelp:
      "Auto-Subscription only: suppress a push update smaller than this absolute change (e.g. 0.01 hides float noise below the 2nd decimal). 0 disables filtering. Polling is unaffected and always reads the exact value.",
    remove: "Remove",
    removing: "Removing…",
    removeTitle: "Remove manual node",
    removeHelp:
      "The manual configuration and its Home Assistant entities will be deleted. Automations using them will need updating. The PLC node is unchanged. If discovery finds it again, it stays excluded.",
    removed: "Manual node removed.",
    removedReloading: "Manual node removed. The endpoint is reloading.",
    not_manual_node: "Only manually configured nodes can be removed here.",
    orphan: "Node missing",
    deleteEntity: "Delete entity",
    deleting: "Deleting…",
    deleteTitle: "Delete orphaned entity",
    deleteHelp:
      "The PLC no longer provides this node after a complete discovery, or the entity was left behind by a category change. The Home Assistant entity will be deleted. Automations and dashboards using it will need updating. The PLC is unchanged. Settings needed by a replacement entity are preserved; settings for a node confirmed missing may also be removed if no other entity references it.",
    deleted: "Orphaned entity deleted.",
    deleteAll: "Delete all missing",
    deleteAllTitle: "Delete all orphaned entities",
    deleteAllHelp:
      "Every entity whose node the PLC no longer provides after a complete discovery, and every entity left behind by a category change, will be deleted. Automations and dashboards using them will need updating. The PLC is unchanged. Settings needed by replacement entities are preserved; settings for nodes confirmed missing may also be removed when no other entity references them.",
    deletedAll: "Orphaned entities deleted.",
    reclassifyBooleans: "Reclassify as binary_sensor",
    reclassifyBooleansTitle: "Reclassify existing Boolean sensors",
    reclassifyBooleansHelp:
      'Read-only Boolean nodes left on Auto can be converted to binary_sensor instead of sensor, so they show On/Off instead of a raw True/False value - only the ones selected below are changed. Only nodes still left on Auto are eligible - an explicit choice, including sensor, is never overridden. Each old sensor entity is left as an orphaned entity after conversion, ready for "Delete all missing".',
    reclassifySelectAll: "Select all",
    reclassifyConvert: "Convert selected",
    reclassifying: "Reclassifying…",
    reclassified: "Boolean sensors reclassified.",
    groupedArrays: "Grouped arrays",
    groupModeLabel: "Grouping",
    groupByCategory: "By category",
    groupByArray: "By array element",
    renameArrayFields: "Rename array fields",
    renameArrayFieldsTitle: "Disambiguate existing array fields",
    renameArrayFieldsHelp:
      'Every field of one PLC array-of-struct element (e.g. "astMeldungen[10].xAktiv") shares the same name with every other element - renaming the ones selected below adds the array index to the name so they can be told apart. Only the selected entities\' names are changed; a name already customized manually is never overridden.',
    renameConfirm: "Rename selected",
    renaming: "Renaming…",
    renamed: "Fields renamed.",
    not_orphan:
      "This entity is no longer orphaned or cannot be verified right now (connection down or discovery incomplete). Nothing was deleted.",
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
    title: "OPC UA Connect",
    subtitle: "Configure entities for your endpoints",
    endpoint: "Endpoint",
    refresh: "Refresh",
    search: "Search name or NodeId",
    gridView: "Tile view",
    listView: "List view",
    rediscover: "Rediscover",
    rediscovering: "Discovering…",
    rediscovered: "PLC nodes rediscovered.",
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
function valueType(row) {
  if (
    ["switch", "binary_sensor"].includes(row.platform) ||
    row.variant_type === "Boolean"
  )
    return "boolean";
  if (row.platform === "datetime" || row.variant_type === "DateTime")
    return "datetime";
  if (row.platform === "number" || NUMERIC.has(row.variant_type))
    return "numeric";
  return "text";
}
// Decorative icons only: the adjacent localized text always describes the state.
const VALUE_ICONS = {
  numeric: "M9 3 7 21M17 3l-2 18M4 9h17M3 15h17",
  text: "M4 5h16M4 10h16M4 15h10M4 20h7",
  datetime:
    "M7 3v4M17 3v4M3 10h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2M8 14h2M14 14h2M8 18h2",
  boolean: "M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18",
  on: "M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18M8 12l3 3 5-6",
  off: "M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18M8 12h8",
  alert: "m12 3 10 18H2L12 3ZM12 9v5M12 17v1",
  unavailable: "M3 3l18 18M8 5a9 9 0 0 1 11 12M16 19A9 9 0 0 1 5 7",
  unknown: "M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4M12 18v1",
  pending: "M5 3h14M5 21h14M7 3v4l10 10v4M17 3v4L7 17v4",
  disabled: "M9 5v14M15 5v14",
  empty: "M5 6h14v12H5zM9 12h6",
};
function valueIcon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [key, val] of Object.entries({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.7",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
  }))
    svg.setAttribute(key, val);
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", VALUE_ICONS[name] || VALUE_ICONS.text);
  svg.append(path);
  return svg;
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
:host{display:flex;flex-direction:column;height:100%;min-height:0;color:var(--primary-text-color,#243346);background:var(--primary-background-color,#f5f7fb);font:14px var(--paper-font-body1_-_font-family,Roboto,Arial,sans-serif);--accent-sensor:#0f9d8a;--accent-binary_sensor:#6366f1;--accent-switch:#d97a06;--accent-number:#7c4fd6;--accent-text:#e0447a;--accent-datetime:#0891b2;--accent-disabled:var(--disabled-text-color,#9aa5b1);--speed:180ms}
@media(prefers-reduced-motion:reduce){:host{--speed:0ms}}
*{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer;border:1px solid var(--divider-color,#dce2ea);border-radius:10px;padding:10px 15px;background:var(--card-background-color,#fff);color:inherit;min-height:42px;transition:background var(--speed),border-color var(--speed)}button:hover{border-color:var(--primary-color,#009ac0);background:color-mix(in srgb,var(--primary-color,#009ac0) 5%,var(--card-background-color,#fff))}button:disabled{opacity:.5;cursor:default}button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color,#009ac0);outline-offset:3px}.primary,.primary:hover{background:var(--primary-color,#008fac);border-color:transparent;color:var(--text-primary-color,#fff)}
header{display:flex;flex-shrink:0;gap:16px;align-items:center;padding:18px 28px;background:var(--card-background-color,#fff);border-bottom:1px solid var(--divider-color,#e0e6ee)}h1{font-size:22px;line-height:1.3;margin:0;font-weight:650}p{margin:0;color:var(--secondary-text-color,#637487);line-height:1.5}.headerText{flex:1;min-width:0}.headerText>p{margin-top:5px}.titleRow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.version{white-space:nowrap}.menu{display:none;border:0;background:none;font-size:22px;padding:4px 10px}.content{flex:1;min-height:0;width:100%;max-width:1480px;margin:0 auto;padding:24px 28px 48px;overflow:auto}
.endpointPanel{background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#dce2ea);border-radius:16px;padding:20px;margin-bottom:22px}.toolbar{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:end;margin-bottom:16px}.field{display:flex;flex-direction:column;gap:7px;min-width:0}.field>span{font-weight:600;font-size:13px}input,select{width:100%;min-width:0;padding:12px;border:1px solid var(--divider-color,#d8e0e8);border-radius:9px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#243346)}.endpointMeta{display:flex;gap:16px;align-items:center;flex-wrap:wrap;min-width:0;color:var(--secondary-text-color,#637487)}.endpointIdentity{display:flex;gap:10px;align-items:center;flex-wrap:wrap;flex:1 1 220px;min-width:0}.endpointAddress{font:12px ui-monospace,monospace;overflow-wrap:anywhere;line-height:1.6}.endpointActions{display:flex;gap:8px;flex-wrap:wrap}.badge{display:inline-flex;align-items:center;gap:7px;font-size:12px;border-radius:7px;padding:4px 8px;background:color-mix(in srgb,var(--secondary-text-color,#637487) 9%,transparent);color:var(--secondary-text-color,#637487)}[data-connection]{border-radius:20px;white-space:nowrap;padding:5px 10px}[data-connection]::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;flex-shrink:0}.online{color:var(--success-color,#138260);background:color-mix(in srgb,var(--success-color,#138260) 12%,transparent)}
.navRow{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--divider-color,#e0e6ee)}nav{display:flex;gap:7px;flex-wrap:wrap;max-width:100%}nav button{border:1px solid transparent;background:transparent;padding:8px 12px;min-height:38px;color:var(--secondary-text-color,#637487)}nav .selected,nav .selected:hover{background:color-mix(in srgb,var(--primary-color,#008fac) 10%,var(--card-background-color,#fff));border-color:color-mix(in srgb,var(--primary-color,#008fac) 28%,transparent);color:var(--primary-text-color,#243346);font-weight:600}.viewToggle{display:flex;gap:3px;padding:3px;border:1px solid var(--divider-color,#dce2ea);border-radius:11px;background:var(--card-background-color,#fff)}.viewToggle button{border:0;background:none;border-radius:7px;padding:8px 11px;min-height:34px;font-size:16px;line-height:1;color:var(--secondary-text-color,#637487)}.viewToggle .selected,.viewToggle .selected:hover{background:color-mix(in srgb,var(--primary-color,#008fac) 12%,transparent);color:var(--primary-color,#008fac)}
.group{margin-bottom:22px}.group>summary{cursor:pointer;font-size:15px;font-weight:600;padding:8px 2px 12px;display:flex;align-items:center;gap:9px;list-style:none}.group>summary::-webkit-details-marker{display:none}.group>summary::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--accent,var(--secondary-text-color,#637487));flex-shrink:0}.group>summary::after{content:"";margin-left:auto;margin-right:5px;width:7px;height:7px;border-right:2px solid var(--secondary-text-color,#8a97a8);border-bottom:2px solid var(--secondary-text-color,#8a97a8);transform:rotate(45deg);transition:transform var(--speed) ease}.group:not([open])>summary::after{transform:rotate(-45deg)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:12px}.card{display:flex;flex-direction:column;position:relative;background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#e2e7ef);border-left:3px solid var(--accent,var(--divider-color,#e2e7ef));border-radius:12px;padding:16px;min-width:0;transition:border-color var(--speed) ease}.card:hover{border-color:color-mix(in srgb,var(--accent,var(--primary-color)) 45%,var(--divider-color,#e2e7ef));border-left-color:var(--accent,var(--divider-color,#e2e7ef))}.cardTop{display:flex;align-items:start;gap:8px;flex-wrap:wrap;min-width:0}.cardTitle{flex:1;min-width:0}.card h3{font-size:15px;line-height:1.45;font-weight:600;margin:0 0 5px;overflow-wrap:anywhere}.cardTop .badge{font-size:11px;padding:3px 7px}.manualTag,.orphanTag{font-size:11px;font-weight:600;padding:3px 8px;border-radius:20px;white-space:nowrap}.manualTag{color:var(--accent,var(--primary-color));background:color-mix(in srgb,var(--accent,var(--primary-color)) 15%,transparent)}.address{font:11px ui-monospace,monospace;overflow-wrap:anywhere;color:var(--secondary-text-color,#637487);line-height:1.6}.limits{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))}.entityState{flex:1;margin-top:18px;min-width:0}.stateLabel{display:block;font-size:11px;color:var(--secondary-text-color,#637487);margin-bottom:4px}.stateValue{display:block;font-size:23px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1.4;white-space:pre-wrap;overflow-wrap:anywhere;max-height:8em;overflow:auto}.stateValue[data-kind="unavailable"],.stateValue[data-kind="unknown"],.stateValue[data-kind="pending"],.stateValue[data-kind="disabled"]{font-size:15px;font-weight:400;color:var(--secondary-text-color,#637487)}.actions{display:flex;gap:7px;flex-wrap:wrap}.danger{color:var(--error-color,#be3131)}.cardBottom{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-top:16px;padding-top:12px;border-top:1px solid var(--divider-color,#e2e7ef)}.actions button{padding:7px 12px;min-height:36px}.meta{color:var(--secondary-text-color,#637487);font-size:12px;overflow-wrap:anywhere}.message{padding:13px 16px;margin-bottom:16px;border-radius:10px;background:var(--secondary-background-color,#eaf0f7);line-height:1.5}.message.empty{display:flex;gap:12px;align-items:center;color:var(--secondary-text-color,#637487)}.message.empty svg{flex-shrink:0;opacity:.7}.error{color:var(--error-color,#be3131)}.hint{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#637487)}
.grid.list{grid-template-columns:1fr;gap:7px}.grid.list .card{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) minmax(180px,.8fr);align-items:center;gap:20px;padding:13px 16px}.grid.list .cardTop{align-items:center}.grid.list .entityState{margin:0}.grid.list .stateValue{font-size:17px;max-height:6em}.grid.list .cardBottom{flex-direction:column;align-items:flex-end;justify-content:center;gap:6px;margin:0;padding:0;border:0}.grid.list .cardBottom .meta{text-align:right}
[data-platform="sensor"]{--accent:var(--accent-sensor)}[data-platform="binary_sensor"]{--accent:var(--accent-binary_sensor)}[data-platform="switch"]{--accent:var(--accent-switch)}[data-platform="number"]{--accent:var(--accent-number)}[data-platform="text"]{--accent:var(--accent-text)}[data-platform="datetime"]{--accent:var(--accent-datetime)}[data-platform="disabled"]{--accent:var(--accent-disabled)}
.endpointSubscription{display:flex;flex:1 1 100%;gap:8px 20px;flex-wrap:wrap;align-items:center;min-width:0;padding-top:14px;border-top:1px solid var(--divider-color,#e2e7ef)}.endpointSubscription .hint{flex:1 1 270px;font-size:12px;margin:0}.endpointSubscription #subscription-status,.endpointSubscription .error{flex-basis:100%}.endpointSubscription .toggle{font-weight:600;color:var(--primary-text-color,#243346);padding:4px 0;min-height:36px}.endpointSubscription input[role="switch"]{appearance:none;position:relative;width:42px;min-width:42px;height:24px;padding:0;border:0;border-radius:12px;background:var(--disabled-color,#8695a5);cursor:pointer}.endpointSubscription input[role="switch"]::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff}.endpointSubscription input[role="switch"]:checked{background:var(--primary-color,#008fac)}.endpointSubscription input[role="switch"]:checked::after{left:21px}.endpointSubscription input[role="switch"]:disabled{opacity:.5;cursor:default}
dialog{border:1px solid var(--divider-color,#dce2ea);border-radius:18px;width:min(620px,calc(100vw - 24px));max-height:calc(100dvh - 32px);padding:0;background:var(--card-background-color,#fff);color:var(--primary-text-color,#243346);opacity:0;transform:translateY(10px) scale(.98);transition:opacity var(--speed) ease,transform var(--speed) ease;overflow:hidden}dialog[open]{opacity:1;transform:none;display:flex;flex-direction:column}dialog::backdrop{background:#10223480;backdrop-filter:blur(1px)}form{padding:24px;display:flex;flex-direction:column;gap:17px;overflow-y:auto;flex:1;min-height:0}form h2{margin:0;font-size:21px;overflow-wrap:anywhere}footer{display:flex;justify-content:flex-end;gap:10px;position:sticky;bottom:-24px;margin:6px -24px -24px;padding:14px 24px 24px;background:var(--card-background-color,#fff)}.toggle{display:flex;gap:10px;align-items:center}.toggle input{width:20px;height:20px;min-width:20px;accent-color:var(--primary-color,#008fac)}[hidden]{display:none!important}.orphanTag{color:var(--error-color,#be3131);background:color-mix(in srgb,var(--error-color,#be3131) 15%,transparent)}.card.orphan{border-left-color:var(--error-color,#be3131);border-style:dashed}.card.orphan .cardTitle h3{color:var(--secondary-text-color,#637487)}
.pickList{display:flex;flex-direction:column;gap:2px;max-height:300px;overflow-y:auto;border:1px solid var(--divider-color,#dce2ea);border-radius:10px;padding:6px}.pickItem{display:flex;align-items:center;gap:12px;padding:9px 8px;border-radius:7px;cursor:pointer}.pickItem:hover{background:color-mix(in srgb,var(--primary-color,#008fac) 6%,transparent)}.pickItem input{width:18px;height:18px;min-width:18px;flex-shrink:0;accent-color:var(--primary-color,#008fac)}.pickInfo{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}.pickName{font-weight:600;overflow-wrap:anywhere}.pickNodeId{font:11px ui-monospace,monospace;color:var(--secondary-text-color,#637487);overflow-wrap:anywhere}.pickState{font-size:12px;font-weight:600;color:var(--secondary-text-color,#637487);white-space:nowrap;flex-shrink:0}
.pickArrow{font-size:12px;color:var(--secondary-text-color,#637487);text-align:right;max-width:180px;overflow-wrap:anywhere;flex-shrink:0}
.arrayGroups{display:flex;flex-direction:column;gap:16px}.arrayGroup{border:1px solid var(--divider-color,#e2e7ef);border-radius:12px;padding:14px}.arrayGroupTitle{margin:0 0 10px;font-size:14px;font-weight:600;color:var(--secondary-text-color,#637487)}
.entityForm{padding:0;gap:0;overflow:hidden;max-height:inherit;flex:0 1 auto}.editorBody{display:flex;flex-direction:column;gap:17px;padding:24px;overflow-y:auto;overscroll-behavior:contain;min-height:0;flex:1}.editorBody>*{flex-shrink:0}.entityForm footer{position:static;flex-shrink:0;flex-wrap:wrap;margin:0;padding:16px 24px;padding-bottom:max(16px,env(safe-area-inset-bottom));border-top:1px solid var(--divider-color,#dce2ea)}.entityForm footer .error{flex-basis:100%;overflow-wrap:anywhere}.entityForm footer .error:empty{display:none}
@media(max-width:870px){.menu{display:inline-flex;align-items:center;justify-content:center}.grid.list .card{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) minmax(140px,.8fr);gap:12px}}
@media(max-width:650px){header{padding:14px 12px;gap:8px}h1{font-size:20px}.content{padding:16px 12px 32px}.endpointPanel{padding:15px;margin-bottom:18px}.toolbar{grid-template-columns:1fr;gap:12px}.endpointMeta{gap:12px}.endpointIdentity{flex-basis:100%}.endpointActions{width:100%}.endpointActions button{flex:1;min-height:44px}.endpointSubscription{gap:5px;padding-top:12px}.endpointSubscription .toggle{width:100%;min-height:44px}.grid{grid-template-columns:1fr}.navRow{gap:10px}nav{gap:3px}nav button{padding:8px 10px;min-height:42px}.card{padding:15px}.grid.list .card{grid-template-columns:minmax(0,1fr);gap:12px;padding:14px}.grid.list .cardBottom{flex-direction:row;justify-content:space-between;align-items:center;border-top:1px solid var(--divider-color,#e2e7ef);padding-top:10px}.grid.list .cardBottom .meta{text-align:left}.grid.list .entityState{display:flex;align-items:baseline;gap:10px}.actions button{min-height:42px}form{padding:20px}.entityForm{padding:0}.editorBody{padding:20px}.entityForm footer{padding-left:20px;padding-right:20px}.entityForm footer button{min-height:44px}.headerText p{font-size:12px}}
.grid{grid-template-columns:repeat(auto-fill,minmax(min(100%,270px),1fr));gap:10px;align-items:start}.card{padding:12px 14px;border-radius:11px}.card h3{font-size:14px;margin-bottom:3px}.address{font-size:10px}.cardTop .badge{font-size:10px;padding:2px 6px}.entityState{display:flex;align-items:center;gap:12px;flex:0 0 auto;margin-top:12px;min-height:48px}.valueIcon{display:flex;align-items:center;justify-content:center;width:38px;height:38px;flex:0 0 38px;border-radius:10px;color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent)}.valueIcon svg{width:23px;height:23px}.stateContent{min-width:0;flex:1}.stateLabel{font-size:10px;margin-bottom:2px}.stateValue{font-size:26px;font-weight:650;line-height:1.25;max-height:5em}.card[data-value-type="text"] .stateValue{font-size:15px;font-weight:400;line-height:1.45}.card[data-value-type="text"] .valueIcon{color:var(--accent-text);background:color-mix(in srgb,var(--accent-text) 10%,transparent)}.card[data-value-type="datetime"] .stateValue{font-size:15px;font-weight:500;line-height:1.45}.card[data-value-type="boolean"] .stateValue{font-size:16px;font-weight:600}.card[data-value-type="boolean"] .valueIcon{border-radius:50%;color:var(--secondary-text-color,#637487);background:color-mix(in srgb,var(--secondary-text-color,#637487) 10%,transparent)}.card[data-tone="active"] .valueIcon{color:var(--primary-color,#008fac);background:color-mix(in srgb,var(--primary-color,#008fac) 15%,transparent)}.card[data-tone="active"] .stateValue{color:var(--primary-color,#008fac)}.card[data-tone="alert"] .valueIcon{color:var(--error-color,#be3131);background:color-mix(in srgb,var(--error-color,#be3131) 12%,transparent)}.card[data-tone="alert"] .stateValue{color:var(--error-color,#be3131)}.card:not([data-state-kind="value"]) .stateValue{font-size:14px;font-weight:400;color:var(--secondary-text-color,#637487)}.card:not([data-state-kind="value"]) .valueIcon{color:var(--secondary-text-color,#637487);background:color-mix(in srgb,var(--secondary-text-color,#637487) 8%,transparent)}.card[data-state-kind="empty"] .stateValue{font-style:italic}.retainedValue{display:inline-block;font-size:10px;line-height:1.4;margin-top:5px;padding:2px 6px;border-radius:4px;color:var(--primary-text-color,#243346);background:color-mix(in srgb,var(--warning-color,#e0a000) 18%,var(--card-background-color,#fff))}.cardBottom{margin-top:8px;padding-top:0;border-top:0;gap:8px}.cardBottom .meta{font-size:11px}.cardBottom .actions button{padding:5px 10px;min-height:32px;font-size:12px}.grid.list .card{padding:10px 14px;gap:16px;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) minmax(150px,.55fr)}.grid.list .entityState{margin:0;min-height:40px;gap:10px}.grid.list .stateValue{font-size:21px}.grid.list .card[data-value-type="text"] .stateValue,.grid.list .card[data-value-type="datetime"] .stateValue{font-size:14px}.grid.list .card[data-value-type="boolean"] .stateValue{font-size:15px}.grid.list .card:not([data-state-kind="value"]) .stateValue{font-size:14px}.grid.list .valueIcon{width:32px;height:32px;flex-basis:32px}.grid.list .valueIcon svg{width:20px;height:20px}
@media(max-width:650px){.grid{grid-template-columns:1fr}.card{padding:12px}.grid.list .card{grid-template-columns:minmax(0,1fr);gap:10px;padding:12px}.grid.list .entityState{align-items:center}.cardBottom .actions button{min-height:44px;padding:8px 12px}.cardBottom .meta{font-size:11px}}
.card{--value-accent:var(--accent)}.card[data-value-type="text"]{--value-accent:var(--accent-text)}.card[data-value-type="datetime"]{--value-accent:var(--accent-datetime)}.card[data-value-type="boolean"]{--value-accent:var(--secondary-text-color,#637487)}.card[data-tone="active"]{--value-accent:var(--primary-color,#008fac)}.card[data-tone="alert"]{--value-accent:var(--error-color,#be3131)}.card:not([data-state-kind="value"]){--value-accent:var(--secondary-text-color,#637487)}.entityState{margin-top:8px;padding:6px 10px;gap:10px;border:1px solid color-mix(in srgb,var(--value-accent) 24%,transparent);border-radius:10px;background:color-mix(in srgb,var(--value-accent) 9%,var(--card-background-color,#fff));max-width:100%}.card .entityState .valueIcon{width:30px;height:30px;flex-basis:30px;background:transparent;color:var(--value-accent)}.grid.list .entityState{width:fit-content;max-width:100%;padding:6px 10px}.card[data-tone="alert"] .stateValue{color:color-mix(in srgb,var(--error-color,#be3131) 70%,var(--primary-text-color,#243346))}
.customizations{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px;min-width:0;order:2}.customizationBadge{padding:3px 7px;border-radius:5px;background:color-mix(in srgb,var(--secondary-text-color,#637487) 8%,transparent);border:1px solid var(--divider-color,#dce2ea);color:var(--secondary-text-color,#637487);font-size:11px;line-height:1.4;max-width:100%;overflow-wrap:anywhere}.cardBottom{order:3}.grid.list .cardBottom{order:0}.grid.list .customizations{grid-column:1/-1;order:1;margin-top:-4px}.grid.list .card:has(.customizations){row-gap:10px}
@media(max-width:650px){.grid.list .customizations{margin-top:0}.grid.list .cardBottom{order:2}}
`;
class OpcuaNodePanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._filter = "all";
    this._query = "";
    this._selected = "";
    this._generation = 0;
    this._viewMode = "grid";
    // Category grouping is the long-standing default; array-element
    // grouping is an explicit opt-in the user can switch to, mirroring the
    // grid/list preference below rather than silently replacing it.
    this._groupMode = "category";
    this._subscriptionPending = new Set();
    this._subscriptionErrors = new Set();
    try {
      const stored = localStorage.getItem("ha-opcua-view-mode");
      if (stored === "grid" || stored === "list") this._viewMode = stored;
      const storedGroup = localStorage.getItem("ha-opcua-group-mode");
      if (storedGroup === "category" || storedGroup === "array")
        this._groupMode = storedGroup;
    } catch {
      /* private browsing / blocked storage: keep the default */
    }
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
          class: "badge version integrationVersion",
        }),
      );
    }
    titleRow.append(
      element("span", `${this._t("panelVersion")} ${PANEL_VERSION}`, {
        class: "badge version panelVersion",
      }),
    );
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
    const endpointPanel = element("section", undefined, {
      class: "endpointPanel",
    });
    endpointPanel.append(toolbar);
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
    const identity = element("div", undefined, { class: "endpointIdentity" });
    identity.append(
      status,
      element("span", endpoint.endpoint || endpoint.title, {
        class: "endpointAddress",
      }),
    );
    const endpointActions = element("div", undefined, {
      class: "endpointActions",
    });
    meta.append(identity, endpointActions);
    const add = this._button("add", () => this._add(), "primary");
    add.disabled = !endpoint.loaded;
    const rediscover = this._button("rediscover", async () => {
      rediscover.disabled = true;
      rediscover.textContent = this._t("rediscovering");
      try {
        await this._hass.callWS({
          type: "ha_opcua/endpoint/rediscover",
          entry_id: endpoint.entry_id,
        });
        this._notice = this._t("rediscovered");
      } catch (err) {
        this._error = this._t(err.code in TEXT.en ? err.code : "error");
      }
      await this._load();
    });
    rediscover.disabled = !endpoint.loaded;
    endpointActions.append(add, rediscover);
    const subscriptionControl = element("div", undefined, {
      class: "endpointSubscription",
    });
    const subscriptionLabel = element("label", undefined, { class: "toggle" });
    const subscriptionToggle = element("input", undefined, {
      type: "checkbox",
      role: "switch",
      "aria-label": this._t("endpointSubscription"),
      "aria-describedby": "subscription-help subscription-status",
      "data-subscription-toggle": "",
    });
    subscriptionToggle.addEventListener("change", () =>
      this._setEndpointSubscription(endpoint, subscriptionToggle.checked),
    );
    subscriptionLabel.append(
      subscriptionToggle,
      element("span", this._t("endpointSubscription")),
    );
    subscriptionControl.append(
      subscriptionLabel,
      element("p", this._t("endpointSubscriptionHelp"), {
        class: "hint",
        id: "subscription-help",
      }),
      element("p", "", {
        class: "hint",
        id: "subscription-status",
        role: "status",
      }),
      element("p", "", {
        class: "error",
        "data-subscription-error": "",
        role: "alert",
      }),
    );
    meta.append(subscriptionControl);
    // A root change or a PLC provider switch can orphan dozens of entities
    // at once; offer one cleanup for all of them next to the rediscover.
    const orphans = endpoint.rows.filter((r) => r.orphan);
    if (orphans.length) {
      const deleteAll = this._button(
        "deleteAll",
        () => this._removeAllOrphans(orphans.length),
        "danger",
      );
      deleteAll.textContent = `${this._t("deleteAll")} (${orphans.length})`;
      endpointActions.append(deleteAll);
    }
    // Read-only Boolean nodes discovered before binary_sensor became their
    // default stay on Auto -> sensor forever unless opted in explicitly here.
    if (endpoint.reclassifiable_booleans) {
      const candidates = endpoint.rows.filter((row) => row.reclassifiable);
      const reclassify = this._button("reclassifyBooleans", () =>
        this._reclassifyBooleans(candidates),
      );
      reclassify.textContent = `${this._t("reclassifyBooleans")} (${candidates.length})`;
      endpointActions.append(reclassify);
    }
    // A field inside a PLC array-of-struct element discovered before this
    // disambiguation existed keeps its raw, colliding name forever unless
    // opted in explicitly here.
    if (endpoint.renamable_array_fields) {
      const renameCandidates = endpoint.rows.filter((row) => row.renamable);
      const rename = this._button("renameArrayFields", () =>
        this._renameArrayFields(renameCandidates),
      );
      rename.textContent = `${this._t("renameArrayFields")} (${renameCandidates.length})`;
      endpointActions.append(rename);
    }
    endpointPanel.append(meta);
    main.append(endpointPanel);
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
    const navRow = element("div", undefined, { class: "navRow" });
    navRow.append(nav);
    const viewToggle = element("div", undefined, {
      class: "viewToggle",
      role: "group",
      "aria-label": `${this._t("gridView")} / ${this._t("listView")}`,
    });
    for (const mode of ["grid", "list"]) {
      const icon = mode === "grid" ? "⊞" : "☰";
      const button = element("button", icon, {
        type: "button",
        class: this._viewMode === mode ? "selected" : "",
        "aria-label": this._t(mode === "grid" ? "gridView" : "listView"),
        title: this._t(mode === "grid" ? "gridView" : "listView"),
        "aria-pressed": String(this._viewMode === mode),
      });
      button.addEventListener("click", () => {
        if (this._viewMode === mode) return;
        this._viewMode = mode;
        try {
          localStorage.setItem("ha-opcua-view-mode", mode);
        } catch {
          /* private browsing / blocked storage: not persisted this time */
        }
        this._render();
      });
      viewToggle.append(button);
    }
    navRow.append(viewToggle);
    // Only worth offering when this endpoint actually has array-of-struct
    // fields to group - otherwise it is a control with no visible effect.
    if (endpoint.rows.some((r) => r.array_group)) {
      const groupToggle = element("div", undefined, {
        class: "viewToggle",
        role: "group",
        "aria-label": this._t("groupModeLabel"),
      });
      for (const mode of ["category", "array"]) {
        const button = this._button(
          mode === "category" ? "groupByCategory" : "groupByArray",
          () => {
            if (this._groupMode === mode) return;
            this._groupMode = mode;
            try {
              localStorage.setItem("ha-opcua-group-mode", mode);
            } catch {
              /* private browsing / blocked storage: not persisted this time */
            }
            this._renderRows();
          },
          this._groupMode === mode ? "selected" : "",
        );
        button.setAttribute("aria-pressed", String(this._groupMode === mode));
        groupToggle.append(button);
      }
      navRow.append(groupToggle);
    }
    main.append(navRow);
    this._rows = element("section");
    main.append(this._rows);
    this._renderRows();
    main.append(element("p", this._t("info"), { class: "hint" }));
    this._paintStates();
  }
  _customizations(row) {
    // Orphans may share settings with a replacement entity; do not attribute
    // that replacement's configuration to the obsolete entity.
    if (row.orphan) return null;
    const settings = row.settings || {};
    const badges = element("div", undefined, {
      class: "customizations",
      role: "list",
      "aria-label": this._t("customizations"),
    });
    const add = (key, text, help = text) =>
      badges.append(
        element("span", text, {
          class: "customizationBadge",
          role: "listitem",
          "data-setting": key,
          title: help,
        }),
      );
    const number = (n) =>
      new Intl.NumberFormat(this._hass?.language || "en", {
        maximumSignificantDigits: 17,
      }).format(n);
    const floating = ["Float", "Double"].includes(row.variant_type);
    if (row.invert_state) add("invert_state", this._t("invertedBadge"));
    if (row.platform === "binary_sensor" && row.device_class) {
      const name =
        this._hass.localize?.(
          `component.binary_sensor.entity_component.${row.device_class}.name`,
        ) || row.device_class;
      add("device_class", `${this._t("classBadge")}: ${name}`);
    }
    if (floating && settings.precision != null)
      add(
        "precision",
        `${this._t("precision")}: ${settings.precision}`,
        this._t("precisionHelp"),
      );
    if (settings.always_available === true)
      add(
        "always_available",
        this._t("alwaysAvailable"),
        this._t("alwaysAvailableHelp"),
      );
    if (settings.update_mode === "subscription") {
      add(
        "update_mode",
        this._t("subscriptionBadge"),
        this._t("updateModeHelp"),
      );
      const deadband = settings.deadband;
      if (
        ["sensor", "number"].includes(row.platform) &&
        NUMERIC.has(row.variant_type) &&
        Number.isFinite(deadband) &&
        deadband !== (floating ? 0.01 : 1)
      ) {
        add(
          "deadband",
          `${this._t("deadband")}: ${number(deadband)}`,
          this._t("deadbandHelp"),
        );
      }
    }
    if (row.platform === "number") {
      const min = settings.min ?? 0;
      const max = settings.max ?? 100;
      if (min !== 0 || max !== 100)
        add(
          "range",
          `${this._t("rangeBadge")}: ${number(min)} – ${number(max)}`,
        );
      const step = settings.step;
      if (Number.isFinite(step) && step !== (floating ? 0.1 : 1))
        add("step", `${this._t("step")}: ${number(step)}`);
    }
    if (row.platform === "text") {
      const min = settings.min_length ?? 0;
      const max = settings.max_length ?? 255;
      if (min !== 0 || max !== 255)
        add("length", `${this._t("lengthBadge")}: ${min} – ${max}`);
    }
    if (row.key && row.node_id && row.node_id !== row.key)
      add("node_id", this._t("remappedBadge"), `${row.key} → ${row.node_id}`);
    return badges.childElementCount ? badges : null;
  }
  _buildCard(row) {
    const type = valueType(row);
    const card = element("article", undefined, {
      class: row.orphan ? "card orphan" : "card",
      "data-platform": row.platform,
      "data-value-type": type,
    });
    const top = element("div", undefined, { class: "cardTop" });
    const text = element("div", undefined, { class: "cardTitle" });
    text.append(
      element("h3", row.name || row.node_id),
      element("div", row.node_id, { class: "address" }),
    );
    top.append(text);
    // An orphan row may have no cached type (node gone, never "always available").
    if (row.variant_type)
      top.append(element("span", row.variant_type, { class: "badge" }));
    if (row.orphan)
      top.append(element("span", this._t("orphan"), { class: "orphanTag" }));
    if (row.manual)
      top.append(element("span", this._t("manual"), { class: "manualTag" }));
    const bottom = element("div", undefined, { class: "cardBottom" });
    const area =
      this._data.areas.find((a) => a.id === row.area_id)?.name ||
      this._t("inherit");
    bottom.append(element("span", area, { class: "meta" }));
    const actions = element("div", undefined, { class: "actions" });
    if (row.orphan) {
      // Nothing left to edit: the only sensible action is cleanup.
      actions.append(
        this._button("deleteEntity", () => this._removeOrphan(row), "danger"),
      );
    } else {
      const edit = this._button("edit", () => this._edit(row));
      edit.disabled = !row.editable;
      if (!row.editable) edit.title = this._t("notReady");
      actions.append(edit);
      if (row.manual)
        actions.append(
          this._button("remove", () => this._remove(row), "danger"),
        );
    }
    bottom.append(actions);
    const state = element("div", undefined, { class: "entityState" });
    const icon = element("span", undefined, {
      class: "valueIcon",
      "aria-hidden": "true",
    });
    const content = element("div", undefined, { class: "stateContent" });
    const labelKey = {
      numeric: "valueLabel",
      text: "textLabel",
      datetime: "dateLabel",
      boolean: "state",
    }[type];
    content.append(
      element("span", this._t(labelKey), { class: "stateLabel" }),
      element("span", "", {
        class: "stateValue",
        "data-entity-state": row.entity_id || "",
        "data-platform": row.platform,
      }),
    );
    const retained = element("span", this._t("retainedValue"), {
      class: "retainedValue",
      title: this._t("retainedHelp"),
      hidden: "",
    });
    content.append(retained);
    state.append(icon, content);
    card.append(top, state, bottom);
    const customizations = this._customizations(row);
    if (customizations) card.append(customizations);
    return card;
  }
  _renderArrayGroups(rows) {
    // Every field of one PLC array-of-struct element (e.g.
    // "astMeldungen[10]") shares a group key - shown together under one
    // heading instead of scattered across the sensor/binary_sensor/...
    // sections above, regardless of how many fields the struct has or
    // how large the array is.
    const byGroup = new Map();
    for (const row of rows) {
      if (!byGroup.has(row.array_group)) byGroup.set(row.array_group, []);
      byGroup.get(row.array_group).push(row);
    }
    const groups = [...byGroup.values()].sort((a, b) =>
      a[0].array_label.localeCompare(b[0].array_label, undefined, {
        numeric: true,
      }),
    );
    const details = element("details", undefined, {
      class: "group",
      open: "",
      "data-platform": "grouped",
    });
    details.append(
      element("summary", `${this._t("groupedArrays")} · ${groups.length}`),
    );
    const container = element("div", undefined, { class: "arrayGroups" });
    for (const fields of groups) {
      fields.sort((a, b) => (a.array_field > b.array_field ? 1 : -1));
      const section = element("div", undefined, { class: "arrayGroup" });
      section.append(
        element("h3", fields[0].array_label, { class: "arrayGroupTitle" }),
      );
      const grid = element("div", undefined, {
        class: this._viewMode === "list" ? "grid list" : "grid",
      });
      for (const row of fields) grid.append(this._buildCard(row));
      section.append(grid);
      container.append(section);
    }
    details.append(container);
    this._rows.append(details);
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
    // Grouping by array only makes sense browsing everything at once - a
    // platform filter or an active search wants its own flat, precise list -
    // and only when the user has explicitly opted into it over the default
    // category grouping.
    const grouping =
      this._filter === "all" && !query && this._groupMode === "array";
    const groupedRows = grouping ? rows.filter((r) => r.array_group) : [];
    const ungroupedRows = grouping ? rows.filter((r) => !r.array_group) : rows;
    for (const group of GROUPS) {
      const items = ungroupedRows.filter((r) => r.platform === group);
      if (!items.length) continue;
      const details = element("details", undefined, {
        class: "group",
        open: "",
        "data-platform": group,
      });
      details.append(element("summary", `${this._t(group)} · ${items.length}`));
      const grid = element("div", undefined, {
        class: this._viewMode === "list" ? "grid list" : "grid",
      });
      for (const row of items) grid.append(this._buildCard(row));
      details.append(grid);
      this._rows.append(details);
    }
    if (groupedRows.length) this._renderArrayGroups(groupedRows);
    this._paintStates();
  }
  async _setEndpointSubscription(endpoint, enabled) {
    const key = endpoint.entry_id;
    const state = this._hass.states?.[endpoint.subscription_entity]?.state;
    if (
      !endpoint.loaded ||
      !["on", "off"].includes(state) ||
      this._subscriptionPending.has(key)
    ) {
      this._paintStates();
      return;
    }
    this._subscriptionPending.add(key);
    this._subscriptionErrors.delete(key);
    this._paintStates();
    try {
      await this._hass.callService("switch", enabled ? "turn_on" : "turn_off", {
        entity_id: endpoint.subscription_entity,
      });
    } catch {
      this._subscriptionErrors.add(key);
    } finally {
      this._subscriptionPending.delete(key);
      if (this.isConnected) this._paintStates();
    }
  }
  _paintSubscription() {
    const control = this.shadowRoot.querySelector("[data-subscription-toggle]");
    const endpoint = this._endpoint();
    if (!control || !endpoint) return;
    const state = this._hass.states?.[endpoint.subscription_entity]?.state;
    const pending = this._subscriptionPending.has(endpoint.entry_id);
    const available = endpoint.loaded && ["on", "off"].includes(state);
    // Reflect the switch entity, including changes from automations. An offline
    // PLC does not make this local configuration switch unavailable.
    control.checked = state === "on";
    control.disabled = pending || !available;
    control.setAttribute("aria-busy", String(pending));
    const status = this.shadowRoot.querySelector("#subscription-status");
    status.textContent = pending
      ? this._t("subscriptionSaving")
      : available
        ? ""
        : this._t("subscriptionUnavailable");
    status.hidden = !status.textContent;
    const error = this.shadowRoot.querySelector("[data-subscription-error]");
    error.textContent = this._subscriptionErrors.has(endpoint.entry_id)
      ? this._t("subscriptionFailed")
      : "";
    error.hidden = !error.textContent;
  }
  _paintStates() {
    this._paintSubscription();
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
        kind = "empty";
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
      const card = value.closest(".card");
      const type = card.dataset.valueType;
      let visual = kind === "value" ? type : kind;
      let tone = "neutral";
      if (kind === "value" && type === "boolean") {
        const raw = entity.state.toLowerCase();
        if (["on", "true"].includes(raw)) {
          visual = "on";
          tone = [
            "problem",
            "safety",
            "smoke",
            "gas",
            "carbon_monoxide",
            "moisture",
            "tamper",
          ].includes(entity.attributes?.device_class)
            ? "alert"
            : "active";
          if (tone === "alert") visual = "alert";
        } else if (["off", "false"].includes(raw)) visual = "off";
      }
      card.dataset.stateKind = kind;
      card.dataset.tone = tone;
      const icon = card.querySelector(".valueIcon");
      if (icon.dataset.icon !== visual) {
        icon.replaceChildren(valueIcon(visual));
        icon.dataset.icon = visual;
      }
      card.querySelector(".retainedValue").hidden = !(
        ["value", "empty"].includes(kind) &&
        entity?.attributes?.value_stale === true
      );
    }
    for (const badge of this.shadowRoot.querySelectorAll("[data-connection]")) {
      const state = states[badge.dataset.connection];
      if (!state) continue;
      const online = state.state === "on";
      badge.textContent = this._t(online ? "connected" : "disconnected");
      badge.classList.toggle("online", online);
    }
  }
  _removeAllOrphans(count) {
    const endpoint = this._endpoint();
    const dialog = element("dialog");
    this._dialog = dialog;
    const form = element("form");
    dialog.append(form);
    const error = element("div", "", { class: "error", role: "alert" });
    const cancel = this._button("cancel", () => dialog.close());
    const remove = element("button", `${this._t("deleteAll")} (${count})`, {
      type: "submit",
      class: "danger",
    });
    const footer = element("footer");
    footer.append(cancel, remove);
    form.append(
      element("h2", this._t("deleteAllTitle")),
      element("p", this._t("deleteAllHelp")),
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
      remove.textContent = this._t("deleting");
      error.textContent = "";
      try {
        await this._hass.callWS({
          type: "ha_opcua/entity/remove_orphans",
          entry_id: endpoint.entry_id,
          revision: endpoint.revision,
        });
        this._notice = this._t("deletedAll");
        dialog.close();
        await this._load();
      } catch (err) {
        error.textContent = this._t(err.code in TEXT.en ? err.code : "error");
        busy = false;
        remove.disabled = cancel.disabled = false;
        remove.textContent = `${this._t("deleteAll")} (${count})`;
      }
    });
    this.shadowRoot.append(dialog);
    dialog.showModal();
  }
  _renameArrayFields(candidates) {
    const endpoint = this._endpoint();
    const dialog = element("dialog");
    this._dialog = dialog;
    const form = element("form");
    dialog.append(form);
    const error = element("div", "", { class: "error", role: "alert" });
    const cancel = this._button("cancel", () => dialog.close());
    const confirm = element("button", `${this._t("renameConfirm")} (0)`, {
      type: "submit",
      class: "primary",
    });
    confirm.disabled = true;
    const footer = element("footer");
    footer.append(cancel, confirm);
    const selectAllLabel = element("label", undefined, { class: "toggle" });
    const selectAll = element("input", undefined, { type: "checkbox" });
    selectAllLabel.append(
      selectAll,
      element("span", this._t("reclassifySelectAll")),
    );
    const list = element("div", undefined, {
      class: "pickList",
      role: "group",
    });
    const checkboxes = [];
    const updateConfirm = () => {
      const selected = checkboxes.filter((box) => box.checked).length;
      confirm.disabled = selected === 0;
      confirm.textContent = `${this._t("renameConfirm")} (${selected})`;
      selectAll.checked = selected > 0 && selected === checkboxes.length;
      selectAll.indeterminate = selected > 0 && selected < checkboxes.length;
    };
    for (const candidate of candidates) {
      const item = element("label", undefined, { class: "pickItem" });
      const checkbox = element("input", undefined, { type: "checkbox" });
      checkbox.value = candidate.key;
      checkbox.addEventListener("change", updateConfirm);
      checkboxes.push(checkbox);
      const info = element("div", undefined, { class: "pickInfo" });
      info.append(
        element("span", candidate.name, { class: "pickName" }),
        element("span", candidate.node_id, { class: "pickNodeId" }),
      );
      item.append(
        checkbox,
        info,
        element("span", `→ ${candidate.proposed_name}`, {
          class: "pickArrow",
        }),
      );
      list.append(item);
    }
    selectAll.addEventListener("change", () => {
      for (const checkbox of checkboxes) checkbox.checked = selectAll.checked;
      updateConfirm();
    });
    form.append(
      element("h2", this._t("renameArrayFieldsTitle")),
      element("p", this._t("renameArrayFieldsHelp")),
      selectAllLabel,
      list,
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
      const keys = checkboxes
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.value);
      if (!keys.length) return;
      busy = true;
      confirm.disabled = cancel.disabled = selectAll.disabled = true;
      for (const checkbox of checkboxes) checkbox.disabled = true;
      confirm.textContent = this._t("renaming");
      error.textContent = "";
      try {
        await this._hass.callWS({
          type: "ha_opcua/entity/rename_array_fields",
          entry_id: endpoint.entry_id,
          revision: endpoint.revision,
          keys,
        });
        this._notice = this._t("renamed");
        dialog.close();
        await this._load();
      } catch (err) {
        error.textContent = this._t(err.code in TEXT.en ? err.code : "error");
        busy = false;
        cancel.disabled = selectAll.disabled = false;
        for (const checkbox of checkboxes) checkbox.disabled = false;
        updateConfirm();
      }
    });
    this.shadowRoot.append(dialog);
    dialog.showModal();
  }
  _reclassifyBooleanState(entityId) {
    const entity = this._hass.states?.[entityId];
    if (!entity || ["unavailable", "unknown", ""].includes(entity.state))
      return this._t("stateUnavailable");
    const raw = entity.state.toLowerCase();
    if (["on", "true"].includes(raw)) return this._t("stateOn");
    if (["off", "false"].includes(raw)) return this._t("stateOff");
    return entity.state;
  }
  _reclassifyBooleans(candidates) {
    const endpoint = this._endpoint();
    const dialog = element("dialog");
    this._dialog = dialog;
    const form = element("form");
    dialog.append(form);
    const error = element("div", "", { class: "error", role: "alert" });
    const cancel = this._button("cancel", () => dialog.close());
    const confirm = element("button", `${this._t("reclassifyConvert")} (0)`, {
      type: "submit",
      class: "primary",
    });
    confirm.disabled = true;
    const footer = element("footer");
    footer.append(cancel, confirm);
    const selectAllLabel = element("label", undefined, { class: "toggle" });
    const selectAll = element("input", undefined, { type: "checkbox" });
    selectAllLabel.append(
      selectAll,
      element("span", this._t("reclassifySelectAll")),
    );
    const list = element("div", undefined, {
      class: "pickList",
      role: "group",
    });
    const checkboxes = [];
    const updateConfirm = () => {
      const selected = checkboxes.filter((box) => box.checked).length;
      confirm.disabled = selected === 0;
      confirm.textContent = `${this._t("reclassifyConvert")} (${selected})`;
      selectAll.checked = selected > 0 && selected === checkboxes.length;
      selectAll.indeterminate = selected > 0 && selected < checkboxes.length;
    };
    for (const candidate of candidates) {
      const item = element("label", undefined, { class: "pickItem" });
      const checkbox = element("input", undefined, { type: "checkbox" });
      checkbox.value = candidate.key;
      checkbox.addEventListener("change", updateConfirm);
      checkboxes.push(checkbox);
      const info = element("div", undefined, { class: "pickInfo" });
      info.append(
        element("span", candidate.name, { class: "pickName" }),
        element("span", candidate.node_id, { class: "pickNodeId" }),
      );
      item.append(
        checkbox,
        info,
        element("span", this._reclassifyBooleanState(candidate.entity_id), {
          class: "pickState",
        }),
      );
      list.append(item);
    }
    selectAll.addEventListener("change", () => {
      for (const checkbox of checkboxes) checkbox.checked = selectAll.checked;
      updateConfirm();
    });
    form.append(
      element("h2", this._t("reclassifyBooleansTitle")),
      element("p", this._t("reclassifyBooleansHelp")),
      selectAllLabel,
      list,
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
      const keys = checkboxes
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.value);
      if (!keys.length) return;
      busy = true;
      confirm.disabled = cancel.disabled = selectAll.disabled = true;
      for (const checkbox of checkboxes) checkbox.disabled = true;
      confirm.textContent = this._t("reclassifying");
      error.textContent = "";
      try {
        await this._hass.callWS({
          type: "ha_opcua/entity/reclassify_boolean_sensors",
          entry_id: endpoint.entry_id,
          revision: endpoint.revision,
          keys,
        });
        this._notice = this._t("reclassified");
        dialog.close();
        await this._load();
      } catch (err) {
        error.textContent = this._t(err.code in TEXT.en ? err.code : "error");
        busy = false;
        cancel.disabled = selectAll.disabled = false;
        for (const checkbox of checkboxes) checkbox.disabled = false;
        updateConfirm();
      }
    });
    this.shadowRoot.append(dialog);
    dialog.showModal();
  }
  _removeOrphan(row) {
    const endpoint = this._endpoint();
    const dialog = element("dialog");
    this._dialog = dialog;
    const form = element("form");
    dialog.append(form);
    const error = element("div", "", { class: "error", role: "alert" });
    const cancel = this._button("cancel", () => dialog.close());
    const remove = element("button", this._t("deleteEntity"), {
      type: "submit",
      class: "danger",
    });
    const footer = element("footer");
    footer.append(cancel, remove);
    form.append(
      element("h2", this._t("deleteTitle")),
      element("strong", row.name || row.node_id),
      element("div", row.entity_id, { class: "address" }),
      element("div", row.node_id, { class: "address" }),
      element("p", this._t("deleteHelp")),
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
      remove.textContent = this._t("deleting");
      error.textContent = "";
      try {
        await this._hass.callWS({
          type: "ha_opcua/entity/remove_orphan",
          entry_id: endpoint.entry_id,
          revision: endpoint.revision,
          entity_id: row.entity_id,
        });
        this._notice = this._t("deleted");
        dialog.close();
        await this._load();
      } catch (err) {
        error.textContent = this._t(err.code in TEXT.en ? err.code : "error");
        busy = false;
        remove.disabled = cancel.disabled = false;
        remove.textContent = this._t("deleteEntity");
      }
    });
    this.shadowRoot.append(dialog);
    dialog.showModal();
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
    const form = element("form", undefined, { class: "entityForm" });
    const body = element("div", undefined, { class: "editorBody" });
    form.append(body);
    dialog.append(form);
    body.append(
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
    body.append(
      this._field("name", name),
      element("p", this._t("nameHelp"), { class: "hint" }),
    );
    const area = element("select", undefined, { name: "area" });
    area.append(element("option", this._t("inherit"), { value: "" }));
    for (const item of this._data.areas)
      area.append(element("option", item.name, { value: item.id }));
    area.value = row.area_id || "";
    body.append(this._field("area", area));
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
    body.append(this._field("category", category));
    const categoryHelp = element("p", "", { class: "hint" });
    body.append(categoryHelp);
    nodeFilter.addEventListener("input", populate);
    if (!manual) body.append(this._field("filterNodes", nodeFilter));
    nodes.disabled = !!manual;
    body.append(this._field("node", nodes));
    if (!manual)
      body.append(element("p", this._t("nodeHelp"), { class: "hint" }));
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
    const updateMode = element("select", undefined, { name: "update_mode" });
    for (const mode of ["polling", "subscription"])
      updateMode.append(element("option", this._t(mode), { value: mode }));
    updateMode.value = initial.update_mode || "polling";
    body.append(
      this._field("updateMode", updateMode),
      element("p", this._t("updateModeHelp"), { class: "hint" }),
    );
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
    body.append(
      availabilityToggle,
      element("p", this._t("alwaysAvailableHelp"), { class: "hint" }),
    );
    const defaults = {
      min: 0,
      max: 100,
      step: ["Float", "Double"].includes(selectedNode()?.variant_type)
        ? 0.1
        : 1,
      deadband: ["Float", "Double"].includes(selectedNode()?.variant_type)
        ? 0.01
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
      body.append(group);
    }
    const limitsHelp = element("p", this._t("limitsHelp"), { class: "hint" });
    body.append(limitsHelp);
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
    body.append(precisionField, precisionHelp);
    const deadband = element("input", undefined, {
      type: "number",
      name: "deadband",
      min: "0",
      step: "any",
    });
    deadband.value = initial.deadband ?? defaults.deadband;
    const deadbandField = this._field("deadband", deadband);
    const deadbandHelp = element("p", this._t("deadbandHelp"), {
      class: "hint",
    });
    body.append(deadbandField, deadbandHelp);
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
    body.append(classField);
    const invert = element("input", undefined, {
      type: "checkbox",
      name: "invert",
    });
    invert.checked = row.invert_state;
    const toggle = element("label", undefined, { class: "toggle" });
    toggle.append(invert, element("span", this._t("invert")));
    const invertHelp = element("p", this._t("invertHelp"), { class: "hint" });
    body.append(toggle, invertHelp);
    const updateFields = () => {
      const platform = effective();
      classField.hidden = platform !== "binary_sensor";
      precisionField.hidden = precisionHelp.hidden = ![
        "Float",
        "Double",
      ].includes(selectedNode()?.variant_type);
      precision.disabled = precisionField.hidden;
      // Any numeric node shown as number or sensor: a read-only float has
      // exactly the same push-noise problem as a writable one.
      deadbandField.hidden = deadbandHelp.hidden = !(
        updateMode.value === "subscription" &&
        ["number", "sensor"].includes(platform) &&
        NUMERIC.has(selectedNode()?.variant_type)
      );
      deadband.disabled = deadbandField.hidden;
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
    updateMode.addEventListener("change", updateFields);
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
    const footer = element("footer");
    const cancel = this._button("cancel", () => dialog.close());
    const save = element("button", this._t("save"), {
      type: "submit",
      class: "primary",
    });
    footer.append(error, cancel, save);
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
          update_mode: updateMode.value,
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
          ...(!deadband.disabled
            ? {
                deadband: deadband.value === "" ? null : Number(deadband.value),
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
