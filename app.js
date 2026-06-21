const ADMIN_USERNAME = "amaresh@bgbazaar.com";
const ADMIN_PASSWORD = "amareshraj@1321";
const LOW_STOCK_THRESHOLD = 5;
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_PDF_BYTES = 1.5 * 1024 * 1024;
const ORDERS_RESET_VERSION = "2026-06-21-order-management-clean-start";
const STORAGE_WARNING =
  "Browser storage is full. Use a smaller image or remove older orders before trying again.";
const DELIVERY_POINT_ADDRESS = "BgBazaar Office";
const DEFAULT_LOGO = "assets/bg-bazaar-logo.jpeg";
const DEFAULT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='675' viewBox='0 0 900 675'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop offset='0' stop-color='%23099aac'/%3E%3Cstop offset='1' stop-color='%23f59a1a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='900' height='675' rx='42' fill='%23f8fbff'/%3E%3Ccircle cx='720' cy='90' r='180' fill='%23fff4df'/%3E%3Ccircle cx='135' cy='560' r='150' fill='%23e0f7fb'/%3E%3Crect x='142' y='160' width='616' height='356' rx='34' fill='url(%23bg)' opacity='0.14'/%3E%3Cpath d='M260 405h380' stroke='%23099aac' stroke-width='24' stroke-linecap='round'/%3E%3Cpath d='M300 330h300' stroke='%23f59a1a' stroke-width='24' stroke-linecap='round'/%3E%3Ctext x='450' y='270' text-anchor='middle' font-family='Avenir Next, Segoe UI, Arial, sans-serif' font-size='54' font-weight='800' fill='%23058a99'%3EBG BAZAAR%3C/text%3E%3Ctext x='450' y='465' text-anchor='middle' font-family='Avenir Next, Segoe UI, Arial, sans-serif' font-size='24' font-weight='700' letter-spacing='5' fill='%2364758b'%3ECAMPUS ESSENTIALS%3C/text%3E%3C/svg%3E";
const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled"
];
const initialCategories = [
  { id: crypto.randomUUID(), name: "Electronics", description: "Electronic devices and gadgets" },
  { id: crypto.randomUUID(), name: "Fashion", description: "Clothing and accessories" },
  { id: crypto.randomUUID(), name: "Home & Kitchen", description: "Home appliances and kitchen essentials" },
  { id: crypto.randomUUID(), name: "Beauty", description: "Beauty and personal care products" },
  { id: crypto.randomUUID(), name: "Books", description: "Books and reading materials" },
  { id: crypto.randomUUID(), name: "Sports", description: "Sports and fitness equipment" }
];

const initialProducts = [
  {
    id: crypto.randomUUID(),
    name: "Daily Grocery Pack",
    description: "Rice, pulses, spices, and essentials for everyday cooking.",
    category: "Home & Kitchen",
    image: DEFAULT_IMAGE,
    price: 699,
    totalStock: 18,
    soldQuantity: 0,
    listed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    name: "Cotton T-shirt",
    description: "Soft cotton regular-fit T-shirt for daily wear.",
    category: "Fashion",
    image: DEFAULT_IMAGE,
    price: 349,
    totalStock: 25,
    soldQuantity: 0,
    listed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    name: "Kitchen Storage Set",
    description: "Airtight containers for grains, snacks, and spices.",
    category: "Home & Kitchen",
    image: DEFAULT_IMAGE,
    price: 499,
    totalStock: 12,
    soldQuantity: 0,
    listed: true,
    createdAt: new Date().toISOString()
  }
];

let categories = load("bgbazaar_categories", initialCategories);
let products = migrateProducts(load("bgbazaar_products", initialProducts));
let cart = load("bgbazaar_cart", []);
let orders = migrateOrders(load("bgbazaar_orders", []));
let settings = normalizeSettings(load("bgbazaar_settings", {
  siteName: "BG BAZAAR",
  logoUrl: DEFAULT_LOGO,
  contactPhone: "9117138483",
  contactEmail: "amaresh.r2030i@iimbg.ac.in",
  upiId: "payments@bgbazaar",
  qrImage: "",
  bankDetails: "Bank details will appear here after admin setup."
}));
let isAdminLoggedIn = sessionStorage.getItem("bgbazaar_admin") === "true";
let activeAdminPanel = "dashboardOverview";

