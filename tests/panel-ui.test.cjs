const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { chromium } = require("playwright");
let browser;
before(async () => {
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: process.env.CHROMIUM_PATH
      ? ["--no-sandbox", "--disable-dev-shm-usage"]
      : [],
  });
});
after(async () => {
  await browser?.close();
});

async function selectNode(dialog, id) {
  await dialog
    .getByRole("button", { name: "NodeId associato", exact: true })
    .click();
  await dialog
    .getByRole("combobox", { name: "Cerca tra i nodi scoperti", exact: true })
    .fill(id);
  await dialog
    .locator(".nodePicker [role=option]")
    .filter({ hasText: id })
    .click();
}

async function pageFor(width = 1280, admin = true) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.setContent(
    '<html lang="it"><body style="margin:0;height:100vh"><opcua-node-panel></opcua-node-panel></body></html>',
  );
  await page.addScriptTag({
    path: path.resolve("custom_components/ha_opcua/www/panel.js"),
  });
  await page.evaluate((admin) => {
    const nodes = [
      {
        name: "Marcia",
        node_id: "ns=4;i=1",
        variant_type: "Boolean",
        writable: true,
      },
      {
        name: "Consenso",
        node_id: "ns=4;i=2",
        variant_type: "Boolean",
        writable: true,
      },
      {
        name: "Velocità linea",
        node_id: "ns=4;i=3",
        variant_type: "Float",
        writable: false,
      },
      {
        name: "Ricetta",
        node_id: "ns=4;i=4",
        variant_type: "String",
        writable: true,
      },
    ];
    const rows = [
      {
        key: "ns=4;i=1",
        name: "Marcia macchina",
        entity_id: "switch.marcia",
        node_id: "ns=4;i=1",
        platform: "switch",
        variant_type: "Boolean",
        invert_state: false,
        device_class: null,
        editable: true,
        custom_name: null,
        area_id: null,
      },
      {
        key: "ns=4;i=2",
        name: "Porta protezione",
        entity_id: "binary_sensor.porta",
        node_id: "ns=4;i=2",
        platform: "binary_sensor",
        variant_type: "Boolean",
        invert_state: false,
        device_class: "door",
        editable: true,
        custom_name: null,
        area_id: null,
      },
      {
        key: "ns=4;i=3",
        name: "Velocità linea",
        entity_id: "sensor.velocita",
        node_id: "ns=4;i=3",
        platform: "sensor",
        variant_type: "Float",
        invert_state: false,
        device_class: null,
        editable: true,
        custom_name: null,
        area_id: null,
      },
      {
        key: "ns=4;i=4",
        name: "Nome ricetta",
        entity_id: "text.ricetta",
        node_id: "ns=4;i=4",
        platform: "text",
        variant_type: "String",
        invert_state: false,
        device_class: null,
        editable: true,
        custom_name: null,
        area_id: "workshop",
      },
    ];
    window.calls = [];
    window.serviceCalls = [];
    window.fixture = {
      version: "2.1.0",
      endpoints: [
        {
          entry_id: "plc1",
          title: "Aspo fermapiedi",
          endpoint: "opc.tcp://192.168.20.12:4840",
          loaded: true,
          connected: true,
          revision: "rev1",
          nodes,
          rows,
          status_entity: "binary_sensor.connection",
          subscription_entity: "switch.subscription1",
        },
        {
          entry_id: "plc2",
          title: "Carroponte A",
          endpoint: "opc.tcp://192.168.20.13:4840",
          loaded: true,
          connected: false,
          revision: "rev2",
          nodes: [],
          rows: [],
          status_entity: "binary_sensor.connection2",
          subscription_entity: "switch.subscription2",
        },
      ],
      areas: [{ id: "workshop", name: "Officina" }],
      device_classes: {
        binary_sensor: ["door", "motion", "problem"],
        number: ["power"],
        sensor: ["temperature", "timestamp"],
        switch: ["outlet", "switch"],
      },
      units: ["%", "Hz", "bar", "kWh", "l/min", "°C"],
    };
    window.testHass = {
      language: "it",
      user: { is_admin: admin },
      states: {
        "switch.subscription1": { state: "off", attributes: {} },
        "switch.subscription2": { state: "on", attributes: {} },
      },
      callService: async (domain, service, data) => {
        window.serviceCalls.push({
          domain,
          service,
          data: structuredClone(data),
        });
        if (window.holdService)
          await new Promise((resolve) => {
            window.releaseService = resolve;
          });
        if (window.failService) throw new Error("service failed");
        window.testHass.states = {
          ...window.testHass.states,
          [data.entity_id]: {
            state: service === "turn_on" ? "on" : "off",
            attributes: {},
          },
        };
        document.querySelector("opcua-node-panel").hass = {
          ...window.testHass,
        };
      },
      localize: () => "",
      callWS: async (msg) => {
        window.calls.push(structuredClone(msg));
        if (msg.type.endsWith("/panel")) return structuredClone(window.fixture);
        if (msg.type.endsWith("/inspect")) {
          if (window.inspectResult)
            return structuredClone(window.inspectResult);
          if (window.failInspect) throw { code: "node_unreadable" };
          return {
            node: {
              name: "Nodo manuale",
              node_id: msg.node_id,
              variant_type: "Boolean",
              writable: true,
            },
            platforms: ["sensor", "binary_sensor", "switch"],
          };
        }
        if (msg.type.endsWith("/remove")) {
          if (window.failRemove) throw { code: window.failRemove };
          const endpoint = window.fixture.endpoints.find(
            (e) => e.entry_id === msg.entry_id,
          );
          endpoint.rows = endpoint.rows.filter((r) => r.key !== msg.key);
          endpoint.revision = "removed";
          return { removed: true, reload: false };
        }
        if (msg.type.endsWith("/create")) {
          if (window.failCreate) throw { code: "node_already_configured" };
          return { saved: true, reload: false };
        }
        if (msg.type.endsWith("/reclassify_boolean_sensors")) {
          if (window.failReclassify) throw { code: window.failReclassify };
          const endpoint = window.fixture.endpoints.find(
            (e) => e.entry_id === msg.entry_id,
          );
          const reclassified = [];
          for (const key of msg.keys) {
            const row = endpoint.rows.find(
              (r) => r.key === key && r.reclassifiable,
            );
            if (!row) continue;
            row.platform = "binary_sensor";
            row.reclassifiable = false;
            reclassified.push(key);
          }
          endpoint.revision = "reclassified";
          return { reclassified };
        }
        if (msg.type.endsWith("/name_with_path")) {
          if (window.failNamePath) throw { code: window.failNamePath };
          const endpoint = window.fixture.endpoints.find(
            (e) => e.entry_id === msg.entry_id,
          );
          endpoint.name_with_path = msg.enabled;
          return { name_with_path: msg.enabled };
        }
        if (msg.type.endsWith("/rename_array_fields")) {
          if (window.failRename) throw { code: window.failRename };
          const endpoint = window.fixture.endpoints.find(
            (e) => e.entry_id === msg.entry_id,
          );
          const renamed = [];
          for (const key of msg.keys) {
            const row = endpoint.rows.find((r) => r.key === key && r.renamable);
            if (!row) continue;
            row.name = row.proposed_name;
            row.custom_name = row.proposed_name;
            row.renamable = false;
            renamed.push(key);
          }
          endpoint.revision = "renamed";
          return { renamed };
        }
        if (window.failSave) throw { code: "stale_configuration" };
        const endpoint = window.fixture.endpoints.find(
          (e) => e.entry_id === msg.entry_id,
        );
        const row = endpoint.rows.find((r) => r.key === msg.key);
        Object.assign(row, {
          platform:
            msg.platform === "auto"
              ? row.platform
              : msg.platform || row.platform,
          settings: {
            ...row.settings,
            platform: msg.platform,
            update_mode: msg.update_mode,
            ...(Object.hasOwn(msg, "deadband")
              ? { deadband: msg.deadband }
              : {}),
            ...msg.limits,
            ...(Object.hasOwn(msg, "always_available")
              ? { always_available: msg.always_available }
              : {}),
            ...(Object.hasOwn(msg, "conversion")
              ? { conversion: msg.conversion }
              : {}),
            ...(Object.hasOwn(msg, "precision")
              ? { precision: msg.precision }
              : {}),
            ...(Object.hasOwn(msg, "unit_of_measurement")
              ? { unit_of_measurement: msg.unit_of_measurement }
              : {}),
          },
          name: msg.name || row.name,
          custom_name: msg.name,
          area_id: msg.area_id,
          node_id: msg.node_id,
          invert_state: msg.invert_state,
          device_class: msg.device_class,
        });
        endpoint.revision = "updated";
        return { saved: true, reload: false };
      },
    };
    document.querySelector("opcua-node-panel").hass = window.testHass;
  }, admin);
  await page
    .getByRole("heading", { name: "OPC UA Connect", exact: true })
    .waitFor();
  if (admin) await page.locator("tr.entityRow").first().waitFor();
  return page;
}
async function shot(page, name) {
  if (!process.env.PANEL_SCREENSHOTS) return;
  fs.mkdirSync(process.env.PANEL_SCREENSHOTS, { recursive: true });
  await page.screenshot({
    path: path.join(process.env.PANEL_SCREENSHOTS, name),
    fullPage: true,
  });
}

