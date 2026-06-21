import { del, list, put } from "@vercel/blob";

const ROOT = "bgbazaar";
const ORDERS_RESET_VERSION = "2026-06-21-order-management-clean-start";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "amaresh@bgbazaar.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "amareshraj@1321";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb"
    }
  }
};

function respond(response, status, data) {
  response.status(status).setHeader("Cache-Control", "no-store").json(data);
}

function safeId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "");
}

function isAdmin(body) {
  return body?.username === ADMIN_USERNAME && body?.password === ADMIN_PASSWORD;
}

async function readJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to read shared data.");
  return response.json();
}

async function listRecords(type) {
  const records = [];
  let cursor;
  do {
    const page = await list({ prefix: `${ROOT}/${type}/`, cursor, limit: 1000 });
    const values = await Promise.all(page.blobs.map((blob) => readJson(blob.url)));
    records.push(...values);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return records;
}

async function readSingle(pathname) {
  const result = await list({ prefix: pathname, limit: 10 });
  const blob = result.blobs.find((item) => item.pathname === pathname);
  return blob ? readJson(blob.url) : null;
}

async function writeJson(pathname, value) {
  await put(pathname, JSON.stringify(value), {
    access: "public",
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60
  });
  return value;
}

async function deleteRecords(type) {
  let cursor;
  do {
    const page = await list({ prefix: `${ROOT}/${type}/`, cursor, limit: 1000 });
    if (page.blobs.length) {
      await Promise.all(page.blobs.map((blob) => del(blob.url)));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}

async function ensureOrdersReset() {
  const metaPath = `${ROOT}/meta/orders-reset.json`;
  const resetMeta = await readSingle(metaPath);
  if (resetMeta?.version === ORDERS_RESET_VERSION) return;
  await deleteRecords("orders");
  await writeJson(`${ROOT}/meta/order-counter.json`, {
    lastOrderNumber: 0,
    resetAt: new Date().toISOString()
  });
  await writeJson(metaPath, {
    version: ORDERS_RESET_VERSION,
    resetAt: new Date().toISOString()
  });
}

async function saveDataImage(dataUrl, folder, filename) {
  if (!String(dataUrl || "").startsWith("data:")) return dataUrl || "";
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid uploaded file.");
  const extension = match[1] === "application/pdf" ? "pdf" : match[1].split("/")[1]?.replace("jpeg", "jpg") || "bin";
  const body = Buffer.from(match[2], "base64");
  const blob = await put(`${ROOT}/${folder}/${safeId(filename)}.${extension}`, body, {
    access: "public",
    addRandomSuffix: true,
    contentType: match[1],
    cacheControlMaxAge: 60
  });
  return blob.url;
}

async function getPublicState() {
  const [categories, products, settings] = await Promise.all([
    listRecords("categories"),
    listRecords("products"),
    readSingle(`${ROOT}/settings.json`)
  ]);
  return { categories, products, settings };
}

async function getAdminState() {
  await ensureOrdersReset();
  const [publicState, orders] = await Promise.all([getPublicState(), listRecords("orders")]);
  return { ...publicState, orders };
}

async function saveCategory(category) {
  return writeJson(`${ROOT}/categories/${safeId(category.id)}.json`, category);
}

async function saveProduct(product) {
  const saved = { ...product };
  saved.image = await saveDataImage(saved.image, "product-images", saved.id);
  return writeJson(`${ROOT}/products/${safeId(saved.id)}.json`, saved);
}

async function saveSettings(settings) {
  const saved = { ...settings };
  saved.logoUrl = await saveDataImage(saved.logoUrl, "branding", "logo");
  saved.qrImage = await saveDataImage(saved.qrImage, "branding", "payment-qr");
  return writeJson(`${ROOT}/settings.json`, saved);
}

async function createOrder(order) {
  await ensureOrdersReset();
  const saved = { ...order };
  const counterPath = `${ROOT}/meta/order-counter.json`;
  const counter = await readSingle(counterPath);
  const nextOrderNumber = Number(counter?.lastOrderNumber || 0) + 1;
  const year = new Date().getFullYear();
  saved.orderNumber = `BGB-${year}-${String(nextOrderNumber).padStart(6, "0")}`;
  saved.paymentProofName = saved.paymentProofName
    ? saved.paymentProofName.replace(/^BGB-\d{4}-\d{6}/, saved.orderNumber)
    : `${saved.orderNumber}.${saved.paymentProofType === "application/pdf" ? "pdf" : "jpg"}`;
  saved.paymentProofData = await saveDataImage(
    saved.paymentProofData,
    "payment-proofs",
    saved.orderNumber || saved.id
  );

  const products = await listRecords("products");
  const changedProducts = [];
  for (const item of saved.items || []) {
    const product = products.find((entry) => entry.id === item.productId);
    if (!product) throw new Error(`${item.name || "A product"} is no longer available.`);
    const remaining = Number(product.totalStock || 0) - Number(product.soldQuantity || 0);
    if (remaining < Number(item.quantity || 0)) {
      throw new Error(`${product.name} does not have enough stock.`);
    }
    product.soldQuantity = Number(product.soldQuantity || 0) + Number(item.quantity || 0);
    changedProducts.push(product);
  }

  await Promise.all(changedProducts.map(saveProduct));
  await writeJson(`${ROOT}/orders/${safeId(saved.id)}.json`, saved);
  await writeJson(counterPath, {
    lastOrderNumber: nextOrderNumber,
    updatedAt: new Date().toISOString()
  });
  return { order: saved, products: changedProducts };
}

export default async function handler(request, response) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return respond(response, 503, { error: "Vercel Blob is not connected to this project." });
  }

  try {
    if (request.method === "GET") {
      return respond(response, 200, { success: true, data: await getPublicState() });
    }
    if (request.method !== "POST") {
      return respond(response, 405, { error: "Method not allowed." });
    }

    const body = request.body || {};
    const { action, data } = body;

    if (action === "createOrder") {
      return respond(response, 200, { success: true, data: await createOrder(data) });
    }

    if (action === "bootstrap") {
      const current = await getPublicState();
      if (!current.categories.length && !current.products.length && !current.settings) {
        await Promise.all([
          ...(data.categories || []).map(saveCategory),
          ...(data.products || []).map(saveProduct),
          saveSettings(data.settings || {})
        ]);
      }
      return respond(response, 200, { success: true, data: await getPublicState() });
    }

    if (!isAdmin(body)) {
      return respond(response, 401, { error: "Administrative authorization required." });
    }

    if (action === "getAdminState") {
      return respond(response, 200, { success: true, data: await getAdminState() });
    }
    if (action === "saveCategory") {
      return respond(response, 200, { success: true, data: await saveCategory(data) });
    }
    if (action === "deleteCategory") {
      await del(`${ROOT}/categories/${safeId(data.id)}.json`);
      return respond(response, 200, { success: true });
    }
    if (action === "saveProduct") {
      return respond(response, 200, { success: true, data: await saveProduct(data) });
    }
    if (action === "deleteProduct") {
      await del(`${ROOT}/products/${safeId(data.id)}.json`);
      return respond(response, 200, { success: true });
    }
    if (action === "saveSettings") {
      return respond(response, 200, { success: true, data: await saveSettings(data) });
    }
    if (action === "saveOrder") {
      return respond(
        response,
        200,
        { success: true, data: await writeJson(`${ROOT}/orders/${safeId(data.id)}.json`, data) }
      );
    }
    if (action === "deleteOrder") {
      const orderPath = `${ROOT}/orders/${safeId(data.id)}.json`;
      const order = await readSingle(orderPath);
      await del(orderPath);
      if (order?.paymentProofData?.includes("blob.vercel-storage.com")) {
        await del(order.paymentProofData);
      }
      return respond(response, 200, { success: true });
    }

    return respond(response, 400, { error: "Unknown shared-data action." });
  } catch (error) {
    console.error(error);
    return respond(response, 500, { error: error.message || "Shared data request failed." });
  }
}
