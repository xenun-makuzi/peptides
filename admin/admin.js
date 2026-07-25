// ===================================
// CMS PRODUCT MANAGEMENT ENGINE
// ===================================

const list = document.getElementById("productsList");
const message = document.getElementById("message");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formTitle = document.getElementById("formTitle");
const productCountBadge = document.getElementById("productCountBadge");

// Auth elements
const loginScreen = document.getElementById("loginScreen");
const cmsApp = document.getElementById("cmsApp");
const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");
const logoutBtn = document.getElementById("logoutBtn");

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// ===================================
// AUTH GUARD
// ===================================

async function handleLogin() {
  const emailEl = document.getElementById("loginEmail");
  const passwordEl = document.getElementById("loginPassword");
  const email = emailEl.value.trim();
  const password = passwordEl.value;

  if (!email || !password) {
    loginMessage.className = "status-message error";
    loginMessage.innerHTML = "Enter both email and password.";
    return;
  }

  loginBtn.disabled = true;
  loginMessage.className = "status-message";
  loginMessage.innerHTML = `<i data-lucide="loader" class="spin"></i> Signing in...`;
  if (window.lucide) lucide.createIcons();

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  loginBtn.disabled = false;

  if (error) {
    loginMessage.className = "status-message error";
    loginMessage.innerHTML = "Invalid email or password.";
    return;
  }

  passwordEl.value = "";
  loginMessage.innerHTML = "";
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
}

function showApp() {
  if (loginScreen) loginScreen.style.display = "none";
  if (cmsApp) cmsApp.style.display = "block";
  loadProducts();
}

function showLogin() {
  if (loginScreen) loginScreen.style.display = "flex";
  if (cmsApp) cmsApp.style.display = "none";
}

async function initAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  session ? showApp() : showLogin();

  supabaseClient.auth.onAuthStateChange((_event, newSession) => {
    newSession ? showApp() : showLogin();
  });
}

// 1. Image Storage Upload Helper
async function uploadImage(file) {
  if (!file) return null;

  const fileExt = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  const { error } = await supabaseClient
    .storage
    .from("product-images")
    .upload(filename, file);

  if (error) {
    console.error("Storage Upload Error:", error);
    return null;
  }

  const { data } = supabaseClient
    .storage
    .from("product-images")
    .getPublicUrl(filename);

  return data.publicUrl;
}