test("desktop categories, search, endpoint selection and safe text rendering", async () => {
  const page = await pageFor();
  assert.equal(await page.locator("tr.entityRow").count(), 4);
  assert.equal(
    await page.locator(".integrationVersion").textContent(),
    "Integrazione 2.1.0",
  );
  assert.equal(
    await page.locator(".panelVersion").textContent(),
    "Pannello 1.17.0 · Build 20261117.5",
  );
  assert.equal(
    await page.getByRole("button", { name: "Menu", exact: true }).count(),
    0,
  );
  await page.setViewportSize({ width: 870, height: 900 });
  assert.equal(
    await page.getByRole("button", { name: "Menu", exact: true }).isVisible(),
    true,
  );
  await page.setViewportSize({ width: 871, height: 900 });
  assert.equal(
    await page.getByRole("button", { name: "Menu", exact: true }).count(),
    0,
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await shot(page, "desktop.png");
  await page
    .getByRole("button", { name: "binary_sensor · 1", exact: true })
    .click();
  assert.equal(await page.locator("tr.entityRow").count(), 1);
  await page.getByRole("button", { name: "Tutte · 4", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Cerca nome o NodeId", exact: true })
    .fill("ns=4;i=4");
  assert.equal(await page.locator("tr.entityRow").count(), 1);
  await page
    .getByRole("searchbox", { name: "Cerca nome o NodeId", exact: true })
    .fill("");
  await page.evaluate(() => {
    window.fixture.endpoints[0].rows[0].name = "<img src=x onerror=alert(1)>";
  });
  await page.getByRole("button", { name: "Aggiorna", exact: true }).click();
  await page
    .getByRole("heading", { name: "<img src=x onerror=alert(1)>" })
    .waitFor();
  assert.equal(await page.locator("img").count(), 0);
  await page.getByLabel("Endpoint", { exact: true }).selectOption("plc2");
  assert.equal(await page.locator("tr.entityRow").count(), 0);
  await page.getByText("Disconnesso", { exact: true }).waitFor();
  await page.close();
});

test("editing saves correct fields and live hass updates preserve draft", async () => {
  const page = await pageFor();
  await page
    .locator("tr.entityRow")
    .filter({ hasText: "Porta protezione" })
    .locator("td.typeCell")
    .click();
  const dialog = page.locator("dialog");
  await dialog.getByLabel("Nome", { exact: true }).fill("Porta ingresso");
  await dialog.getByLabel("Area", { exact: true }).selectOption("workshop");
  await selectNode(dialog, "ns=4;i=1");
  await dialog
    .getByLabel("Classe dispositivo", { exact: true })
    .selectOption("motion");
  await dialog.getByLabel("Inverti stato booleano", { exact: true }).check();
  await page.evaluate(() => {
    document.querySelector("opcua-node-panel").hass = {
      ...window.testHass,
      states: { unrelated: { state: "on" } },
    };
  });
  assert.equal(
    await dialog.getByLabel("Nome", { exact: true }).inputValue(),
    "Porta ingresso",
  );
  await shot(page, "edit-desktop.png");
  await dialog.getByRole("button", { name: "Salva", exact: true }).click();
  await page.getByText("Configurazione salvata.", { exact: true }).waitFor();
  const saved = await page.evaluate(() =>
    window.calls.find((m) => m.type.endsWith("/update")),
  );
  assert.deepEqual(saved, {
    type: "ha_opcua/entity/update",
    entry_id: "plc1",
    revision: "rev1",
    key: "ns=4;i=2",
    platform: "binary_sensor",
    update_mode: "polling",
    name: "Porta ingresso",
    area_id: "workshop",
    node_id: "ns=4;i=1",
    device_class: "motion",
    invert_state: true,
  });
  await page.close();
});

test("sensor device class is configurable and saved", async () => {
  const page = await pageFor();
  await page
    .locator("tr.entityRow")
    .filter({ hasText: "Velocità linea" })
    .locator("td.typeCell")
    .click();
  const dialog = page.locator("dialog");
  const deviceClass = dialog.getByLabel("Classe dispositivo", { exact: true });
  assert.equal(await deviceClass.isVisible(), true);
  assert.deepEqual(
    await deviceClass
      .locator("option")
      .evaluateAll((options) => options.map((option) => option.value)),
    ["", "temperature", "timestamp"],
  );
  await deviceClass.selectOption("temperature");
  await dialog.getByRole("button", { name: "Salva", exact: true }).click();
  const saved = await page.evaluate(() =>
    window.calls.find((message) => message.type.endsWith("/update")),
  );
  assert.equal(saved.device_class, "temperature");
  await page.close();
});

test("mobile dialog, cancel and rejected save keep data intact", async () => {
  const page = await pageFor(390);
  await page.evaluate(() => {
    document.body.style.cssText +=
      ";--primary-background-color:#111827;--card-background-color:#1f2937;--primary-text-color:#eef2f7;--secondary-text-color:#9cabc0;--divider-color:#374151;--secondary-background-color:#283548;--primary-color:#0891b2";
  });
  await page
    .locator("tr.entityRow")
    .filter({ hasText: "Marcia macchina" })
    .locator("td.typeCell")
    .click();
  let dialog = page.locator("dialog");
  await dialog.getByLabel("Nome", { exact: true }).fill("Cancelled");
  await dialog.getByRole("button", { name: "Annulla", exact: true }).click();
  assert.equal(
    await page.evaluate(
      () => window.calls.filter((m) => m.type.endsWith("/update")).length,
    ),
    0,
  );
  await page
    .locator("tr.entityRow")
    .filter({ hasText: "Marcia macchina" })
    .locator("td.typeCell")
    .click();
  dialog = page.locator("dialog");
  await dialog.getByLabel("Nome", { exact: true }).fill("Unsaved draft");
  await page.evaluate(() => {
    window.failSave = true;
  });
  await dialog.getByRole("button", { name: "Salva", exact: true }).click();
  await dialog
    .getByRole("alert")
    .filter({ hasText: "La configurazione è cambiata" })
    .waitFor();
  assert.equal(
    await dialog.getByLabel("Nome", { exact: true }).inputValue(),
    "Unsaved draft",
  );
  const box = await dialog.boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 390);
  await dialog
    .getByRole("button", { name: "Annulla", exact: true })
    .scrollIntoViewIfNeeded();
  await shot(page, "edit-mobile-dark.png");
  await page.close();
});

test("non-admin cannot request endpoint data", async () => {
  const page = await pageFor(1280, false);
  await page
    .getByText("Pannello riservato agli amministratori.", { exact: true })
    .waitFor();
  assert.equal(await page.evaluate(() => window.calls.length), 0);
  await page.close();
});

test("manual NodeId creation on an empty endpoint, category, area and inversion", async () => {
  const page = await pageFor(390);
  await page.getByLabel("Endpoint", { exact: true }).selectOption("plc2");
  await page
    .getByRole("button", { name: "Aggiungi entità", exact: true })
    .click();
  let dialog = page.locator("dialog[open]");
  await dialog
    .getByLabel("NodeId associato", { exact: true })
    .fill('ns=4;s="DB"."Door"');
  await dialog
    .getByRole("button", { name: "Verifica nodo", exact: true })
    .click();
  await dialog
    .getByLabel("Categoria", { exact: true })
    .selectOption("binary_sensor");
  await dialog.getByLabel("Nome", { exact: true }).fill("Porta manuale");
  await dialog.getByLabel("Area", { exact: true }).selectOption("workshop");
  await dialog
    .getByLabel("Classe dispositivo", { exact: true })
    .selectOption("door");
  await dialog.getByLabel("Inverti stato booleano", { exact: true }).check();
  const box = await dialog.boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 390);
  await shot(page, "manual-mobile.png");
  await page.evaluate(() => {
    window.failCreate = true;
  });
  await dialog.getByRole("button", { name: "Salva", exact: true }).click();
  await dialog
    .getByRole("alert")
    .filter({ hasText: "Questo nodo ha già" })
    .waitFor();
  assert.equal(
    await dialog.getByLabel("Nome", { exact: true }).inputValue(),
    "Porta manuale",
  );
  await page.evaluate(() => {
    window.failCreate = false;
  });
  await dialog.getByRole("button", { name: "Salva", exact: true }).click();
  await page.getByText("Configurazione salvata.", { exact: true }).waitFor();
  const saved = await page.evaluate(() =>
    window.calls.find((m) => m.type.endsWith("/create")),
  );
  assert.deepEqual(saved, {
    type: "ha_opcua/entity/create",
    entry_id: "plc2",
    revision: "rev2",
    node_id: 'ns=4;s="DB"."Door"',
    platform: "binary_sensor",
    update_mode: "polling",
    name: "Porta manuale",
    area_id: "workshop",
    device_class: "door",
    invert_state: true,
  });
  await page.close();
});

test("failed node verification preserves input and cancellation creates nothing", async () => {
  const page = await pageFor();
  await page
    .getByRole("button", { name: "Aggiungi entità", exact: true })
    .click();
  const dialog = page.locator("dialog[open]");
  await dialog
    .getByLabel("NodeId associato", { exact: true })
    .fill("ns=4;i=999");
  await page.evaluate(() => {
    window.failInspect = true;
  });
  await dialog
    .getByRole("button", { name: "Verifica nodo", exact: true })
    .click();
  await dialog
    .getByRole("alert")
    .filter({ hasText: "Il nodo non esiste" })
    .waitFor();
  assert.equal(
    await dialog.getByLabel("NodeId associato", { exact: true }).inputValue(),
    "ns=4;i=999",
  );
  await dialog.getByRole("button", { name: "Annulla", exact: true }).click();
  assert.equal(
    await page.evaluate(
      () => window.calls.filter((m) => m.type.endsWith("/create")).length,
    ),
    0,
  );
  await page.close();
});

test("datetime manual creation, category filter and compatible remapping", async () => {
  const page = await pageFor();
  await page.evaluate(() => {
    window.inspectResult = {
      node: {
        name: "Orologio",
        node_id: "ns=4;i=50",
        variant_type: "DateTime",
        writable: true,
      },
      platforms: ["sensor", "datetime"],
    };
  });
  await page
    .getByRole("button", { name: "Aggiungi entità", exact: true })
    .click();
  const dialog = page.locator("dialog[open]");
  await dialog
    .getByLabel("NodeId associato", { exact: true })
    .fill("ns=4;i=50");
  await dialog
    .getByRole("button", { name: "Verifica nodo", exact: true })
    .click();
  await dialog
    .getByLabel("Categoria", { exact: true })
    .selectOption("datetime");
  assert.equal(
    await dialog
      .getByRole("switch", { name: "Inverti stato booleano", exact: true })
      .isVisible(),
    false,
  );
  assert.equal(
    await dialog.getByLabel("Classe dispositivo", { exact: true }).isVisible(),
    false,
  );
  await dialog.getByRole("button", { name: "Salva", exact: true }).click();
  await page.getByText("Configurazione salvata.", { exact: true }).waitFor();
  const saved = await page.evaluate(() =>
    window.calls.find((m) => m.type.endsWith("/create")),
  );
  assert.equal(saved.platform, "datetime");
  assert.equal(saved.node_id, "ns=4;i=50");
  assert.equal(saved.invert_state, false);
  assert.equal(saved.device_class, null);
  await page.evaluate(() => {
    const endpoint = window.fixture.endpoints[0];
    endpoint.nodes.push(window.inspectResult.node, {
      ...window.inspectResult.node,
      node_id: "ns=4;i=51",
      writable: false,
    });
    endpoint.rows.push({
      key: "ns=4;i=50",
      node_id: "ns=4;i=50",
      name: "Orologio",
      platform: "datetime",
      variant_type: "DateTime",
      editable: true,
    });
  });
  await page.getByRole("button", { name: "Aggiorna", exact: true }).click();
  await page.getByRole("button", { name: "datetime · 1", exact: true }).click();
  assert.equal(await page.locator("tr.entityRow").count(), 1);
  await page.locator("tr.entityRow td.typeCell").click();
  const options = await dialog
    .locator("select[name=node_id]")
    .locator("option")
    .evaluateAll((nodes) => nodes.map((n) => n.value));
  assert.deepEqual(options, ["ns=4;i=50"]);
  await shot(page, "datetime-edit.png");
  await page.close();
});

test("manual removal works offline with confirmation, cancel and dependency errors", async () => {
  const page = await pageFor(390);
  assert.equal(
    await page.getByRole("button", { name: "Rimuovi", exact: true }).count(),
    0,
  );
  await page.evaluate(() => {
    const endpoint = window.fixture.endpoints[1];
    endpoint.loaded = false;
    endpoint.rows = [
      {
        key: "ns=4;i=99",
        node_id: "ns=4;i=99",
        name: "Ricetta manuale",
        platform: "text",
        manual: true,
        editable: false,
        entity_id: "text.manual_recipe",
        variant_type: "String",
      },
    ];
  });
  await page.getByRole("button", { name: "Aggiorna", exact: true }).click();
  await page.getByLabel("Endpoint", { exact: true }).selectOption("plc2");
  await page.getByRole("button", { name: "Rimuovi", exact: true }).click();
  let dialog = page.locator("dialog[open]");
  await dialog.getByText("Ricetta manuale", { exact: true }).waitFor();
  await dialog.getByRole("button", { name: "Annulla", exact: true }).click();
  assert.equal(
    await page.evaluate(
      () => window.calls.filter((m) => m.type.endsWith("/remove")).length,
    ),
    0,
  );
  await page.getByRole("button", { name: "Rimuovi", exact: true }).click();
  dialog = page.locator("dialog[open]");
  await page.evaluate(() => {
    window.failRemove = "node_in_use";
  });
  await dialog.getByRole("button", { name: "Rimuovi", exact: true }).click();
  await dialog.getByRole("alert").filter({ hasText: "Altre entità" }).waitFor();
  assert.equal(await page.locator("tr.entityRow").count(), 1);
  const box = await dialog.boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 390);
  await shot(page, "remove-manual-mobile.png");
  await page.evaluate(() => {
    window.failRemove = null;
  });
  await dialog.getByRole("button", { name: "Rimuovi", exact: true }).click();
  await page.getByText("Nodo manuale rimosso.", { exact: true }).waitFor();
  assert.equal(await page.locator("tr.entityRow").count(), 0);
  const removal = await page.evaluate(() =>
    window.calls.find((m) => m.type.endsWith("/remove")),
  );
  assert.deepEqual(removal, {
    type: "ha_opcua/node/remove",
    entry_id: "plc2",
    revision: "rev2",
    key: "ns=4;i=99",
  });
  await page.close();
});