if (localStorage.getItem("bgbazaar_orders_reset_version") !== ORDERS_RESET_VERSION) {
  orders = [];
  localStorage.setItem("bgbazaar_orders_reset_version", ORDERS_RESET_VERSION);
  localStorage.setItem("bgbazaar_orders", JSON.stringify(orders));
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function load(key, fallback) {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : fallback;
}

function save() {
  try {
    localStorage.setItem("bgbazaar_categories", JSON.stringify(categories));
    localStorage.setItem("bgbazaar_products", JSON.stringify(products));
    localStorage.setItem("bgbazaar_cart", JSON.stringify(cart));
    localStorage.setItem("bgbazaar_orders", JSON.stringify(orders));
    localStorage.setItem("bgbazaar_settings", JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error("Unable to save marketplace data:", error);
    return false;
  }
}

function normalizeSettings(savedSettings) {
  const legacyLogo =
    !savedSettings.logoUrl ||
    savedSettings.logoUrl.startsWith("data:image/svg+xml") ||
    savedSettings.logoUrl.includes("BG%3C/text%3E%3Ctext");
  const legacySiteName = !savedSettings.siteName || savedSettings.siteName === "BGBAZAAR";
  const legacyPhone = !savedSettings.contactPhone || savedSettings.contactPhone === "+91 9876543210";
  const legacyEmail = !savedSettings.contactEmail || savedSettings.contactEmail === "contact@bgbazaar.com";
  return {
    siteName: legacySiteName ? "BG BAZAAR" : savedSettings.siteName,
    logoUrl: legacyLogo ? DEFAULT_LOGO : savedSettings.logoUrl,
    contactPhone: legacyPhone ? "9117138483" : savedSettings.contactPhone,
    contactEmail: legacyEmail ? "amaresh.r2030i@iimbg.ac.in" : savedSettings.contactEmail,
    upiId: savedSettings.upiId || "payments@bgbazaar",
    qrImage: savedSettings.qrImage || "",
    bankDetails: savedSettings.bankDetails || "Bank details will appear here after admin setup."
  };
}

function migrateProducts(savedProducts) {
  return savedProducts.map((item) => {
    const totalStock = Number(item.totalStock ?? item.quantity ?? 0);
    const soldQuantity = Number(item.soldQuantity ?? 0);
    const legacyImage = !item.image || item.image.includes("images.unsplash.com");
    return {
      id: item.id || crypto.randomUUID(),
      name: item.name || "Untitled product",
      description: item.description || "Product details available at BG BAZAAR.",
      category: item.category || "General",
      image: legacyImage ? DEFAULT_IMAGE : item.image,
      price: Number(item.price || 0),
      totalStock,
      soldQuantity: Math.min(soldQuantity, totalStock),
      listed: item.listed !== false,
      createdAt: item.createdAt || new Date().toISOString()
    };
  });
}

function migrateOrders(savedOrders) {
  return savedOrders.map((order, index) => {
    const createdAt = order.createdAt
      ? new Date(order.createdAt).toISOString()
      : new Date().toISOString();
    return {
      id: order.id || crypto.randomUUID(),
      orderNumber:
        order.orderNumber ||
        `BGB-${new Date(createdAt).getFullYear()}-${String(index + 1).padStart(6, "0")}`,
      buyerName: order.buyerName || "Unknown buyer",
      mobileNumber: order.mobileNumber || order.phone || "",
      emailAddress: order.emailAddress || order.email || "",
      deliveryLocation: order.deliveryLocation || order.address || DELIVERY_POINT_ADDRESS,
      notes: order.notes || "",
      totalAmount: Number(order.totalAmount ?? order.total ?? 0),
      status: order.status || "Payment Submitted",
      createdAt,
      items: (order.items || []).map((item) => ({
        productId: item.productId || item.id || "",
        name: item.name || "Product",
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice ?? item.price ?? 0),
        subtotal: Number(item.subtotal ?? (item.price || 0) * (item.quantity || 0))
      })),
      utrNumber: order.utrNumber || order.transactionId || "",
      paymentProofName: order.paymentProofName || "",
      paymentProofType: order.paymentProofType || "",
      paymentProofData: order.paymentProofData || "#",
      paymentSubmittedAt: order.paymentSubmittedAt || createdAt
    };
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  return `Rs. ${Number(value).toLocaleString("en-IN")}`;
}

function remainingStock(product) {
  return Math.max(Number(product.totalStock) - Number(product.soldQuantity), 0);
}

function stockStatus(product) {
  const remaining = remainingStock(product);
  if (remaining === 0) return "Out of Stock";
  if (remaining <= LOW_STOCK_THRESHOLD) return "Low Stock";
  return "Available";
}

function getCartRows() {
  return cart
    .map((entry) => {
      const product = products.find((item) => item.id === entry.id);
      return product ? { ...entry, product } : null;
    })
    .filter(Boolean);
}

function cartTotal() {
  return getCartRows().reduce(
    (total, row) => total + row.product.price * row.quantity,
    0
  );
}

function orderTotal(order) {
  return Number(order.totalAmount ?? order.total ?? 0);
}

function isDeliveredOrder(order) {
  return order.status === "Delivered";
}

function generateOrderNumber() {
  const year = new Date().getFullYear();
  return `BGB-${year}-${String(orders.length + 1).padStart(6, "0")}`;
}

function acceptedProofFile(file) {
  if (!file) return false;
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  const extAllowed = /\.(jpe?g|png|webp|pdf)$/i.test(file.name);
  return allowed.includes(file.type) || extAllowed;
}

function isImageProof(order) {
  return (
    (order.paymentProofType || "").startsWith("image/") ||
    /^data:image\//i.test(order.paymentProofData || "")
  );
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function proofFileName(orderNumber, proofType) {
  const extension = proofType === "application/pdf" ? "pdf" : "jpg";
  return `${orderNumber}.${extension}`;
}

function buildOrdersCsv() {
  const headers = [
    "Order Number",
    "Created At",
    "Buyer Name",
    "Mobile Number",
    "Email Address",
    "Delivery Point Address",
    "Items",
    "Total Amount",
    "Order Status",
    "UTR Number",
    "Payment Proof File",
    "Payment Submitted At"
  ];
  const rows = orders.map((order) => [
    order.orderNumber,
    new Date(order.createdAt).toLocaleString("en-IN"),
    order.buyerName,
    order.mobileNumber,
    order.emailAddress,
    order.deliveryLocation || DELIVERY_POINT_ADDRESS,
    order.items
      .map((item) => `${item.name} x ${item.quantity} @ ${money(item.unitPrice)}`)
      .join("; "),
    orderTotal(order),
    order.status,
    order.utrNumber,
    order.paymentProofName || proofFileName(order.orderNumber, order.paymentProofType),
    order.paymentSubmittedAt ? new Date(order.paymentSubmittedAt).toLocaleString("en-IN") : ""
  ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function downloadOrdersCsv() {
  if (!orders.length) {
    alert("No orders available to export.");
    return;
  }
  const blob = new Blob([buildOrdersCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bgbazaar-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function openPaymentProof(orderId) {
  const order = orders.find((item) => item.id === orderId);
  if (!order || !order.paymentProofData || order.paymentProofData === "#") {
    alert("No payment proof is available for this order.");
    return;
  }

  const preview = window.open("", "_blank");
  if (!preview) {
    alert("Please allow pop-ups to open the payment proof preview.");
    return;
  }

  const safeTitle = escapeHtml(`Payment Proof - ${order.orderNumber}`);
  const proofMarkup = isImageProof(order)
    ? `<img src="${escapeHtml(order.paymentProofData)}" alt="${safeTitle}">`
    : `<iframe src="${escapeHtml(order.paymentProofData)}" title="${safeTitle}"></iframe>`;

  preview.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${safeTitle}</title>
        <style>
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #0f172a;
            color: #fff;
            font-family: Arial, sans-serif;
          }
          main {
            width: min(100% - 32px, 1100px);
            display: grid;
            gap: 16px;
            padding: 24px 0;
          }
          h1 {
            margin: 0;
            font-size: 22px;
          }
          img,
          iframe {
            width: 100%;
            height: min(82vh, 820px);
            object-fit: contain;
            border: 0;
            border-radius: 14px;
            background: #fff;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>${safeTitle}</h1>
          ${proofMarkup}
        </main>
      </body>
    </html>
  `);
  preview.document.close();
}

function printOrderDetails(orderId) {
  const order = orders.find((item) => item.id === orderId);
  if (!order) {
    alert("Order details are not available.");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow pop-ups to print order details.");
    return;
  }

  const items = order.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${item.quantity}</td>
          <td>${money(item.unitPrice)}</td>
          <td>${money(item.subtotal)}</td>
        </tr>`
    )
    .join("");

  printWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(order.orderNumber)} Order Details</title>
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #0f172a; font: 12px/1.45 Arial, sans-serif; }
          h1 { margin: 0 0 6px; font-size: 22px; }
          h2 { margin: 14px 0 8px; font-size: 14px; }
          p { margin: 3px 0; }
          .header { display: flex; justify-content: space-between; gap: 16px; padding-bottom: 12px; border-bottom: 2px solid #0797a8; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
          .card { padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { padding: 7px; border-bottom: 1px solid #e2e8f0; text-align: left; }
          th { color: #64748b; background: #f8fafc; font-size: 11px; text-transform: uppercase; }
          .total { margin-top: 12px; color: #0797a8; text-align: right; font-size: 18px; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>BG BAZAAR Order Details</h1>
            <p><strong>Order:</strong> ${escapeHtml(order.orderNumber)}</p>
            <p><strong>Date:</strong> ${escapeHtml(new Date(order.createdAt).toLocaleString("en-IN"))}</p>
            <p><strong>UTR:</strong> ${escapeHtml(order.utrNumber || "Not provided")}</p>
          </div>
          <div>
            <p><strong>Status:</strong> ${escapeHtml(order.status)}</p>
            <p><strong>Total:</strong> ${money(orderTotal(order))}</p>
          </div>
        </div>
        <div class="grid">
          <div class="card">
            <h2>Customer</h2>
            <p><strong>Name:</strong> ${escapeHtml(order.buyerName)}</p>
            <p><strong>Mobile:</strong> ${escapeHtml(order.mobileNumber)}</p>
            <p><strong>Email:</strong> ${escapeHtml(order.emailAddress)}</p>
          </div>
          <div class="card">
            <h2>Pickup</h2>
            <p><strong>Pickup Point:</strong></p>
            <p>${escapeHtml(order.deliveryLocation || DELIVERY_POINT_ADDRESS)}</p>
          </div>
        </div>
        <h2>Items</h2>
        <table>
          <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
          <tbody>${items}</tbody>
        </table>
        <div class="total">Total: ${money(orderTotal(order))}</div>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function renderShared() {
  $$("#siteLogo, #heroLogo").forEach((logo) => {
    logo.src = settings.logoUrl || DEFAULT_LOGO;
  });
  $$("#siteName").forEach((node) => {
    node.textContent = settings.siteName || "BG BAZAAR";
  });
  $$("#navCartCount").forEach((node) => {
    node.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  });
  const activeMetric = $("#activeProductsMetric");
  const cartMetric = $("#cartItemsMetric");
  const ordersMetric = $("#ordersMetric");
  if (activeMetric) activeMetric.textContent = products.filter((item) => item.listed).length;
  if (cartMetric) cartMetric.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (ordersMetric) ordersMetric.textContent = orders.length;
}

function renderFilters() {
  const categoryFilter = $("#categoryFilter");
  if (!categoryFilter) return;
  const previous = categoryFilter.value || "all";
  const categoryNames = categories.map(c => c.name).sort();
  categoryFilter.innerHTML =
    `<option value="all">All categories</option>` +
    categoryNames
      .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
      .join("");
  categoryFilter.value = categoryNames.includes(previous) ? previous : "all";
}

function renderCategories() {
  const categoriesList = $("#categoriesList");
  if (!categoriesList || !isAdminLoggedIn) return;

  categoriesList.innerHTML = categories.length
    ? categories
        .map((category) => {
          const productCount = products.filter(p => p.category === category.name).length;
          return `
            <div style="padding: 12px; background: #fff; border: 1px solid var(--line); border-radius: 6px; display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; margin-bottom: 10px;">
              <div>
                <strong>${escapeHtml(category.name)}</strong>
                <p style="margin: 4px 0 0; color: var(--muted); font-size: 13px;">${productCount} products</p>
              </div>
              <div style="display: flex; gap: 6px;">
                <button class="ghost-btn" type="button" data-edit-category="${category.id}" style="padding: 6px 10px; font-size: 12px;">Edit</button>
                <button class="danger-btn" type="button" data-delete-category="${category.id}" style="padding: 6px 10px; font-size: 12px;">Delete</button>
              </div>
            </div>
          `;
        })
        .join("")
    : `<div class="empty">No categories yet.</div>`;
}

function fillCategoryForm(id) {
  const categoryForm = $("#categoryForm");
  const category = categories.find((c) => c.id === id);
  if (!categoryForm || !category) return;
  categoryForm.elements.categoryId.value = category.id;
  categoryForm.elements.categoryName.value = category.name;
  categoryForm.elements.categoryDescription.value = category.description || "";
  $("#saveCategoryBtn").textContent = "Update Category";
  showAdminPanel("categorySetup");
  categoryForm.elements.categoryName.focus();
}

function resetCategoryForm() {
  const categoryForm = $("#categoryForm");
  if (!categoryForm) return;
  categoryForm.reset();
  categoryForm.elements.categoryId.value = "";
  $("#saveCategoryBtn").textContent = "Add Category";
}

function renderShop() {
  const productGrid = $("#productGrid");
  if (!productGrid) return;
  const query = ($("#searchInput")?.value || "").trim().toLowerCase();
  const category = $("#categoryFilter")?.value || "all";

  const visible = products.filter((item) => {
    const remaining = remainingStock(item);
    const matchesQuery =
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query);
    const matchesCategory = category === "all" || item.category === category;
    return item.listed && remaining > 0 && matchesQuery && matchesCategory;
  });

  productGrid.innerHTML = visible.length
    ? visible
        .map((item) => {
          const remaining = remainingStock(item);
          const status = stockStatus(item);
          const stockClass = remaining === 0 ? "out" : remaining <= LOW_STOCK_THRESHOLD ? "low" : "";
          return `
          <article class="product-card">
            <img src="${escapeHtml(item.image || DEFAULT_IMAGE)}" alt="${escapeHtml(item.name)}">
            <div class="product-body">
              <div>
                <p class="eyebrow">${escapeHtml(item.category)}</p>
                <h3>${escapeHtml(item.name)}</h3>
              </div>
              <p class="muted">${escapeHtml(item.description)}</p>
              <div class="product-meta">
                <span class="price">${money(item.price)}</span>
                <span class="stock ${stockClass}">${status}: ${remaining} left</span>
              </div>
              <button class="primary-btn" type="button" data-add="${item.id}" ${remaining === 0 ? "disabled" : ""}>Add to cart</button>
            </div>
          </article>
        `;
        })
        .join("")
    : `<div class="empty">No listed products match the selected filters.</div>`;
}

function renderCart() {
  const cartList = $("#cartList");
  const rows = getCartRows();
  const cartTotalNode = $("#cartTotal");
  const paymentAmount = $("#paymentAmount");
  if (cartTotalNode) cartTotalNode.textContent = money(cartTotal());
  if (paymentAmount) paymentAmount.textContent = money(cartTotal());

  if (cartList) {
    cartList.innerHTML = rows.length
      ? rows
          .map((row) => {
            const subtotal = row.product.price * row.quantity;
            return `
            <article class="cart-item">
              <div>
                <strong>${escapeHtml(row.product.name)}</strong>
                <p class="muted">Qty ${row.quantity} x ${money(row.product.price)} = ${money(subtotal)}</p>
                <p class="muted">${remainingStock(row.product)} available</p>
              </div>
              <div class="cart-controls">
                <button class="qty-btn" type="button" data-minus="${row.id}">-</button>
                <strong>${row.quantity}</strong>
                <button class="qty-btn" type="button" data-plus="${row.id}">+</button>
                <button class="ghost-btn" type="button" data-remove="${row.id}">Remove</button>
              </div>
            </article>
          `;
          })
          .join("")
      : `<div class="empty">Your cart is empty.</div>`;
  }

  const checkoutSummary = $("#checkoutCartSummary");
  if (checkoutSummary) {
    checkoutSummary.innerHTML = rows.length
      ? `
        <h3>Order summary</h3>
        ${rows
          .map(
            (row) =>
              `<p>${escapeHtml(row.product.name)} x ${row.quantity} <strong>${money(row.product.price * row.quantity)}</strong></p>`
          )
          .join("")}
      `
      : `<div class="empty">Your cart is empty. Add items before payment submission.</div>`;
  }

  const upiQr = $("#upiQr");
  const upiLabel = $("#upiLabel");
  const bankDetailsBox = $("#bankDetailsBox");
  if (upiQr) {
    upiQr.src = settings.qrImage || DEFAULT_LOGO;
  }
  if (upiLabel) upiLabel.textContent = `${settings.upiId} - ${money(cartTotal())}`;
  if (bankDetailsBox) {
    bankDetailsBox.innerHTML = `
      <h4>Bank details</h4>
      <p>${escapeHtml(settings.bankDetails).replaceAll("\n", "<br>")}</p>
    `;
  }
}

function renderAuth() {
  const loginForm = $("#loginForm");
  const adminDashboard = $("#adminDashboard");
  const logoutBtn = $("#logoutBtn");
  if (!loginForm || !adminDashboard) return;
  loginForm.classList.toggle("hidden", isAdminLoggedIn);
  adminDashboard.classList.toggle("hidden", !isAdminLoggedIn);
  logoutBtn?.classList.toggle("hidden", !isAdminLoggedIn);
}

function showAdminPanel(panelId = "dashboardOverview") {
  const panels = $$("[data-admin-panel]");
  const tabs = $$("[data-admin-tab]");
  if (!panels.length) return;

  const targetPanel = panels.some((panel) => panel.dataset.adminPanel === panelId)
    ? panelId
    : "dashboardOverview";
  activeAdminPanel = targetPanel;

  panels.forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.adminPanel !== targetPanel);
  });
  tabs.forEach((tab) => {
    const isActive = tab.dataset.adminTab === targetPanel;
    tab.classList.toggle("active", isActive);
    if (isActive) {
      tab.setAttribute("aria-current", "page");
    } else {
      tab.removeAttribute("aria-current");
    }
  });
}

function renderAdmin() {
  const adminList = $("#adminList");
  if (!adminList || !isAdminLoggedIn) return;

  adminList.innerHTML = products.length
    ? products
        .map((item) => {
          const remaining = remainingStock(item);
          return `
          <article class="admin-item">
            <div>
              <strong>${escapeHtml(item.name)}</strong>
              <p class="muted">${escapeHtml(item.category)} - ${money(item.price)}</p>
              <p class="muted">Total ${item.totalStock}, sold ${item.soldQuantity}, remaining ${remaining}</p>
              <span class="status-pill ${item.listed ? "" : "hidden"}">${item.listed ? "Listed" : "Unlisted"}</span>
              <span class="status-pill ${remaining === 0 ? "cancelled" : remaining <= LOW_STOCK_THRESHOLD ? "pending" : ""}">${stockStatus(item)}</span>
            </div>
            <div class="admin-controls">
              <button class="ghost-btn" type="button" data-edit="${item.id}">Edit</button>
              <button class="ghost-btn" type="button" data-toggle="${item.id}">${item.listed ? "Unlist" : "List"}</button>
              <button class="danger-btn" type="button" data-delete="${item.id}">Delete</button>
            </div>
          </article>
        `;
        })
        .join("")
    : `<div class="empty">No products yet.</div>`;
}

function renderDashboard() {
  const totalProductsDash = $("#totalProductsDash");
  if (!totalProductsDash || !isAdminLoggedIn) return;

  const activeProducts = products.filter((item) => item.listed).length;
  const completedOrders = orders.filter(isDeliveredOrder);
  const pendingOrders = orders.filter((order) => !isDeliveredOrder(order) && order.status !== "Cancelled");
  const revenue = completedOrders.reduce((sum, order) => sum + orderTotal(order), 0);

  totalProductsDash.textContent = products.length;
  $("#activeProductsDash").textContent = activeProducts;
  $("#totalOrdersDash").textContent = orders.length;
  $("#pendingOrdersDash").textContent = pendingOrders.length;
  $("#completedOrdersDash").textContent = completedOrders.length;
  $("#revenueDash").textContent = money(revenue);

  renderLowStockAlerts();
  renderInventoryTable();
  renderRevenueTable();
}

function renderLowStockAlerts() {
  const lowStockAlerts = $("#lowStockAlerts");
  if (!lowStockAlerts) return;
  const lowProducts = products.filter((item) => item.listed && remainingStock(item) <= LOW_STOCK_THRESHOLD);
  lowStockAlerts.innerHTML = lowProducts.length
    ? lowProducts
        .map(
          (item) =>
            `<div class="alert-row"><strong>${escapeHtml(item.name)}</strong> is ${stockStatus(item).toLowerCase()} with ${remainingStock(item)} units left.</div>`
        )
        .join("")
    : `<div class="muted">No low-stock alerts. Threshold is ${LOW_STOCK_THRESHOLD} units.</div>`;
}

function renderInventoryTable() {
  const inventoryTable = $("#inventoryTable");
  if (!inventoryTable) return;
  inventoryTable.innerHTML = `
    <table>
      <thead>
        <tr><th>Product</th><th>Price</th><th>Total stock</th><th>Sold</th><th>Remaining</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${products
          .map(
            (item) => `
          <tr>
            <td>${escapeHtml(item.name)}</td>
            <td>${money(item.price)}</td>
            <td>${item.totalStock}</td>
            <td>${item.soldQuantity}</td>
            <td>${remainingStock(item)}</td>
            <td>${stockStatus(item)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function sumRevenue(days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return orders
    .filter((order) => isDeliveredOrder(order) && new Date(order.createdAt).getTime() >= cutoff)
    .reduce((sum, order) => sum + orderTotal(order), 0);
}

function renderRevenueTable() {
  const revenueTable = $("#revenueTable");
  if (!revenueTable) return;
  const total = orders
    .filter(isDeliveredOrder)
    .reduce((sum, order) => sum + orderTotal(order), 0);
  revenueTable.innerHTML = `
    <table>
      <thead><tr><th>Period</th><th>Revenue</th></tr></thead>
      <tbody>
        <tr><td>Daily</td><td>${money(sumRevenue(1))}</td></tr>
        <tr><td>Weekly</td><td>${money(sumRevenue(7))}</td></tr>
        <tr><td>Monthly</td><td>${money(sumRevenue(30))}</td></tr>
        <tr><td>Total</td><td>${money(total)}</td></tr>
      </tbody>
    </table>
  `;
}

function renderOrders() {
  const ordersList = $("#ordersList");
  if (!ordersList || !isAdminLoggedIn) return;

  ordersList.innerHTML = orders.length
    ? orders
        .slice()
        .reverse()
        .map((order) => {
          const proofLabel = order.paymentProofType === "application/pdf" ? "Open PDF proof" : "Open screenshot";
          const hasProofData = order.paymentProofData && order.paymentProofData !== "#";
          const downloadName = escapeHtml(order.paymentProofName || proofFileName(order.orderNumber, order.paymentProofType));
          const proofPreview = !hasProofData
            ? `<p class="muted">No payment proof uploaded.</p>`
            : isImageProof(order)
            ? `<div class="proof-card">
                <p class="muted">Payment screenshot uploaded. Use the actions below to view or download it.</p>
                <div class="proof-actions">
                  <button class="proof-preview" type="button" data-proof-open="${escapeHtml(order.id)}">Open screenshot</button>
                  <a class="proof-preview" href="${escapeHtml(order.paymentProofData)}" download="${downloadName}">Download proof</a>
                </div>
              </div>`
            : `<div class="proof-actions">
                <button class="proof-preview" type="button" data-proof-open="${escapeHtml(order.id)}">${proofLabel}</button>
                <a class="proof-preview" href="${escapeHtml(order.paymentProofData)}" download="${downloadName}">Download proof</a>
              </div>`;
          return `
          <article class="order-item">
            <div class="order-actions">
              <div>
                <strong>${escapeHtml(order.orderNumber)}</strong>
                <p class="muted">${escapeHtml(new Date(order.createdAt).toLocaleString("en-IN"))}</p>
              </div>
              <span class="status-pill ${order.status === "Cancelled" ? "cancelled" : order.status === "Payment Submitted" ? "pending" : ""}">${escapeHtml(order.status)}</span>
            </div>
            <div class="order-grid">
              <div>
                <p><strong>Buyer:</strong> ${escapeHtml(order.buyerName)}</p>
                <p><strong>Mobile:</strong> ${escapeHtml(order.mobileNumber)}</p>
                <p><strong>Email:</strong> ${escapeHtml(order.emailAddress)}</p>
                <p><strong>Delivery Point Address:</strong> ${escapeHtml(order.deliveryLocation || DELIVERY_POINT_ADDRESS)}</p>
              </div>
              <div>
                <p><strong>Total:</strong> ${money(orderTotal(order))}</p>
                <p><strong>UTR:</strong> ${escapeHtml(order.utrNumber || "Not provided")}</p>
                ${proofPreview}
              </div>
            </div>
            <p class="muted">${order.items
              .map((item) => `${escapeHtml(item.name)} x ${item.quantity} @ ${money(item.unitPrice)}`)
              .join(", ")}</p>
            <div class="order-actions">
              <label>
                Order status
                <select data-order-status="${order.id}">
                  ${ORDER_STATUSES.map(
                    (status) =>
                      `<option value="${status}" ${status === order.status ? "selected" : ""}>${status}</option>`
                  ).join("")}
                </select>
              </label>
              <button class="ghost-btn" type="button" data-print-order="${escapeHtml(order.id)}">Print Order Details</button>
              <button class="danger-btn" type="button" data-delete-order="${escapeHtml(order.id)}">Delete Order</button>
            </div>
          </article>
        `;
        })
        .join("")
    : `<div class="empty">No orders have been submitted.</div>`;
}

function renderBrandingForm() {
  const brandingForm = $("#brandingForm");
  const settingsForm = $("#settingsForm");
  
  if (brandingForm) {
    brandingForm.elements.siteName.value = settings.siteName;
    brandingForm.elements.contactPhone.value = settings.contactPhone;
    brandingForm.elements.contactEmail.value = settings.contactEmail;
    const logoPreview = $("#adminLogoPreview");
    if (logoPreview) logoPreview.src = settings.logoUrl || DEFAULT_LOGO;
  }
  
  if (settingsForm) {
    settingsForm.elements.upiId.value = settings.upiId;
    settingsForm.elements.bankDetails.value = settings.bankDetails;
    const preview = $("#adminQrPreview");
    if (preview) preview.src = settings.qrImage || DEFAULT_LOGO;
  }
}

function renderAll() {
  renderShared();
  renderFilters();
  renderShop();
  renderCart();
  renderAuth();
  showAdminPanel(activeAdminPanel);
  renderBrandingForm();
  renderCategories();
  renderAdmin();
  renderOrders();
  renderDashboard();
  save();
}

function addToCart(id) {
  const product = products.find((item) => item.id === id);
  if (!product || remainingStock(product) < 1) return;
  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + 1, remainingStock(product));
  } else {
    cart.push({ id, quantity: 1 });
  }
  renderAll();
}

function changeCartQuantity(id, amount) {
  const product = products.find((item) => item.id === id);
  const existing = cart.find((item) => item.id === id);
  if (!product || !existing) return;
  existing.quantity += amount;
  if (existing.quantity <= 0) {
    cart = cart.filter((item) => item.id !== id);
  } else {
    existing.quantity = Math.min(existing.quantity, remainingStock(product));
  }
  renderAll();
}

function fillProductForm(id) {
  const productForm = $("#productForm");
  const item = products.find((product) => product.id === id);
  if (!productForm || !item) return;
  productForm.elements.id.value = item.id;
  productForm.elements.name.value = item.name;
  productForm.elements.description.value = item.description;
  productForm.elements.category.value = item.category;
  productForm.elements.image.value = item.image;
  productForm.elements.price.value = item.price;
  productForm.elements.totalStock.value = item.totalStock;
  productForm.elements.listed.checked = item.listed;
  showAdminPanel("productSetup");
  productForm.elements.name.focus();
}

function resetProductForm() {
  const productForm = $("#productForm");
  if (!productForm) return;
  productForm.reset();
  productForm.elements.id.value = "";
  productForm.elements.listed.checked = true;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected image could not be read."));
    };
    image.src = objectUrl;
  });
}

async function optimizeImageFile(file, maxDimension, quality = 0.78, outputType = "image/jpeg") {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Image is too large. Choose a file smaller than 12 MB.");
  }

  const image = await loadImageFile(file);
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image processing is not supported in this browser.");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL(outputType, quality);
}

async function prepareProofData(file) {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (isPdf) {
    if (file.size > MAX_PDF_BYTES) {
      throw new Error("PDF payment proof must be smaller than 1.5 MB.");
    }
    return fileToDataUrl(file);
  }
  return optimizeImageFile(file, 1400, 0.76);
}

function attachEvents() {
  $(".admin-tabs")?.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-admin-tab]");
    if (!tab) return;
    event.preventDefault();
    showAdminPanel(tab.dataset.adminTab);
  });

  $("#productGrid")?.addEventListener("click", (event) => {
    const id = event.target.dataset.add;
    if (id) addToCart(id);
  });

  $("#cartList")?.addEventListener("click", (event) => {
    const { plus, minus, remove } = event.target.dataset;
    if (plus) changeCartQuantity(plus, 1);
    if (minus) changeCartQuantity(minus, -1);
    if (remove) {
      cart = cart.filter((item) => item.id !== remove);
      renderAll();
    }
  });

  $("#adminList")?.addEventListener("click", (event) => {
    const { edit, toggle, delete: deleteId } = event.target.dataset;
    if (edit) fillProductForm(edit);
    if (toggle) {
      const item = products.find((product) => product.id === toggle);
      item.listed = !item.listed;
      renderAll();
    }
    if (deleteId && confirm("Delete this product permanently?")) {
      products = products.filter((product) => product.id !== deleteId);
      cart = cart.filter((item) => item.id !== deleteId);
      renderAll();
    }
  });

  $("#ordersList")?.addEventListener("change", (event) => {
    const orderStatusId = event.target.dataset.orderStatus;
    if (orderStatusId) {
      const order = orders.find((item) => item.id === orderStatusId);
      order.status = event.target.value;
    }
    renderAll();
  });

  $("#ordersList")?.addEventListener("click", (event) => {
    const proofButton = event.target.closest("[data-proof-open]");
    if (proofButton) openPaymentProof(proofButton.dataset.proofOpen);
    const printButton = event.target.closest("[data-print-order]");
    if (printButton) printOrderDetails(printButton.dataset.printOrder);
    const deleteButton = event.target.closest("[data-delete-order]");
    if (deleteButton && confirm("Delete this order from Order Management? Inventory counts will stay unchanged.")) {
      orders = orders.filter((order) => order.id !== deleteButton.dataset.deleteOrder);
      renderAll();
    }
  });

  $("#downloadOrdersCsv")?.addEventListener("click", downloadOrdersCsv);

  $("#productForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const productForm = event.currentTarget;
    const form = new FormData(productForm);
    const id = form.get("id") || crypto.randomUUID();
    const existing = products.find((item) => item.id === id);
    const soldQuantity = existing ? existing.soldQuantity : 0;
    const totalStock = Math.max(Number(form.get("totalStock")), soldQuantity);
    const product = {
      id,
      name: form.get("name").trim(),
      description: form.get("description").trim(),
      category: form.get("category").trim(),
      image: form.get("image").trim() || DEFAULT_IMAGE,
      price: Number(form.get("price")),
      totalStock,
      soldQuantity,
      listed: form.get("listed") === "on",
      createdAt: existing ? existing.createdAt : new Date().toISOString()
    };

    products = existing
      ? products.map((item) => (item.id === id ? product : item))
      : [...products, product];

    cart = cart
      .map((item) => {
        const updated = products.find((productItem) => productItem.id === item.id);
        return updated
          ? { ...item, quantity: Math.min(item.quantity, remainingStock(updated)) }
          : item;
      })
      .filter((item) => item.quantity > 0);

    resetProductForm();
    renderAll();
  });

  $("#brandingForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const brandingForm = event.currentTarget;
    const form = new FormData(brandingForm);
    const logoFile = form.get("logoFile");
    let logoUrl = settings.logoUrl || DEFAULT_LOGO;
    try {
      if (logoFile && logoFile.size > 0) {
        const isSvg = logoFile.type === "image/svg+xml" || /\.svg$/i.test(logoFile.name);
        const isAllowedType = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(logoFile.type);
        const isAllowedExtension = /\.(jpe?g|png|webp|svg)$/i.test(logoFile.name);
        if (!isAllowedType && !isAllowedExtension) {
          throw new Error("Upload logo as JPG, JPEG, PNG, WebP, or SVG.");
        }
        if (isSvg && logoFile.size > 500 * 1024) {
          throw new Error("SVG logo must be smaller than 500 KB.");
        }
        logoUrl = isSvg
          ? await fileToDataUrl(logoFile)
          : await optimizeImageFile(logoFile, 512, 0.82);
      }
    } catch (error) {
      alert(error.message || "The logo could not be uploaded.");
      return;
    }
    const previousSettings = { ...settings };
    settings = {
      siteName: form.get("siteName").trim() || "BG BAZAAR",
      logoUrl,
      contactPhone: form.get("contactPhone").trim() || "9117138483",
      contactEmail: form.get("contactEmail").trim() || "amaresh.r2030i@iimbg.ac.in",
      upiId: settings.upiId,
      qrImage: settings.qrImage,
      bankDetails: settings.bankDetails
    };
    if (!save()) {
      settings = previousSettings;
      alert(STORAGE_WARNING);
      return;
    }
    brandingForm.elements.logoFile.value = "";
    renderAll();
  });

  $("#settingsForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const settingsForm = event.currentTarget;
    const form = new FormData(settingsForm);
    const qrFile = form.get("qrImage");
    let qrImage = settings.qrImage;
    try {
      if (qrFile && qrFile.size > 0) {
        const isAllowedType = ["image/jpeg", "image/png", "image/webp"].includes(qrFile.type);
        const isAllowedExtension = /\.(jpe?g|png|webp)$/i.test(qrFile.name);
        if (!isAllowedType && !isAllowedExtension) {
          throw new Error("Upload QR code as JPG, JPEG, PNG, or WebP.");
        }
        qrImage = await optimizeImageFile(qrFile, 900, 0.84, "image/png");
      }
    } catch (error) {
      alert(error.message || "The payment QR image could not be uploaded.");
      return;
    }
    const previousSettings = { ...settings };
    settings.upiId = form.get("upiId").trim() || "payments@bgbazaar";
    settings.qrImage = qrImage;
    settings.bankDetails = form.get("bankDetails").trim() || "Bank details will appear here after admin setup.";
    if (!save()) {
      settings = previousSettings;
      alert(STORAGE_WARNING);
      return;
    }
    settingsForm.elements.qrImage.value = "";
    alert("Payment settings updated successfully!");
    renderAll();
  });

  $("#categoryForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = form.get("categoryId") || crypto.randomUUID();
    const existing = categories.find((c) => c.id === id);
    
    const category = {
      id,
      name: form.get("categoryName").trim(),
      description: form.get("categoryDescription").trim()
    };

    if (existing) {
      const index = categories.indexOf(existing);
      categories[index] = category;
    } else {
      categories.push(category);
    }

    resetCategoryForm();
    renderAll();
  });

  $("#categoriesList")?.addEventListener("click", (event) => {
    const editId = event.target.dataset.editCategory;
    const deleteId = event.target.dataset.deleteCategory;
    
    if (editId) fillCategoryForm(editId);
    if (deleteId && confirm("Delete this category? Products in this category will not be affected.")) {
      categories = categories.filter((c) => c.id !== deleteId);
      renderAll();
    }
  });

  $("#resetCategoryBtn")?.addEventListener("click", resetCategoryForm);

  $("#paymentForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const paymentForm = event.currentTarget;
    const checkoutMessage = $("#checkoutMessage");
    const submitButton = $("#submitOrderBtn");
    const rows = getCartRows();
    checkoutMessage.classList.remove("error");
    checkoutMessage.textContent = "";
    if (!rows.length) {
      checkoutMessage.textContent = "Add at least one product before checkout.";
      checkoutMessage.classList.add("error");
      return;
    }

    const form = new FormData(paymentForm);
    const proof = form.get("paymentProof");
    if (!acceptedProofFile(proof)) {
      checkoutMessage.textContent = "Upload payment proof as JPG, JPEG, PNG, WebP, or PDF.";
      checkoutMessage.classList.add("error");
      return;
    }

    const unavailable = rows.find((row) => row.quantity > remainingStock(row.product));
    if (unavailable) {
      checkoutMessage.textContent = `${unavailable.product.name} does not have enough stock.`;
      checkoutMessage.classList.add("error");
      renderAll();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Submitting Order...";
    checkoutMessage.textContent = "Processing payment proof...";

    try {
      const proofData = await prepareProofData(proof);
      const isPdf = proof.type === "application/pdf" || /\.pdf$/i.test(proof.name);
      const now = new Date().toISOString();
      const orderNumber = generateOrderNumber();
      const proofType = isPdf ? "application/pdf" : "image/jpeg";
      const order = {
        id: crypto.randomUUID(),
        orderNumber,
        buyerName: form.get("buyerName").trim(),
        mobileNumber: form.get("phone").trim(),
        emailAddress: form.get("email").trim(),
        deliveryLocation: form.get("location")?.trim() || DELIVERY_POINT_ADDRESS,
        notes: "",
        totalAmount: cartTotal(),
        status: "Pending",
        createdAt: now,
        items: rows.map((row) => ({
          productId: row.id,
          name: row.product.name,
          quantity: row.quantity,
          unitPrice: row.product.price,
          subtotal: row.product.price * row.quantity
        })),
        utrNumber: form.get("utrNumber").trim(),
        paymentProofName: proofFileName(orderNumber, proofType),
        paymentProofType: proofType,
        paymentProofData: proofData,
        paymentSubmittedAt: now
      };

      const previousProducts = products;
      const previousOrders = orders;
      const previousCart = cart;
      products = products.map((product) => {
        const row = rows.find((item) => item.id === product.id);
        return row ? { ...product, soldQuantity: product.soldQuantity + row.quantity } : product;
      });
      orders = [...orders, order];
      cart = [];

      if (!save()) {
        products = previousProducts;
        orders = previousOrders;
        cart = previousCart;
        save();
        throw new Error(STORAGE_WARNING);
      }

      paymentForm.reset();
      checkoutMessage.textContent = `Order ${order.orderNumber} submitted. Redirecting...`;
      renderAll();
      setTimeout(() => {
        window.location.href = "order-success.html";
      }, 1200);
    } catch (error) {
      checkoutMessage.textContent = error.message || "Order submission failed. Please try again.";
      checkoutMessage.classList.add("error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Submit Order";
    }
  });

  $("#loginForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const loginMessage = $("#loginMessage");
    if (form.get("username") === ADMIN_USERNAME && form.get("password") === ADMIN_PASSWORD) {
      isAdminLoggedIn = true;
      sessionStorage.setItem("bgbazaar_admin", "true");
      event.currentTarget.reset();
      loginMessage.textContent = "";
      renderAll();
    } else {
      loginMessage.textContent = "Invalid admin username or password.";
    }
  });

  $("#logoutBtn")?.addEventListener("click", () => {
    isAdminLoggedIn = false;
    sessionStorage.removeItem("bgbazaar_admin");
    renderAll();
  });

  $("#clearCartBtn")?.addEventListener("click", () => {
    cart = [];
    const checkoutMessage = $("#checkoutMessage");
    if (checkoutMessage) {
      checkoutMessage.textContent = "";
      checkoutMessage.classList.remove("error");
    }
    renderAll();
  });

  $("#resetFormBtn")?.addEventListener("click", resetProductForm);

  ["#searchInput", "#categoryFilter"].forEach((selector) => {
    const control = $(selector);
    control?.addEventListener("input", () => {
      renderFilters();
      renderShop();
    });
    control?.addEventListener("change", () => {
      renderFilters();
      renderShop();
    });
  });
}

attachEvents();
renderAll();
