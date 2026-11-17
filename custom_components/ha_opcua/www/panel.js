/* Native Home Assistant configuration panel. No external scripts or styles. */
// Bump for every frontend change; displayed from the loaded JavaScript bundle.
const PANEL_VERSION = "1.17.1";
// Build shown next to the version: date and running number of that day
// (YYYYMMDD.N). Bump with every change to this file.
const PANEL_BUILD = "20261117.6";
// The build this code was loaded as: the hash Home Assistant put into the
// module URL. Taken from the newest load of this file, so a tab that already
// ran an older panel still reports the build it actually executes.
const LOADED_BUILD = (() => {
  try {
    const loads = performance
      .getEntriesByType("resource")
      .filter((entry) => entry.name.includes("/ha-opcua-panel/panel.js"));
    return loads.length
      ? new URL(loads.at(-1).name).searchParams.get("panel")
      : null;
  } catch {
    return null;
  }
})();
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
    areaBadge: "Area",
    valueLabel: "Valore",
    textLabel: "Testo",
    dateLabel: "Data e ora",
    retainedValue: "Ultimo valore",
    retainedHelp: "Valore conservato: in attesa di una nuova lettura dal PLC.",
    alwaysAvailable: "Sempre disponibile",
    alwaysAvailableHelp:
      "Mantiene l’ultimo valore noto quando il PLC è scollegato o la connessione è disabilitata. Senza un valore salvato lo stato è sconosciuto. Le scritture richiedono la connessione e una lettura aggiornata.",
    invalid_availability: "Impostazione di disponibilità non valida.",
    endpointNamePath: "Percorso PLC nei nomi",
    endpointNamePathHelp:
      "Le nuove entità prendono il percorso completo nel nome (es. “SP.xError”). Per quelle esistenti usa «Rinomina campi duplicati».",
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
    conversion: "Conversione numerica",
    conversionNone: "Nessuna (valore PLC)",
    multiplier: "Moltiplicatore",
    linear_scale: "Scala lineare",
    factor: "Fattore",
    plc_min: "Valore PLC iniziale",
    plc_max: "Valore PLC finale",
    ha_min: "Valore HA iniziale",
    ha_max: "Valore HA finale",
    conversionHelp:
      "La conversione si applica in lettura e, al contrario, in scrittura. Limiti e passo sono in unità HA; il deadband resta in unità PLC. Le scritture su interi arrotondano al più vicino (a parità, al pari). La scala non limita i valori agli estremi.",
    invalid_conversion:
      "Inserisci valori finiti: fattore diverso da zero ed estremi distinti per ogni scala.",
    precision: "Decimali",
    precisionHelp:
      "REAL/LREAL e valori convertiti: da 0 a 10 decimali. Lascia vuoto per non arrotondare. Si applica al valore in Home Assistant, inclusi storico e automazioni; non modifica le scritture al PLC.",
    invalid_precision:
      "Inserisci un numero intero da 0 a 10 per un nodo REAL/LREAL.",
    invalid_deadband:
      "Usa un deadband finito maggiore o uguale a 0 (intero per i tipi interi).",
    deadband: "Deadband",
    deadbandHelp:
      "Solo Auto-Subscription: sopprime un aggiornamento push più piccolo di questa variazione assoluta (es. 0,01 nasconde il rumore in virgola mobile oltre la 2ª cifra decimale). 0 disattiva il filtro. Il polling non è interessato e legge sempre il valore esatto.",
    unit: "Unità di misura",
    unitHelp:
      "Scegli un'unità standard di Home Assistant, «Nessuna» oppure «Personalizzata…» per digitarne una (es. pieces/min), mostrata accanto al valore.",
    filterUnits: "Cerca unità…",
    moreInfo: "Dettagli",
    noMatches: "Nessun risultato",
    availabilityShort: "Mantieni l’ultimo valore quando il PLC è offline.",
    invertShort: "Scambia acceso e spento in Home Assistant.",
    identitySection: "Identità",
    sourceSection: "Nodo OPC UA",
    valueSection: "Valore e visualizzazione",
    updatesSection: "Aggiornamento e disponibilità",
    unitCustom: "Personalizzata…",
    unitCustomLabel: "Unità personalizzata",
    unitBadge: "Unità",
    invalid_unit: "Inserisci un'unità di misura di massimo 50 caratteri.",
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
    groupModeLabel: "Raggruppamento",
    groupByCategory: "Per categoria",
    groupByArray: "Per elemento array",
    groupByPath: "Per gruppo (GVL / struct)",
    groupTipCategory: "Sezioni per tipo: sensori, interruttori, numeri…",
    groupTipArray: "Campi raggruppati per elemento array",
    groupTipPath: "Campi raggruppati per percorso PLC (GVL / struct)",
    renameFields: "Rinomina campi duplicati",
    renameFieldsTitle: "Disambigua i campi con nomi ripetuti",
    renameFieldsHelp:
      "Più campi del PLC condividono lo stesso nome: ogni campo di un elemento di array di struct (es. “Alarms[10].xActive”) si ripete in tutti gli elementi, e un campo come “xEnable” si ripete in più istanze di struct (es. “...Pompa_HK_Nord.xEnable” e “...Pompa_HK_Sud.xEnable”). Rinominare i campi selezionati qui sotto aggiunge al nome l'indice dell'array o la struct padre, così da poterli distinguere. Vengono modificati solo i nomi delle entità selezionate; un nome già personalizzato manualmente non viene mai sovrascritto.",
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
      "Cambiare categoria può cambiare l’ID dell’entità. Aggiorna automazioni e dashboard; l’entità della categoria precedente viene eliminata.",
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
    colName: "Nome",
    colNode: "NodeId",
    colType: "Tipo",
    colEntity: "Entità",
    colValue: "Valore",
    colSettings: "Impostazioni",
    colArea: "Area",
    sortHint: "Clic per ordinare: crescente, decrescente, ordine originale",
    addHelp:
      "Aggiunge a mano un nodo tramite NodeId, per variabili che la rilevazione automatica non trova (es. fuori dal nodo di partenza della ricerca).",
    rediscoverHelp:
      "Cerca di nuovo i nodi sul PLC senza interrompere la connessione. La rilevazione avviene già all'avvio e a ogni riconnessione; serve dopo una modifica al programma PLC.",
    groupToggle: "Mostra o nascondi gruppo",
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
    select: "Selezioni",
    button: "Pulsanti",
    valueLabels: "Tabella valori",
    valueLabelsHelp:
      "Assegna un testo a ogni valore intero. Home Assistant mostra il testo; un select scrive il valore del testo scelto. Un valore assente dalla tabella appare come sconosciuto.",
    valueLabelsSensorHelp:
      "Facoltativo: assegna un testo a ogni valore intero, così il sensore mostra il testo invece del numero. Vuota: il sensore mostra il numero.",
    rawValue: "Valore",
    labelText: "Testo",
    addValueLabel: "Aggiungi riga",
    removeValueLabel: "Rimuovi riga",
    valueLabelsBadge: "Testi",
    pulseMs: "Durata impulso (ms)",
    pulseHelp:
      "Una pressione imposta il bit, attende questa durata e lo azzera. Per logiche PLC che reagiscono al fronte. 50 – 10000 ms.",
    pulseBadge: "Impulso",
    value_labels_required:
      "Un select richiede almeno una riga nella tabella valori.",
    invalid_value_labels:
      "Ogni riga richiede un valore intero e un testo di massimo 64 caratteri.",
    duplicate_value_labels:
      "Valori e testi della tabella devono essere univoci.",
    value_labels_outside_type:
      "Un valore della tabella supera l'intervallo del tipo di dato.",
    value_labels_conversion:
      "Una tabella valori non può essere combinata con una conversione.",
    invalid_pulse: "Durata impulso: intero tra 50 e 10000 ms.",
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
    errorReason: "Causa:",
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
    info: "Clicca una riga per configurarne categoria e limiti. Le impostazioni di connessione restano nelle opzioni dell’integrazione.",
  },
  de: {
    version: "Integration",
    panelVersion: "Panel",
    customizations: "Gespeicherte Anpassungen",
    invertedBadge: "Zustand invertiert",
    classBadge: "Klasse",
    rangeBadge: "Grenzen",
    lengthBadge: "Zeichen",
    remappedBadge: "NodeId neu zugeordnet",
    subscriptionBadge: "Subscription konfiguriert",
    areaBadge: "Bereich",
    valueLabel: "Wert",
    textLabel: "Text",
    dateLabel: "Datum und Uhrzeit",
    retainedValue: "Letzter bekannter Wert",
    retainedHelp:
      "Gehaltener Wert: Es wird auf einen neuen Messwert der SPS gewartet.",
    alwaysAvailable: "Immer verfügbar",
    alwaysAvailableHelp:
      "Behält den letzten bekannten Wert, wenn die SPS getrennt oder die Verbindung deaktiviert ist. Ohne gespeicherten Wert ist der Zustand unbekannt. Schreiben erfordert eine Verbindung und einen frischen Messwert.",
    invalid_availability: "Ungültige Verfügbarkeitseinstellung.",
    endpointNamePath: "SPS-Pfad in Namen",
    endpointNamePathHelp:
      "Neue Entitäten werden mit ihrem vollen Pfad benannt (z. B. „SP.xError“). Für bestehende „Doppelte Felder umbenennen“ verwenden.",
    endpointSubscription: "Auto-Subscription",
    endpointSubscriptionHelp:
      "Subscriptions für die ausgewählten Entitäten dieses Endpoints aktivieren. Das Polling bleibt aktiv.",
    subscriptionUnavailable:
      "Schalter nicht verfügbar. Prüfen, ob die Integration und die Auto-Subscription-Entität aktiviert sind.",
    subscriptionFailed:
      "Auto-Subscription konnte nicht geändert werden. Bitte erneut versuchen.",
    subscriptionSaving: "Speichern…",
    updateMode: "Aktualisierung",
    polling: "Nur Polling",
    subscription: "Polling + Subscription",
    updateModeHelp:
      "Benachrichtigungen erfordern zusätzlich, dass der Auto-Subscription-Schalter des Endpoints an ist. Das Polling läuft in beiden Modi weiter. Ausschalten des Schalters behält diese Auswahl.",
    invalid_update_mode: "Ungültiger Aktualisierungsmodus.",
    conversion: "Numerische Umrechnung",
    conversionNone: "Keine (SPS-Wert)",
    multiplier: "Multiplikator",
    linear_scale: "Lineare Skalierung",
    factor: "Faktor",
    plc_min: "SPS-Startwert",
    plc_max: "SPS-Endwert",
    ha_min: "HA-Startwert",
    ha_max: "HA-Endwert",
    conversionHelp:
      "Gelesene Werte werden umgerechnet, geschriebene umgekehrt. Grenzen und Schrittweite in HA-Einheiten, Totband in SPS-Einheiten. Ganzzahlige Schreibvorgänge runden zum nächsten Wert (bei Gleichstand gerade). Die Skalierung begrenzt Werte nicht auf ihre Endpunkte.",
    invalid_conversion:
      "Endliche Werte eingeben: einen Faktor ungleich null und unterschiedliche Endpunkte je Skala.",
    precision: "Nachkommastellen",
    precisionHelp:
      "REAL/LREAL und umgerechnete Werte: 0 bis 10 Nachkommastellen. Leer lassen für keine Rundung. Gilt für den Home-Assistant-Wert inklusive Verlauf und Automationen; Schreibvorgänge zur SPS bleiben unverändert.",
    invalid_precision:
      "Eine ganze Zahl von 0 bis 10 für einen REAL/LREAL- oder umgerechneten Zahlenknoten eingeben.",
    invalid_deadband:
      "Ein endliches Totband von 0 oder mehr verwenden (ganzzahlig bei ganzzahligen Knotentypen).",
    deadband: "Totband",
    deadbandHelp:
      "Nur Auto-Subscription: Push-Updates mit kleinerer absoluter Änderung unterdrücken (z. B. 0,01 blendet Gleitkomma-Rauschen ab der 2. Nachkommastelle aus). 0 deaktiviert den Filter. Polling ist nicht betroffen und liest immer den genauen Wert.",
    unit: "Maßeinheit",
    unitHelp:
      "Eine Standard-Einheit von Home Assistant, „Keine“ oder „Eigene…“ wählen und selbst eintippen (z. B. Stück/min); sie steht neben dem Wert.",
    filterUnits: "Einheiten suchen…",
    moreInfo: "Details",
    noMatches: "Keine Treffer",
    availabilityShort: "Letzten Wert behalten, solange die SPS offline ist.",
    invertShort: "Ein und Aus in Home Assistant tauschen.",
    identitySection: "Identität",
    sourceSection: "OPC-UA-Knoten",
    valueSection: "Wert und Anzeige",
    updatesSection: "Aktualisierung und Verfügbarkeit",
    unitCustom: "Eigene…",
    unitCustomLabel: "Eigene Einheit",
    unitBadge: "Einheit",
    invalid_unit: "Eine Maßeinheit mit höchstens 50 Zeichen eingeben.",
    remove: "Entfernen",
    removing: "Entfernen…",
    removeTitle: "Manuellen Knoten entfernen",
    removeHelp:
      "Die manuelle Konfiguration und ihre Home-Assistant-Entitäten werden gelöscht. Automationen, die sie nutzen, müssen angepasst werden. Der SPS-Knoten bleibt unverändert. Findet die Erkennung ihn wieder, bleibt er ausgeschlossen.",
    removed: "Manueller Knoten entfernt.",
    removedReloading:
      "Manueller Knoten entfernt. Der Endpoint wird neu geladen.",
    not_manual_node:
      "Hier können nur manuell angelegte Knoten entfernt werden.",
    orphan: "Knoten fehlt",
    deleteEntity: "Entität löschen",
    deleting: "Löschen…",
    deleteTitle: "Verwaiste Entität löschen",
    deleteHelp:
      "Die SPS stellt diesen Knoten nach vollständiger Erkennung nicht mehr bereit, oder die Entität blieb nach einem Kategoriewechsel zurück. Die Home-Assistant-Entität wird gelöscht. Automationen und Dashboards, die sie nutzen, müssen angepasst werden. Die SPS bleibt unverändert. Einstellungen, die eine Ersatz-Entität braucht, bleiben erhalten; Einstellungen eines bestätigt fehlenden Knotens werden ggf. ebenfalls entfernt, wenn keine andere Entität sie nutzt.",
    deleted: "Verwaiste Entität gelöscht.",
    deleteAll: "Alle fehlenden löschen",
    deleteAllTitle: "Alle verwaisten Entitäten löschen",
    deleteAllHelp:
      "Jede Entität, deren Knoten die SPS nach vollständiger Erkennung nicht mehr bereitstellt, und jede nach einem Kategoriewechsel zurückgebliebene Entität wird gelöscht. Automationen und Dashboards, die sie nutzen, müssen angepasst werden. Die SPS bleibt unverändert. Einstellungen, die Ersatz-Entitäten brauchen, bleiben erhalten; Einstellungen bestätigt fehlender Knoten werden ggf. ebenfalls entfernt, wenn keine andere Entität sie nutzt.",
    deletedAll: "Verwaiste Entitäten gelöscht.",
    reclassifyBooleans: "Als binary_sensor einstufen",
    reclassifyBooleansTitle: "Bestehende Boolean-Sensoren neu einstufen",
    reclassifyBooleansHelp:
      "Schreibgeschützte Boolean-Knoten auf Automatisch können statt sensor zu binary_sensor werden und zeigen dann An/Aus statt True/False – nur die unten ausgewählten werden geändert. Nur Knoten, die noch auf Automatisch stehen, kommen infrage – eine ausdrückliche Wahl, auch sensor, wird nie überschrieben. Jede alte sensor-Entität bleibt danach als verwaiste Entität zurück, bereit für „Alle fehlenden löschen“.",
    reclassifySelectAll: "Alle auswählen",
    reclassifyConvert: "Ausgewählte umwandeln",
    reclassifying: "Umwandeln…",
    reclassified: "Boolean-Sensoren neu eingestuft.",
    groupModeLabel: "Gruppierung",
    groupByCategory: "Nach Kategorie",
    groupByArray: "Nach Array-Element",
    groupByPath: "Nach Gruppe (GVL / Struct)",
    groupTipCategory: "Abschnitte nach Typ: Sensoren, Schalter, Zahlen…",
    groupTipArray: "Felder nach Array-Element gruppiert",
    groupTipPath: "Felder nach SPS-Pfad gruppiert (GVL / Struct)",
    renameFields: "Doppelte Felder umbenennen",
    renameFieldsTitle: "Felder mit gleichen Namen unterscheiden",
    renameFieldsHelp:
      "Mehrere SPS-Felder haben denselben Namen: Jedes Feld eines Array-of-Struct-Elements (z. B. „Alarms[10].xActive“) wiederholt sich über die Elemente, und ein Feld wie „xEnable“ wiederholt sich über Struct-Instanzen (z. B. „...Pump_HK_North.xEnable“ und „...Pump_HK_South.xEnable“). Umbenennen der unten ausgewählten ergänzt den Array-Index oder das übergeordnete Struct im Namen. Nur die Namen der ausgewählten Entitäten ändern sich; ein manuell angepasster Name wird nie überschrieben.",
    renameConfirm: "Ausgewählte umbenennen",
    renaming: "Umbenennen…",
    renamed: "Felder umbenannt.",
    not_orphan:
      "Diese Entität ist nicht mehr verwaist oder lässt sich gerade nicht prüfen (Verbindung weg oder Erkennung unvollständig). Nichts wurde gelöscht.",
    node_in_use:
      "Andere Entitäten sind diesem Knoten zugeordnet. Diese vor dem Entfernen neu zuordnen, auch ausgeschlossene.",
    add: "Entität hinzufügen",
    verify: "Knoten prüfen",
    verifying: "Prüfen…",
    category: "Kategorie",
    auto: "Automatisch",
    min: "Minimalwert",
    max: "Maximalwert",
    step: "Schrittweite",
    min_length: "Minimale Länge",
    max_length: "Maximale Länge",
    categoryHelp:
      "Ein Kategoriewechsel kann die Entitäts-ID ändern. Automationen und Dashboards anpassen; die Entität der vorigen Kategorie wird gelöscht.",
    excludeHelp:
      "Der Knoten wird vom zyklischen Lesen ausgeschlossen. Er lässt sich in diesem Panel wieder aktivieren.",
    limitsHelp:
      "Grenzen legen fest, welche Werte in Home Assistant einstellbar sind. Für Text die String-Kapazität der SPS verwenden, bis 255 Zeichen.",
    invalid_limits: "Grenzen passen nicht zur gewählten Kategorie.",
    invalid_number_limits:
      "Endliche Werte verwenden, Minimum unter Maximum und eine positive Schrittweite nicht größer als der Bereich.",
    integer_limits_required:
      "Dieser Knoten braucht ganzzahlige Grenzen und Schrittweite.",
    unsafe_integer_limits:
      "Ganzzahlige Grenzen müssen innerhalb ±9007199254740991 liegen.",
    invalid_text_limits:
      "Ganzzahlige Längen von 0 bis 255 verwenden, Minimum nicht größer als Maximum.",
    manualHelp:
      "Die vollständige NodeId eingeben, auch für Knoten außerhalb der Erkennung. Die Prüfung liest den Knoten, ohne ihn zu ändern.",
    invalid_node_id: "Ungültige NodeId. Beispiel: ns=4;i=2",
    unsupported_node:
      "Eine skalare Boolean-, Zahl-, String- oder DateTime-Variable wählen.",
    node_unreadable:
      "Der Knoten existiert nicht oder ist mit den konfigurierten Zugangsdaten nicht lesbar.",
    node_already_configured:
      "Dieser Knoten hat bereits eine Entität. Sie in der Liste oder den Integrationsoptionen bearbeiten.",
    connection_disabled:
      "Die Verbindung aktivieren, um den Knoten zu prüfen und hinzuzufügen.",
    connection_failed: "Endpoint nicht erreichbar. Die Verbindung prüfen.",
    state: "Zustand",
    stateUnknown: "Unbekannt",
    stateUnavailable: "Nicht verfügbar",
    statePending: "Noch nicht registriert",
    stateExcluded: "Ausgeschlossen",
    stateEmpty: "Leerer Text",
    stateOn: "An",
    stateOff: "Aus",
    title: "OPC UA Connect",
    subtitle: "Entitäten deiner Endpoints konfigurieren",
    endpoint: "Endpoint",
    refresh: "Aktualisieren",
    search: "Name oder NodeId suchen",
    colName: "Name",
    colNode: "NodeId",
    colType: "Typ",
    colEntity: "Entität",
    colValue: "Wert",
    colSettings: "Einstellungen",
    colArea: "Bereich",
    sortHint:
      "Klicken zum Sortieren: aufsteigend, absteigend, ursprüngliche Reihenfolge",
    addHelp:
      "Einen Knoten von Hand per NodeId hinzufügen – für Variablen, die die automatische Erkennung nicht findet (z. B. außerhalb des Start-Knotens der Suche).",
    rediscoverHelp:
      "SPS-Knoten neu durchsuchen, ohne die Verbindung zu trennen. Läuft ohnehin bei jedem Start und jeder Neuverbindung; nötig nach einer Änderung am SPS-Programm.",
    groupToggle: "Gruppe ein- oder ausblenden",
    rediscover: "Neu erkennen",
    rediscovering: "Erkennen…",
    rediscovered: "SPS-Knoten neu erkannt.",
    all: "Alle",
    sensor: "Sensoren",
    binary_sensor: "Binärsensoren",
    switch: "Schalter",
    number: "Zahlen",
    text: "Text",
    datetime: "Datum und Uhrzeit",
    select: "Auswahl",
    button: "Taster",
    valueLabels: "Wertetabelle",
    valueLabelsHelp:
      "Jedem ganzzahligen Wert einen Text zuordnen. Home Assistant zeigt den Text; eine Auswahl schreibt den Wert des gewählten Texts. Ein Wert, der nicht in der Tabelle steht, erscheint als unbekannt.",
    valueLabelsSensorHelp:
      "Optional: jedem ganzzahligen Wert einen Text zuordnen, dann zeigt der Sensor den Text statt der Zahl. Leer: der Sensor zeigt die Zahl.",
    rawValue: "Wert",
    labelText: "Text",
    addValueLabel: "Zeile hinzufügen",
    removeValueLabel: "Zeile entfernen",
    valueLabelsBadge: "Texte",
    pulseMs: "Pulsdauer (ms)",
    pulseHelp:
      "Ein Druck setzt das Bit, wartet diese Dauer und setzt es zurück. Für SPS-Logik, die auf die Flanke reagiert. 50 – 10000 ms.",
    pulseBadge: "Puls",
    value_labels_required:
      "Eine Auswahl braucht mindestens eine Zeile in der Wertetabelle.",
    invalid_value_labels:
      "Jede Zeile braucht einen ganzzahligen Wert und einen Text mit höchstens 64 Zeichen.",
    duplicate_value_labels:
      "Werte und Texte der Tabelle müssen eindeutig sein.",
    value_labels_outside_type:
      "Ein Wert der Tabelle liegt außerhalb des Datentyps.",
    value_labels_conversion:
      "Eine Wertetabelle lässt sich nicht mit einer Umrechnung kombinieren.",
    invalid_pulse: "Pulsdauer: ganze Zahl von 50 bis 10000 ms.",
    disabled: "Ausgeschlossen",
    connected: "Verbunden",
    disconnected: "Getrennt",
    edit: "Bearbeiten",
    name: "Name",
    area: "Bereich",
    inherit: "Vom Gerät übernehmen",
    node: "Zugeordnete NodeId",
    filterNodes: "Erkannte Knoten suchen",
    deviceClass: "Geräteklasse",
    none: "Keine",
    invert: "Boolean-Zustand invertieren",
    invertHelp: "Bei Schaltern werden auch die Befehle an die SPS invertiert.",
    save: "Speichern",
    cancel: "Abbrechen",
    saving: "Speichern…",
    loading: "Laden…",
    manual: "Manuell",
    empty: "Keine Entität passt zur Suche.",
    noEndpoints:
      "Keine Endpoints konfiguriert. Eine Verbindung unter Integrationen hinzufügen.",
    noNodes:
      "Keine Entitäten verfügbar. Verbindung und Erkennung in den Integrationsoptionen prüfen.",
    notLoaded:
      "Der Endpoint wird neu geladen oder ist nicht geladen. Zum erneuten Versuch aktualisieren.",
    notReady: "Entität noch nicht registriert oder ausgeschlossen",
    saved: "Konfiguration gespeichert.",
    reloading: "Konfiguration gespeichert. Der Endpoint wird neu geladen.",
    nameHelp: "Leer lassen, um den ursprünglichen Namen zu verwenden.",
    nodeHelp:
      "Die Identität der Entität bleibt erhalten. Einen passenden, auf diesem Endpoint erkannten Knoten wählen.",
    admin: "Dieses Panel erfordert Administratorrechte.",
    error: "Vorgang fehlgeschlagen. Bitte erneut versuchen.",
    errorReason: "Ursache:",
    stale_configuration:
      "Die Konfiguration hat sich geändert. Abbrechen, die Liste aktualisieren und erneut versuchen.",
    node_not_found: "Die NodeId ist nicht unter den erkannten Knoten.",
    incompatible_platform:
      "Der gewählte Knoten passt nicht zu dieser Kategorie.",
    area_not_found:
      "Der Bereich existiert nicht mehr. Die Liste aktualisieren.",
    invalid_device_class: "Unpassende Geräteklasse.",
    invalid_inversion: "Invertieren erfordert einen Boolean-Knoten.",
    entity_not_ready: "Die Entität ist noch nicht konfigurierbar.",
    endpoint_not_loaded:
      "Der Endpoint ist nicht geladen. Kurz warten und erneut versuchen.",
    endpoint_not_found: "Der Endpoint existiert nicht mehr.",
    invalid_name: "Namen dürfen höchstens 255 Zeichen lang sein.",
    limits_outside_type:
      "Die numerischen Grenzen überschreiten den Wertebereich des gewählten Knotens.",
    info: "Zeile anklicken, um Kategorie und Grenzen einzustellen. Die Verbindungseinstellungen bleiben in den Integrationsoptionen.",
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
    areaBadge: "Area",
    valueLabel: "Value",
    textLabel: "Text",
    dateLabel: "Date and time",
    retainedValue: "Last known value",
    retainedHelp: "Retained value: waiting for a fresh reading from the PLC.",
    alwaysAvailable: "Always available",
    alwaysAvailableHelp:
      "Keeps the last known value when the PLC is disconnected or the connection is disabled. Without a saved value the state is unknown. Writes require a connection and a fresh reading.",
    invalid_availability: "Invalid availability setting.",
    endpointNamePath: "Include PLC path in names",
    endpointNamePathHelp:
      "New entities are named with their full path (e.g. “SP.xError”). For existing ones use Rename duplicate fields.",
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
    conversion: "Numeric conversion",
    conversionNone: "None (PLC value)",
    multiplier: "Multiplier",
    linear_scale: "Linear scale",
    factor: "Factor",
    plc_min: "PLC start value",
    plc_max: "PLC end value",
    ha_min: "HA start value",
    ha_max: "HA end value",
    conversionHelp:
      "Reads are converted and writes use the inverse. Limits and step use HA units; deadband uses PLC units. Integer writes round to nearest (ties to even). The scale does not clamp values to its endpoints.",
    invalid_conversion:
      "Enter finite values: a nonzero factor and distinct endpoints for each scale.",
    precision: "Decimal places",
    precisionHelp:
      "REAL/LREAL and converted values: 0 to 10 decimal places. Leave empty for no rounding. Applies to the Home Assistant value, including history and automations; PLC writes are unchanged.",
    invalid_precision:
      "Enter an integer from 0 to 10 for a REAL/LREAL or converted numeric node.",
    invalid_deadband:
      "Use a finite deadband of 0 or more (an integer for integer node types).",
    deadband: "Deadband",
    deadbandHelp:
      "Auto-Subscription only: suppress a push update smaller than this absolute change (e.g. 0.01 hides float noise below the 2nd decimal). 0 disables filtering. Polling is unaffected and always reads the exact value.",
    unit: "Unit of measurement",
    unitHelp:
      "Pick a standard Home Assistant unit, “None”, or “Custom…” to type one (e.g. pieces/min), shown next to the value.",
    filterUnits: "Search units…",
    moreInfo: "Details",
    noMatches: "No results",
    availabilityShort: "Keep the last value while the PLC is offline.",
    invertShort: "Swap on and off in Home Assistant.",
    identitySection: "Identity",
    sourceSection: "OPC UA node",
    valueSection: "Value and display",
    updatesSection: "Updates and availability",
    unitCustom: "Custom…",
    unitCustomLabel: "Custom unit",
    unitBadge: "Unit",
    invalid_unit: "Enter a unit of measurement of at most 50 characters.",
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
    groupModeLabel: "Grouping",
    groupByCategory: "By category",
    groupByArray: "By array element",
    groupByPath: "By group (GVL / struct)",
    groupTipCategory: "Sections by type: sensors, switches, numbers…",
    groupTipArray: "Fields grouped by array element",
    groupTipPath: "Fields grouped by PLC path (GVL / struct)",
    renameFields: "Rename duplicate fields",
    renameFieldsTitle: "Disambiguate fields with repeated names",
    renameFieldsHelp:
      'Several PLC fields share the same name: every field of an array-of-struct element (e.g. "Alarms[10].xActive") repeats across the elements, and a field like "xEnable" repeats across struct instances (e.g. "...Pump_HK_North.xEnable" and "...Pump_HK_South.xEnable"). Renaming the ones selected below adds the array index or the parent struct to the name so they can be told apart. Only the selected entities\' names are changed; a name already customized manually is never overridden.',
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
      "Changing category may change the entity ID. Update automations and dashboards; the entity of the previous category is deleted.",
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
    colName: "Name",
    colNode: "NodeId",
    colType: "Type",
    colEntity: "Entity",
    colValue: "Value",
    colSettings: "Settings",
    colArea: "Area",
    sortHint: "Click to sort: ascending, descending, original order",
    addHelp:
      "Add a node by hand via its NodeId – for variables the automatic discovery does not find (e.g. outside the browse start node).",
    rediscoverHelp:
      "Browse the PLC nodes again without dropping the connection. Discovery already runs on every start and reconnect; use it after a change to the PLC program.",
    groupToggle: "Show or hide group",
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
    select: "Selects",
    button: "Buttons",
    valueLabels: "Value table",
    valueLabelsHelp:
      "Assign a text to each integer value. Home Assistant shows the text; a select writes the value of the chosen text. A value missing from the table shows as unknown.",
    valueLabelsSensorHelp:
      "Optional: assign a text to each integer value, so the sensor shows the text instead of the number. Empty: the sensor shows the number.",
    rawValue: "Value",
    labelText: "Text",
    addValueLabel: "Add row",
    removeValueLabel: "Remove row",
    valueLabelsBadge: "Texts",
    pulseMs: "Pulse length (ms)",
    pulseHelp:
      "A press sets the bit, waits this long and resets it. For PLC logic that reacts to the edge. 50 – 10000 ms.",
    pulseBadge: "Pulse",
    value_labels_required:
      "A select needs at least one row in the value table.",
    invalid_value_labels:
      "Each row needs an integer value and a text of up to 64 characters.",
    duplicate_value_labels: "Values and texts in the table must be unique.",
    value_labels_outside_type:
      "A value in the table exceeds the data type range.",
    value_labels_conversion:
      "A value table cannot be combined with a conversion.",
    invalid_pulse: "Pulse length: integer from 50 to 10000 ms.",
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
    errorReason: "Cause:",
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
    info: "Click a row to configure its category and limits. Connection settings remain in the integration options.",
  },
};
const LANGS = ["it", "de"];
// Table columns: default and smallest width in px. The settings column has
// no default and takes the remaining space.
const COLUMNS = [
  { key: "colName", width: 300, min: 120 },
  { key: "colType", width: 90, min: 60 },
  { key: "colEntity", width: 110, min: 70 },
  { key: "colValue", width: 140, min: 80 },
  { key: "colSettings", min: 200 },
  { key: "", width: 90, min: 60 },
];
// Order of the setting badges in the settings column. Each setting used by
// any shown row gets its own fixed slot, so the same setting always sits at
// the same place and the badges line up from row to row.
const SETTING_SLOTS = [
  "invert_state",
  "device_class",
  "conversion",
  "precision",
  "unit_of_measurement",
  "always_available",
  "update_mode",
  "deadband",
  "range",
  "step",
  "value_labels",
  "pulse_ms",
  "length",
  "area",
  "node_id",
];
const GROUPINGS = {
  array: {
    key: "array_group",
    label: "array_label",
    sort: "array_field",
  },
  path: {
    key: "path_group",
    label: "path_label",
    sort: "name",
  },
};
const GROUPS = [
  "sensor",
  "binary_sensor",
  "switch",
  "number",
  "text",
  "datetime",
  "select",
  "button",
  "disabled",
];
const INTEGER = new Set([
  "SByte",
  "Byte",
  "Int16",
  "UInt16",
  "Int32",
  "UInt32",
  "Int64",
  "UInt64",
]);
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
  if (row.platform === "select" || row.settings?.value_labels?.length)
    return "text";
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
  groupCategory:
    "M7 3.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM14 4h6v6h-6ZM7 14l3.5 6h-7ZM17 14l3 3-3 3-3-3Z",
  groupArray: "M8 4H5v16h3M16 4h3v16h-3M12 8v.01M12 12v.01M12 16v.01",
  groupPath: "M4 4h6v5H4ZM7 9v9M7 13h5M7 18h5M12 11h8v4h-8ZM12 16h8v4h-8Z",
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
  if (row.platform === "select")
    return INTEGER.has(node.variant_type) && node.writable;
  if (row.platform === "button")
    return node.variant_type === "Boolean" && node.writable;
  return true;
}
const CSS = `
:host{display:flex;flex-direction:column;height:100%;min-height:0;color:var(--primary-text-color,#243346);background:var(--primary-background-color,#f5f7fb);font:14px var(--paper-font-body1_-_font-family,Roboto,Arial,sans-serif);--accent-sensor:#0f9d8a;--accent-binary_sensor:#6366f1;--accent-switch:#d97a06;--accent-number:#7c4fd6;--accent-text:#e0447a;--accent-datetime:#0891b2;--accent-select:#2f7d32;--accent-button:#c2410c;--accent-disabled:var(--disabled-text-color,#9aa5b1);--speed:180ms}
@media(prefers-reduced-motion:reduce){:host{--speed:0ms}}
*{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer;border:1px solid var(--divider-color,#dce2ea);border-radius:10px;padding:10px 15px;background:var(--card-background-color,#fff);color:inherit;min-height:42px;transition:background var(--speed),border-color var(--speed)}button:hover{border-color:var(--primary-color,#009ac0);background:color-mix(in srgb,var(--primary-color,#009ac0) 5%,var(--card-background-color,#fff))}button:disabled{opacity:.5;cursor:default}button:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color,#009ac0);outline-offset:3px}.primary,.primary:hover{background:var(--primary-color,#008fac);border-color:transparent;color:var(--text-primary-color,#fff)}
header{display:flex;flex-shrink:0;gap:16px;align-items:center;padding:18px 28px;background:var(--card-background-color,#fff);border-bottom:1px solid var(--divider-color,#e0e6ee)}h1{font-size:22px;line-height:1.3;margin:0;font-weight:650}p{margin:0;color:var(--secondary-text-color,#637487);line-height:1.5}.headerText{flex:1;min-width:0}.headerText>p{margin-top:5px}.titleRow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.version{white-space:nowrap}.menu{display:none;border:0;background:none;font-size:22px;padding:4px 10px}.content{flex:1;min-height:0;width:100%;max-width:1480px;margin:0 auto;padding:24px 28px 48px;overflow:auto}
.endpointPanel{background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#dce2ea);border-radius:16px;padding:20px;margin-bottom:22px}.toolbar{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:end;margin-bottom:16px}.field{display:flex;flex-direction:column;gap:7px;min-width:0}.field>span{font-weight:600;font-size:13px}input,select{width:100%;min-width:0;padding:12px;border:1px solid var(--divider-color,#d8e0e8);border-radius:9px;background:var(--card-background-color,#fff);color:var(--primary-text-color,#243346)}.endpointMeta{display:flex;gap:16px;align-items:center;flex-wrap:wrap;min-width:0;color:var(--secondary-text-color,#637487)}.endpointIdentity{display:flex;gap:10px;align-items:center;flex-wrap:wrap;flex:1 1 220px;min-width:0}.endpointAddress{font:12px ui-monospace,monospace;overflow-wrap:anywhere;line-height:1.6}.endpointActions{display:flex;gap:8px;flex-wrap:wrap}.badge{display:inline-flex;align-items:center;gap:7px;font-size:12px;border-radius:7px;padding:4px 8px;background:color-mix(in srgb,var(--secondary-text-color,#637487) 9%,transparent);color:var(--secondary-text-color,#637487)}[data-connection]{border-radius:20px;white-space:nowrap;padding:5px 10px}[data-connection]::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;flex-shrink:0}.online{color:var(--success-color,#138260);background:color-mix(in srgb,var(--success-color,#138260) 12%,transparent)}
.navRow{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--divider-color,#e0e6ee)}nav{display:flex;gap:7px;flex-wrap:wrap;max-width:100%}nav button{border:1px solid transparent;background:transparent;padding:8px 12px;min-height:38px;color:var(--secondary-text-color,#637487)}nav .selected,nav .selected:hover{background:color-mix(in srgb,var(--primary-color,#008fac) 10%,var(--card-background-color,#fff));border-color:color-mix(in srgb,var(--primary-color,#008fac) 28%,transparent);color:var(--primary-text-color,#243346);font-weight:600}.navTools{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.viewToggle button,nav button{position:relative}.viewToggle svg{display:block;width:18px;height:18px}[data-tip]::after{content:attr(data-tip);position:absolute;top:calc(100% + 8px);right:0;z-index:20;width:max-content;max-width:210px;padding:5px 9px;border-radius:7px;background:var(--primary-text-color,#243346);color:var(--card-background-color,#fff);font-size:12px;font-weight:400;line-height:1.35;text-align:left;white-space:normal;opacity:0;pointer-events:none;transition:opacity .12s ease}@media(hover:hover){[data-tip]:hover::after{opacity:1;transition-delay:.8s}}[data-tip]:focus-visible::after{opacity:1;transition-delay:.3s}.viewToggle{display:flex;gap:3px;padding:3px;border:1px solid var(--divider-color,#dce2ea);border-radius:11px;background:var(--card-background-color,#fff)}.viewToggle button{border:0;background:none;border-radius:7px;padding:8px 11px;min-height:34px;font-size:16px;line-height:1;color:var(--secondary-text-color,#637487)}.viewToggle .selected,.viewToggle .selected:hover{background:color-mix(in srgb,var(--primary-color,#008fac) 12%,transparent);color:var(--primary-color,#008fac)}.card{display:flex;flex-direction:column;position:relative;background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#e2e7ef);border-left:3px solid var(--accent,var(--divider-color,#e2e7ef));border-radius:12px;padding:16px;min-width:0;transition:border-color var(--speed) ease}.card:hover{border-color:color-mix(in srgb,var(--accent,var(--primary-color)) 45%,var(--divider-color,#e2e7ef));border-left-color:var(--accent,var(--divider-color,#e2e7ef))}.card h3{font-size:15px;line-height:1.45;font-weight:600;margin:0 0 5px;overflow-wrap:anywhere}.manualTag,.orphanTag{font-size:11px;font-weight:600;padding:3px 8px;border-radius:20px;white-space:nowrap}.manualTag{color:var(--accent,var(--primary-color));background:color-mix(in srgb,var(--accent,var(--primary-color)) 15%,transparent)}.address{font:11px ui-monospace,monospace;overflow-wrap:anywhere;color:var(--secondary-text-color,#637487);line-height:1.6}.valueTable{display:grid;gap:8px}.valueTableRow{display:grid;gap:8px;grid-template-columns:minmax(80px,1fr) minmax(120px,3fr) auto;align-items:end}.valueTableRow button{min-height:38px}.valueTableRow:not(:first-child) .field>span{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}.limits{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr))}.entityState{flex:1;margin-top:18px;min-width:0}.stateLabel{display:block;font-size:11px;color:var(--secondary-text-color,#637487);margin-bottom:4px}.stateValue{display:block;font-size:23px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1.4;white-space:pre-wrap;overflow-wrap:anywhere;max-height:8em;overflow:auto}.stateValue[data-kind="unavailable"],.stateValue[data-kind="unknown"],.stateValue[data-kind="pending"],.stateValue[data-kind="disabled"]{font-size:15px;font-weight:400;color:var(--secondary-text-color,#637487)}.actions{display:flex;gap:7px;flex-wrap:wrap}.danger{color:var(--error-color,#be3131)}.actions button{padding:7px 12px;min-height:36px}.meta{color:var(--secondary-text-color,#637487);font-size:12px;overflow-wrap:anywhere}.message{padding:13px 16px;margin-bottom:16px;border-radius:10px;background:var(--secondary-background-color,#eaf0f7);line-height:1.5}.message.empty{display:flex;gap:12px;align-items:center;color:var(--secondary-text-color,#637487)}.message.empty svg{flex-shrink:0;opacity:.7}.error{color:var(--error-color,#be3131)}.hint{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#637487)}
[data-platform="sensor"]{--accent:var(--accent-sensor)}[data-platform="binary_sensor"]{--accent:var(--accent-binary_sensor)}[data-platform="switch"]{--accent:var(--accent-switch)}[data-platform="number"]{--accent:var(--accent-number)}[data-platform="text"]{--accent:var(--accent-text)}[data-platform="datetime"]{--accent:var(--accent-datetime)}[data-platform="select"]{--accent:var(--accent-select)}[data-platform="button"]{--accent:var(--accent-button)}[data-platform="disabled"]{--accent:var(--accent-disabled)}
.endpointSubscription{display:flex;flex:1 1 100%;gap:8px 20px;flex-wrap:wrap;align-items:center;min-width:0;padding-top:14px;border-top:1px solid var(--divider-color,#e2e7ef)}.endpointSubscription .hint{flex:1 1 270px;font-size:12px;margin:0}.endpointSubscription #subscription-status,.endpointSubscription .error{flex-basis:100%}.endpointSubscription .toggle{font-weight:600;color:var(--primary-text-color,#243346);padding:4px 0;min-height:36px}.endpointSubscription input[role="switch"]{appearance:none;position:relative;width:42px;min-width:42px;height:24px;padding:0;border:0;border-radius:12px;background:var(--disabled-color,#8695a5);cursor:pointer}.endpointSubscription input[role="switch"]::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff}.endpointSubscription input[role="switch"]:checked{background:var(--primary-color,#008fac)}.endpointSubscription input[role="switch"]:checked::after{left:21px}.endpointSubscription input[role="switch"]:disabled{opacity:.5;cursor:default}.endpointSubscription+.endpointSubscription{border-top:0;padding-top:0}
dialog{border:1px solid var(--divider-color,#dce2ea);border-radius:18px;width:min(620px,calc(100vw - 24px));max-height:calc(100dvh - 32px);padding:0;background:var(--card-background-color,#fff);color:var(--primary-text-color,#243346);opacity:0;transform:translateY(10px) scale(.98);transition:opacity var(--speed) ease,transform var(--speed) ease;overflow:hidden}dialog[open]{opacity:1;transform:none;display:flex;flex-direction:column}dialog::backdrop{background:#10223480;backdrop-filter:blur(1px)}form{padding:24px;display:flex;flex-direction:column;gap:17px;overflow-y:auto;flex:1;min-height:0}form h2{margin:0;font-size:21px;overflow-wrap:anywhere}footer{display:flex;justify-content:flex-end;gap:10px;position:sticky;bottom:-24px;margin:6px -24px -24px;padding:14px 24px 24px;background:var(--card-background-color,#fff)}.toggle{display:flex;gap:10px;align-items:center}.toggle input{width:20px;height:20px;min-width:20px;accent-color:var(--primary-color,#008fac)}[hidden]{display:none!important}.orphanTag{color:var(--error-color,#be3131);background:color-mix(in srgb,var(--error-color,#be3131) 15%,transparent)}.card.orphan{border-left-color:var(--error-color,#be3131);border-style:dashed}
.pickList{display:flex;flex-direction:column;gap:2px;max-height:300px;overflow-y:auto;border:1px solid var(--divider-color,#dce2ea);border-radius:10px;padding:6px}.pickItem{display:flex;align-items:center;gap:12px;padding:9px 8px;border-radius:7px;cursor:pointer}.pickItem:hover{background:color-mix(in srgb,var(--primary-color,#008fac) 6%,transparent)}.pickItem input{width:18px;height:18px;min-width:18px;flex-shrink:0;accent-color:var(--primary-color,#008fac)}.pickInfo{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}.pickName{font-weight:600;overflow-wrap:anywhere}.pickNodeId{font:11px ui-monospace,monospace;color:var(--secondary-text-color,#637487);overflow-wrap:anywhere}.pickState{font-size:12px;font-weight:600;color:var(--secondary-text-color,#637487);white-space:nowrap;flex-shrink:0}
.pickArrow{font-size:12px;color:var(--secondary-text-color,#637487);text-align:right;max-width:180px;overflow-wrap:anywhere;flex-shrink:0}
.entityForm{padding:0;gap:0;overflow:hidden;max-height:inherit;flex:0 1 auto}.editorBody{display:flex;flex-direction:column;gap:17px;padding:24px;overflow-y:auto;overscroll-behavior:contain;min-height:0;flex:1}.editorBody>*{flex-shrink:0}.entityForm footer{position:static;flex-shrink:0;flex-wrap:wrap;margin:0;padding:16px 24px;padding-bottom:max(16px,env(safe-area-inset-bottom));border-top:1px solid var(--divider-color,#dce2ea)}.entityForm footer .error{flex-basis:100%;overflow-wrap:anywhere}.entityForm footer .error:empty{display:none}
.entityEditor .editorHeading{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 24px}.editorHeadingText{min-width:0;flex:1}.editorHeadingText h2{font-size:19px}.editorState.card{padding:0;border:0;background:transparent;max-width:40%;flex-shrink:0}.editorState .entityState{margin:0;min-height:36px}.editorState .stateValue{font-size:18px;max-height:3em}.editorState .retainedValue{max-width:160px}.entityEditor .editorSection{padding:14px 16px}.entityEditor .editorSection h3{display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:12px}.editorSection h3 svg{width:18px;height:18px;flex-shrink:0}.entityEditor .editorFields{gap:12px 16px}.helpTip{position:relative;display:inline-flex;align-items:center;margin-left:6px;vertical-align:middle;color:var(--secondary-text-color,#637487);cursor:help;border-radius:50%}.helpTip:hover,.helpTip:focus-visible{color:var(--primary-color,#008fac)}.helpTip:focus-visible{outline:2px solid var(--primary-color,#008fac);outline-offset:2px}.helpTip .hint{display:none;position:absolute;top:calc(100% + 6px);left:-8px;z-index:30;width:max-content;max-width:min(320px,70vw);margin:0;padding:6px 10px;border-radius:7px;background:var(--primary-text-color,#243346);color:var(--card-background-color,#fff);font-size:12px;font-weight:400;line-height:1.4;text-align:left;white-space:normal;box-shadow:0 4px 14px rgba(0,0,0,.18)}.helpTip:hover .hint,.helpTip:focus .hint{display:block}
.infoDot{display:inline-flex;justify-content:center;align-items:center;width:14px;height:14px;border:1px solid currentColor;border-radius:50%;font-size:10px;font-weight:600}.editorSwitch{justify-content:space-between;flex-direction:row-reverse;gap:16px;min-height:44px;padding:8px 0;cursor:pointer}.editorSwitch .switchCopy{flex:1;font-weight:500;line-height:1.4}.switchCopy small{display:block;margin-top:3px;font-size:12px;font-weight:400;color:var(--secondary-text-color,#637487)}.entityEditor .editorSwitch input{appearance:none;-webkit-appearance:none;position:relative;width:44px;height:26px;min-width:44px;min-height:26px;flex:0 0 44px;border:1px solid var(--secondary-text-color,#637487);border-radius:20px;background:var(--secondary-text-color,#637487);margin:0;padding:0;cursor:pointer;transition:background 160ms,border-color 160ms}.editorSwitch input::before{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:var(--card-background-color,#fff);transition:transform 160ms}.entityEditor .editorSwitch input:checked{background:var(--primary-color,#008fac);border-color:var(--primary-color,#008fac)}.editorSwitch input:checked::before{transform:translateX(18px)}.editorSwitch input:focus-visible{outline:2px solid var(--primary-color,#008fac);outline-offset:3px}.editorSwitch input:disabled{opacity:.45;cursor:default}.entityEditor input[name=precision]{max-width:120px}.nodePicker .unitTrigger{overflow-wrap:anywhere;white-space:normal;gap:8px}.unitTrigger::after{flex-shrink:0}
@media(max-width:650px){.entityEditor .editorHeading{padding:12px 16px;gap:8px;flex-wrap:wrap}.editorState.card{max-width:100%}.editorState .entityState{padding:4px 8px;min-height:28px}.editorState .stateValue{font-size:15px}.editorState .valueIcon{display:none}.editorState .stateLabel{display:none}.entityEditor .editorSection{padding:12px}.entityEditor .editorFields{gap:10px}}
@media(prefers-reduced-motion:reduce){.editorSwitch input,.editorSwitch input::before{transition:none}}
.entityEditor{width:min(820px,calc(100vw - 24px))}.editorHeading{padding:20px 24px 16px;border-bottom:1px solid var(--divider-color,#dce2ea);flex-shrink:0}.editorHeading .hint{margin-top:5px}.entityEditor .editorBody{gap:16px;background:var(--primary-background-color,#f5f7fa);padding:20px 24px}.editorSection{padding:18px;background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#dce2ea);border-radius:12px;min-width:0}.editorSection h3{margin:0 0 16px;font-size:13px;font-weight:600;color:var(--primary-color,#008fac);letter-spacing:.02em}.editorFields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.editorFieldGroup{min-width:0}.editorFieldGroup.wide{grid-column:1/-1}.editorFieldGroup .hint{margin:6px 0 0;font-size:12px;line-height:1.45}.entityEditor input,.entityEditor select{min-height:44px}.unitTrigger{width:100%;min-height:44px;text-align:left;display:flex;align-items:center;justify-content:space-between;font-weight:400}.unitTrigger::after{content:"⌄";margin-left:12px;color:var(--secondary-text-color,#637487)}.unitMenu{border:1px solid var(--primary-color,#008fac);border-radius:10px;padding:8px;margin-top:6px;background:var(--card-background-color,#fff)}.unitMenu input{width:100%;box-sizing:border-box}.pickerOptions{max-height:190px;overflow:auto;margin-top:6px;overscroll-behavior:contain}.pickerOptions [role=option]{padding:10px 12px;min-height:24px;border-radius:6px;cursor:pointer;overflow-wrap:anywhere}.pickerOptions [aria-selected=true]{font-weight:600;color:var(--primary-color,#008fac);background:color-mix(in srgb,var(--primary-color,#008fac) 10%,transparent)}.pickerOptions .active,.pickerOptions [role=option]:hover{background:var(--secondary-background-color,#eaf0f7);outline:1px solid var(--primary-color,#008fac);outline-offset:-1px}.unitTrigger:focus-visible,.unitMenu input:focus-visible{outline:2px solid var(--primary-color,#008fac);outline-offset:2px}
@media(max-width:650px){.entityEditor{width:calc(100vw - 16px);max-height:calc(100dvh - 16px);border-radius:14px}.editorHeading{padding:16px}.entityEditor .editorBody{padding:12px;gap:12px}.editorSection{padding:14px}.editorFields{grid-template-columns:1fr;gap:14px}.entityEditor .editorHeading h2{font-size:18px}.editorSection h3{margin-bottom:14px}}
@media(max-width:870px){.menu{display:inline-flex;align-items:center;justify-content:center}}
@media(max-width:650px){header{padding:14px 12px;gap:8px}h1{font-size:20px}.content{padding:16px 12px 32px}.endpointPanel{padding:15px;margin-bottom:18px}.toolbar{grid-template-columns:1fr;gap:12px}.endpointMeta{gap:12px}.endpointIdentity{flex-basis:100%}.endpointActions{width:100%}.endpointActions button{flex:1;min-height:44px}.endpointSubscription{gap:5px;padding-top:12px}.endpointSubscription .toggle{width:100%;min-height:44px}.navRow{gap:10px}nav{gap:3px}nav button{padding:8px 10px;min-height:42px}.card{padding:15px}.actions button{min-height:42px}form{padding:20px}.entityForm{padding:0}.editorBody{padding:20px}.entityForm footer{padding-left:20px;padding-right:20px}.entityForm footer button{min-height:44px}.headerText p{font-size:12px}}.card{padding:12px 14px;border-radius:11px}.card h3{font-size:14px;margin-bottom:3px}.address{font-size:10px}.entityState{display:flex;align-items:center;gap:12px;flex:0 0 auto;margin-top:12px;min-height:48px}.valueIcon{display:flex;align-items:center;justify-content:center;width:38px;height:38px;flex:0 0 38px;border-radius:10px;color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,transparent)}.valueIcon svg{width:23px;height:23px}.stateContent{min-width:0;flex:1}.stateLabel{font-size:10px;margin-bottom:2px}.stateValue{font-size:26px;font-weight:650;line-height:1.25;max-height:5em}.card[data-value-type="text"] .stateValue{font-size:15px;font-weight:400;line-height:1.45}.card[data-value-type="text"] .valueIcon{color:var(--accent-text);background:color-mix(in srgb,var(--accent-text) 10%,transparent)}.card[data-value-type="datetime"] .stateValue{font-size:15px;font-weight:500;line-height:1.45}.card[data-value-type="boolean"] .stateValue{font-size:16px;font-weight:600}.card[data-value-type="boolean"] .valueIcon{border-radius:50%;color:var(--secondary-text-color,#637487);background:color-mix(in srgb,var(--secondary-text-color,#637487) 10%,transparent)}.card[data-tone="active"] .valueIcon{color:var(--primary-color,#008fac);background:color-mix(in srgb,var(--primary-color,#008fac) 15%,transparent)}.card[data-tone="active"] .stateValue{color:var(--primary-color,#008fac)}.card[data-tone="alert"] .valueIcon{color:var(--error-color,#be3131);background:color-mix(in srgb,var(--error-color,#be3131) 12%,transparent)}.card[data-tone="alert"] .stateValue{color:var(--error-color,#be3131)}.card:not([data-state-kind="value"]) .stateValue{font-size:14px;font-weight:400;color:var(--secondary-text-color,#637487)}.card:not([data-state-kind="value"]) .valueIcon{color:var(--secondary-text-color,#637487);background:color-mix(in srgb,var(--secondary-text-color,#637487) 8%,transparent)}.card[data-state-kind="empty"] .stateValue{font-style:italic}.retainedValue{display:inline-block;font-size:10px;line-height:1.4;margin-top:5px;padding:2px 6px;border-radius:4px;color:var(--primary-text-color,#243346);background:color-mix(in srgb,var(--warning-color,#e0a000) 18%,var(--card-background-color,#fff))}
@media(max-width:650px){.card{padding:12px}}
.card{--value-accent:var(--accent)}.card[data-value-type="text"]{--value-accent:var(--accent-text)}.card[data-value-type="datetime"]{--value-accent:var(--accent-datetime)}.card[data-value-type="boolean"]{--value-accent:var(--secondary-text-color,#637487)}.card[data-tone="active"]{--value-accent:var(--primary-color,#008fac)}.card[data-tone="alert"]{--value-accent:var(--error-color,#be3131)}.card:not([data-state-kind="value"]){--value-accent:var(--secondary-text-color,#637487)}.entityState{margin-top:8px;padding:6px 10px;gap:10px;border:1px solid color-mix(in srgb,var(--value-accent) 24%,transparent);border-radius:10px;background:color-mix(in srgb,var(--value-accent) 9%,var(--card-background-color,#fff));max-width:100%}.card .entityState .valueIcon{width:30px;height:30px;flex-basis:30px;background:transparent;color:var(--value-accent)}.card[data-tone="alert"] .stateValue{color:color-mix(in srgb,var(--error-color,#be3131) 70%,var(--primary-text-color,#243346))}
.customizations{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px;min-width:0;order:2}.customizationBadge{padding:3px 7px;border-radius:5px;background:color-mix(in srgb,var(--secondary-text-color,#637487) 8%,transparent);border:1px solid var(--divider-color,#dce2ea);color:var(--secondary-text-color,#637487);font-size:11px;line-height:1.4;max-width:100%;overflow-wrap:anywhere}
header{gap:14px;padding:16px 24px}
button{padding:8px 14px;min-height:40px}
.content{display:flex;flex-direction:column;max-width:none;padding:20px 24px 24px}
.content>*{flex-shrink:0}
.endpointPanel{border-radius:14px;padding:16px;margin-bottom:16px}
.toolbar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:0}
.toolbar select{flex:0 1 260px;width:auto}
.toolbar input[type=search]{flex:1 1 260px;width:auto}
input,select{padding:9px 11px;min-height:40px}
.endpointActions{gap:8px}
.endpointMeta{display:flex;flex-direction:column;align-items:stretch;gap:10px;margin-top:12px;font-size:12px}
.endpointIdentity{flex:none;gap:8px}
.endpointAddress{font-size:12px}
.endpointSwitches{display:flex;flex-wrap:wrap;gap:10px 28px}
.endpointSwitches .endpointSubscription{flex:1 1 300px;min-width:0;margin:0}
.endpointSwitches .hint{margin-top:2px}
.endpointFeedback .hint:empty,.endpointFeedback .error:empty{display:none}
.navRow{margin:12px 0 0;padding:12px 0 0;border-bottom:0;border-top:1px solid var(--divider-color,#e0e6ee)}
nav{gap:6px}
nav button{border:1px solid var(--divider-color,#dce2ea);border-radius:18px;padding:5px 12px;min-height:34px;color:var(--secondary-text-color,#637487)}
nav .selected,nav .selected:hover{background:color-mix(in srgb,var(--primary-color,#008fac) 12%,transparent);border-color:color-mix(in srgb,var(--primary-color,#008fac) 35%,transparent);color:var(--primary-text-color,#243346);font-weight:600}
.tableWrap{flex:1 1 auto;min-height:240px;overflow:auto;border:1px solid var(--divider-color,#dce2ea);border-radius:12px;background:var(--card-background-color,#fff)}
.entityTable{border-collapse:collapse;width:100%;table-layout:fixed}
.entityTable td{overflow:hidden;text-overflow:ellipsis}
.entityTable th,.entityTable td{padding:7px 10px;text-align:left;border-bottom:1px solid var(--divider-color,#e8edf3);white-space:nowrap;vertical-align:middle}
.entityTable thead th{position:sticky;top:0;z-index:2;background:var(--card-background-color,#fff);font-size:12px;font-weight:600;color:var(--secondary-text-color,#637487)}
.groupRow th{padding:0;background:color-mix(in srgb,var(--secondary-text-color,#637487) 6%,var(--card-background-color,#fff));box-shadow:inset 3px 0 0 var(--accent,var(--secondary-text-color,#637487))}
.groupToggle{display:flex;align-items:center;gap:9px;width:100%;min-height:0;padding:6px 12px;border:0;border-radius:0;background:none;font-size:13px;font-weight:600;color:var(--primary-text-color,#243346);text-align:left}
.groupToggle:hover{background:color-mix(in srgb,var(--primary-color,#008fac) 6%,transparent)}
.groupToggle::before{content:"";width:6px;height:6px;margin:0 2px;border-right:2px solid var(--secondary-text-color,#8a97a8);border-bottom:2px solid var(--secondary-text-color,#8a97a8);transform:rotate(45deg);transition:transform var(--speed)}
.rowGroup.collapsed .groupToggle::before{transform:rotate(-45deg)}
.rowGroup.collapsed .entityRow{display:none}
.arrayGroupTitle{font-family:ui-monospace,monospace;font-size:12px}
.entityRow{--value-accent:var(--accent)}
.entityRow[data-value-type="text"]{--value-accent:var(--accent-text)}
.entityRow[data-value-type="datetime"]{--value-accent:var(--accent-datetime)}
.entityRow[data-value-type="boolean"]{--value-accent:var(--secondary-text-color,#637487)}
.entityRow[data-tone="active"]{--value-accent:var(--primary-color,#008fac)}
.entityRow[data-tone="alert"]{--value-accent:var(--error-color,#be3131)}
.entityRow:not([data-state-kind="value"]){--value-accent:var(--secondary-text-color,#637487)}
.entityRow.clickable{cursor:pointer}.entityRow.clickable:focus-visible{outline:2px solid var(--primary-color,#008fac);outline-offset:-2px}
.entityRow:hover{background:color-mix(in srgb,var(--primary-color,#008fac) 5%,transparent)}
.nameLine{display:flex;align-items:center;gap:6px;min-width:0}
.nameCell h3{margin:0;max-width:360px;overflow:hidden;text-overflow:ellipsis;font-size:14px;font-weight:600;line-height:1.4}
.addressCell .address{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:1.4}
.typeCell,.platformCell,.areaCell{font-size:12px;color:var(--secondary-text-color,#637487)}
.muted{color:var(--secondary-text-color,#637487)}
.entityRow .entityState{display:flex;align-items:center;gap:6px;margin:0;padding:0;min-height:0;border:0;border-radius:0;background:none;width:auto;max-width:none}
.entityRow .stateLabel{display:none}
.entityRow .stateContent{display:flex;align-items:center;gap:6px;min-width:0}
.entityRow .entityState .valueIcon{width:18px;height:18px;flex:0 0 18px;border-radius:0;background:none;color:var(--value-accent)}
.entityRow .valueIcon svg{width:16px;height:16px}
.entityRow .stateValue{font-size:14px;font-weight:600;line-height:1.4;max-height:none;overflow:visible;white-space:nowrap;color:var(--primary-text-color,#243346)}
.entityRow[data-tone="active"] .stateValue{color:var(--primary-color,#008fac)}
.entityRow[data-tone="alert"] .stateValue{color:var(--error-color,#be3131)}
.entityRow:not([data-state-kind="value"]) .stateValue{font-weight:400;color:var(--secondary-text-color,#637487)}
.entityRow[data-state-kind="empty"] .stateValue{font-style:italic}
.entityRow[data-value-type="text"] .valueCell{white-space:normal;min-width:180px;max-width:340px}
.entityRow[data-value-type="text"] .stateValue{font-weight:400;white-space:normal;overflow-wrap:anywhere}
.entityRow .retainedValue{margin:0}
.settingsCell .customizations{flex-wrap:nowrap;gap:4px;margin:0}
.settingsCell .customizationBadge{padding:1px 6px;font-size:11px;white-space:nowrap}
.settingsCell .customizationBadge,.settingSlot{box-sizing:border-box;flex:none}
.actionsCell{text-align:right}
.actionsCell .actions{justify-content:flex-end;flex-wrap:nowrap;gap:6px}
.actionsCell .actions button{min-height:28px;padding:3px 10px;border-radius:8px;font-size:12px}
.entityRow.orphan h3{color:var(--secondary-text-color,#637487)}
.entityRow.orphan td:first-child{box-shadow:inset 3px 0 0 var(--error-color,#be3131)}
.manualTag,.orphanTag{padding:1px 7px;font-size:11px}
.pageHint{margin-top:12px}
@media(max-width:650px){header{padding:12px}.content{padding:12px 12px 32px}.toolbar select,.toolbar input[type=search]{flex:1 1 100%}.endpointActions{width:100%}.endpointActions button{flex:1;min-height:44px}.tableWrap{min-height:320px}}
.headerText>p{margin-top:0}.titleRow{gap:8px}.badge{padding:3px 8px}
.endpointMeta{flex-direction:row;flex-wrap:wrap;align-items:center;gap:8px 24px;margin-top:10px}
.endpointSwitches{gap:8px 24px}
.endpointIdentity{flex:0 1 auto;min-width:0;flex-wrap:wrap}.endpointAddress{min-width:0;overflow-wrap:anywhere}
.endpointSwitches .endpointSubscription,.endpointSubscription{flex:0 0 auto;padding:0;border:0;margin:0}
.endpointSubscription .toggle{position:relative;min-height:32px;padding:0;font-weight:500;font-size:13px;cursor:pointer}
.endpointSubscription .toggle[data-tip]::after{left:0;right:auto;max-width:min(340px,calc(100vw - 64px))}
.endpointFeedback{flex:1 1 100%}.endpointFeedback:not(:has(:not(:empty))){display:none}
.endpointSubscription input[role="switch"]::after{display:none}
input[type=checkbox][role=switch]{appearance:none;-webkit-appearance:none;position:relative;padding:0;border:0;min-height:0;box-shadow:none;flex:0 0 36px;width:36px;min-width:36px;height:14px;margin:0 6px;border-radius:7px;background:var(--switch-unchecked-track-color,#a0a8b4);cursor:pointer;transition:background var(--speed,.15s)}
input[type=checkbox][role=switch]::before{content:"";position:absolute;top:-3px;left:-6px;transform:none;width:20px;height:20px;border-radius:50%;background:var(--switch-unchecked-button-color,#fafafa);box-shadow:0 1px 3px rgba(0,0,0,.35);transition:transform var(--speed,.15s),background var(--speed,.15s)}
input[type=checkbox][role=switch]:checked{background:color-mix(in srgb,var(--switch-checked-color,var(--primary-color,#008fac)) 50%,transparent)}
input[type=checkbox][role=switch]:checked::before{transform:translateX(28px);background:var(--switch-checked-color,var(--primary-color,#008fac))}
input[type=checkbox][role=switch]:focus-visible{outline:2px solid var(--primary-color,#008fac);outline-offset:4px}
input[type=checkbox][role=switch]:disabled{opacity:.5;cursor:default}
.navRow{margin-top:10px;padding-top:10px}
.entityTable th,.entityTable td{padding:4px 10px}
.entityTable thead th{padding-top:7px;padding-bottom:7px}
.groupToggle{padding:4px 12px;font-size:12px}
.nameCell h3{font-size:13px;line-height:1.35;max-width:100%;cursor:default}
.entityRow .stateValue{font-size:13px;line-height:1.35}
.entityRow .entityState .valueIcon{width:16px;height:16px;flex-basis:16px}
.entityRow .valueIcon svg{width:15px;height:15px}
.actionsCell .actions button{min-height:24px;padding:2px 9px}
.entityTable thead th{position:sticky;overflow:visible}
.entityTable thead th.sortable{cursor:pointer;user-select:none}.entityTable thead th.sortable:hover,.entityTable thead th[aria-sort=ascending],.entityTable thead th[aria-sort=descending]{color:var(--primary-text-color,#243346)}.sortArrow{display:inline-block;width:1em;margin-left:4px;color:var(--primary-color,#008fac)}.nodeTip.textTip{max-width:min(300px,calc(100vw - 16px))}
.colResizer{position:absolute;top:0;right:0;width:8px;height:100%;cursor:col-resize;touch-action:none;user-select:none}
.colResizer:hover{background:color-mix(in srgb,var(--secondary-text-color,#637487) 25%,transparent)}
.entityRow .stateValue{font-variant-numeric:tabular-nums}
.entityRow .stateContent,.entityRow .entityState{min-width:0}
.entityRow .stateValue{overflow:hidden;text-overflow:ellipsis}
.settingsCell .customizations{overflow:hidden}
.nodeTip{position:fixed;top:0;left:0;z-index:30;display:flex;flex-direction:column;gap:2px;max-width:min(560px,calc(100vw - 16px));padding:6px 10px;border-radius:7px;background:var(--primary-text-color,#243346);color:var(--card-background-color,#fff);font-size:12px;line-height:1.4;box-shadow:0 4px 14px rgba(0,0,0,.25);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s ease}
.nodeTip.visible{opacity:1;visibility:visible}
.nodeTipId{font-family:ui-monospace,monospace;font-size:11px;opacity:.85;overflow-wrap:anywhere}
.field .editorNodeId{display:flex;gap:8px;align-items:baseline;min-width:0;margin-top:2px;font-size:12px;font-weight:400;color:var(--secondary-text-color,#637487);cursor:text}.editorNodeIdLabel{flex:none}.editorNodeId code{min-width:0;font-family:ui-monospace,monospace;font-size:11.5px;overflow-wrap:anywhere;user-select:all;color:var(--primary-text-color,#243346)}
/* Compact desktop layout: lower buttons and fields; phones keep 44px touch targets. */
@media(min-width:651px){button{padding:5px 12px;min-height:32px}input,select{padding:5px 10px;min-height:32px}.endpointPanel{padding:12px 14px;margin-bottom:12px}.endpointMeta{gap:8px;margin-top:8px}.endpointSubscription .toggle{min-height:26px}.navRow{margin-top:8px;padding-top:8px}nav button{padding:3px 10px;min-height:28px}.viewToggle{padding:2px}.viewToggle button{padding:5px 9px;min-height:28px}.entityEditor .editorBody{padding:12px 16px;gap:10px}.entityEditor .editorSection{padding:10px 14px}.entityEditor .editorSection h3{margin-bottom:8px}.field{gap:4px}.entityForm footer{padding-top:10px;padding-bottom:10px}.entityForm footer button{min-height:32px}.entityEditor input:not([type=checkbox]),.entityEditor select{min-height:32px}}
/* Only the table scrolls; the endpoint toolbar above stays in place. A short window scrolls the whole page instead. position:relative keeps the hidden hints of the toolbar inside, so they never make the Home Assistant page scroll. */
@media(min-width:651px) and (min-height:560px){:host{height:100vh;height:100dvh}.content{overflow:hidden;position:relative}.content>.tableWrap{flex:1 1 0;min-height:200px}}
`;
class OpcuaNodePanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._filter = "all";
    this._query = "";
    this._selected = "";
    this._generation = 0;
    // Category grouping is the long-standing default; array-element and
    // path grouping are an explicit opt-in the user can switch to.
    this._groupMode = "category";
    // Folded groups survive a re-render (live data, filter, search).
    this._collapsed = new Set();
    this._subscriptionPending = new Set();
    this._subscriptionErrors = new Set();
    this._colWidths = {};
    // Column sort like the file explorer: 1st click ascending, 2nd
    // descending, 3rd back to the original order. Kept across re-renders.
    this._sort = null;
    try {
      const stored = JSON.parse(
        localStorage.getItem("ha-opcua-column-widths") || "{}",
      );
      for (const [index, width] of Object.entries(stored))
        if (
          COLUMNS[index] &&
          Number.isFinite(width) &&
          width >= COLUMNS[index].min
        )
          this._colWidths[index] = width;
    } catch {
      /* private browsing / blocked storage or bad data: default widths */
    }
    // One floating hint for the full name and NodeId of a row. It waits until
    // the pointer rests on a name, so moving across the table stays calm, and
    // it floats above the scrolling table instead of being cut off by it.
    this._tip = element("div", "", { class: "nodeTip", role: "tooltip" });
    this.shadowRoot.addEventListener("pointerover", (event) => {
      const target = event.target.closest?.("[data-node-tip], [data-float-tip]");
      if (!target || target === this._tipTarget) return;
      this._hideTip();
      this._tipTarget = target;
      this._tipTimer = setTimeout(() => this._showTip(target), 700);
    });
    this.shadowRoot.addEventListener("pointerout", (event) => {
      if (this._tipTarget && !this._tipTarget.contains(event.relatedTarget))
        this._hideTip();
    });
    this.shadowRoot.addEventListener("scroll", () => this._hideTip(), true);
    // Keyboard users get the button hints on focus, a bit sooner.
    this.shadowRoot.addEventListener("focusin", (event) => {
      const target = event.target.closest?.("[data-float-tip]");
      if (!target || !target.matches(":focus-visible")) return;
      this._hideTip();
      this._tipTarget = target;
      this._tipTimer = setTimeout(() => this._showTip(target), 300);
    });
    this.shadowRoot.addEventListener("focusout", () => this._hideTip());
    // Pressing the button answers the question the hint explained.
    this.shadowRoot.addEventListener("pointerdown", () => this._hideTip());
    try {
      const storedGroup = localStorage.getItem("ha-opcua-group-mode");
      if (storedGroup === "category" || storedGroup in GROUPINGS)
        this._groupMode = storedGroup;
    } catch {
      /* private browsing / blocked storage: keep the default */
    }
  }
  set panel(value) {
    this._panel = value;
    // A tab left open across an update keeps running the old panel code: a
    // custom element cannot be replaced without loading the page again. Do
    // that once per new build; never loop if the reload did not help.
    const build = value?.config?.build;
    if (!build || !LOADED_BUILD || build === LOADED_BUILD) return;
    try {
      if (sessionStorage.getItem("ha-opcua-panel-reload") === build) return;
      sessionStorage.setItem("ha-opcua-panel-reload", build);
    } catch {
      return; // blocked storage: no loop protection, so no automatic reload
    }
    location.reload();
  }
  get panel() {
    return this._panel;
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
      TEXT[LANGS.find((l) => this._hass?.language?.startsWith(l)) || "en"][
        key
      ] || key
    );
  }
  // A known error code has its own text; anything else says what failed
  // instead of only "failed" (HA's own "Unknown error" says nothing).
  _errorText(err) {
    if (err?.code in TEXT.en) return this._t(err.code);
    const cause =
      err?.message && err.message !== "Unknown error" ? err.message : "";
    return cause
      ? `${this._t("error")} ${this._t("errorReason")} ${cause}`
      : this._t("error");
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
  async _load(keepError = false) {
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
      if (!keepError) this._error = "";
      if (!data.endpoints.some((e) => e.entry_id === this._selected))
        this._selected = data.endpoints[0]?.entry_id || "";
      this._render();
    } catch (error) {
      if (generation !== this._generation) return;
      this._error = this._errorText(error);
      this._render();
    }
  }
  _showTip(target) {
    if (!target.isConnected) return;
    const text = target.dataset.floatTip;
    this._tip.classList.toggle("textTip", Boolean(text));
    if (text) this._tip.replaceChildren(element("span", text));
    else
      this._tip.replaceChildren(
        element("strong", target.textContent),
        element("span", target.dataset.nodeTip, { class: "nodeTipId" }),
      );
    this._tip.classList.add("visible");
    const box = target.getBoundingClientRect();
    const tip = this._tip.getBoundingClientRect();
    const below = box.bottom + 6 + tip.height <= window.innerHeight;
    this._tip.style.top = `${below ? box.bottom + 6 : box.top - 6 - tip.height}px`;
    this._tip.style.left = `${Math.max(8, Math.min(box.left, window.innerWidth - tip.width - 8))}px`;
  }
  _hideTip() {
    clearTimeout(this._tipTimer);
    this._tipTarget = null;
    this._tip.classList.remove("visible");
  }
  _render() {
    if (this._dialog?.open) return;
    const root = this.shadowRoot;
    this._hideTip();
    root.replaceChildren(element("style", CSS), this._tip);
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
      element(
        "span",
        `${this._t("panelVersion")} ${PANEL_VERSION} · Build ${PANEL_BUILD}`,
        { class: "badge version panelVersion" },
      ),
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
    const endpoint = this._endpoint();
    const endpointActions = element("div", undefined, {
      class: "endpointActions",
    });
    // One compact toolbar like the other device panels: endpoint, search and
    // the endpoint-wide actions side by side.
    toolbar.append(endpoints, search, endpointActions);
    const endpointPanel = element("section", undefined, {
      class: "endpointPanel",
    });
    endpointPanel.append(toolbar);
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
      element("span", endpoint.endpoint || endpoint.title, {
        class: "endpointAddress",
      }),
      status,
    );
    meta.append(identity);
    const add = this._button("add", () => this._add(), "primary");
    add.disabled = !endpoint.loaded;
    // The hint floats above the page and stays inside the window wherever
    // the button sits (wide toolbar, full-width buttons on a phone).
    add.dataset.floatTip = this._t("addHelp");
    add.setAttribute("aria-description", this._t("addHelp"));
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
        this._error = this._errorText(err);
      }
      await this._load();
    });
    rediscover.disabled = !endpoint.loaded;
    rediscover.dataset.floatTip = this._t("rediscoverHelp");
    rediscover.setAttribute("aria-description", this._t("rediscoverHelp"));
    endpointActions.append(add, rediscover);
    const switches = element("div", undefined, { class: "endpointSwitches" });
    const subscriptionControl = element("div", undefined, {
      class: "endpointSubscription",
    });
    // The help texts are hints on the switch label, shown after a short
    // rest of the pointer; screen readers still get them as description.
    const subscriptionLabel = element("label", undefined, {
      class: "toggle",
      "data-tip": this._t("endpointSubscriptionHelp"),
    });
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
        hidden: "",
      }),
    );
    switches.append(subscriptionControl);
    const pathControl = element("div", undefined, {
      class: "endpointSubscription",
    });
    const pathLabel = element("label", undefined, {
      class: "toggle",
      "data-tip": this._t("endpointNamePathHelp"),
    });
    const pathToggle = element("input", undefined, {
      type: "checkbox",
      role: "switch",
      "aria-label": this._t("endpointNamePath"),
      "aria-describedby": "name-path-help",
      "data-name-path-toggle": "",
    });
    pathToggle.checked = Boolean(endpoint.name_with_path);
    pathToggle.addEventListener("change", () =>
      this._setNamePath(endpoint, pathToggle),
    );
    pathLabel.append(pathToggle, element("span", this._t("endpointNamePath")));
    pathControl.append(
      pathLabel,
      element("p", this._t("endpointNamePathHelp"), {
        class: "hint",
        id: "name-path-help",
        hidden: "",
      }),
    );
    switches.append(pathControl);
    meta.append(switches);
    // Status and error of the subscription switch sit below both switches so
    // the two controls stay together.
    const subscriptionFeedback = element("div", undefined, {
      class: "endpointFeedback",
    });
    subscriptionFeedback.append(
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
    meta.append(subscriptionFeedback);
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
    if (endpoint.renamable_fields) {
      const renameCandidates = endpoint.rows.filter((row) => row.renamable);
      const rename = this._button("renameFields", () =>
        this._renameFields(renameCandidates),
      );
      rename.textContent = `${this._t("renameFields")} (${renameCandidates.length})`;
      endpointActions.append(rename);
    }
    endpointPanel.append(meta);
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
      // A platform chip reads like the entity column ("sensor", "number");
      // the translated name stays available as its hint.
      if (group !== "all") {
        button.textContent = group;
        button.dataset.tip = this._t(group);
      }
      button.textContent += ` · ${count}`;
      // The hint is CSS generated content; keep it out of the name.
      button.setAttribute("aria-label", button.textContent);
      button.setAttribute("aria-pressed", String(this._filter === group));
      nav.append(button);
    }
    const navRow = element("div", undefined, { class: "navRow" });
    navRow.append(nav);
    const navTools = element("div", undefined, { class: "navTools" });
    // Only worth offering when this endpoint actually has something to
    // group by - otherwise it is a control with no visible effect.
    const groupModes = ["category"];
    if (endpoint.rows.some((r) => r.array_group)) groupModes.push("array");
    if (endpoint.rows.some((r) => r.path_group)) groupModes.push("path");
    if (groupModes.length > 1) {
      const activeMode = this._activeGroupMode(endpoint);
      const groupToggle = element("div", undefined, {
        class: "viewToggle",
        role: "group",
        "aria-label": this._t("groupModeLabel"),
      });
      const labels = {
        category: ["groupByCategory", "groupTipCategory", "groupCategory"],
        array: ["groupByArray", "groupTipArray", "groupArray"],
        path: ["groupByPath", "groupTipPath", "groupPath"],
      };
      for (const mode of groupModes) {
        const [label, tip, icon] = labels[mode];
        const button = element("button", undefined, {
          type: "button",
          class: activeMode === mode ? "selected" : "",
          "aria-label": this._t(label),
          "aria-pressed": String(activeMode === mode),
          "data-tip": this._t(tip),
        });
        button.append(valueIcon(icon));
        button.addEventListener("click", () => {
          if (activeMode === mode) return;
          this._groupMode = mode;
          try {
            localStorage.setItem("ha-opcua-group-mode", mode);
          } catch {
            /* private browsing / blocked storage: not persisted this time */
          }
          this._render();
        });
        groupToggle.append(button);
      }
      navTools.append(groupToggle);
    }
    navRow.append(navTools);
    endpointPanel.append(navRow);
    main.append(endpointPanel);
    // One table for every entity of the endpoint, like the other device
    // panels: columns line up across all groups, the header stays visible
    // while the rows scroll.
    const wrap = element("div", undefined, { class: "tableWrap" });
    const table = element("table", undefined, { class: "entityTable" });
    // Fixed column widths: a changing value never pushes the columns next
    // to it around. Each column can be widened or narrowed by dragging the
    // edge of its header; the widths are remembered in this browser.
    const head = element("tr");
    const colgroup = element("colgroup");
    const cols = COLUMNS.map((column, index) => {
      const col = element("col");
      const width = this._colWidths[index] ?? column.width;
      if (width) col.style.width = `${width}px`;
      colgroup.append(col);
      const th = element("th", column.key ? this._t(column.key) : "", {
        scope: "col",
      });
      if (column.key) this._sortableHeader(th, column.key);
      const resizer = element("span", undefined, {
        class: "colResizer",
        "aria-hidden": "true",
      });
      resizer.addEventListener("pointerdown", (event) =>
        this._startResize(event, index, th, col, table),
      );
      th.append(resizer);
      head.append(th);
      return col;
    });
    this._fitTable(table, cols);
    const thead = element("thead");
    thead.append(head);
    table.append(colgroup, thead);
    wrap.append(table);
    this._rows = table;
    main.append(wrap);
    this._renderRows();
    main.append(element("p", this._t("info"), { class: "hint pageHint" }));
    this._paintStates();
  }
  _fitTable(table) {
    // Below the sum of all widths the table scrolls in its frame instead of
    // squeezing the columns.
    const total = COLUMNS.reduce(
      (sum, column, index) =>
        sum + (this._colWidths[index] ?? column.width ?? column.min),
      0,
    );
    table.style.minWidth = `${total}px`;
  }
  _startResize(event, index, th, col, table) {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = th.getBoundingClientRect().width;
    const onMove = (move) => {
      const width = Math.round(
        Math.max(COLUMNS[index].min, startWidth + move.clientX - startX),
      );
      this._colWidths[index] = width;
      col.style.width = `${width}px`;
      this._fitTable(table);
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      // The click that ends a drag on the header must not sort the column.
      this._resized = true;
      setTimeout(() => (this._resized = false));
      try {
        localStorage.setItem(
          "ha-opcua-column-widths",
          JSON.stringify(this._colWidths),
        );
      } catch {
        /* private browsing / blocked storage: kept for this page view */
      }
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp, { once: true });
    document.addEventListener("pointercancel", onUp, { once: true });
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
    if (settings.conversion)
      add(
        "conversion",
        this._t(settings.conversion.type),
        this._t("conversionHelp"),
      );
    if ((floating || settings.conversion) && settings.precision != null)
      add(
        "precision",
        `${this._t("precision")}: ${settings.precision}`,
        this._t("precisionHelp"),
      );
    if (
      ["sensor", "number"].includes(row.platform) &&
      settings.unit_of_measurement
    )
      add(
        "unit_of_measurement",
        `${this._t("unitBadge")}: ${settings.unit_of_measurement}`,
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
    if (settings.value_labels?.length)
      add(
        "value_labels",
        `${this._t("valueLabelsBadge")}: ${settings.value_labels.length}`,
        settings.value_labels.map((i) => `${i.value} = ${i.label}`).join(", "),
      );
    if (row.platform === "button" && (settings.pulse_ms ?? 500) !== 500)
      add("pulse_ms", `${this._t("pulseBadge")}: ${settings.pulse_ms} ms`);
    if (row.platform === "text") {
      const min = settings.min_length ?? 0;
      const max = settings.max_length ?? 255;
      if (min !== 0 || max !== 255)
        add("length", `${this._t("lengthBadge")}: ${min} – ${max}`);
    }
    // An own area only matters when it differs from the device; the
    // default (inherit) is not worth a column of its own.
    const area = row.area_id
      ? this._data.areas.find((a) => a.id === row.area_id)?.name
      : "";
    if (area) add("area", `${this._t("areaBadge")}: ${area}`);
    if (row.key && row.node_id && row.node_id !== row.key)
      add("node_id", this._t("remappedBadge"), `${row.key} → ${row.node_id}`);
    return badges.childElementCount ? badges : null;
  }
  _stateBlock(row) {
    // The live value with its icon; used in a table row and in the editor.
    const type = valueType(row);
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
    return state;
  }
  _buildRow(row) {
    const tr = element("tr", undefined, {
      class: row.orphan ? "entityRow orphan" : "entityRow",
      "data-platform": row.platform,
      "data-value-type": valueType(row),
    });
    const name = row.name || row.node_id;
    const nameCell = element("td", undefined, { class: "nameCell" });
    const nameLine = element("div", undefined, { class: "nameLine" });
    // A long name is cut to one line. Resting the pointer on it shows the
    // full name and the NodeId after a short delay.
    nameLine.append(
      element("h3", name, { "data-node-tip": row.node_id || "" }),
    );
    if (row.orphan)
      nameLine.append(
        element("span", this._t("orphan"), { class: "orphanTag" }),
      );
    if (row.manual)
      nameLine.append(
        element("span", this._t("manual"), { class: "manualTag" }),
      );
    nameCell.append(nameLine);
    // An orphan row may have no cached type (node gone, never "always available").
    const typeCell = element("td", row.variant_type || "", {
      class: "muted typeCell",
    });
    const platformCell = element("td", row.platform || "", {
      class: "platformCell",
    });
    const valueCell = element("td", undefined, { class: "valueCell" });
    valueCell.append(this._stateBlock(row));
    const settingsCell = element("td", undefined, { class: "settingsCell" });
    const customizations = this._customizations(row);
    if (customizations) settingsCell.append(customizations);
    const actionsCell = element("td", undefined, { class: "actionsCell" });
    const actions = element("div", undefined, { class: "actions" });
    let open = null;
    if (row.orphan) {
      // Nothing left to edit: the only sensible action is cleanup.
      actions.append(
        this._button("deleteEntity", () => this._removeOrphan(row), "danger"),
      );
    } else {
      // No separate edit button: the whole row opens the editor.
      if (!row.editable) tr.title = this._t("notReady");
      if (row.manual)
        actions.append(
          this._button("remove", () => this._remove(row), "danger"),
        );
      if (row.editable) open = () => this._edit(row);
    }
    actionsCell.append(actions);
    tr.append(
      nameCell,
      typeCell,
      platformCell,
      valueCell,
      settingsCell,
      actionsCell,
    );
    // Like the other device panels a click anywhere on the row opens the
    // editor; the buttons keep their own action. The row is focusable, so
    // the editor stays reachable from the keyboard (Enter or Space).
    if (open) {
      tr.classList.add("clickable");
      tr.tabIndex = 0;
      tr.setAttribute(
        "aria-label",
        `${this._t("edit")}: ${row.name || row.node_id}`,
      );
      tr.addEventListener("click", (event) => {
        if (event.target.closest("button, a, input, select")) return;
        open();
      });
      tr.addEventListener("keydown", (event) => {
        if (event.target !== tr || !["Enter", " "].includes(event.key)) return;
        event.preventDefault();
        open();
      });
    }
    return tr;
  }
  _activeGroupMode(endpoint) {
    // A stored preference only applies to an endpoint that has something
    // to group that way; any other endpoint keeps the category default.
    const grouping = GROUPINGS[this._groupMode];
    return grouping && endpoint.rows.some((r) => r[grouping.key])
      ? this._groupMode
      : "category";
  }
  _appendGroup(key, label, items, extra = {}) {
    // One table body per group: a heading row that folds the group, then
    // one row per entity. Folding is remembered across re-renders.
    const collapsed = this._collapsed.has(key);
    const body = element("tbody", undefined, {
      class: `rowGroup${extra.className ? ` ${extra.className}` : ""}${collapsed ? " collapsed" : ""}`,
      "data-platform": extra.platform || "grouped",
    });
    const headRow = element("tr", undefined, { class: "groupRow" });
    const cell = element("th", undefined, { colspan: "6", scope: "rowgroup" });
    // The count already shows in the filter chips above the table.
    const toggle = element("button", label, {
      type: "button",
      class: `groupToggle${extra.titleClass ? ` ${extra.titleClass}` : ""}`,
      "aria-expanded": String(!collapsed),
      // Own accessible name, so it never clashes with the filter button of
      // the same category above the table.
      "aria-label": `${label} – ${this._t("groupToggle")}`,
      title: this._t("groupToggle"),
    });
    toggle.addEventListener("click", () => {
      const fold = !body.classList.contains("collapsed");
      body.classList.toggle("collapsed", fold);
      toggle.setAttribute("aria-expanded", String(!fold));
      if (fold) this._collapsed.add(key);
      else this._collapsed.delete(key);
    });
    cell.append(toggle);
    headRow.append(cell);
    body.append(headRow);
    for (const row of this._sorted(items)) body.append(this._buildRow(row));
    this._rows.append(body);
  }
  _sortableHeader(th, key) {
    // Clicking a column header sorts the rows inside each group: ascending,
    // descending, then back to the original order.
    th.classList.add("sortable");
    th.tabIndex = 0;
    th.title = this._t("sortHint");
    const dir = this._sort?.key === key ? this._sort.dir : 0;
    th.setAttribute(
      "aria-sort",
      dir > 0 ? "ascending" : dir < 0 ? "descending" : "none",
    );
    th.append(
      element("span", dir > 0 ? "▲" : dir < 0 ? "▼" : "", {
        class: "sortArrow",
        "aria-hidden": "true",
      }),
    );
    const toggle = () => {
      const current = this._sort?.key === key ? this._sort.dir : 0;
      this._sort =
        current === 0 ? { key, dir: 1 } : current > 0 ? { key, dir: -1 } : null;
      for (const other of th.parentElement.querySelectorAll("th.sortable")) {
        const own = other === th && this._sort;
        other.setAttribute(
          "aria-sort",
          own ? (this._sort.dir > 0 ? "ascending" : "descending") : "none",
        );
        other.querySelector(".sortArrow").textContent = own
          ? this._sort.dir > 0
            ? "▲"
            : "▼"
          : "";
      }
      this._renderRows();
    };
    th.addEventListener("click", (event) => {
      // Dragging a column edge must not sort.
      if (event.target.closest(".colResizer") || this._resized) return;
      toggle();
    });
    th.addEventListener("keydown", (event) => {
      if (event.target !== th || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      toggle();
    });
  }
  _sortValue(row, key) {
    // Sort key per column: a number or text; empty cells always go last.
    // The value column is sorted at the moment of the click, not on every
    // new value, so rows do not jump around while the PLC updates.
    switch (key) {
      case "colName":
        return row.name || row.node_id;
      case "colType":
        return row.variant_type;
      case "colEntity":
        return row.platform;
      case "colValue": {
        const entity = this._hass?.states?.[row.entity_id];
        if (!entity || ["unavailable", "unknown"].includes(entity.state))
          return null;
        const number = Number(entity.state);
        return entity.state !== "" && Number.isFinite(number)
          ? number
          : entity.state;
      }
      case "colSettings":
        return this._customizations(row)?.textContent;
    }
    return null;
  }
  _sorted(rows) {
    if (!this._sort) return rows;
    const { key, dir } = this._sort;
    const empty = (v) => v === null || v === undefined || v === "";
    const compare = (a, b) => {
      if (typeof a === "number" && typeof b === "number") return a - b;
      // Mixed column (value): numbers before text such as "on"/"off".
      if (typeof a === "number" || typeof b === "number")
        return typeof a === "number" ? -1 : 1;
      return String(a).localeCompare(String(b), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    };
    return rows
      .map((row, index) => ({ row, index, value: this._sortValue(row, key) }))
      .sort((a, b) => {
        const ea = empty(a.value);
        const eb = empty(b.value);
        if (ea || eb) return ea === eb ? a.index - b.index : ea ? 1 : -1;
        return dir * compare(a.value, b.value) || a.index - b.index;
      })
      .map((item) => item.row);
  }
  _renderGroups(rows, grouping) {
    // Every field sharing a group key - one PLC array-of-struct element
    // (e.g. "astAlarms[10]") or one parent path (e.g. a GVL or struct
    // instance) - is shown together under one heading instead of
    // scattered across the sensor/binary_sensor/... sections above,
    // regardless of how many fields the group has or how many groups
    // there are.
    const byGroup = new Map();
    for (const row of rows) {
      if (!byGroup.has(row[grouping.key])) byGroup.set(row[grouping.key], []);
      byGroup.get(row[grouping.key]).push(row);
    }
    const groups = [...byGroup.values()].sort((a, b) =>
      a[0][grouping.label].localeCompare(b[0][grouping.label], undefined, {
        numeric: true,
      }),
    );
    // Each group folds on its own, like the platform sections above.
    for (const fields of groups) {
      fields.sort((a, b) => (a[grouping.sort] > b[grouping.sort] ? 1 : -1));
      this._appendGroup(
        `group:${fields[0][grouping.key]}`,
        fields[0][grouping.label],
        fields,
        { className: "arrayGroup", titleClass: "arrayGroupTitle" },
      );
    }
  }
  _renderRows() {
    if (!this._rows) return;
    for (const body of [...this._rows.tBodies]) body.remove();
    this._rows.parentElement.parentElement
      .querySelectorAll(":scope > .message.empty")
      .forEach((node) => node.remove());
    const endpoint = this._endpoint();
    if (!endpoint) return;
    const wrap = this._rows.parentElement;
    const showEmpty = (key) => {
      wrap.hidden = true;
      wrap.after(emptyMessage(this._t(key)));
    };
    wrap.hidden = false;
    if (!endpoint.rows.length) {
      showEmpty(endpoint.loaded ? "noNodes" : "notLoaded");
      return;
    }
    const query = this._query.toLowerCase();
    const rows = endpoint.rows.filter(
      (r) =>
        (this._filter === "all" || r.platform === this._filter) &&
        `${r.name} ${r.node_id} ${r.entity_id} ${r.path_label || ""}`
          .toLowerCase()
          .includes(query),
    );
    if (!rows.length) {
      showEmpty("empty");
      return;
    }
    // Grouping by array element only makes sense browsing everything at
    // once - a platform filter or an active search wants its own flat,
    // precise list. Grouping by path is a structure the user keeps while
    // narrowing down, so it also applies inside a platform filter or a
    // search. Either only when explicitly chosen over the default category
    // grouping.
    const mode = this._activeGroupMode(endpoint);
    const grouping =
      mode === "path" || (mode === "array" && this._filter === "all" && !query)
        ? GROUPINGS[mode]
        : null;
    const groupedRows = grouping ? rows.filter((r) => r[grouping.key]) : [];
    const ungroupedRows = grouping
      ? rows.filter((r) => !r[grouping.key])
      : rows;
    for (const group of GROUPS) {
      const items = ungroupedRows.filter((r) => r.platform === group);
      if (!items.length) continue;
      this._appendGroup(`platform:${group}`, group, items, {
        platform: group,
      });
    }
    if (groupedRows.length) this._renderGroups(groupedRows, grouping);
    this._alignSettings();
    this._paintStates();
  }
  _alignSettings() {
    // Give every setting used in the table one fixed slot: rows without it
    // keep the slot empty, and each slot is as wide as its widest badge.
    const lists = [...this._rows.querySelectorAll(".customizations")];
    if (!lists.length) return;
    const badge = (list, key) =>
      list.querySelector(`:scope > [data-setting="${key}"]`);
    const used = SETTING_SLOTS.filter((key) =>
      lists.some((list) => badge(list, key)),
    );
    // Measured outside the table: rows of a folded group have no size.
    const probeCell = element("div", undefined, { class: "settingsCell" });
    probeCell.style.cssText =
      "position:absolute;visibility:hidden;top:0;left:0;width:max-content";
    const probe = element("div", undefined, { class: "customizations" });
    probeCell.append(probe);
    this._rows.parentElement.append(probeCell);
    const widths = {};
    for (const key of used) {
      const texts = new Set(
        lists.map((list) => badge(list, key)?.textContent).filter(Boolean),
      );
      widths[key] = Math.max(
        ...[...texts].map((text) => {
          const span = element("span", text, { class: "customizationBadge" });
          probe.append(span);
          return Math.ceil(span.getBoundingClientRect().width);
        }),
      );
    }
    probeCell.remove();
    for (const list of lists) {
      for (const key of used) {
        const item =
          badge(list, key) ||
          element("span", undefined, {
            class: "settingSlot",
            "data-slot": key,
            "aria-hidden": "true",
          });
        if (widths[key]) item.style.width = `${widths[key]}px`;
        list.append(item);
      }
    }
  }
  async _setNamePath(endpoint, control) {
    control.disabled = true;
    let failed = false;
    try {
      await this._hass.callWS({
        type: "ha_opcua/endpoint/name_with_path",
        entry_id: endpoint.entry_id,
        enabled: control.checked,
      });
    } catch (err) {
      failed = true;
      this._error = this._errorText(err);
    }
    // Reloading re-reads the saved state, which puts the switch back after a
    // failed save; the failure message has to survive that reload.
    await this._load(failed);
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
      } else if (platform === "button") {
        const bit = entity.attributes?.bit_state;
        if (typeof bit === "boolean")
          label = this._t(bit ? "stateOn" : "stateOff");
        else {
          kind = "unknown";
          label = this._t("stateUnknown");
        }
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
      const card = value.closest("[data-value-type]");
      const type = card.dataset.valueType;
      let visual = kind === "value" ? type : kind;
      let tone = "neutral";
      if (kind === "value" && type === "boolean") {
        const raw =
          platform === "button"
            ? String(entity.attributes?.bit_state)
            : entity.state.toLowerCase();
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
        error.textContent = this._errorText(err);
        busy = false;
        remove.disabled = cancel.disabled = false;
        remove.textContent = `${this._t("deleteAll")} (${count})`;
      }
    });
    this.shadowRoot.append(dialog);
    dialog.showModal();
  }
  _renameFields(candidates) {
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
      element("h2", this._t("renameFieldsTitle")),
      element("p", this._t("renameFieldsHelp")),
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
        error.textContent = this._errorText(err);
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
        error.textContent = this._errorText(err);
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
        error.textContent = this._errorText(err);
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
        error.textContent = this._errorText(err);
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
        error.textContent = this._errorText(err);
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
  _searchPicker(unit, key, searchKey, pinned = []) {
    const unitField = element("div", undefined, {
      class: `field ${key === "unit" ? "unitPicker" : "nodePicker"}`,
    });
    const unitLabel = element("span", this._t(key), { id: `${key}-label` });
    const unitButton = element("button", undefined, {
      type: "button",
      class: "unitTrigger",
      "aria-label": this._t(key),
      "aria-haspopup": "listbox",
      "aria-expanded": "false",
      "aria-controls": `${key}-options`,
    });
    const unitMenu = element("div", undefined, {
      class: "unitMenu",
      hidden: "",
    });
    const unitFilter = element("input", undefined, {
      type: "search",
      placeholder: this._t(searchKey),
      "aria-label": this._t(searchKey),
      role: "combobox",
      "aria-expanded": "false",
      "aria-controls": `${key}-options`,
      "aria-autocomplete": "list",
      autocomplete: "off",
    });
    const unitList = element("div", undefined, {
      id: `${key}-options`,
      role: "listbox",
      tabindex: "-1",
      "aria-labelledby": `${key}-label`,
      class: key === "unit" ? "pickerOptions unitOptions" : "pickerOptions",
    });
    const empty = element("div", this._t("noMatches"), {
      class: "hint",
      role: "status",
      hidden: "",
    });
    unitMenu.append(unitFilter, unitList, empty);
    unit.hidden = true;
    unitField.append(unitLabel, unitButton, unitMenu, unit);
    let activeUnit = -1;
    const closeUnits = (focus = false) => {
      unitMenu.hidden = true;
      unitButton.setAttribute("aria-expanded", "false");
      unitFilter.setAttribute("aria-expanded", "false");
      unitFilter.removeAttribute("aria-activedescendant");
      if (focus) unitButton.focus();
    };
    const markUnit = (index) => {
      const options = [...unitList.children];
      activeUnit = options.length
        ? Math.max(0, Math.min(index, options.length - 1))
        : -1;
      options.forEach((option, i) =>
        option.classList.toggle("active", i === activeUnit),
      );
      if (options[activeUnit]) {
        unitFilter.setAttribute(
          "aria-activedescendant",
          options[activeUnit].id,
        );
        options[activeUnit].scrollIntoView({ block: "nearest" });
      }
    };
    const populateUnits = () => {
      unitList.replaceChildren();
      for (const option of unit.options) {
        if (
          !pinned.includes(option.value) &&
          !option.textContent
            .toLowerCase()
            .includes(unitFilter.value.toLowerCase())
        )
          continue;
        const item = element("div", option.textContent, {
          role: "option",
          id: `${key}-option-${unitList.children.length}`,
          "aria-selected": String(option.value === unit.value),
        });
        item.addEventListener("mousedown", (event) => event.preventDefault());
        item.addEventListener("click", () => {
          unit.value = option.value;
          unit.dispatchEvent(new Event("change"));
          closeUnits(true);
        });
        unitList.append(item);
      }
      empty.hidden = unitList.children.length > 0;
      activeUnit = -1;
      unitFilter.removeAttribute("aria-activedescendant");
    };
    const openUnits = () => {
      unitMenu.hidden = false;
      unitButton.setAttribute("aria-expanded", "true");
      unitFilter.setAttribute("aria-expanded", "true");
      unitFilter.value = "";
      populateUnits();
      unitFilter.focus();
      unitMenu.scrollIntoView({ block: "nearest" });
    };
    unitButton.addEventListener("click", () =>
      unitMenu.hidden ? openUnits() : closeUnits(),
    );
    unitButton.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        openUnits();
      }
    });
    unitFilter.addEventListener("input", populateUnits);
    unitField.addEventListener("keydown", (event) => {
      if (unitMenu.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeUnits(true);
      } else if (
        event.target === unitFilter &&
        ["ArrowDown", "ArrowUp", "Home", "End", "Enter"].includes(event.key)
      ) {
        event.preventDefault();
        if (event.key === "Enter") {
          if (activeUnit >= 0) unitList.children[activeUnit].click();
        } else
          markUnit(
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? unitList.children.length - 1
                : activeUnit + (event.key === "ArrowDown" ? 1 : -1),
          );
      }
    });
    unitField.addEventListener("focusout", (event) => {
      if (!unitField.contains(event.relatedTarget)) closeUnits();
    });
    const refresh = () => {
      unitButton.textContent =
        unit.selectedOptions[0]?.textContent || this._t("noMatches");
      unitButton.disabled = unit.disabled || !unit.options.length;
      if (unitButton.disabled) closeUnits();
    };
    unit.addEventListener("change", refresh);
    refresh();
    return {
      field: unitField,
      button: unitButton,
      filter: unitFilter,
      close: closeUnits,
      refresh,
    };
  }
  _edit(row, manual = null, endpoint = this._endpoint()) {
    row = { ...row };
    const revision = endpoint.revision;
    const dialog = element("dialog", undefined, {
      class: "entityEditor",
      "aria-labelledby": "entity-editor-title",
    });
    this._dialog = dialog;
    const form = element("form", undefined, { class: "entityForm" });
    const body = element("div", undefined, { class: "editorBody" });
    form.append(body);
    dialog.append(form);
    const heading = element("div", undefined, { class: "editorHeading" });
    heading.append(
      element(
        "h2",
        `${this._t(manual ? "add" : "edit")} · ${row.name || row.node_id}`,
        { id: "entity-editor-title" },
      ),
      element("div", endpoint.title || endpoint.name || row.node_id, {
        class: "hint",
      }),
    );
    const headingText = element("div", undefined, {
      class: "editorHeadingText",
    });
    headingText.append(...heading.childNodes);
    heading.append(headingText);
    if (!manual) {
      const preview = element("div", undefined, {
        class: "card editorState",
        "data-platform": row.platform,
        "data-value-type": valueType(row),
      });
      preview.append(this._stateBlock(row));
      heading.append(preview);
    }
    form.prepend(heading);
    const section = (key) => {
      const section = element("section", undefined, { class: "editorSection" });
      const title = element("h3", this._t(key));
      title.prepend(
        valueIcon(
          {
            identitySection: "text",
            sourceSection: "numeric",
            valueSection: "datetime",
            updatesSection: "on",
          }[key],
        ),
      );
      section.append(title);
      const grid = element("div", undefined, { class: "editorFields" });
      section.append(grid);
      body.append(section);
      return grid;
    };
    const identitySection = section("identitySection");
    const sourceSection = section("sourceSection");
    const valueSection = section("valueSection");
    const updatesSection = section("updatesSection");
    const name = element("input", undefined, {
      type: "text",
      maxlength: "255",
      name: "name",
    });
    name.value = row.custom_name ?? "";
    name.placeholder = row.name || "";
    const nameField = this._field("name", name);
    // The NodeId behind the entity, directly below the name input and
    // selectable for copying; a manual entity picks its node further down.
    if (!manual && row.node_id) {
      const nodeLine = element("div", undefined, { class: "editorNodeId" });
      nodeLine.append(
        element("span", this._t("colNode"), { class: "editorNodeIdLabel" }),
        element("code", row.node_id),
      );
      // Selecting the NodeId must not hand the click on to the name input.
      nodeLine.addEventListener("click", (event) => event.preventDefault());
      nameField.append(nodeLine);
    }
    identitySection.append(
      nameField,
      element("p", this._t("nameHelp"), { class: "hint" }),
    );
    const area = element("select", undefined, { name: "area" });
    area.append(element("option", this._t("inherit"), { value: "" }));
    for (const item of this._data.areas)
      area.append(element("option", item.name, { value: item.id }));
    area.value = row.area_id || "";
    identitySection.append(this._field("area", area));
    const availableNodes = manual ? [manual.node] : endpoint.nodes;
    const originalPlatform = row.platform;
    const category = element("select");
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
        ...[
          "binary_sensor",
          "switch",
          "button",
          "number",
          "select",
          "text",
          "datetime",
        ].filter((platform) => compatible({ platform }, node)),
        ...(manual ? [] : ["disabled"]),
      ];
    };
    // What "auto" stands for on a node, as the integration maps it: a
    // writable Boolean is a switch, a writable DateTime a datetime, anything
    // else a sensor.
    const autoPlatform = (node) =>
      node?.writable
        ? { Boolean: "switch", DateTime: "datetime" }[node.variant_type] ||
          "sensor"
        : "sensor";
    const populateCategories = (
      chosen = category.value || row.settings?.platform || row.platform,
    ) => {
      const node =
        selectedNode() || availableNodes.find((n) => n.node_id === row.node_id);
      const allowed = choices(node);
      const label = (p) => {
        // Platform IDs as in the group headings; only the pseudo choices
        // "auto" and "disabled" keep a translated label. "Auto" also names
        // the category it currently resolves to, e.g. "Automatic (sensor)".
        if (p === "auto")
          return node
            ? `${this._t("auto")} (${autoPlatform(node)})`
            : this._t("auto");
        return p === "disabled" ? this._t(p) : p;
      };
      category.replaceChildren(
        ...allowed.map((p) => element("option", label(p), { value: p })),
      );
      category.value = allowed.includes(chosen) ? chosen : allowed[0];
    };
    const populate = () => {
      const chosen = nodes.value || row.node_id;
      nodes.replaceChildren();
      for (const node of availableNodes.filter((n) =>
        compatible({ platform: category.value }, n),
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
    identitySection.append(this._field("category", category));
    const categoryHelp = element("p", "", { class: "hint" });
    identitySection.append(categoryHelp);
    nodes.disabled = !!manual;
    const nodePicker = manual
      ? null
      : this._searchPicker(nodes, "node", "filterNodes");
    sourceSection.append(
      nodePicker ? nodePicker.field : this._field("node", nodes),
    );
    if (!manual)
      sourceSection.append(
        element("p", this._t("nodeHelp"), { class: "hint" }),
      );
    const effective = () =>
      category.value === "auto" ? autoPlatform(selectedNode()) : category.value;
    const limitInputs = {};
    const limitGroups = {};
    const initial = row.settings || {};
    const updateMode = element("select", undefined, { name: "update_mode" });
    for (const mode of ["polling", "subscription"])
      updateMode.append(element("option", this._t(mode), { value: mode }));
    updateMode.value = initial.update_mode || "polling";
    updatesSection.append(
      this._field("updateMode", updateMode),
      element("p", this._t("updateModeHelp"), { class: "hint" }),
    );
    const alwaysAvailable = element("input", undefined, {
      type: "checkbox",
      name: "always_available",
      role: "switch",
      "aria-label": this._t("alwaysAvailable"),
    });
    alwaysAvailable.checked = initial.always_available === true;
    const availabilityToggle = element("label", undefined, {
      class: "toggle editorSwitch",
    });
    availabilityToggle.append(
      alwaysAvailable,
      element("span", this._t("alwaysAvailable")),
    );
    updatesSection.append(
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
      valueSection.append(group);
    }
    const limitsHelp = element("p", this._t("limitsHelp"), { class: "hint" });
    valueSection.append(limitsHelp);
    // Value table (raw integer -> text) for a select or an integer sensor.
    const valueTable = element("div", undefined, { class: "valueTable" });
    const valueTableHead = element("span", this._t("valueLabels"));
    const valueTableField = element("div", undefined, {
      class: "valueTableField",
    });
    const valueTableLabel = element("div", undefined, {
      class: "field tableLabel",
    });
    valueTableLabel.append(valueTableHead);
    const valueTableRows = element("div", undefined, { class: "valueTable" });
    const tableRows = () =>
      [...valueTableRows.querySelectorAll(".valueTableRow")].map((line) => ({
        value: Number(line.querySelector("[name=value_label_value]").value),
        label: line.querySelector("[name=value_label_text]").value,
      }));
    const addTableRow = (entry = {}) => {
      const line = element("div", undefined, { class: "valueTableRow" });
      const value = element("input", undefined, {
        type: "number",
        step: "1",
        name: "value_label_value",
        required: "",
        "aria-label": this._t("rawValue"),
      });
      value.value = entry.value ?? "";
      const text = element("input", undefined, {
        type: "text",
        name: "value_label_text",
        maxlength: "64",
        required: "",
        "aria-label": this._t("labelText"),
      });
      text.value = entry.label ?? "";
      const remove = element("button", "✕", {
        type: "button",
        class: "danger",
        title: this._t("removeValueLabel"),
        "aria-label": this._t("removeValueLabel"),
      });
      remove.addEventListener("click", () => {
        line.remove();
        updateFields();
      });
      const valueField = this._field("rawValue", value);
      const textField = this._field("labelText", text);
      line.append(valueField, textField, remove);
      valueTableRows.append(line);
      return line;
    };
    for (const entry of initial.value_labels || []) addTableRow(entry);
    const addRow = element("button", this._t("addValueLabel"), {
      type: "button",
    });
    addRow.addEventListener("click", () => {
      const used = tableRows()
        .map((r) => r.value)
        .filter(Number.isFinite);
      const line = addTableRow({
        value: used.length ? Math.max(...used) + 1 : 0,
      });
      updateFields();
      line.querySelector("[name=value_label_text]").focus();
    });
    valueTable.append(valueTableRows, addRow);
    valueTableLabel.append(valueTable);
    valueTableField.append(valueTableLabel);
    const valueTableHelp = element("p", "", { class: "hint" });
    valueSection.append(valueTableField, valueTableHelp);
    const pulse = element("input", undefined, {
      type: "number",
      name: "pulse_ms",
      min: "50",
      max: "10000",
      step: "1",
    });
    pulse.value = initial.pulse_ms ?? 500;
    const pulseField = this._field("pulseMs", pulse);
    const pulseHelp = element("p", this._t("pulseHelp"), { class: "hint" });
    valueSection.append(pulseField, pulseHelp);
    const conversion = element("select", undefined, { name: "conversion" });
    for (const kind of ["none", "multiplier", "linear_scale"])
      conversion.append(
        element("option", this._t(kind === "none" ? "conversionNone" : kind), {
          value: kind,
        }),
      );
    conversion.value = initial.conversion?.type || "none";
    const conversionField = this._field("conversion", conversion);
    const conversionHelp = element("p", this._t("conversionHelp"), {
      class: "hint",
    });
    const conversionInputs = {};
    const conversionGroup = element("div", undefined, { class: "limits" });
    for (const [key, fallback] of Object.entries({
      factor: 1,
      plc_min: 0,
      plc_max: 100,
      ha_min: 0,
      ha_max: 100,
    })) {
      const input = element("input", undefined, {
        type: "number",
        step: "any",
        name: key,
      });
      input.value = initial.conversion?.[key] ?? fallback;
      conversionInputs[key] = input;
      conversionGroup.append(this._field(key, input));
    }
    valueSection.append(conversionField, conversionHelp, conversionGroup);
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
    valueSection.append(precisionField, precisionHelp);
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
    updatesSection.append(deadbandField, deadbandHelp);
    const UNIT_CUSTOM = "__custom__";
    const unit = element("select", undefined, {
      name: "unit_choice",
      hidden: "",
    });
    unit.append(element("option", this._t("none"), { value: "" }));
    for (const value of this._data.units)
      unit.append(element("option", value, { value }));
    unit.append(
      element("option", this._t("unitCustom"), { value: UNIT_CUSTOM }),
    );
    unit.value = this._data.units.includes(initial.unit_of_measurement)
      ? initial.unit_of_measurement
      : initial.unit_of_measurement
        ? UNIT_CUSTOM
        : "";
    const {
      field: unitField,
      button: unitButton,
      filter: unitFilter,
      close: closeUnits,
    } = this._searchPicker(unit, "unit", "filterUnits", ["", UNIT_CUSTOM]);
    const unitHelp = element("p", this._t("unitHelp"), { class: "hint" });
    const unitCustom = element("input", undefined, {
      type: "text",
      name: "unit_of_measurement",
      maxlength: "50",
    });
    unitCustom.value = this._data.units.includes(initial.unit_of_measurement)
      ? ""
      : initial.unit_of_measurement || "";
    const unitCustomField = this._field("unitCustomLabel", unitCustom);
    const updateUnitCustomVisibility = () => {
      unitButton.textContent = unit.selectedOptions[0].textContent;
      unitCustomField.hidden = unitField.hidden || unit.value !== UNIT_CUSTOM;
      unitCustom.disabled = unitCustomField.hidden;
      if (unitCustomField.parentElement?.classList.contains("editorFieldGroup"))
        unitCustomField.parentElement.hidden = unitCustomField.hidden;
    };
    unit.addEventListener("change", updateUnitCustomVisibility);
    valueSection.append(unitField, unitHelp, unitCustomField);
    const deviceClass = element("select", undefined, { name: "device_class" });
    deviceClass.append(element("option", this._t("none"), { value: "" }));
    const classesFor = (platform) => {
      const classes = this._data.device_classes[platform] || [];
      return platform === "sensor" &&
        selectedNode()?.variant_type === "DateTime"
        ? classes.filter((cls) => cls === "timestamp")
        : classes;
    };
    for (const cls of classesFor(effective()))
      deviceClass.append(
        element(
          "option",
          this._hass.localize?.(
            `component.${effective()}.entity_component.${cls}.name`,
          ) || cls,
          { value: cls },
        ),
      );
    deviceClass.value = row.device_class || "";
    const classField = this._field("deviceClass", deviceClass);
    valueSection.insertBefore(classField, unitCustomField);
    const invert = element("input", undefined, {
      type: "checkbox",
      name: "invert",
      role: "switch",
      "aria-label": this._t("invert"),
    });
    invert.checked = row.invert_state;
    const toggle = element("label", undefined, {
      class: "toggle editorSwitch",
    });
    toggle.append(invert, element("span", this._t("invert")));
    const invertHelp = element("p", this._t("invertHelp"), { class: "hint" });
    valueSection.append(toggle, invertHelp);
    const updateFields = () => {
      const platform = effective();
      nodePicker?.refresh();
      const tableVisible =
        ["select", "sensor"].includes(platform) &&
        INTEGER.has(selectedNode()?.variant_type);
      valueTableField.hidden = valueTableHelp.hidden = !tableVisible;
      for (const input of valueTableRows.querySelectorAll("input"))
        input.disabled = !tableVisible;
      valueTableHelp.textContent = this._t(
        platform === "select" ? "valueLabelsHelp" : "valueLabelsSensorHelp",
      );
      // Texts replace the number: no conversion, unit or device class.
      const labelled =
        tableVisible &&
        (platform === "select" || valueTableRows.childElementCount > 0);
      pulseField.hidden = pulseHelp.hidden = platform !== "button";
      pulse.disabled = pulseField.hidden;
      pulse.required = !pulse.disabled;
      const classes = labelled ? [] : classesFor(platform);
      const configuredClass = deviceClass.value;
      classField.hidden = classes.length === 0;
      deviceClass.replaceChildren(
        element("option", this._t("none"), { value: "" }),
      );
      for (const cls of classes)
        deviceClass.append(
          element(
            "option",
            this._hass.localize?.(
              `component.${platform}.entity_component.${cls}.name`,
            ) || cls,
            { value: cls },
          ),
        );
      deviceClass.value = classes.includes(configuredClass)
        ? configuredClass
        : "";
      conversionField.hidden = conversionHelp.hidden =
        labelled || !NUMERIC.has(selectedNode()?.variant_type);
      conversion.disabled = conversionField.hidden;
      conversionGroup.hidden =
        conversion.disabled || conversion.value === "none";
      for (const [key, input] of Object.entries(conversionInputs)) {
        const visible =
          !conversionGroup.hidden &&
          (conversion.value === "multiplier"
            ? key === "factor"
            : key !== "factor");
        input.parentElement.hidden = !visible;
        input.disabled = !visible;
        input.required = visible;
      }
      precisionField.hidden = precisionHelp.hidden = !(
        ["Float", "Double"].includes(selectedNode()?.variant_type) ||
        (!conversion.disabled && conversion.value !== "none")
      );
      precision.disabled = precisionField.hidden;
      // Any numeric node shown as number or sensor: a read-only float has
      // exactly the same push-noise problem as a writable one.
      deadbandField.hidden = deadbandHelp.hidden = !(
        updateMode.value === "subscription" &&
        ["number", "sensor"].includes(platform) &&
        NUMERIC.has(selectedNode()?.variant_type)
      );
      deadband.disabled = deadbandField.hidden;
      unitField.hidden = unitHelp.hidden = !(
        !labelled &&
        ["number", "sensor"].includes(platform) &&
        NUMERIC.has(selectedNode()?.variant_type)
      );
      unit.disabled =
        unitButton.disabled =
        unitFilter.disabled =
          unitField.hidden;
      if (unitField.hidden) closeUnits();
      updateUnitCustomVisibility();
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
      for (const [info, help] of helpPairs) info.hidden = help.hidden;
      for (const wrap of body.querySelectorAll(".editorFieldGroup"))
        wrap.hidden = [...wrap.children].every((child) => child.hidden);
      for (const section of body.querySelectorAll(".editorSection"))
        section.hidden = [
          ...section.querySelector(".editorFields").children,
        ].every((child) => child.hidden);
      categoryHelp.textContent = this._t(
        platform === "disabled" ? "excludeHelp" : "categoryHelp",
      );
    };
    for (const [label, short] of [
      [availabilityToggle, "availabilityShort"],
      [toggle, "invertShort"],
    ]) {
      const copy = label.querySelector("span");
      copy.classList.add("switchCopy");
      copy.append(element("small", this._t(short)));
    }
    conversion.addEventListener("change", updateFields);
    // Keep related fields adjacent: unit and class share a row on desktop.
    valueSection.append(precisionField, precisionHelp);
    const helpPairs = [];
    for (const grid of [
      identitySection,
      sourceSection,
      valueSection,
      updatesSection,
    ]) {
      for (const child of [...grid.children]) {
        if (child.classList.contains("hint")) continue;
        const help = child.nextElementSibling?.classList.contains("hint")
          ? child.nextElementSibling
          : null;
        const wrap = element("div", undefined, { class: "editorFieldGroup" });
        grid.insertBefore(wrap, child);
        wrap.append(child);
        if (help) {
          // The help sits behind the field's own label as a small "i" and
          // opens as a tooltip on hover or keyboard focus, so it costs no
          // extra line below every field.
          const labelText = child.querySelector("span");
          const info = element("span", undefined, {
            class: "helpTip",
            tabindex: "0",
            "aria-label": `${this._t("moreInfo")}: ${labelText?.firstChild?.textContent || this._t("valueSection")}`,
          });
          info.append(
            element("span", "i", { class: "infoDot", "aria-hidden": "true" }),
            help,
          );
          help.setAttribute("role", "tooltip");
          // Inside a <label>, a click would otherwise focus the input or
          // flip the switch the label belongs to.
          info.addEventListener("click", (event) => event.preventDefault());
          if (labelText?.firstChild) labelText.firstChild.after(info);
          else wrap.append(info);
          helpPairs.push([info, help]);
        }
        if (
          child.contains(name) ||
          child.classList.contains("limits") ||
          child === valueTableField ||
          child === availabilityToggle ||
          child === toggle ||
          child.contains(nodes) ||
          child.contains(updateMode)
        )
          wrap.classList.add("wide");
      }
    }
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
          ...(!conversion.disabled || initial.conversion
            ? {
                conversion:
                  conversion.disabled || conversion.value === "none"
                    ? null
                    : {
                        type: conversion.value,
                        ...Object.fromEntries(
                          Object.entries(conversionInputs)
                            .filter(([, input]) => !input.disabled)
                            .map(([key, input]) => [key, Number(input.value)]),
                        ),
                      },
              }
            : {}),
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
          ...(!valueTableField.hidden ? { value_labels: tableRows() } : {}),
          ...(!pulse.disabled ? { pulse_ms: Number(pulse.value) } : {}),
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
          ...(!unit.disabled || initial.unit_of_measurement != null
            ? {
                unit_of_measurement: unit.disabled
                  ? null
                  : unit.value === UNIT_CUSTOM
                    ? unitCustom.value.trim() || null
                    : unit.value || null,
              }
            : {}),
          name: name.value,
          area_id: area.value || null,
          node_id: nodes.value,
          device_class: !classField.hidden ? deviceClass.value || null : null,
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
        error.textContent = this._errorText(err);
      } finally {
        saving = false;
        save.disabled = cancel.disabled = false;
        save.textContent = this._t("save");
      }
    });
    this.shadowRoot.append(dialog);
    dialog.showModal();
    this._paintStates();
    name.focus();
  }
}
if (!customElements.get("opcua-node-panel"))
  customElements.define("opcua-node-panel", OpcuaNodePanel);