test("live entity states update without requests, rebuilding cards or losing drafts", async () => {
  const page = await pageFor();
  const card = (name) =>
    page
      .locator("tr.entityRow")
      .filter({ has: page.getByRole("heading", { name, exact: true }) });
  const run = card("Marcia macchina");
  await page.evaluate(() => {
    const panel = document.querySelector("opcua-node-panel");
    window.originalCard = panel.shadowRoot.querySelector("article");
    window.initialCalls = window.calls.length;
    window.testHass.states = {
      "switch.marcia": { state: "off", attributes: {} },
      "binary_sensor.porta": { state: "on", attributes: {} },
      "sensor.velocita": {
        state: "0",
        attributes: { unit_of_measurement: "m/s" },
      },
      "text.ricetta": { state: "  [Ricetta A]  ", attributes: {} },
    };
    panel.hass = { ...window.testHass };
  });
  assert.equal(await run.locator(".stateValue").textContent(), "Spento");
  assert.equal(
    await card("Velocità linea").locator(".stateValue").textContent(),
    "0 m/s",
  );
  assert.equal(
    await card("Nome ricetta").locator(".stateValue").textContent(),
    "  [Ricetta A]  ",
  );
  await run.locator("td.typeCell").click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByLabel("Nome", { exact: true }).fill("Bozza aperta");
  await page.evaluate(() => {
    window.testHass.states["switch.marcia"] = { state: "on", attributes: {} };
    document.querySelector("opcua-node-panel").hass = { ...window.testHass };
  });
  assert.equal(await run.locator(".stateValue").textContent(), "Acceso");
  assert.equal(
    await dialog.getByLabel("Nome", { exact: true }).inputValue(),
    "Bozza aperta",
  );
  assert.equal(
    await page.evaluate(() => window.initialCalls === window.calls.length),
    true,
  );
  assert.equal(
    await page.evaluate(
      () =>
        window.originalCard ===
        document
          .querySelector("opcua-node-panel")
          .shadowRoot.querySelector("article"),
    ),
    true,
  );
  await dialog.getByRole("button", { name: "Annulla", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Cerca nome o NodeId", exact: true })
    .fill("Marcia");
  assert.equal(await run.locator(".stateValue").textContent(), "Acceso");
  await page.close();
});

test("HA formatting and unavailable, unknown, empty, excluded and pending states", async () => {
  const page = await pageFor(390);
  await page.evaluate(() => {
    const endpoint = window.fixture.endpoints[0];
    endpoint.rows.push(
      {
        key: "date",
        node_id: "date",
        name: "Orologio",
        entity_id: "datetime.clock",
        platform: "datetime",
        variant_type: "DateTime",
      },
      {
        key: "excluded",
        node_id: "excluded",
        name: "Escluso",
        entity_id: "sensor.excluded",
        platform: "disabled",
        variant_type: "Float",
      },
      {
        key: "pending",
        node_id: "pending",
        name: "In attesa",
        entity_id: null,
        platform: "sensor",
        variant_type: "Float",
      },
    );
    window.testHass.formatEntityState = (entity) =>
      ({
        "binary_sensor.porta": "Aperto",
        "datetime.clock": "14 settembre 2026 alle 18:30",
      })[entity.entity_id] || entity.state;
    window.testHass.states = {
      "switch.marcia": { state: "unavailable", attributes: {} },
      "binary_sensor.porta": {
        entity_id: "binary_sensor.porta",
        state: "on",
        attributes: { device_class: "door" },
      },
      "sensor.velocita": { state: "unknown", attributes: {} },
      "text.ricetta": { state: "", attributes: {} },
      "datetime.clock": {
        entity_id: "datetime.clock",
        state: "2026-09-14T16:30:00+00:00",
        attributes: {},
      },
      "sensor.excluded": { state: "old value", attributes: {} },
    };
    document.querySelector("opcua-node-panel").hass = { ...window.testHass };
  });
  await page.getByRole("button", { name: "Aggiorna", exact: true }).click();
  const value = (id) => page.locator(`[data-entity-state="${id}"]`);
  assert.equal(await value("switch.marcia").textContent(), "Non disponibile");
  assert.equal(await value("binary_sensor.porta").textContent(), "Aperto");
  assert.equal(await value("sensor.velocita").textContent(), "Sconosciuto");
  assert.equal(await value("text.ricetta").textContent(), "Testo vuoto");
  assert.equal(
    await value("datetime.clock").textContent(),
    "14 settembre 2026 alle 18:30",
  );
  assert.equal(await value("sensor.excluded").textContent(), "Esclusa");
  assert.equal(await value("").textContent(), "Non ancora registrata");
  await shot(page, "live-states-mobile.png");
  await page.evaluate(() => {
    delete window.testHass.states["binary_sensor.porta"];
    window.testHass.states["text.ricetta"] = {
      state: "<img src=x onerror=alert(1)>",
      attributes: {},
    };
    document.querySelector("opcua-node-panel").hass = { ...window.testHass };
  });
  assert.equal(
    await value("binary_sensor.porta").textContent(),
    "Non disponibile",
  );
  assert.equal(await page.locator("img").count(), 0);
  assert.equal(
    await value("text.ricetta").textContent(),
    "<img src=x onerror=alert(1)>",
  );
  await page.close();
});

test("reclassify dialog starts empty and sends only the confirmed keys", async () => {
  const page = await pageFor(1280);
  await page.evaluate(() => {
    const endpoint = window.fixture.endpoints[0];
    endpoint.rows.push(
      {
        key: "bool1",
        node_id: "ns=4;i=20",
        name: "Allarme 1",
        entity_id: "sensor.allarme1",
        platform: "sensor",
        variant_type: "Boolean",
        reclassifiable: true,
      },
      {
        key: "bool2",
        node_id: "ns=4;i=21",
        name: "Allarme 2",
        entity_id: "sensor.allarme2",
        platform: "sensor",
        variant_type: "Boolean",
        reclassifiable: true,
      },
    );
    endpoint.reclassifiable_booleans = 2;
    window.testHass.states = {
      ...window.testHass.states,
      "sensor.allarme1": { state: "True", attributes: {} },
      "sensor.allarme2": { state: "False", attributes: {} },
    };
    document.querySelector("opcua-node-panel").hass = { ...window.testHass };
  });
  await page.getByRole("button", { name: "Aggiorna", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Riclassifica come binary_sensor (2)",
      exact: true,
    })
    .click();

  const dialog = page.locator("dialog[open]");
  await dialog.waitFor();
  const confirm = dialog.getByRole("button", { name: /Converti selezionati/ });
  assert.equal(await confirm.textContent(), "Converti selezionati (0)");
  assert.equal(await confirm.isDisabled(), true);

  const item1 = dialog.locator(".pickItem").filter({ hasText: "Allarme 1" });
  const item2 = dialog.locator(".pickItem").filter({ hasText: "Allarme 2" });
  assert.equal(await item1.locator(".pickState").textContent(), "Acceso");
  assert.equal(await item2.locator(".pickState").textContent(), "Spento");

  await item1.locator("input").check();
  assert.equal(await confirm.textContent(), "Converti selezionati (1)");
  assert.equal(await confirm.isDisabled(), false);

  await dialog.getByLabel("Seleziona tutti", { exact: true }).check();
  assert.equal(await confirm.textContent(), "Converti selezionati (2)");
  assert.equal(await item2.locator("input").isChecked(), true);

  // Deselecting one candidate again must drop it from what gets sent -
  // "select all" is a shortcut, not a separate all-or-nothing action.
  await item2.locator("input").uncheck();
  assert.equal(await confirm.textContent(), "Converti selezionati (1)");

  await confirm.click();
  await dialog.waitFor({ state: "detached" });

  const call = await page.evaluate(() =>
    window.calls.find((m) => m.type.endsWith("/reclassify_boolean_sensors")),
  );
  assert.deepEqual(call.keys, ["bool1"]);
  await page.close();
});

test("array-of-struct fields are grouped and can be renamed selectively", async () => {
  const page = await pageFor(1280);
  await page.evaluate(() => {
    const endpoint = window.fixture.endpoints[0];
    const group1 = "ns=4;s=PLC.astMeldungen[1]";
    const group2 = "ns=4;s=PLC.astMeldungen[2]";
    endpoint.rows.push(
      {
        key: "arr1x",
        node_id: `${group1}.xAktiv`,
        name: "xAktiv",
        entity_id: "binary_sensor.arr1x",
        platform: "binary_sensor",
        variant_type: "Boolean",
        reclassifiable: false,
        array_group: group1,
        array_label: "astMeldungen[1]",
        array_field: "xAktiv",
        proposed_name: "astMeldungen[1].xAktiv",
        renamable: true,
      },
      {
        key: "arr1s",
        node_id: `${group1}.sText`,
        name: "sText",
        entity_id: "sensor.arr1s",
        platform: "sensor",
        variant_type: "String",
        reclassifiable: false,
        array_group: group1,
        array_label: "astMeldungen[1]",
        array_field: "sText",
        proposed_name: "astMeldungen[1].sText",
        renamable: true,
      },
      {
        key: "arr2x",
        node_id: `${group2}.xAktiv`,
        name: "xAktiv",
        entity_id: "binary_sensor.arr2x",
        platform: "binary_sensor",
        variant_type: "Boolean",
        reclassifiable: false,
        array_group: group2,
        array_label: "astMeldungen[2]",
        array_field: "xAktiv",
        proposed_name: "astMeldungen[2].xAktiv",
        renamable: true,
      },
    );
    endpoint.renamable_fields = 3;
    window.testHass.states = {
      ...window.testHass.states,
      "binary_sensor.arr1x": { state: "on", attributes: {} },
      "sensor.arr1s": { state: "Pump running", attributes: {} },
      "binary_sensor.arr2x": { state: "off", attributes: {} },
    };
    document.querySelector("opcua-node-panel").hass = { ...window.testHass };
  });
  await page.getByRole("button", { name: "Aggiorna", exact: true }).click();

  const categoryToggle = () =>
    page.getByRole("button", { name: "Per categoria", exact: true });
  const arrayToggle = () =>
    page.getByRole("button", { name: "Per elemento array", exact: true });
  const pressedState = async (locator) => ({
    selected: ((await locator.getAttribute("class")) || "")
      .split(" ")
      .includes("selected"),
    pressed: await locator.getAttribute("aria-pressed"),
  });

  // Category grouping is the default - even on "All", array fields stay
  // scattered under their own platform headings until the user opts in.
  assert.equal(await page.locator(".arrayGroup").count(), 0);
  assert.equal(
    await page
      .locator("tr.entityRow")
      .filter({ has: page.locator(`[data-node-tip*="astMeldungen"]`) })
      .count(),
    3,
  );
  assert.deepEqual(await pressedState(categoryToggle()), {
    selected: true,
    pressed: "true",
  });
  assert.deepEqual(await pressedState(arrayToggle()), {
    selected: false,
    pressed: "false",
  });

  // Opting into array grouping via the toggle groups the two astMeldungen[1]
  // fields under one heading and astMeldungen[2] under another, independent
  // of how many fields each struct element has.
  await arrayToggle().click();
  const groups = page.locator(".arrayGroup");
  assert.equal(await groups.count(), 2);
  const group1Card = groups.filter({ hasText: "astMeldungen[1]" });
  assert.equal(
    await group1Card.locator("tr.entityRow").count(),
    2,
    "both fields of astMeldungen[1] appear under its own heading",
  );
  // The toggle itself must reflect the new mode, not just the rendered rows.
  assert.deepEqual(await pressedState(arrayToggle()), {
    selected: true,
    pressed: "true",
  });
  assert.deepEqual(await pressedState(categoryToggle()), {
    selected: false,
    pressed: "false",
  });

  // A platform filter wants its own flat, precise list instead, even while
  // array grouping is selected.
  await page
    .getByRole("button", { name: "binary_sensor · 3", exact: true })
    .click();
  assert.equal(await page.locator(".arrayGroup").count(), 0);
  assert.equal(
    await page
      .locator("tr.entityRow")
      .filter({ has: page.locator(`[data-node-tip*="astMeldungen"]`) })
      .count(),
    2,
  );
  await page.getByRole("button", { name: "Tutte · 7", exact: true }).click();
  // Back on "All" with no filter, the array-grouping choice still applies.
  assert.equal(await page.locator(".arrayGroup").count(), 2);

  // Switching back to category grouping ungroups again and updates the
  // toggle's selected styling and aria-pressed back the other way.
  await categoryToggle().click();
  assert.equal(await page.locator(".arrayGroup").count(), 0);
  assert.deepEqual(await pressedState(categoryToggle()), {
    selected: true,
    pressed: "true",
  });
  assert.deepEqual(await pressedState(arrayToggle()), {
    selected: false,
    pressed: "false",
  });
  await arrayToggle().click();

  await page
    .getByRole("button", { name: "Rinomina campi duplicati (3)", exact: true })
    .click();
  const dialog = page.locator("dialog[open]");
  await dialog.waitFor();
  const confirm = dialog.getByRole("button", { name: /Rinomina selezionati/ });
  assert.equal(await confirm.textContent(), "Rinomina selezionati (0)");
  assert.equal(await confirm.isDisabled(), true);

  const item = dialog
    .locator(".pickItem")
    .filter({ hasText: "xAktiv" })
    .first();
  assert.equal(
    await item.locator(".pickArrow").textContent(),
    "→ astMeldungen[1].xAktiv",
  );
  await item.locator("input").check();
  assert.equal(await confirm.textContent(), "Rinomina selezionati (1)");
  await confirm.click();
  await dialog.waitFor({ state: "detached" });

  const call = await page.evaluate(() =>
    window.calls.find((m) => m.type.endsWith("/rename_array_fields")),
  );
  assert.deepEqual(call.keys, ["arr1x"]);
  await page.close();
});

test("view and grouping choices sit together as icons with a calm, delayed hint", async () => {
  const page = await pageFor(1280);
  await page.evaluate(() => {
    const endpoint = window.fixture.endpoints[0];
    endpoint.rows.push({
      key: "tipsp1",
      node_id: "ns=4;s=PLC.Application.SP.xError",
      name: "SP.xError",
      entity_id: "binary_sensor.tipsp1",
      platform: "binary_sensor",
      variant_type: "Boolean",
      reclassifiable: false,
      path_group: "SP",
      path_label: "SP",
    });
    window.testHass.states = {
      ...window.testHass.states,
      "binary_sensor.tipsp1": { state: "off", attributes: {} },
    };
    document.querySelector("opcua-node-panel").hass = { ...window.testHass };
  });
  await page.getByRole("button", { name: "Aggiorna", exact: true }).click();

  // The grouping choices are icons only.
  const tools = page.locator(".navTools");
  assert.equal(await tools.locator(".viewToggle").count(), 1);
  const pathButton = page.getByRole("button", {
    name: "Per gruppo (GVL / struct)",
    exact: true,
  });
  assert.equal((await pathButton.textContent()).trim(), "");
  assert.equal(await pathButton.locator("svg").count(), 1);

  const hint = (locator) =>
    locator.evaluate((node) => {
      const style = getComputedStyle(node, "::after");
      return { text: style.content, opacity: style.opacity };
    });
  // Moving over the button does not flash the hint right away ...
  await pathButton.hover();
  assert.equal((await hint(pathButton)).opacity, "0");
  // ... it only appears when the pointer stays, with a short text ...
  await page.waitForTimeout(1200);
  const shown = await hint(pathButton);
  assert.equal(shown.opacity, "1");
  assert.ok(shown.text.includes("PLC"));
  await shot(page, "toolbar-hint.png");
  // ... and leaves again as soon as the pointer does.
  await page.mouse.move(5, 5);
  await page.waitForTimeout(400);
  assert.equal((await hint(pathButton)).opacity, "0");
});

for (const width of [1920, 1280, 768, 390]) {
  test(`only the table scrolls and the controls stay compact at ${width}px`, async () => {
    const page = await pageFor(width);
    await page.evaluate(() => {
      // Like Home Assistant: the panel sits in a wrapper of automatic
      // height, not in a full-height page.
      const panel = document.querySelector("opcua-node-panel");
      const wrapper = document.createElement("div");
      panel.before(wrapper);
      wrapper.append(panel);
      document.body.style.height = "auto";
      const endpoint = window.fixture.endpoints[0];
      for (let i = 0; i < 80; i++)
        endpoint.rows.push({
          key: `many${i}`,
          node_id: `many${i}`,
          name: `Valore ${i}`,
          entity_id: `sensor.many${i}`,
          platform: "sensor",
          variant_type: "Float",
          reclassifiable: false,
        });
      document.querySelector("opcua-node-panel").hass = { ...window.testHass };
    });
    await page.getByRole("button", { name: "Aggiorna", exact: true }).click();
    const content = page.locator(".content");
    const table = page.locator(".tableWrap");
    const toolbarTop = () =>
      page
        .locator(".endpointPanel")
        .evaluate((node) => node.getBoundingClientRect().top);
    const height = (name) =>
      page
        .getByRole("button", { name, exact: true })
        .evaluate((node) => node.getBoundingClientRect().height);
    const before = await toolbarTop();
    if (width > 650) {
      // The page itself does not scroll; the table does, below a fixed toolbar.
      assert.equal(
        await content.evaluate((el) => el.scrollHeight > el.clientHeight + 1),
        false,
        "page scrolls",
      );
      await table.evaluate((el) => (el.scrollTop = 600));
      assert.ok((await table.evaluate((el) => el.scrollTop)) > 0);
      assert.equal(await toolbarTop(), before, "toolbar moved");
      // The table fills the window down to its bottom edge.
      const bottom = await page
        .locator(".pageHint")
        .evaluate((node) => node.getBoundingClientRect().bottom);
      assert.ok(bottom > 900 - 80, `table leaves the window empty (${bottom})`);
      assert.ok(bottom <= 900, "page hint below the window");
      // The table header stays visible while its rows scroll.
      const head = await page
        .locator("thead th")
        .first()
        .evaluate((node) => node.getBoundingClientRect().top);
      const frame = await table.evaluate(
        (node) => node.getBoundingClientRect().top,
      );
      assert.ok(Math.abs(head - frame) <= 2, "table header scrolled away");
      // Compact controls on a desktop.
      assert.ok((await height("Rileva di nuovo")) <= 34);
      assert.ok(
        (await page
          .getByRole("searchbox")
          .evaluate((node) => node.getBoundingClientRect().height)) <= 34,
      );
    } else {
      // A phone keeps finger-sized buttons and scrolls the whole page.
      assert.ok((await height("Rileva di nuovo")) >= 44);
      assert.ok(
        await content.evaluate((el) => el.scrollHeight > el.clientHeight + 1),
      );
    }
    // Nothing is wider than the page.
    assert.equal(
      await content.evaluate((el) => el.scrollWidth > el.clientWidth + 1),
      false,
    );
    await shot(page, `table-scroll-${width}.png`);
  });
}

test("each setting badge keeps a fixed slot so the badges line up from row to row", async () => {
  const page = await pageFor(1280);
  await page.evaluate(() => {
    const endpoint = window.fixture.endpoints[0];
    for (const [key, settings] of [
      ["slot1", { precision: 2, unit_of_measurement: "°C" }],
      ["slot2", { unit_of_measurement: "%" }],
      ["slot3", { precision: 1, update_mode: "subscription" }],
      ["slot4", { update_mode: "subscription" }],
    ]) {
      endpoint.rows.push({
        key,
        node_id: key,
        name: key,
        entity_id: `sensor.${key}`,
        platform: "sensor",
        variant_type: "Float",
        reclassifiable: false,
        settings,
      });
    }
    document.querySelector("opcua-node-panel").hass = { ...window.testHass };
  });
  await page.getByRole("button", { name: "Aggiorna", exact: true }).click();
  const left = (name, setting) =>
    page
      .locator("tr.entityRow", { hasText: name })
      .locator(`[data-setting="${setting}"]`)
      .evaluate((node) => node.getBoundingClientRect().left);
  // The same setting starts at the same place in every row, even when the
  // row before it has fewer settings.
  assert.equal(
    await left("slot1", "unit_of_measurement"),
    await left("slot2", "unit_of_measurement"),
  );
  assert.equal(
    await left("slot3", "update_mode"),
    await left("slot4", "update_mode"),
  );
  assert.equal(
    await left("slot1", "precision"),
    await left("slot3", "precision"),
  );
  // Empty slots are placeholders only: no extra text for screen readers
  // and no extra setting badge.
  const slot2 = page.locator("tr.entityRow", { hasText: "slot2" });
  assert.equal(await slot2.locator(".customizationBadge").count(), 1);
  assert.ok((await slot2.locator(".settingSlot").count()) >= 2);
  assert.equal(
    await slot2.locator('.settingSlot[aria-hidden="true"]').count(),
    await slot2.locator(".settingSlot").count(),
  );
  await shot(page, "setting-slots.png");
});

test("a column header sorts the rows inside each group and the endpoint buttons explain themselves", async () => {
  const page = await pageFor(1280);
  await page.evaluate(() => {
    const endpoint = window.fixture.endpoints[0];
    for (const [key, name, value] of [
      ["sortb", "Pressione b", "12.5"],
      ["sorta", "Pressione A", "3"],
      ["sortc", "Pressione c", "unavailable"],
    ]) {
      endpoint.rows.push({
        key,
        node_id: `ns=4;s=${key}`,
        name,
        entity_id: `sensor.${key}`,
        platform: "sensor",
        variant_type: "Float",
        reclassifiable: false,
      });
      window.testHass.states = {
        ...window.testHass.states,
        [`sensor.${key}`]: { state: value, attributes: {} },
      };
    }
    document.querySelector("opcua-node-panel").hass = { ...window.testHass };
  });
  await page.getByRole("button", { name: "Aggiorna", exact: true }).click();
  // The "x of y entities" line is gone.
  assert.equal(await page.getByText(/di \d+ entità/).count(), 0);

  const sensorNames = () =>
    page
      .locator('tbody[data-platform="sensor"] tr.entityRow h3')
      .allTextContents();
  const original = await sensorNames();
  const name = page.locator("thead th", { hasText: "Nome" });
  const value = page.locator("thead th", { hasText: "Valore" });
  assert.equal(await name.getAttribute("aria-sort"), "none");

  await name.click();
  assert.equal(await name.getAttribute("aria-sort"), "ascending");
  assert.deepEqual(await sensorNames(), [
    "Pressione A",
    "Pressione b",
    "Pressione c",
    "Velocità linea",
  ]);
  await name.click();
  assert.equal(await name.getAttribute("aria-sort"), "descending");
  assert.deepEqual(await sensorNames(), [
    "Velocità linea",
    "Pressione c",
    "Pressione b",
    "Pressione A",
  ]);
  await name.click();
  assert.equal(await name.getAttribute("aria-sort"), "none");
  assert.deepEqual(await sensorNames(), original);

  // Numbers sort as numbers; an unavailable value stays last either way.
  await value.click();
  const ascending = await sensorNames();
  assert.ok(
    ascending.indexOf("Pressione A") < ascending.indexOf("Pressione b"),
  );
  assert.equal(ascending.at(-1), "Pressione c");
  await value.click();
  const descending = await sensorNames();
  assert.ok(
    descending.indexOf("Pressione b") < descending.indexOf("Pressione A"),
  );
  assert.equal(descending.at(-1), "Pressione c");
  assert.equal(await name.getAttribute("aria-sort"), "none");

  // Dragging a column edge does not sort.
  await value.click();
  assert.equal(await value.getAttribute("aria-sort"), "none");
  const edge = await name.locator(".colResizer").boundingBox();
  await page.mouse.move(edge.x + 4, edge.y + 5);
  await page.mouse.down();
  await page.mouse.move(edge.x + 40, edge.y + 5);
  await page.mouse.up();
  assert.equal(await name.getAttribute("aria-sort"), "none");

  await shot(page, "sorted-table.png");
});

for (const width of [1920, 1440, 1280, 1024, 768, 650, 390, 320]) {
  test(`endpoint button hints stay fully inside the window at ${width}px`, async () => {
    const page = await pageFor(width);
    const tip = page.locator(".nodeTip");
    const inWindow = () =>
      tip.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return (
          box.width > 0 &&
          box.left >= 0 &&
          box.top >= 0 &&
          box.right <= window.innerWidth &&
          box.bottom <= window.innerHeight
        );
      });
    const visible = () =>
      tip.evaluate((node) => getComputedStyle(node).visibility === "visible");
    for (const [label, word] of [
      ["Aggiungi entità", "NodeId"],
      ["Rileva di nuovo", "PLC"],
    ]) {
      const button = page.getByRole("button", { name: label, exact: true });
      // The name stays the button text; the hint is its description.
      assert.ok((await button.getAttribute("aria-description")).includes(word));
      await button.hover();
      // No flash while the pointer only passes by ...
      await page.waitForTimeout(150);
      assert.equal(await visible(), false, `${label}: shown too early`);
      // ... then the whole text, never cut off by the window or the panel.
      await page.waitForTimeout(900);
      assert.equal(await visible(), true, `${label}: not shown`);
      assert.ok((await tip.textContent()).includes(word));
      assert.equal(await inWindow(), true, `${label}: cut off at ${width}px`);
      await shot(page, `button-hint-${label.split(" ")[0]}-${width}.png`);
      // Leaving the button hides it again.
      await page.mouse.move(1, 1);
      await page.waitForTimeout(50);
      assert.equal(await visible(), false, `${label}: still shown`);
    }
    // Keyboard: the hint follows the focus.
    await page.getByRole("searchbox").focus();
    await page.keyboard.press("Tab");
    await page.waitForTimeout(500);
    assert.equal(await visible(), true, "keyboard focus shows no hint");
    assert.ok((await tip.textContent()).includes("NodeId"));
    assert.equal(await inWindow(), true);
    await page.keyboard.press("Tab");
    await page.waitForTimeout(500);
    assert.ok((await tip.textContent()).includes("PLC"));
    assert.equal(await inWindow(), true);
    await page.keyboard.press("Tab");
    await page.waitForTimeout(50);
    assert.equal(await visible(), false, "hint stays after focus moved on");
    // Pressing a button closes its hint.
    const rediscover = page.getByRole("button", {
      name: "Rileva di nuovo",
      exact: true,
    });
    await rediscover.hover();
    await page.waitForTimeout(1000);
    await page.mouse.down();
    assert.equal(await visible(), false, "hint stays while pressing");
    await page.mouse.up();
    // A hint never widens the page.
    assert.equal(
      await page
        .locator(".content")
        .evaluate((el) => el.scrollWidth > el.clientWidth + 1),
      false,
    );
    // While the endpoint is still loading both buttons are disabled; the
    // hint still explains what they will do.
    await page.evaluate(() => {
      window.fixture.endpoints[0].loaded = false;
    });
    await page.getByRole("button", { name: "Aggiorna", exact: true }).click();
    const disabled = page.getByRole("button", {
      name: "Rileva di nuovo",
      exact: true,
    });
    assert.equal(await disabled.isDisabled(), true);
    await disabled.hover({ force: true });
    await page.waitForTimeout(1000);
    assert.equal(await visible(), true, "no hint on a disabled button");
    assert.equal(await inWindow(), true);
  });
}

