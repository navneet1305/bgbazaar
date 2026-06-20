const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";
const LOW_STOCK_THRESHOLD = 5;
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_PDF_BYTES = 1.5 * 1024 * 1024;
const STORAGE_WARNING =
  "Browser storage is full. Use a smaller image or remove older orders before trying again.";
const DEFAULT_LOGO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='16' fill='%230066cc'/%3E%3Ctext x='48' y='38' text-anchor='middle' font-family='Arial' font-size='22' font-weight='700' fill='white'%3EBG%3C/text%3E%3Ctext x='48' y='63' text-anchor='middle' font-family='Arial' font-size='17' font-weight='700' fill='white'%3EBazaar%3C/text%3E%3C/svg%3E";
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=900&q=80";
const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled"
];
const PAYMENT_STATUSES = ["Pending", "Approved", "Rejected"];

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
    image:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
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
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
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
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80",
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
  siteName: "BGBAZAAR",
  logoUrl: DEFAULT_LOGO,
  contactPhone: "+91 9876543210",
  contactEmail: "contact@bgbazaar.com",
  upiId: "payments@bgbazaar",
  qrImage: "",
  bankDetails: "Bank details will appear here after admin setup."
}));
let isAdminLoggedIn = sessionStorage.getItem("bgbazaar_admin") === "true";
let activeAdminPanel = "dashboardOverview";

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
  return {
    siteName: savedSettings.siteName || "BGBAZAAR",
    logoUrl: savedSettings.logoUrl || DEFAULT_LOGO,
    contactPhone: savedSettings.contactPhone || "+91 9876543210",
    contactEmail: savedSettings.contactEmail || "contact@bgbazaar.com",
    upiId: savedSettings.upiId || "payments@bgbazaar",
    qrImage: savedSettings.qrImage || "",
    bankDetails: savedSettings.bankDetails || "Bank details will appear here after admin setup."
  };
}

function migrateProducts(savedProducts) {
  return savedProducts.map((item) => {
    const totalStock = Number(item.totalStock ?? item.quantity ?? 0);
    const soldQuantity = Number(item.soldQuantity ?? 0);
    return {
      id: item.id || crypto.randomUUID(),
      name: item.name || "Untitled product",
      description: item.description || "Product details available at BGBAZAAR.",
      category: item.category || "General",
      image: item.image || DEFAULT_IMAGE,
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
      deliveryLocation: order.deliveryLocation || order.address || "",
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
      paymentVerificationStatus: order.paymentVerificationStatus || "Pending",
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

function renderShared() {
  $$("#siteLogo, #heroLogo").forEach((logo) => {
    logo.src = settings.logoUrl || DEFAULT_LOGO;
  });
  $$("#siteName").forEach((node) => {
    node.textContent = settings.siteName || "BGBAZAAR";
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
  const unlistedProducts = products.filter((item) => !item.listed).length;
  const completedOrders = orders.filter((order) => order.status === "Completed");
  const pendingOrders = orders.filter((order) => order.status !== "Completed" && order.status !== "Cancelled");
  const revenue = completedOrders.reduce((sum, order) => sum + orderTotal(order), 0);

  totalProductsDash.textContent = products.length;
  $("#activeProductsDash").textContent = activeProducts;
  $("#unlistedProductsDash").textContent = unlistedProducts;
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
    .filter((order) => order.status === "Completed" && new Date(order.createdAt).getTime() >= cutoff)
    .reduce((sum, order) => sum + orderTotal(order), 0);
}

function renderRevenueTable() {
  const revenueTable = $("#revenueTable");
  if (!revenueTable) return;
  const total = orders
    .filter((order) => order.status === "Completed")
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
                <p><strong>Location:</strong> ${escapeHtml(order.deliveryLocation)}</p>
                <p><strong>Notes:</strong> ${escapeHtml(order.notes || "None")}</p>
              </div>
              <div>
                <p><strong>Total:</strong> ${money(orderTotal(order))}</p>
                <p><strong>UTR:</strong> ${escapeHtml(order.utrNumber)}</p>
                <p><strong>Payment:</strong> ${escapeHtml(order.paymentVerificationStatus)}</p>
                <a class="proof-preview" href="${escapeHtml(order.paymentProofData)}" target="_blank" rel="noreferrer">${proofLabel}</a>
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
              <label>
                Payment verification
                <select data-payment-status="${order.id}">
                  ${PAYMENT_STATUSES.map(
                    (status) =>
                      `<option value="${status}" ${status === order.paymentVerificationStatus ? "selected" : ""}>${status}</option>`
                  ).join("")}
                </select>
              </label>
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
    const paymentStatusId = event.target.dataset.paymentStatus;
    if (orderStatusId) {
      const order = orders.find((item) => item.id === orderStatusId);
      order.status = event.target.value;
    }
    if (paymentStatusId) {
      const order = orders.find((item) => item.id === paymentStatusId);
      order.paymentVerificationStatus = event.target.value;
      if (event.target.value === "Approved") order.status = "Payment Verified";
      if (event.target.value === "Rejected") order.status = "Pending Payment";
      if (event.target.value === "Resubmission Requested") order.status = "Pending Payment";
    }
    renderAll();
  });

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
    const form = new FormData(event.currentTarget);
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
      siteName: form.get("siteName").trim() || "BGBAZAAR",
      logoUrl,
      contactPhone: form.get("contactPhone").trim() || "+91 9876543210",
      contactEmail: form.get("contactEmail").trim() || "contact@bgbazaar.com",
      upiId: settings.upiId,
      qrImage: settings.qrImage,
      bankDetails: settings.bankDetails
    };
    if (!save()) {
      settings = previousSettings;
      alert(STORAGE_WARNING);
      return;
    }
    event.currentTarget.elements.logoFile.value = "";
    renderAll();
  });

  $("#settingsForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
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
    event.currentTarget.elements.qrImage.value = "";
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

    const form = new FormData(event.currentTarget);
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
      const order = {
        id: crypto.randomUUID(),
        orderNumber: generateOrderNumber(),
        buyerName: form.get("buyerName").trim(),
        mobileNumber: form.get("phone").trim(),
        emailAddress: form.get("email").trim(),
        deliveryLocation: form.get("location").trim(),
        notes: form.get("notes").trim(),
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
        paymentProofName: proof.name,
        paymentProofType: isPdf ? "application/pdf" : "image/jpeg",
        paymentProofData: proofData,
        paymentVerificationStatus: "Pending",
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

      event.currentTarget.reset();
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
