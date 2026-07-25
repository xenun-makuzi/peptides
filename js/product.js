// =====================================
// SINGLE PRODUCT DETAILS & SIMILAR ITEMS
// =====================================

const detailWrapper = document.getElementById("productDetailWrapper");

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function getProductIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadProductDetails() {
  const id = getProductIdFromURL();

  if (!id || !detailWrapper) {
    if (detailWrapper) {
      detailWrapper.innerHTML = `
        <div class="empty-state">
          <h2>Product Not Found</h2>
          <p>No valid product ID specified.</p>
          <a href="products.html" class="btn-primary" style="margin-top:15px; display:inline-block;">Return to Products</a>
        </div>
      `;
    }
    return;
  }

  if (typeof supabaseClient === "undefined") {
    console.error("Supabase client is not initialized.");
    detailWrapper.innerHTML = `<div class="empty-state"><h2>Database connection error.</h2></div>`;
    return;
  }

  try {
    const { data: product, error } = await supabaseClient
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !product) {
      console.error("Supabase Product Fetch Error:", error);
      detailWrapper.innerHTML = `
        <div class="empty-state">
          <h2>Product Not Found</h2>
          <p>The requested compound could not be found.</p>
          <a href="products.html" class="btn-primary" style="margin-top:15px; display:inline-block;">Browse Catalog</a>
        </div>
      `;
      return;
    }

    renderProductDetail(product);
    loadSimilarProducts(product.category, product.id);
  } catch (err) {
    console.error("Exception loading product:", err);
  }
}

function renderProductDetail(product) {
  const safeName = escapeHTML(product.name || "Research Compound");
  const safeDesc = escapeHTML(
    product.description || "High-purity research compound backed by transparent laboratory documentation."
  );
  
  // Image URL fallbacks
  const mainImg = product.image_url || "https://via.placeholder.com/400";
  const labImg = product.lab_image_url || product.lab_test_url || mainImg;

  const price = Number(product.price || 0).toFixed(2);
  const category = escapeHTML(product.category || "Research Peptides");

  detailWrapper.innerHTML = `
    <div class="product-detail-layout">
      
      <!-- Left: Two-Image Gallery (Product + Lab Result) -->
      <div class="product-gallery">
        <div class="gallery-main-image">
          <img id="activeGalleryImage" src="${mainImg}" alt="${safeName}">
        </div>

        <div class="gallery-thumbnails">
          <div class="thumb-item active" onclick="switchGalleryImage('${mainImg}', this)">
            <img src="${mainImg}" alt="Product Image">
          </div>
          <div class="thumb-item" onclick="switchGalleryImage('${labImg}', this)">
            <img src="${labImg}" alt="Lab Test Certificate">
          </div>
        </div>
      </div>

      <!-- Right: Details Box -->
      <div class="product-info-panel">
        <span class="product-badge">${category}</span>
        <h1 class="product-title">${safeName}</h1>
        <div class="product-price">$${price}</div>
        <p class="product-description">${safeDesc}</p>

        <!-- Quantity & Add to Cart -->
        <div class="purchase-controls">
          <div class="quantity-selector">
            <button id="qtyMinus" type="button">-</button>
            <input type="number" id="productQty" value="1" min="1" max="99" readonly>
            <button id="qtyPlus" type="button">+</button>
          </div>
          <button id="detailAddToCart" class="add-to-cart-btn" type="button">
            <i data-lucide="shopping-cart"></i>
            Add To Cart
          </button>
        </div>

        <!-- Specifications & Lab Meta -->
        <div class="lab-specs-box">
          <div class="spec-item">
            <span>Purity Grade</span>
            <strong>&ge; 99% Pure (HPLC)</strong>
          </div>
          <div class="spec-item">
            <span>Documentation</span>
            <strong>Lab Test COA Included</strong>
          </div>
          <div class="spec-item">
            <span>Storage Conditions</span>
            <strong>Store at -20&deg;C</strong>
          </div>
        </div>
      </div>

    </div>

    <!-- Clean Similar Products Section -->
    <section class="related-products-section">
      <h2>Similar Products</h2>
      <div class="similar-grid" id="similarProductsContainer">
        <div class="loading-state">
          <i data-lucide="loader" class="spin"></i>
          <p>Loading similar compounds...</p>
        </div>
      </div>
    </section>
  `;

  if (window.lucide) lucide.createIcons();

  // Quantity button logic
  const qtyInput = document.getElementById("productQty");
  const minusBtn = document.getElementById("qtyMinus");
  const plusBtn = document.getElementById("qtyPlus");
  const addToCartBtn = document.getElementById("detailAddToCart");

  if (minusBtn) {
    minusBtn.addEventListener("click", () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });
  }

  if (plusBtn) {
    plusBtn.addEventListener("click", () => {
      let val = parseInt(qtyInput.value) || 1;
      qtyInput.value = val + 1;
    });
  }

  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      const quantity = parseInt(qtyInput.value) || 1;
      
      // Call global cart logic with quantity count
      for (let i = 0; i < quantity; i++) {
        if (typeof window.addToCartGlobal === "function") {
          window.addToCartGlobal(product);
        } else {
          addToCartDetailFallback(product);
        }
      }
    });
  }
}