test("path naming is switched on and off from the endpoint panel", async () => {
  const page = await pageFor(1280);
  const toggle = () => page.locator("[data-name-path-toggle]");
  assert.equal(await toggle().count(), 1);
  assert.equal(await toggle().isChecked(), false);
  assert.equal(await page.locator("#name-path-help").count(), 1);
  const saves = () =>
    page.evaluate(() =>
      window.calls.filter((m) => m.type.endsWith("/name_with_path")),
    );
  await toggle().click();
  await page.waitForFunction(() =>
    window.calls.some((m) => m.type.endsWith("/name_with_path")),
  );
  const [first] = await saves();
  assert.equal(first.type, "ha_opcua/endpoint/name_with_path");
  assert.equal(first.enabled, true);
  assert.ok(first.entry_id);
  // The panel reloads its data afterwards and shows the saved state.
  await page.waitForFunction(
    () =>
      document
        .querySelector("opcua-node-panel")
        .shadowRoot.querySelector("[data-name-path-toggle]")?.checked,
  );
  await toggle().click();
  await page.waitForFunction(
    () =>
      window.calls.filter((m) => m.type.endsWith("/name_with_path")).length ===
      2,
  );
  assert.equal((await saves())[1].enabled, false);
});

test("a failed path naming save restores the switch and keeps the message", async () => {
  const page = await pageFor(1280);
  const toggle = () => page.locator("[data-name-path-toggle]");
  const saves = () =>
    page.evaluate(
      () =>
        window.calls.filter((m) => m.type.endsWith("/name_with_path")).length,
    );
  await page.evaluate(() => {
    window.failNamePath = "error";
  });
  await toggle().click();
  await page.waitForFunction(() =>
    window.calls.some((m) => m.type.endsWith("/name_with_path")),
  );
  // The reload that follows the failed save must not wipe the message ...
  const alert = page.locator(".message.error");
  await alert.waitFor();
  assert.match(await alert.innerText(), /Operazione non riuscita/);
  // ... and the switch shows what is really saved: still off.
  await page.waitForFunction(
    () =>
      document
        .querySelector("opcua-node-panel")
        .shadowRoot.querySelectorAll("[data-name-path-toggle]").length === 1,
  );
  assert.equal(await toggle().isChecked(), false);
  assert.equal(await toggle().isDisabled(), false);
  assert.equal(await saves(), 1);
  // A later successful save clears the message again.
  await page.evaluate(() => {
    window.failNamePath = "";
  });
  await toggle().click();
  await page.waitForFunction(
    () =>
      document
        .querySelector("opcua-node-panel")
        .shadowRoot.querySelector("[data-name-path-toggle]")?.checked,
  );
  assert.equal(await page.locator(".message.error").count(), 0);
});

test("a group's path can be found by searching when the names are short", async () => {
  const page = await pageFor(1280);
  await page.evaluate(() => {
    const endpoint = window.fixture.endpoints[0];
    const row = (key, group, label, name) => ({
      key,
      node_id: `ns=4;i=${key.length}${name.length}`,
      name,
      entity_id: `sensor.${key}`,
      platform: "sensor",
      variant_type: "Double",
      reclassifiable: false,
      path_group: group,
      path_label: label,
    });
    endpoint.rows.push(
      row("found1", "Tank", "Tank", "Level"),
      row("found2", "Tank", "Tank", "Flow"),
      row("other1", "Pump", "Pump", "Speed"),
    );
    window.testHass.states = {
      ...window.testHass.states,
      "sensor.found1": { state: "1", attributes: {} },
      "sensor.found2": { state: "2", attributes: {} },
      "sensor.other1": { state: "3", attributes: {} },
    };
    document.querySelector("opcua-node-panel").hass = { ...window.testHass };
  });
  await page.getByRole("button", { name: "Aggiorna", exact: true }).click();
  await page
    .getByRole("button", { name: "Per gruppo (GVL / struct)", exact: true })
    .click();
  await page
    .getByRole("searchbox", { name: "Cerca nome o NodeId", exact: true })
    .fill("tank");
  const groups = page.locator(".arrayGroup");
  assert.equal(await groups.count(), 1);
  assert.equal(await groups.locator("tr.entityRow").count(), 2);
});

