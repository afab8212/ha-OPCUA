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

async function pageFor(width = 1280, admin = true) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.setContent(
    '<html lang="it"><body style="margin:0;height:100vh"><opcua-node-panel></opcua-node-panel></body></html>',
  );
  await page.addScriptTag({
    path: path.resolve("custom_components/ha_opcua_discovery/www/panel.js"),
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
    window.fixture = {
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
        },
      ],
      areas: [{ id: "workshop", name: "Officina" }],
      device_classes: ["door", "motion", "problem"],
    };
    window.testHass = {
      language: "it",
      user: { is_admin: admin },
      states: {},
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
        if (window.failSave) throw { code: "stale_configuration" };
        const endpoint = window.fixture.endpoints.find(
          (e) => e.entry_id === msg.entry_id,
        );
        const row = endpoint.rows.find((r) => r.key === msg.key);
        Object.assign(row, {
          name: msg.name,
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
    .getByRole("heading", { name: "Nodi OPC UA", exact: true })
    .waitFor();
  if (admin) await page.locator("article").first().waitFor();
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
  assert.equal(await page.locator("article").count(), 4);
  await shot(page, "desktop.png");
  await page
    .getByRole("button", { name: "Sensori binari · 1", exact: true })
    .click();
  assert.equal(await page.locator("article").count(), 1);
  await page.getByRole("button", { name: "Tutte · 4", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Cerca nome o NodeId", exact: true })
    .fill("ns=4;i=4");
  assert.equal(await page.locator("article").count(), 1);
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
  assert.equal(await page.locator("article").count(), 0);
  await page.getByText("Disconnesso", { exact: true }).waitFor();
  await page.close();
});

test("editing saves correct fields and live hass updates preserve draft", async () => {
  const page = await pageFor();
  await page
    .locator("article")
    .filter({ hasText: "Porta protezione" })
    .getByRole("button", { name: "Modifica" })
    .click();
  const dialog = page.locator("dialog");
  await dialog.getByLabel("Nome", { exact: true }).fill("Porta ingresso");
  await dialog.getByLabel("Area", { exact: true }).selectOption("workshop");
  await dialog
    .getByLabel("NodeId associato", { exact: true })
    .selectOption("ns=4;i=1");
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
    type: "ha_opcua_discovery/entity/update",
    entry_id: "plc1",
    revision: "rev1",
    key: "ns=4;i=2",
    name: "Porta ingresso",
    area_id: "workshop",
    node_id: "ns=4;i=1",
    device_class: "motion",
    invert_state: true,
  });
  await page.close();
});

test("mobile dialog, cancel and rejected save keep data intact", async () => {
  const page = await pageFor(390);
  await page.evaluate(() => {
    document.body.style.cssText +=
      ";--primary-background-color:#111827;--card-background-color:#1f2937;--primary-text-color:#eef2f7;--secondary-text-color:#9cabc0;--divider-color:#374151;--secondary-background-color:#283548;--primary-color:#0891b2";
  });
  await page
    .locator("article")
    .filter({ hasText: "Marcia macchina" })
    .getByRole("button", { name: "Modifica" })
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
    .locator("article")
    .filter({ hasText: "Marcia macchina" })
    .getByRole("button", { name: "Modifica" })
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
    type: "ha_opcua_discovery/entity/create",
    entry_id: "plc2",
    revision: "rev2",
    node_id: 'ns=4;s="DB"."Door"',
    platform: "binary_sensor",
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
    await dialog.getByLabel("Inverti stato booleano").isVisible(),
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
  await page
    .getByRole("button", { name: "Data e ora · 1", exact: true })
    .click();
  assert.equal(await page.locator("article").count(), 1);
  await page.getByRole("button", { name: "Modifica", exact: true }).click();
  const options = await dialog
    .getByLabel("NodeId associato", { exact: true })
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
  assert.equal(await page.locator("article").count(), 1);
  const box = await dialog.boundingBox();
  assert.ok(box.x >= 0 && box.x + box.width <= 390);
  await shot(page, "remove-manual-mobile.png");
  await page.evaluate(() => {
    window.failRemove = null;
  });
  await dialog.getByRole("button", { name: "Rimuovi", exact: true }).click();
  await page.getByText("Nodo manuale rimosso.", { exact: true }).waitFor();
  assert.equal(await page.locator("article").count(), 0);
  const removal = await page.evaluate(() =>
    window.calls.find((m) => m.type.endsWith("/remove")),
  );
  assert.deepEqual(removal, {
    type: "ha_opcua_discovery/node/remove",
    entry_id: "plc2",
    revision: "rev2",
    key: "ns=4;i=99",
  });
  await page.close();
});