// Gallery image toggle function
window.switchGalleryImage = function (src, element) {
  const main = document.getElementById("activeGalleryImage");
  if (main) main.src = src;

  document.querySelectorAll(".thumb-item").forEach((thumb) => thumb.classList.remove("active"));
  if (element) element.classList.add("active");
};

// Fetch and render similar items clean layout
async function loadSimilarProducts(category, currentProductId) {
  const container = document.getElementById("similarProductsContainer");
  if (!container) return;

  try {
    let query = supabaseClient
      .from("products")
      .select("*")
      .neq("id", currentProductId)
      .limit(3);

    if (category) {
      query = query.eq("category", category);
    }

    let { data: similar, error } = await query;

    if (error || !similar || similar.length === 0) {
      const fallback = await supabaseClient
        .from("products")
        .select("*")
        .neq("id", currentProductId)
        .limit(3);
      similar = fallback.data || [];
    }

    if (similar.length === 0) {
      container.innerHTML = `<p style="color:#64748b;">No similar products available.</p>`;
      return;
    }

    container.innerHTML = "";
    similar.forEach((item) => {
      const safeName = escapeHTML(item.name || "Research Compound");
      const safeDesc = escapeHTML(
        item.description ? item.description.substring(0, 75) + "..." : "High-purity laboratory research product."
      );
      const safeImg = item.image_url || "https://via.placeholder.com/300";
      const price = Number(item.price || 0).toFixed(2);

      const card = document.createElement("div");
      card.className = "similar-card";
      card.innerHTML = `
        <div class="similar-card-image">
          <img src="${safeImg}" alt="${safeName}">
        </div>
        <div class="similar-card-body">
          <h3 class="similar-card-title">${safeName}</h3>
          <p class="similar-card-desc">${safeDesc}</p>
          <div class="similar-card-price">$${price}</div>
          <div class="similar-card-actions">
            <a href="product.html?id=${item.id}">View Details</a>
            <button type="button" class="sim-cart-btn">Add To Cart</button>
          </div>
        </div>
      `;

      const simBtn = card.querySelector(".sim-cart-btn");
      if (simBtn) {
        simBtn.addEventListener("click", () => {
          if (typeof window.addToCartGlobal === "function") {
            window.addToCartGlobal(item);
          } else {
            addToCartDetailFallback(item);
          }
        });
      }

      container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error("Error loading similar products:", err);
  }
}

function addToCartDetailFallback(product) {
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
      name: product.name,
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

document.addEventListener("DOMContentLoaded", () => {
  loadProductDetails();
});