test("fields can be grouped by their PLC path as a third explicit choice", async () => {
  const page = await pageFor(1280);
  await page.evaluate(() => {
    const endpoint = window.fixture.endpoints[0];
    const row = (key, platform, group, label, name) => ({
      key,
      node_id: `ns=4;s=PLC.Application.${group}.${name}`,
      name: `${label} · ${name}`,
      entity_id: `${platform}.${key}`,
      platform,
      variant_type: platform === "binary_sensor" ? "Boolean" : "Double",
      reclassifiable: false,
      path_group: group,
      path_label: label,
    });
    endpoint.rows.push(
      row("pathsp1", "binary_sensor", "SP", "SP", "xError"),
      row("pathsp2", "binary_sensor", "SP", "SP", "xWarning"),
      row(
        "pathpr1",
        "sensor",
        "PARAM.Pump_North",
        "PARAM › Pump_North",
        "rGain",
      ),
    );
    window.testHass.states = {
      ...window.testHass.states,
      "binary_sensor.pathsp1": { state: "off", attributes: {} },
      "binary_sensor.pathsp2": { state: "on", attributes: {} },
      "sensor.pathpr1": { state: "1.5", attributes: {} },
    };
    document.querySelector("opcua-node-panel").hass = { ...window.testHass };
  });
  await page.getByRole("button", { name: "Aggiorna", exact: true }).click();

  const categoryToggle = () =>
    page.getByRole("button", { name: "Per categoria", exact: true });
  const pathToggle = () =>
    page.getByRole("button", {
      name: "Per gruppo (GVL / struct)",
      exact: true,
    });
  const pressed = async (locator) => await locator.getAttribute("aria-pressed");

  // Only offered when something can be grouped by path; no array fields
  // here, so there is no array choice at all.
  assert.equal(
    await page
      .getByRole("button", { name: "Per elemento array", exact: true })
      .count(),
    0,
  );
  assert.equal(await page.locator(".arrayGroup").count(), 0);
  assert.equal(await pressed(categoryToggle()), "true");
  assert.equal(await pressed(pathToggle()), "false");

  await pathToggle().click();
  const groups = page.locator(".arrayGroup");
  assert.equal(await groups.count(), 2);
  assert.equal(
    await groups
      .filter({
        has: page.locator(".arrayGroupTitle", { hasText: /^SP$/ }),
      })
      .locator("tr.entityRow")
      .count(),
    2,
    "both SP fields appear under the SP heading",
  );
  assert.equal(
    await page
      .locator(".arrayGroupTitle", { hasText: "PARAM › Pump_North" })
      .count(),
    1,
  );
  // Every group folds on its own: closing one leaves the other open.
  await groups.first().locator(".groupToggle").click();
  assert.equal(await groups.first().getAttribute("open"), null);
  assert.equal(await page.locator(".arrayGroup:not(.collapsed)").count(), 1);
  await groups.first().locator(".groupToggle").click();
  assert.equal(await page.locator(".arrayGroup:not(.collapsed)").count(), 2);
  assert.equal(await pressed(pathToggle()), "true");
  assert.equal(await pressed(categoryToggle()), "false");

  // Path grouping is kept while narrowing down: a platform filter groups
  // only what it still shows, and a search does too.
  await page.getByRole("button", { name: /^binary_sensor · \d+$/ }).click();
  assert.equal(await page.locator(".arrayGroup").count(), 1);
  assert.equal(await page.locator(".arrayGroup tr.entityRow").count(), 2);
  await page.getByRole("button", { name: /^sensor · \d+$/ }).click();
  assert.equal(await page.locator(".arrayGroup").count(), 1);
  await page.getByRole("button", { name: /^Tutte · \d+$/ }).click();
  assert.equal(await page.locator(".arrayGroup").count(), 2);
  await page
    .getByRole("searchbox", { name: "Cerca nome o NodeId", exact: true })
    .fill("xWarning");
  assert.equal(await page.locator(".arrayGroup").count(), 1);
  assert.equal(await page.locator(".arrayGroup tr.entityRow").count(), 1);
  await page
    .getByRole("searchbox", { name: "Cerca nome o NodeId", exact: true })
    .fill("");

  await categoryToggle().click();
  assert.equal(await page.locator(".arrayGroup").count(), 0);
  assert.equal(await pressed(categoryToggle()), "true");
});

test("edit number limits, preserve draft, exclude and re-enable from the panel", async () => {
  const page = await pageFor();
  await page.evaluate(() => {
    const endpoint = window.fixture.endpoints[0];
    endpoint.nodes.find((n) => n.node_id === "ns=4;i=3").writable = true;
    const row = endpoint.rows.find((r) => r.key === "ns=4;i=3");
    row.platform = "number";
    row.entity_id = "number.velocita";
    row.settings = { platform: "number", min: -5, max: 80, step: 0.25 };
  });
  await page.getByRole("button", { name: "Aggiorna", exact: true }).click();
  const card = page
    .locator("tr.entityRow")
    .filter({ hasText: "Velocità linea" });
  await card.locator("td.typeCell").click();
  let dialog = page.locator("dialog[open]");
  assert.equal(
    await dialog.getByLabel("Valore minimo", { exact: true }).inputValue(),
    "-5",
  );
  assert.equal(
    await dialog.getByLabel("Passo", { exact: true }).inputValue(),
    "0.25",
  );
  await dialog.getByLabel("Valore massimo", { exact: true }).fill("125.5");
  await page.evaluate(() => {
    document.querySelector("opcua-node-panel").hass = { ...window.testHass };
  });
  assert.equal(
    await dialog.getByLabel("Valore massimo", { exact: true }).inputValue(),
    "125.5",
  );
  await shot(page, "number-limits-desktop.png");
  await dialog.getByRole("button", { name: "Salva", exact: true }).click();
  await page.getByText("Configurazione salvata.", { exact: true }).waitFor();
  const saved = await page.evaluate(() =>
    window.calls.find((m) => m.type.endsWith("/update")),
  );
  assert.deepEqual(saved.limits, { min: -5, max: 125.5, step: 0.25 });
  assert.equal(saved.platform, "number");
  await card.locator("td.typeCell").click();
  dialog = page.locator("dialog[open]");
  await dialog
    .getByLabel("Categoria", { exact: true })
    .selectOption("disabled");
  assert.equal(
    await dialog.getByLabel("Valore minimo", { exact: true }).isVisible(),
    false,
  );
  await dialog.getByRole("button", { name: "Salva", exact: true }).click();
  await page
    .getByRole("button", { name: "disabled · 1", exact: true })
    .waitFor();
  await card.locator("td.typeCell").click();
  await page
    .locator("dialog[open]")
    .getByLabel("Categoria", { exact: true })
    .selectOption("number");
  await page
    .locator("dialog[open]")
    .getByRole("button", { name: "Salva", exact: true })
    .click();
  await page.getByRole("button", { name: "number · 1", exact: true }).waitFor();
  await page.close();
});

test("manual text limits and cancelled category edits on mobile", async () => {
  const page = await pageFor(390);
  await page.evaluate(() => {
    window.inspectResult = {
      node: {
        name: "Ricetta nuova",
        node_id: "ns=4;i=77",
        variant_type: "String",
        writable: true,
      },
      platforms: ["sensor", "text"],
    };
  });
  await page
    .getByRole("button", { name: "Aggiungi entità", exact: true })
    .click();
  let dialog = page.locator("dialog[open]");
  await dialog
    .getByLabel("NodeId associato", { exact: true })
    .fill("ns=4;i=77");
  await dialog
    .getByRole("button", { name: "Verifica nodo", exact: true })
    .click();
  await dialog.getByLabel("Categoria", { exact: true }).selectOption("text");
  await dialog.getByLabel("Lunghezza minima", { exact: true }).fill("2");
  await dialog.getByLabel("Lunghezza massima", { exact: true }).fill("64");
  await shot(page, "text-limits-mobile.png");
  await dialog.getByRole("button", { name: "Salva", exact: true }).click();
  await page.getByText("Configurazione salvata.", { exact: true }).waitFor();
  const saved = await page.evaluate(() =>
    window.calls.find((m) => m.type.endsWith("/create")),
  );
  assert.deepEqual(saved.limits, { min_length: 2, max_length: 64 });
  const card = page.locator("tr.entityRow").filter({ hasText: "Nome ricetta" });
  await card.locator("td.typeCell").click();
  dialog = page.locator("dialog[open]");
  await dialog.getByLabel("Categoria", { exact: true }).selectOption("sensor");
  await dialog.getByRole("button", { name: "Annulla", exact: true }).click();
  await card.locator("td.typeCell").click();
  assert.equal(
    await page
      .locator("dialog[open]")
      .getByLabel("Categoria", { exact: true })
      .inputValue(),
    "text",
  );
  await page.close();
});

test("the automatic category names what it resolves to and follows a remap", async () => {
  const page = await pageFor();
  const dialog = page.locator("dialog[open]");
  const category = () => dialog.getByLabel("Categoria", { exact: true });
  const autoText = () =>
    category()
      .locator('option[value="auto"]')
      .textContent();
  // A writable Boolean maps to a switch.
  await page
    .locator("tr.entityRow")
    .filter({ hasText: "Marcia macchina" })
    .locator("td.typeCell")
    .click();
  assert.equal(await autoText(), "Automatico (switch)");
  // Other choices keep their plain names.
  assert.equal(
    await category().locator('option[value="sensor"]').textContent(),
    "sensor",
  );
  assert.equal(
    await category().locator('option[value="disabled"]').textContent(),
    "Esclusi",
  );
  // Remapped to a read-only Float node, automatic means a sensor.
  await category().selectOption("auto");
  await selectNode(dialog, "ns=4;i=3");
  assert.equal(await autoText(), "Automatico (sensor)");
  assert.equal(await category().inputValue(), "auto");
  await shot(page, "auto-category.png");
});

test("REAL precision can be saved, cleared and reset on a non-REAL remap", async () => {
  const page = await pageFor();
  const card = page
    .locator("tr.entityRow")
    .filter({ hasText: "Velocità linea" });
  const edit = () => card.locator("td.typeCell").click();
  const dialog = page.locator("dialog[open]");
  const field = () => dialog.getByLabel("Decimali", { exact: true });
  const save = async () => {
    await dialog.getByRole("button", { name: "Salva", exact: true }).click();
    await page.getByText("Configurazione salvata.", { exact: true }).waitFor();
  };
  await edit();
  assert.equal(await field().inputValue(), "");
  await field().fill("2");
  await page.evaluate(() => {
    document.querySelector("opcua-node-panel").hass = { ...window.testHass };
  });
  assert.equal(await field().inputValue(), "2");
  await shot(page, "real-rounding.png");
  await save();
  assert.equal(
    await page.evaluate(
      () => window.calls.find((m) => m.type.endsWith("/update")).precision,
    ),
    2,
  );
  await edit();
  assert.equal(await field().inputValue(), "2");
  await field().fill("0");
  await save();
  await edit();
  assert.equal(await field().inputValue(), "0");
  await field().fill("");
  await save();
  assert.equal(
    await page.evaluate(
      () =>
        window.calls.filter((m) => m.type.endsWith("/update")).at(-1).precision,
    ),
    null,
  );
  await edit();
  assert.equal(await field().inputValue(), "");
  await field().fill("3");
  await dialog.getByRole("button", { name: "Annulla", exact: true }).click();
  await edit();
  assert.equal(await field().inputValue(), "");
  await field().fill("3");
  await save();
  await edit();
  await selectNode(dialog, "ns=4;i=4");
  assert.equal(await field().isVisible(), false);
  await save();
  assert.equal(
    await page.evaluate(
      () =>
        window.calls.filter((m) => m.type.endsWith("/update")).at(-1).precision,
    ),
    null,
  );
  await page.close();
});