// 2. Load Catalog List
async function loadProducts() {
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch Products Error:", error);
    list.innerHTML = `<p class="status-message error">Failed to load inventory.</p>`;
    return;
  }

  if (productCountBadge) {
    productCountBadge.textContent = `${data.length} item${data.length === 1 ? '' : 's'}`;
  }

  if (data.length === 0) {
    list.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">No products found in the catalog.</p>`;
    return;
  }

  list.innerHTML = "";

  data.forEach((product) => {
    const safeName = escapeHTML(product.name || "Unnamed Product");
    const safeCategory = escapeHTML(product.category || "peptides");
    const imgUrl = product.image_url || "../assets/images/product-placeholder.jpg";
    const price = Number(product.price || 0).toFixed(2);

    const card = document.createElement("div");
    card.className = "product-item";
    card.innerHTML = `
      <div class="product-thumb-box">
        <img src="${imgUrl}" alt="${safeName}">
      </div>

      <div class="product-info">
        <h3>${safeName}</h3>
        <div class="product-meta-tags">
          <span class="price-tag">$${price}</span>
          <span class="tag-badge">${safeCategory}</span>
        </div>
      </div>

      <div class="item-actions">
        <button class="btn-icon edit" title="Edit Product">
          <i data-lucide="edit-3"></i>
        </button>
        <button class="btn-icon delete" title="Delete Product">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `;

    card.querySelector(".edit").addEventListener("click", () => editProduct(product));
    card.querySelector(".delete").addEventListener("click", () => deleteProduct(product.id, safeName));

    list.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

// 3. Save Product
async function saveProduct() {
  message.className = "status-message";
  message.innerHTML = `<i data-lucide="loader" class="spin"></i> Processing product...`;
  if (window.lucide) lucide.createIcons();

  const idEl = document.getElementById("productId");
  const nameEl = document.getElementById("productNameInput");
  const priceEl = document.getElementById("priceInput");
  const categoryEl = document.getElementById("categorySelect");
  const descEl = document.getElementById("descriptionInput");

  const id = idEl ? idEl.value : "";
  const nameVal = nameEl ? nameEl.value.trim() : "";
  const priceVal = priceEl ? parseFloat(priceEl.value) : 0;
  const categoryVal = categoryEl ? categoryEl.value : "peptides";
  const descriptionVal = descEl ? descEl.value.trim() : "";

  if (!nameVal || isNaN(priceVal)) {
    message.className = "status-message error";
    message.innerHTML = "Please fill in a valid product name and price.";
    return;
  }

  let imageURL = null;
  let labURL = null;

  const imageFile = document.getElementById("productImage").files[0];
  const labFile = document.getElementById("labImage").files[0];

  if (imageFile) imageURL = await uploadImage(imageFile);
  if (labFile) labURL = await uploadImage(labFile);

  const productPayload = {
    name: nameVal,
    price: priceVal,
    category: categoryVal,
    description: descriptionVal,
    featured: document.getElementById("featured").checked,
    new_arrival: document.getElementById("newArrival").checked,
    best_seller: document.getElementById("bestSeller").checked,
  };

  if (imageURL) productPayload.image_url = imageURL;
  if (labURL) productPayload.lab_test_url = labURL;

  let result;

  if (id) {
    result = await supabaseClient
      .from("products")
      .update(productPayload)
      .eq("id", id);
  } else {
    result = await supabaseClient
      .from("products")
      .insert([productPayload]);
  }

  if (result.error) {
    console.error("Database Save Error:", result.error);
    message.className = "status-message error";
    message.innerHTML = `Error: ${result.error.message || 'Check console'}`;
    return;
  }

  message.className = "status-message success";
  message.innerHTML = id ? "Product updated successfully!" : "New product created!";

  resetForm();
  loadProducts();
}

// 4. Edit Product Populate
function editProduct(product) {
  document.getElementById("productId").value = product.id;
  document.getElementById("productNameInput").value = product.name || "";
  document.getElementById("priceInput").value = product.price || "";
  document.getElementById("categorySelect").value = product.category || "peptides";
  document.getElementById("descriptionInput").value = product.description || "";
  
  document.getElementById("featured").checked = !!product.featured;
  document.getElementById("newArrival").checked = !!product.new_arrival;
  document.getElementById("bestSeller").checked = !!product.best_seller;

  if (formTitle) {
    formTitle.innerHTML = `<i data-lucide="edit"></i> Edit Product`;
  }
  if (cancelEditBtn) {
    cancelEditBtn.style.display = "inline-block";
  }

  if (window.lucide) lucide.createIcons();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 5. Delete Product
async function deleteProduct(id, productName) {
  if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;

  const { error } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete Error:", error);
    alert("Could not delete product.");
    return;
  }

  loadProducts();
}

// 6. Reset Form
function resetForm() {
  document.getElementById("productForm")?.reset();
  document.getElementById("productId").value = "";

  if (formTitle) {
    formTitle.innerHTML = `<i data-lucide="plus-circle"></i> Add New Product`;
  }
  if (cancelEditBtn) {
    cancelEditBtn.style.display = "none";
  }

  if (window.lucide) lucide.createIcons();
}

// Attach Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveBtn");
  if (saveBtn) saveBtn.onclick = saveProduct;

  if (cancelEditBtn) cancelEditBtn.onclick = resetForm;
  if (logoutBtn) logoutBtn.onclick = handleLogout;

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleLogin();
    });
  }

  initAuth();
});