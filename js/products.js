// =====================================
// PRODUCTS PAGE (SUPABASE INTEGRATION)
// =====================================

const container = document.getElementById("productsContainer");
const searchInput = document.getElementById("searchInput");
const suggestionsBox = document.getElementById("searchSuggestions");
const categoryFilter = document.getElementById("categoryFilter");
const priceRange = document.getElementById("priceRange");
const priceValue = document.getElementById("priceValue");

let allProducts = [];

// Helper function to sanitize user HTML text
function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Check for URL parameters (e.g. products.html?filter=lab-tests)
function applyInitialURLFilter() {
  const urlParams = new URLSearchParams(window.location.search);
  const filter = urlParams.get("filter");
  if (filter && categoryFilter) {
    categoryFilter.value = filter;
  }
}

// =====================================
// 1. LOAD PRODUCTS FROM SUPABASE
// =====================================
async function getProducts() {
  if (!container) return;

  container.innerHTML = `
    <div class="loading-state">
      <i data-lucide="loader" class="spin"></i>
      <p>Loading research catalog...</p>
    </div>
  `;
  if (window.lucide) lucide.createIcons();

  if (typeof supabaseClient === "undefined") {
    console.error("Supabase client is not initialized.");
    container.innerHTML = `<div class="empty-state"><p>Database connection error.</p></div>`;
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error:", error);
      container.innerHTML = `
        <div class="empty-state">
          <p>Unable to load products. Please refresh or try again later.</p>
        </div>
      `;
      return;
    }

    allProducts = data || [];

    // Dynamically calculate highest price for slider max limit
    if (allProducts.length && priceRange) {
      const highestPrice = Math.ceil(
        Math.max(...allProducts.map((p) => Number(p.price || 0)))
      );
      priceRange.max = highestPrice;
      priceRange.value = highestPrice;
      if (priceValue) priceValue.textContent = `$${highestPrice}`;
    }

    applyInitialURLFilter();
    filterProducts();
  } catch (err) {
    console.error("Fetch Exception:", err);
    container.innerHTML = `
      <div class="empty-state">
        <p>An unexpected error occurred while fetching products.</p>
      </div>
    `;
  }
}

// =====================================
// 2. RENDER PRODUCTS GRID
// =====================================
function renderProducts(products) {
  container.innerHTML = "";

  if (!products.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No products match your filter criteria.</p>
      </div>
    `;
    return;
  }

  products.forEach((product) => {
    const safeName = escapeHTML(product.name || "Research Compound");
    const safeDesc = escapeHTML(
      product.description
        ? product.description.substring(0, 90) + "..."
        : "Premium research product with verified testing parameters."
    );
    const safeImage = product.image_url || "https://via.placeholder.com/300";
    const price = Number(product.price || 0).toFixed(2);

    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image">
        <img src="${safeImage}" alt="${safeName}">
      </div>
      <div class="product-info">
        <h3>${safeName}</h3>
        <p>${safeDesc}</p>
        <div class="price">$${price}</div>
        <div class="product-card-actions">
          <a href="product.html?id=${product.id}">View Details</a>
          <button class="cart-btn" type="button" data-id="${product.id}">Add To Cart</button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  activateCartButtons();
}

// =====================================
// 3. AUTO-SUGGESTION SYSTEM
// =====================================
function handleAutoSuggest() {
  if (!suggestionsBox || !searchInput) return;

  const query = searchInput.value.toLowerCase().trim();

  if (query.length < 1) {
    suggestionsBox.hidden = true;
    suggestionsBox.innerHTML = "";
    return;
  }

  const matches = allProducts.filter((item) =>
    (item.name || "").toLowerCase().includes(query)
  ).slice(0, 5);

  if (matches.length === 0) {
    suggestionsBox.hidden = true;
    return;
  }

  suggestionsBox.innerHTML = "";
  matches.forEach((item) => {
    const suggestion = document.createElement("div");
    suggestion.className = "suggestion-item";
    suggestion.innerHTML = `
      <span class="suggestion-title">${escapeHTML(item.name)}</span>
      <span class="suggestion-price">$${Number(item.price || 0).toFixed(2)}</span>
    `;

    suggestion.addEventListener("click", () => {
      searchInput.value = item.name;
      suggestionsBox.hidden = true;
      filterProducts();
    });

    suggestionsBox.appendChild(suggestion);
  });

  suggestionsBox.hidden = false;
}

// Close search suggestions on outside click
document.addEventListener("click", (e) => {
  if (
    suggestionsBox &&
    !suggestionsBox.contains(e.target) &&
    e.target !== searchInput
  ) {
    suggestionsBox.hidden = true;
  }
});

// =====================================
// 4. COMBINED FILTERING
// =====================================
function filterProducts() {
  const searchValue = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const selectedCat = categoryFilter ? categoryFilter.value.toLowerCase() : "all";
  const maxPrice = priceRange ? Number(priceRange.value) : Infinity;

  if (priceValue && priceRange) {
    priceValue.textContent = `$${priceRange.value}`;
  }

  const filtered = allProducts.filter((product) => {
    const matchName = (product.name || "").toLowerCase().includes(searchValue);
    const productCat = (product.category || "").toLowerCase();
    const matchCategory = selectedCat === "all" || productCat === selectedCat;
    const matchPrice = Number(product.price || 0) <= maxPrice;

    return matchName && matchCategory && matchPrice;
  });

  renderProducts(filtered);
}

// =====================================
// 5. CART & BADGE SYNCING
// =====================================
function activateCartButtons() {
  const buttons = container.querySelectorAll(".cart-btn");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      const product = allProducts.find((item) => String(item.id) === String(id));
      
      if (product) {
        if (typeof window.addToCartGlobal === "function") {
          window.addToCartGlobal(product);
        } else {
          addToCartFallback(product);
        }
      }
    });
  });
}

function addToCartFallback(product) {
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
  } catch (e) {
    cart = [];
  }

  const existingIndex = cart.findIndex((item) => item && String(item.id) === String(product.id));

  if (existingIndex > -1) {
    cart[existingIndex].quantity = (Number(cart[existingIndex].quantity) || 1) + 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name || "Research Compound",
      price: Number(product.price) || 0,
      image_url: product.image_url || "https://via.placeholder.com/300",
      quantity: 1,
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  if (typeof updateGlobalCartCount === "function") {
    updateGlobalCartCount();
  }

  alert(`${product.name} added to cart!`);
}

// Event Listeners
if (searchInput) {
  searchInput.addEventListener("input", () => {
    handleAutoSuggest();
    filterProducts();
  });
}
if (categoryFilter) categoryFilter.addEventListener("change", filterProducts);
if (priceRange) priceRange.addEventListener("input", filterProducts);

// Initialize Products Page
document.addEventListener("DOMContentLoaded", () => {
  getProducts();
});
// Check for URL parameters (e.g. products.html?category=peptides or products.html?filter=lab-tests)
function applyInitialURLFilter() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get("category");
  const filterParam = urlParams.get("filter");

  if (categoryFilter) {
    if (categoryParam) {
      categoryFilter.value = categoryParam.toLowerCase();
    } else if (filterParam) {
      categoryFilter.value = filterParam.toLowerCase();
    }
  }
}