test("a unit of measurement can be picked from a searchable list, set to a custom value, cleared and hidden for a non-numeric remap", async () => {
  const page = await pageFor();
  const card = page
    .locator("tr.entityRow")
    .filter({ hasText: "Velocità linea" });
  const edit = () => card.locator("td.typeCell").click();
  const dialog = page.locator("dialog[open]");
  const field = () =>
    dialog.getByRole("button", { name: "Unità di misura", exact: true });
  const filter = () =>
    dialog.getByRole("combobox", { name: "Cerca unità…", exact: true });
  const selectUnit = async (value) => {
    await field().click();
    await dialog
      .locator(".unitOptions")
      .getByRole("option", {
        name: value === "__custom__" ? "Personalizzata…" : value || "Nessuna",
        exact: true,
      })
      .click();
  };
  const custom = () =>
    dialog.getByLabel("Unità personalizzata", { exact: true });
  const lastUnit = () =>
    page.evaluate(
      () =>
        window.calls.filter((m) => m.type.endsWith("/update")).at(-1)
          .unit_of_measurement,
    );
  const save = async () => {
    await dialog.getByRole("button", { name: "Salva", exact: true }).click();
    await page.getByText("Configurazione salvata.", { exact: true }).waitFor();
  };
  await edit();
  assert.equal(
    await dialog.locator("select[name=unit_choice]").inputValue(),
    "",
  );
  assert.equal(await custom().isVisible(), false);
  // The filter narrows the standard list; "Nessuna" and "Personalizzata…"
  // always stay pinned so a search never hides those two choices.
  await field().click();
  await filter().fill("kwh");
  assert.deepEqual(
    await dialog.locator(".unitOptions").getByRole("option").allTextContents(),
    ["Nessuna", "kWh", "Personalizzata…"],
  );
  await filter().press("Escape");
  await selectUnit("bar");
  await save();
  assert.equal(await lastUnit(), "bar");
  await edit();
  assert.equal(
    await dialog.locator("select[name=unit_choice]").inputValue(),
    "bar",
  );
  assert.equal(await custom().isVisible(), false);
  // Regression: selecting "None" and then typing into the filter must keep
  // the explicit empty choice, not resurrect the unit that was there before.
  await selectUnit("");
  await field().click();
  await filter().fill("kwh");
  assert.equal(
    await dialog.locator("select[name=unit_choice]").inputValue(),
    "",
  );
  await filter().press("Escape");
  await save();
  assert.equal(await lastUnit(), null);

  await edit();
  assert.equal(
    await dialog.locator("select[name=unit_choice]").inputValue(),
    "",
  );
  await selectUnit("bar");
  await save();
  assert.equal(await lastUnit(), "bar");

  await edit();
  assert.equal(
    await dialog.locator("select[name=unit_choice]").inputValue(),
    "bar",
  );
  assert.equal(await custom().isVisible(), false);
  await selectUnit("__custom__");
  assert.equal(await custom().isVisible(), true);
  await custom().fill(" pieces/min ");
  await save();
  assert.equal(await lastUnit(), "pieces/min");
  await edit();
  assert.equal(
    await dialog.locator("select[name=unit_choice]").inputValue(),
    "__custom__",
  );
  assert.equal(await custom().inputValue(), "pieces/min");
  await selectUnit("");
  assert.equal(await custom().isVisible(), false);
  await save();
  assert.equal(await lastUnit(), null);
  await edit();
  assert.equal(
    await dialog.locator("select[name=unit_choice]").inputValue(),
    "",
  );
  await selectUnit("bar");
  await save();
  await edit();
  await selectNode(dialog, "ns=4;i=4");
  assert.equal(await field().isVisible(), false);
  assert.equal(await custom().isVisible(), false);
  await save();
  assert.equal(await lastUnit(), null);
  await page.close();
});

for (const width of [1280, 390]) {
  test(`compact editor switches, node search and live header preserve draft at ${width}px`, async () => {
    const page = await pageFor(width);
    await page
      .locator("tr.entityRow")
      .filter({ hasText: "Marcia macchina" })
      .locator("td.typeCell")
      .click();
    const dialog = page.locator("dialog[open]");
    const invert = dialog.getByRole("switch", {
      name: "Inverti stato booleano",
      exact: true,
    });
    const available = dialog.getByRole("switch", {
      name: "Sempre disponibile",
      exact: true,
    });
    await invert.focus();
    await invert.press("Space");
    await available.check();
    assert.equal(await invert.isChecked(), true);
    assert.equal(
      await page.evaluate(
        () => window.calls.filter((m) => m.type.endsWith("/update")).length,
      ),
      0,
    );
    await dialog.getByLabel("Nome", { exact: true }).fill("Bozza interruttore");
    await page.evaluate(() => {
      window.testHass.states = {
        ...window.testHass.states,
        "switch.marcia": { state: "on", attributes: {} },
      };
      document.querySelector("opcua-node-panel").hass = { ...window.testHass };
    });
    assert.equal(
      await dialog.locator(".editorState .stateValue").textContent(),
      "Acceso",
    );
    assert.equal(
      await dialog.getByLabel("Nome", { exact: true }).inputValue(),
      "Bozza interruttore",
    );
    assert.equal(await invert.isChecked(), true);
    const help = dialog.locator(".helpTip:visible").last();
    assert.equal(await help.locator(".hint").isVisible(), false);
    // The help sits behind the label and opens as a tooltip on focus,
    // without flipping the switch the label belongs to.
    await help.focus();
    assert.equal(await help.locator(".hint").isVisible(), true);
    await help.click();
    assert.equal(await invert.isChecked(), true);
    await shot(page, `editor-switches-${width}.png`);
    const search = dialog.getByRole("combobox", {
      name: "Cerca tra i nodi scoperti",
      exact: true,
    });
    assert.equal(await search.isVisible(), false);
    await dialog
      .getByRole("button", { name: "NodeId associato", exact: true })
      .click();
    await search.fill("missing-node");
    await dialog
      .locator(".nodePicker")
      .getByText("Nessun risultato", { exact: true })
      .waitFor();
    await search.press("ArrowDown");
    await search.press("Enter");
    assert.equal(await dialog.isVisible(), true);
    await search.fill("Consenso");
    await search.press("ArrowDown");
    await search.press("Enter");
    assert.equal(
      await dialog.locator("select[name=node_id]").inputValue(),
      "ns=4;i=2",
    );
    await dialog.getByRole("button", { name: "Annulla", exact: true }).click();
    assert.equal(
      await page.evaluate(
        () => window.calls.filter((m) => m.type.endsWith("/update")).length,
      ),
      0,
    );
    await page.close();
  });
}

for (const width of [1280, 390]) {
  test(`unit picker keyboard interaction and editor sections at ${width}px`, async () => {
    const page = await pageFor(width);
    await page
      .locator("tr.entityRow")
      .filter({ hasText: "Velocità linea" })
      .locator("td.typeCell")
      .click();
    const dialog = page.locator("dialog[open]");
    assert.equal(await dialog.locator(".editorSection:visible").count(), 4);
    const trigger = dialog.getByRole("button", {
      name: "Unità di misura",
      exact: true,
    });
    const search = dialog.getByRole("combobox", {
      name: "Cerca unità…",
      exact: true,
    });
    assert.equal(await search.isVisible(), false);
    await trigger.focus();
    await trigger.press("ArrowDown");
    await search.fill("kwh");
    await shot(page, `editor-unit-picker-${width}.png`);
    await search.press("ArrowDown");
    await search.press("ArrowDown");
    await search.press("Enter");
    assert.equal(await trigger.textContent(), "kWh");
    assert.equal(await search.isVisible(), false);
    assert.equal(await dialog.isVisible(), true);
    await trigger.click();
    await search.fill("no matching unit");
    await search.press("Escape");
    assert.equal(await dialog.isVisible(), true);
    assert.equal(await trigger.textContent(), "kWh");
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    await trigger.click();
    await search.press("Tab");
    assert.equal(await search.isVisible(), false);
    await dialog.getByRole("button", { name: "Salva", exact: true }).click();
    await dialog.waitFor({ state: "detached" });
    assert.equal(
      await page.evaluate(
        () =>
          window.calls.filter((m) => m.type.endsWith("/update")).at(-1)
            .unit_of_measurement,
      ),
      "kWh",
    );
    await page.close();
  });
}

test("always available is per entity, persists, clears and supports manual nodes", async () => {
  const page = await pageFor(390);
  const card = page
    .locator("tr.entityRow")
    .filter({ hasText: "Marcia macchina" });
  const edit = () => card.locator("td.typeCell").click();
  const dialog = page.locator("dialog[open]");
  const option = () => dialog.getByLabel("Sempre disponibile", { exact: true });
  const save = async () => {
    await dialog.getByRole("button", { name: "Salva", exact: true }).click();
    await page.getByText("Configurazione salvata.", { exact: true }).waitFor();
  };
  await edit();
  assert.equal(await option().isChecked(), false);
  await option().check();
  await page.evaluate(() => {
    document.querySelector("opcua-node-panel").hass = { ...window.testHass };
  });
  assert.equal(await option().isChecked(), true);
  await shot(page, "always-available-mobile.png");
  await save();
  assert.equal(
    await page.evaluate(
      () =>
        window.calls.filter((m) => m.type.endsWith("/update")).at(-1)
          .always_available,
    ),
    true,
  );
  await edit();
  assert.equal(await option().isChecked(), true);
  await option().uncheck();
  await dialog.getByRole("button", { name: "Annulla", exact: true }).click();
  await edit();
  assert.equal(await option().isChecked(), true);
  await option().uncheck();
  await save();
  assert.equal(
    await page.evaluate(
      () =>
        window.calls.filter((m) => m.type.endsWith("/update")).at(-1)
          .always_available,
    ),
    false,
  );
  await page
    .getByRole("button", { name: "Aggiungi entità", exact: true })
    .click();
  await dialog
    .getByLabel("NodeId associato", { exact: true })
    .fill("ns=4;i=77");
  await dialog
    .getByRole("button", { name: "Verifica nodo", exact: true })
    .click();
  await option().check();
  await dialog.getByRole("button", { name: "Salva", exact: true }).click();
  await page.getByText("Configurazione salvata.", { exact: true }).waitFor();
  assert.equal(
    await page.evaluate(
      () =>
        window.calls.find((m) => m.type.endsWith("/create")).always_available,
    ),
    true,
  );
  await page.close();
});

for (const width of [390, 1280]) {
  test(`subscription selection persists and keeps deadband while polling at ${width}px`, async () => {
    const page = await pageFor(width);
    const card = page
      .locator("tr.entityRow")
      .filter({ hasText: "Velocità linea" });
    const edit = () => card.locator("td.typeCell").click();
    const dialog = page.locator("dialog[open]");
    const mode = dialog.getByLabel("Modalità aggiornamento", { exact: true });
    const deadband = dialog.getByLabel("Deadband", { exact: true });
    const save = async () => {
      await dialog.getByRole("button", { name: "Salva", exact: true }).click();
      await page
        .getByText("Configurazione salvata.", { exact: true })
        .waitFor();
    };
    await edit();
    assert.equal(await mode.inputValue(), "polling");
    assert.equal(await deadband.isVisible(), false);
    await mode.selectOption("subscription");
    await deadband.fill("0.25");
    await page.evaluate(() => {
      document.querySelector("opcua-node-panel").hass = { ...window.testHass };
    });
    assert.equal(await mode.inputValue(), "subscription");
    await shot(page, `subscription-${width}.png`);
    await save();
    await edit();
    assert.equal(await mode.inputValue(), "subscription");
    assert.equal(await deadband.inputValue(), "0.25");
    await mode.selectOption("polling");
    assert.equal(await deadband.isVisible(), false);
    await dialog.getByRole("button", { name: "Annulla", exact: true }).click();
    await edit();
    assert.equal(await mode.inputValue(), "subscription");
    await mode.selectOption("polling");
    await save();
    const saved = await page.evaluate(() =>
      window.calls.filter((m) => m.type.endsWith("/update")).at(-1),
    );
    assert.equal(saved.update_mode, "polling");
    assert.equal(Object.hasOwn(saved, "deadband"), false);
    await edit();
    assert.equal(await mode.inputValue(), "polling");
    await mode.selectOption("subscription");
    assert.equal(await deadband.inputValue(), "0.25");
    await dialog.getByRole("button", { name: "Annulla", exact: true }).click();
    await page.close();
  });
}

test("manual nodes offer subscription mode in English", async () => {
  const page = await pageFor(390);
  await page.evaluate(async () => {
    window.testHass.language = "en";
    const panel = document.querySelector("opcua-node-panel");
    panel.hass = { ...window.testHass };
    await panel._load();
  });
  await page.getByRole("button", { name: "Add entity", exact: true }).click();
  const dialog = page.locator("dialog[open]");
  await dialog
    .getByLabel("Associated NodeId", { exact: true })
    .fill("ns=4;i=77");
  await dialog
    .getByRole("button", { name: "Verify node", exact: true })
    .click();
  const mode = dialog.getByLabel("Update mode", { exact: true });
  assert.equal(await mode.inputValue(), "polling");
  await mode.selectOption("subscription");
  assert.equal(
    await dialog.getByLabel("Deadband", { exact: true }).isVisible(),
    false,
  );
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForFunction(() =>
    window.calls.some((m) => m.type.endsWith("/create")),
  );
  assert.equal(
    await page.evaluate(
      () => window.calls.find((m) => m.type.endsWith("/create")).update_mode,
    ),
    "subscription",
  );
  await page.close();
});

for (const width of [390, 1280]) {
  test(`endpoint toggle uses native switch, works offline and tracks external changes at ${width}px`, async () => {
    const page = await pageFor(width);
    const toggle = page.getByRole("switch", {
      name: "Auto-Subscription endpoint",
      exact: true,
    });
    assert.equal(await toggle.isChecked(), false);
    await toggle.check();
    await page.waitForFunction(
      () => window.testHass.states["switch.subscription1"].state === "on",
    );
    assert.deepEqual(await page.evaluate(() => window.serviceCalls), [
      {
        domain: "switch",
        service: "turn_on",
        data: { entity_id: "switch.subscription1" },
      },
    ]);
    const box = await toggle.boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= width);
    await shot(page, `endpoint-subscription-${width}.png`);
    await page
      .locator("tr.entityRow")
      .filter({ hasText: "Marcia macchina" })
      .locator("td.typeCell")
      .click();
    const dialog = page.locator("dialog[open]");
    await dialog.getByLabel("Nome", { exact: true }).fill("Draft preserved");
    await page.evaluate(() => {
      window.testHass.states["switch.subscription1"] = {
        state: "off",
        attributes: {},
      };
      document.querySelector("opcua-node-panel").hass = { ...window.testHass };
    });
    assert.equal(await toggle.isChecked(), false);
    assert.equal(
      await dialog.getByLabel("Nome", { exact: true }).inputValue(),
      "Draft preserved",
    );
    await dialog.getByRole("button", { name: "Annulla", exact: true }).click();
    await page.getByLabel("Endpoint", { exact: true }).selectOption("plc2");
    assert.equal(await toggle.isChecked(), true);
    assert.equal(await toggle.isEnabled(), true); // PLC 2 is offline.
    await toggle.uncheck();
    await page.waitForFunction(
      () => window.testHass.states["switch.subscription2"].state === "off",
    );
    assert.deepEqual(await page.evaluate(() => window.serviceCalls.at(-1)), {
      domain: "switch",
      service: "turn_off",
      data: { entity_id: "switch.subscription2" },
    });
    assert.equal(
      await page.evaluate(() =>
        window.calls.some((c) => c.type.endsWith("/update")),
      ),
      false,
    );
    await page.close();
  });
}

test("pending commands and errors stay scoped to their endpoint", async () => {
  const page = await pageFor();
  const toggle = page.getByRole("switch", {
    name: "Auto-Subscription endpoint",
    exact: true,
  });
  await page.evaluate(() => {
    window.holdService = true;
  });
  await toggle.click();
  assert.equal(await toggle.isDisabled(), true);
  await page.getByLabel("Endpoint", { exact: true }).selectOption("plc2");
  assert.equal(await toggle.isEnabled(), true);
  assert.equal(await toggle.isChecked(), true);
  await page.evaluate(() => {
    window.failService = true;
    window.releaseService();
  });
  await page.waitForFunction(
    () =>
      document.querySelector("opcua-node-panel")._subscriptionPending.size ===
      0,
  );
  assert.equal(
    await page
      .getByText("Impossibile modificare Auto-Subscription. Riprova.", {
        exact: true,
      })
      .isVisible(),
    false,
  );
  await page.getByLabel("Endpoint", { exact: true }).selectOption("plc1");
  assert.equal(await toggle.isChecked(), false);
  await page
    .getByRole("alert")
    .filter({ hasText: "Impossibile modificare Auto-Subscription" })
    .waitFor();
  assert.equal(await page.evaluate(() => window.serviceCalls.length), 1);
  await page.evaluate(() => {
    window.failService = false;
    window.holdService = false;
  });
  await toggle.check();
  await page.waitForFunction(
    () => window.testHass.states["switch.subscription1"].state === "on",
  );
  assert.equal(
    await page
      .getByText("Impossibile modificare Auto-Subscription. Riprova.", {
        exact: true,
      })
      .isVisible(),
    false,
  );
  await page.close();
});

test("unavailable, missing and unloaded subscription switches cannot be controlled", async () => {
  const page = await pageFor();
  const toggle = page.getByRole("switch", {
    name: "Auto-Subscription endpoint",
    exact: true,
  });
  for (const state of ["unavailable", "unknown", null]) {
    await page.evaluate((state) => {
      if (state === null) delete window.testHass.states["switch.subscription1"];
      else
        window.testHass.states["switch.subscription1"] = {
          state,
          attributes: {},
        };
      document.querySelector("opcua-node-panel").hass = { ...window.testHass };
    }, state);
    assert.equal(await toggle.isDisabled(), true);
  }
  await page.evaluate(async () => {
    window.testHass.states["switch.subscription1"] = {
      state: "off",
      attributes: {},
    };
    window.fixture.endpoints[0].loaded = false;
    await document.querySelector("opcua-node-panel")._load();
  });
  assert.equal(await toggle.isDisabled(), true);
  assert.equal(await page.evaluate(() => window.serviceCalls.length), 0);
  await page.close();
});

for (const [width, dark] of [
  [1440, false],
  [1440, true],
  [768, false],
  [390, true],
  [320, false],
]) {
  test(`panel layout keeps long values and controls readable at ${width}px, dark=${dark}`, async () => {
    const page = await pageFor(width);
    await page.evaluate(async (dark) => {
      if (dark)
        document.body.style.cssText +=
          ";--primary-background-color:#111827;--card-background-color:#1f2937;--primary-text-color:#eef2f7;--secondary-text-color:#acb8c9;--divider-color:#374151;--secondary-background-color:#283548;--primary-color:#38bdf8;--text-primary-color:#111827";
      const endpoint = window.fixture.endpoints[0];
      endpoint.endpoint =
        "opc.tcp://production-line-controller-with-a-long-name.local:4840";
      for (let i = 0; i < 8; i++) {
        const nodeId = `ns=4;s="ProductionLine"."Counter_${i}"`;
        endpoint.rows.push({
          ...endpoint.rows[2],
          key: nodeId,
          node_id: nodeId,
          name:
            i === 0
              ? "Descrizione_articolo_in_lavorazione_sulla_linea_di_produzione"
              : `Contatore produzione ${i}`,
          entity_id: `sensor.counter${i}`,
          variant_type: i === 0 ? "String" : "Int32",
        });
        window.testHass.states[`sensor.counter${i}`] = {
          state:
            i === 0
              ? "PIANO LAVORO CLINCIATO ZINCATO 1800MM / riferimento commessa 822101842"
              : `${74030 + i}`,
          attributes: {},
        };
      }
      const panel = document.querySelector("opcua-node-panel");
      panel.hass = { ...window.testHass };
      await panel._load();
    }, dark);
    await page.locator(".content").evaluate((el) => {
      el.scrollTop = 0;
    });
    // The page itself never scrolls sideways; a narrow screen scrolls the
    // table inside its own frame.
    const overflow = await page
      .locator(".content")
      .evaluate((el) => el.scrollWidth > el.clientWidth + 1);
    assert.equal(overflow, false, "panel must not overflow horizontally");
    const card = page
      .locator("tr.entityRow")
      .filter({ hasText: "Descrizione_articolo_in_lavorazione" });
    const value = card.locator(".stateValue");
    assert.match(await value.textContent(), /1800MM \/ riferimento/);
    const title = await card.locator(".nameCell").boundingBox();
    const state = await value.boundingBox();
    const actions = await card.locator(".actionsCell").boundingBox();
    assert.ok(
      title.x + title.width <= state.x,
      "state occupies its own column",
    );
    assert.ok(
      state.x + state.width <= actions.x,
      "actions occupy their own column",
    );
    // Every column starts at the same left edge in every row and group.
    const edges = await page
      .locator("tr.entityRow")
      .evaluateAll((rows) =>
        [".nameCell", ".typeCell", ".valueCell", ".settingsCell"].map(
          (cell) =>
            new Set(
              rows.map((row) =>
                Math.round(
                  row.querySelector(cell).getBoundingClientRect().left,
                ),
              ),
            ).size,
        ),
      );
    assert.deepEqual(edges, [1, 1, 1, 1], "columns line up in every row");
    await shot(page, `polish-${width}-${dark ? "dark" : "light"}.png`);
    await page.close();
  });
}

for (const width of [1280, 390, 320]) {
  test(`entity editor actions stay visible while fields scroll at ${width}px`, async () => {
    const page = await pageFor(width);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 620 });
    await page.evaluate(async () => {
      window.fixture.endpoints[0].nodes[2].writable = true;
      await document.querySelector("opcua-node-panel")._load();
    });
    await page
      .locator("tr.entityRow")
      .filter({ hasText: "Velocità linea" })
      .locator("td.typeCell")
      .click();
    const dialog = page.locator("dialog");
    await dialog
      .getByLabel("Categoria", { exact: true })
      .selectOption("number");
    const body = dialog.locator(".editorBody");
    const footer = dialog.locator("footer");
    const assertActionsVisible = async () => {
      const viewport = page.viewportSize();
      for (const label of ["Annulla", "Salva"]) {
        const button = dialog.getByRole("button", { name: label, exact: true });
        const box = await button.boundingBox();
        assert.ok(box && box.y >= 0 && box.y + box.height <= viewport.height);
        assert.ok(box.x >= 0 && box.x + box.width <= viewport.width);
        // Check actual hit testing, not just presence in the DOM.
        assert.equal(
          await button.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return (
              el
                .getRootNode()
                .elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el
            );
          }),
          true,
        );
      }
      const fields = await body.boundingBox();
      const actions = await footer.boundingBox();
      assert.ok(fields.y + fields.height <= actions.y + 1);
    };
    await body.evaluate((el) => {
      el.scrollTop = 0;
    });
    await assertActionsVisible();
    const top = (await footer.boundingBox()).y;
    await body.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    assert.ok(await body.evaluate((el) => el.scrollTop > 0));
    await assertActionsVisible();
    assert.ok(Math.abs((await footer.boundingBox()).y - top) < 1);
    // A reduced viewport also covers landscape / constrained-height layouts.
    await page.setViewportSize({ width, height: 400 });
    await assertActionsVisible();
    await shot(page, `editor-fixed-actions-${width}.png`);
    await page.evaluate(() => {
      window.failSave = true;
    });
    await dialog.getByRole("button", { name: "Salva", exact: true }).click();
    await dialog.getByRole("alert").filter({ hasText: /.+/ }).waitFor();
    await assertActionsVisible();
    await shot(page, `editor-fixed-actions-error-${width}.png`);
    await dialog.getByRole("button", { name: "Annulla", exact: true }).click();
    await dialog.waitFor({ state: "detached" });
    await page.close();
  });
}

for (const [width, dark] of [
  [1440, false],
  [390, true],
  [320, false],
]) {
  test(`typed state cards and live indicators at ${width}px`, async () => {
    const page = await pageFor(width);
    await page.evaluate(async (dark) => {
      if (dark)
        document.body.style.cssText +=
          ";--primary-background-color:#111827;--card-background-color:#1f2937;--primary-text-color:#eef2f7;--secondary-text-color:#acb8c9;--divider-color:#374151;--primary-color:#38bdf8;--text-primary-color:#111827";
      const endpoint = window.fixture.endpoints[0];
      const samples = [
        ["Int2", "Int16", "10", {}],
        ["Real1", "Float", "0.0", {}],
        ["Real2", "Float", "11.1000003814697", { value_stale: true }],
        ["String1", "String", "", {}],
        ["String2", "String", "Ricetta A / articolo in lavorazione", {}],
        ["Orologio", "DateTime", "2026-09-29T10:00:00+00:00", {}],
        ["Marcia", "Boolean", "on", {}],
        ["Consenso", "Boolean", "off", {}],
        ["Allarme", "Boolean", "on", { device_class: "problem" }],
        ["Scollegato", "Boolean", "unavailable", {}],
      ];
      endpoint.rows = samples.map(
        ([name, variant_type, state, attributes], i) => {
          const platform =
            variant_type === "Boolean" ? "binary_sensor" : "sensor";
          const entity_id = `${platform}.sample${i}`;
          window.testHass.states[entity_id] = { state, attributes };
          return {
            key: `ns=4;i=${i + 5}`,
            node_id: `ns=4;i=${i + 5}`,
            name,
            variant_type,
            platform,
            entity_id,
            editable: true,
          };
        },
      );
      const panel = document.querySelector("opcua-node-panel");
      panel.hass = { ...window.testHass };
      await panel._load();
    }, dark);
    const card = (name) =>
      page
        .locator("tr.entityRow")
        .filter({ has: page.getByRole("heading", { name, exact: true }) });
    assert.equal(await card("Int2").getAttribute("data-value-type"), "numeric");
    assert.equal(await card("String2").getAttribute("data-value-type"), "text");
    assert.equal(
      await card("Orologio").getAttribute("data-value-type"),
      "datetime",
    );
    assert.equal(
      await card("String1").getAttribute("data-state-kind"),
      "empty",
    );
    assert.equal(
      await card("String1").locator(".stateValue").textContent(),
      "Testo vuoto",
    );
    assert.equal(await card("Marcia").getAttribute("data-tone"), "active");
    assert.equal(
      await card("Consenso").locator(".valueIcon").getAttribute("data-icon"),
      "off",
    );
    assert.equal(await card("Allarme").getAttribute("data-tone"), "alert");
    assert.equal(
      await card("Scollegato").locator(".valueIcon").getAttribute("data-icon"),
      "unavailable",
    );
    assert.equal(
      await card("Real2").locator(".retainedValue").isVisible(),
      true,
    );
    assert.equal(
      await card("Real2").locator(".stateValue").textContent(),
      "11.1000003814697",
    );
    assert.equal(
      await page
        .locator(".content")
        .evaluate((el) => el.scrollWidth > el.clientWidth + 1),
      false,
    );
    // A simple value keeps its row one line high.
    assert.ok(
      (await card("Int2").boundingBox()).height < 48,
      "simple rows stay compact",
    );
    await shot(page, `typed-states-${width}-${dark ? "dark" : "light"}.png`);
    await page.locator(".tableWrap").evaluate((el) => {
      el.scrollTop +=
        el
          .querySelector('.rowGroup[data-platform="binary_sensor"]')
          .getBoundingClientRect().top - el.getBoundingClientRect().top;
    });
    await shot(page, `boolean-states-${width}-${dark ? "dark" : "light"}.png`);
    // A live update clears both stale and active/alarm visuals without rebuilding the card.
    await page.evaluate(() => {
      window.testHass.states["sensor.sample2"] = {
        state: "12",
        attributes: { value_stale: false },
      };
      window.testHass.states["binary_sensor.sample6"] = {
        state: "off",
        attributes: {},
      };
      window.testHass.states["binary_sensor.sample8"] = {
        state: "unknown",
        attributes: { device_class: "problem" },
      };
      document.querySelector("opcua-node-panel").hass = { ...window.testHass };
    });
    assert.equal(
      await card("Real2").locator(".retainedValue").isVisible(),
      false,
    );
    assert.equal(await card("Marcia").getAttribute("data-tone"), "neutral");
    assert.equal(
      await card("Marcia").locator(".valueIcon").getAttribute("data-icon"),
      "off",
    );
    assert.equal(await card("Allarme").getAttribute("data-tone"), "neutral");
    assert.equal(
      await card("Allarme").locator(".valueIcon").getAttribute("data-icon"),
      "unknown",
    );
    await page.close();
  });
}

for (const width of [1280, 390]) {
  test(`saved customizations are compact, conditional and update after saving at ${width}px`, async () => {
    const page = await pageFor(width);
    await page.evaluate(async () => {
      const endpoint = window.fixture.endpoints[0];
      Object.assign(endpoint.rows[0], {
        settings: { always_available: false, update_mode: "polling" },
      });
      Object.assign(endpoint.rows[1], { invert_state: true });
      Object.assign(endpoint.rows[2], {
        platform: "number",
        node_id: "ns=4;i=30",
        settings: {
          precision: 0,
          always_available: true,
          update_mode: "subscription",
          deadband: 0,
          min: -10,
          max: 50,
          step: 0.5,
        },
      });
      endpoint.rows[3].settings = { min_length: 0, max_length: 64 };
      window.testHass.localize = (key) =>
        key.endsWith(".door.name") ? "Porta" : "";
      const panel = document.querySelector("opcua-node-panel");
      panel.hass = { ...window.testHass };
      await panel._load();
    });
    const card = (name) =>
      page
        .locator("tr.entityRow")
        .filter({ has: page.getByRole("heading", { name, exact: true }) });
    const number = card("Velocità linea");
    assert.equal(
      await card("Marcia macchina").locator(".customizations").count(),
      0,
    );
    assert.equal(
      await number.locator('[data-setting="precision"]').textContent(),
      "Decimali: 0",
    );
    assert.equal(
      await number.locator('[data-setting="deadband"]').textContent(),
      "Deadband: 0",
    );
    assert.equal(
      await number.locator('[data-setting="range"]').textContent(),
      "Limiti: -10 – 50",
    );
    assert.equal(
      await number.locator('[data-setting="step"]').textContent(),
      "Passo: 0,5",
    );
    assert.equal(
      await number.locator('[data-setting="node_id"]').getAttribute("title"),
      "ns=4;i=3 → ns=4;i=30",
    );
    assert.equal(
      await number.locator('[data-setting="update_mode"]').textContent(),
      "Subscription configurata",
    );
    assert.equal(
      await card("Porta protezione")
        .locator('[data-setting="device_class"]')
        .textContent(),
      "Classe: Porta",
    );
    assert.equal(
      await card("Nome ricetta")
        .locator('[data-setting="length"]')
        .textContent(),
      "Caratteri: 0 – 64",
    );
    assert.equal(
      await page
        .locator(".content")
        .evaluate((el) => el.scrollWidth > el.clientWidth + 1),
      false,
    );
    // The saved settings have their own column to the right of the live
    // value, so the row stays one line high.
    const state = await number.locator(".entityState").boundingBox();
    const badges = await number.locator(".customizations").boundingBox();
    assert.ok(
      badges.x >= state.x + state.width,
      "saved settings are separate from live state",
    );
    const rowBox = await number.boundingBox();
    assert.ok(
      rowBox.height <= Math.max(state.height, badges.height) + 24,
      `a row stays one line high (${rowBox.height}px)`,
    );
    await number.scrollIntoViewIfNeeded();
    await shot(page, `customizations-${width}.png`);
    // Use the real save handler: clearing an override must remove its badge.
    await card("Porta protezione").locator("td.typeCell").click();
    const dialog = page.locator("dialog");
    await dialog
      .getByLabel("Inverti stato booleano", { exact: true })
      .uncheck();
    await dialog
      .getByLabel("Classe dispositivo", { exact: true })
      .selectOption("");
    await dialog.getByRole("button", { name: "Salva", exact: true }).click();
    await dialog.waitFor({ state: "detached" });
    assert.equal(
      await card("Porta protezione").locator(".customizations").count(),
      0,
    );
    // Default limits and inactive deadband must not add noise; orphan settings
    // belong to the replacement entity and should not be repeated on the orphan.
    await page.evaluate(async () => {
      const rows = window.fixture.endpoints[0].rows;
      rows[2].node_id = rows[2].key;
      rows[2].settings = {
        min: 0,
        max: 100,
        step: 0.1,
        precision: null,
        update_mode: "polling",
        deadband: 0.5,
      };
      rows[3].settings = { min_length: 0, max_length: 255 };
      rows[0].orphan = true;
      rows[0].settings = {
        always_available: true,
        update_mode: "subscription",
      };
      await document.querySelector("opcua-node-panel")._load();
    });
    assert.equal(
      await page
        .locator('.customizationBadge:not([data-setting="area"])')
        .count(),
      0,
    );
    await page.close();
  });
}

for (const width of [1280, 390]) {
  test(`numeric conversions persist, switch mode and clear at ${width}px`, async () => {
    const page = await pageFor(width);
    const card = page
      .locator("tr.entityRow")
      .filter({ hasText: "Velocità linea" });
    await card.locator("td.typeCell").click();
    let dialog = page.locator("dialog[open]");
    const selector = () =>
      dialog.getByLabel("Conversione numerica", { exact: true });
    await selector().selectOption("multiplier");
    await dialog.getByLabel("Fattore", { exact: true }).fill("0.1");
    await dialog.getByRole("button", { name: "Salva", exact: true }).click();
    await page.getByText("Configurazione salvata.", { exact: true }).waitFor();
    assert.deepEqual(
      await page.evaluate(
        () =>
          window.calls.filter((m) => m.type.endsWith("/update")).at(-1)
            .conversion,
      ),
      { type: "multiplier", factor: 0.1 },
    );
    await card
      .locator('[data-setting="conversion"]')
      .getByText("Moltiplicatore", { exact: true })
      .waitFor();
    await card.locator("td.typeCell").click();
    dialog = page.locator("dialog[open]");
    assert.equal(await selector().inputValue(), "multiplier");
    assert.equal(
      await dialog.getByLabel("Fattore", { exact: true }).inputValue(),
      "0.1",
    );
    await selector().selectOption("linear_scale");
    await dialog.getByLabel("Valore PLC finale", { exact: true }).fill("27648");
    await dialog.getByLabel("Valore HA iniziale", { exact: true }).fill("-50");
    await dialog.getByLabel("Valore HA finale", { exact: true }).fill("150");
    await shot(page, `conversion-${width}.png`);
    await dialog.getByRole("button", { name: "Salva", exact: true }).click();
    await page.getByText("Configurazione salvata.", { exact: true }).waitFor();
    assert.deepEqual(
      await page.evaluate(
        () =>
          window.calls.filter((m) => m.type.endsWith("/update")).at(-1)
            .conversion,
      ),
      {
        type: "linear_scale",
        plc_min: 0,
        plc_max: 27648,
        ha_min: -50,
        ha_max: 150,
      },
    );
    await card.locator("td.typeCell").click();
    dialog = page.locator("dialog[open]");
    await selector().selectOption("none");
    await dialog.getByRole("button", { name: "Salva", exact: true }).click();
    await page.getByText("Configurazione salvata.", { exact: true }).waitFor();
    assert.equal(
      await page.evaluate(
        () =>
          window.calls.filter((m) => m.type.endsWith("/update")).at(-1)
            .conversion,
      ),
      null,
    );
    await page.close();
  });
}

test("German texts, delayed NodeId hint on the name and NodeId in the editor", async () => {
  const page = await pageFor(1280);
  await page.evaluate(async () => {
    window.testHass.language = "de";
    const panel = document.querySelector("opcua-node-panel");
    panel.hass = { ...window.testHass };
    await panel._load();
  });
  assert.equal(
    await page
      .getByRole("searchbox", { name: "Name oder NodeId suchen", exact: true })
      .count(),
    1,
  );
  assert.equal(
    await page.getByRole("columnheader", { name: "Einstellungen" }).count(),
    1,
  );
  // No NodeId or area column any more; the help of a switch is a hint.
  assert.equal(
    await page.locator("th").filter({ hasText: "NodeId" }).count(),
    0,
  );
  assert.equal(await page.locator("#subscription-help").isVisible(), false);
  const row = page.locator("tr.entityRow").filter({ hasText: "Marcia" });
  const name = row.locator(".nameCell h3");
  const tip = page.locator(".nodeTip");
  await name.hover();
  await page.waitForTimeout(200);
  assert.equal(
    await tip.isVisible(),
    false,
    "hint waits for a resting pointer",
  );
  await page.waitForTimeout(900);
  assert.equal(await tip.isVisible(), true);
  assert.match(await tip.textContent(), /ns=4;i=1/);
  await page.mouse.move(5, 5);
  assert.equal(await tip.isVisible(), false);
  // No edit button any more: the focused row opens the editor with Enter.
  assert.equal(
    await row.getByRole("button", { name: "Bearbeiten", exact: true }).count(),
    0,
  );
  await row.focus();
  await page.keyboard.press("Enter");
  const dialog = page.locator("dialog[open]");
  assert.match(
    await dialog.locator(".editorNodeId").textContent(),
    /^NodeId\s*ns=4;i=1$/,
  );
  await dialog.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await page.close();
});

test("columns keep their place when a value changes and can be resized", async () => {
  const page = await pageFor(1280);
  const settingsLeft = () =>
    page
      .locator("thead th")
      .nth(4)
      .evaluate((th) => Math.round(th.getBoundingClientRect().left));
  const before = await settingsLeft();
  await page.evaluate(() => {
    const panel = document.querySelector("opcua-node-panel");
    for (const id of Object.keys(window.testHass.states))
      window.testHass.states[id] = {
        ...window.testHass.states[id],
        state: "123456789.123456",
      };
    panel.hass = { ...window.testHass };
  });
  assert.equal(await settingsLeft(), before, "a longer value moves nothing");
  const name = page.locator("thead th").first();
  const box = await name.boundingBox();
  await page.mouse.move(box.x + box.width - 3, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 80, box.y + box.height / 2, {
    steps: 4,
  });
  await page.mouse.up();
  const wider = (await name.boundingBox()).width;
  assert.ok(Math.abs(wider - (box.width + 83)) <= 2, `dragged to ${wider}`);
  // The width survives a re-render (storage is blocked in this test page).
  await page.evaluate(() =>
    document.querySelector("opcua-node-panel")._render(),
  );
  assert.ok(
    Math.abs((await name.boundingBox()).width - wider) <= 1,
    "width kept after re-render",
  );
  await page.close();
});

test("integer select with a value table and a Boolean push button", async () => {
  const page = await pageFor();
  await page.evaluate(() => {
    const endpoint = window.fixture.endpoints[0];
    const node = endpoint.nodes.find((n) => n.node_id === "ns=4;i=3");
    node.variant_type = "Int16";
    node.writable = true;
    endpoint.rows.find((r) => r.key === "ns=4;i=3").variant_type = "Int16";
  });
  await page.getByRole("button", { name: "Aggiorna", exact: true }).click();
  const row = page
    .locator("tr.entityRow")
    .filter({ hasText: "Velocità linea" });
  await row.locator("td.typeCell").click();
  let dialog = page.locator("dialog[open]");
  // Optional on an integer sensor, required on a select.
  assert.equal(await dialog.locator(".valueTableField").isVisible(), true);
  await dialog.getByLabel("Categoria", { exact: true }).selectOption("select");
  assert.equal(
    await dialog.getByLabel("Unità di misura", { exact: true }).isVisible(),
    false,
  );
  const add = dialog.getByRole("button", {
    name: "Aggiungi riga",
    exact: true,
  });
  await add.click();
  await add.click();
  const texts = dialog.locator("[name=value_label_text]");
  await texts.nth(0).fill("Spento");
  await texts.nth(1).fill("Auto");
  assert.deepEqual(
    await dialog
      .locator("[name=value_label_value]")
      .evaluateAll((inputs) => inputs.map((i) => i.value)),
    ["0", "1"],
  );
  await add.click();
  await dialog
    .getByRole("button", { name: "Rimuovi riga", exact: true })
    .last()
    .click();
  await dialog.getByRole("button", { name: "Salva", exact: true }).click();
  await page.getByText("Configurazione salvata.", { exact: true }).waitFor();
  let saved = await page.evaluate(() =>
    window.calls.findLast((m) => m.type.endsWith("/update")),
  );
  assert.equal(saved.platform, "select");
  assert.deepEqual(saved.value_labels, [
    { value: 0, label: "Spento" },
    { value: 1, label: "Auto" },
  ]);
  assert.equal(saved.unit_of_measurement, undefined);
  assert.equal(saved.pulse_ms, undefined);

  const button = page
    .locator("tr.entityRow")
    .filter({ hasText: "Marcia macchina" });
  await button.locator("td.typeCell").click();
  dialog = page.locator("dialog[open]");
  assert.equal(
    await dialog.getByLabel("Durata impulso (ms)", { exact: true }).isVisible(),
    false,
  );
  await dialog.getByLabel("Categoria", { exact: true }).selectOption("button");
  const pulse = dialog.getByLabel("Durata impulso (ms)", { exact: true });
  assert.equal(await pulse.inputValue(), "500");
  assert.equal(await dialog.locator(".valueTableField").isVisible(), false);
  await pulse.fill("800");
  await dialog.getByRole("button", { name: "Salva", exact: true }).click();
  await page.getByText("Configurazione salvata.", { exact: true }).waitFor();
  saved = await page.evaluate(() =>
    window.calls.findLast((m) => m.type.endsWith("/update")),
  );
  assert.equal(saved.platform, "button");
  assert.equal(saved.pulse_ms, 800);
  assert.equal(saved.value_labels, undefined);
  // Group headings name the platform and leave the count to the chips.
  const headings = await page.locator(".groupToggle").allTextContents();
  assert.ok(
    ["select", "button"].every((p) => headings.includes(p)),
    headings.join(", "),
  );
  assert.ok(
    headings.every((h) => !h.includes("·")),
    headings.join(", "),
  );
  await page.close();
});
