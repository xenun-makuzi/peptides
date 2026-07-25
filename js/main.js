document.addEventListener("DOMContentLoaded", () => {
  // 1. Age Verification Modal
  const modal = document.getElementById("ageModal");
  const enterBtn = document.getElementById("enterBtn");
  const leaveBtn = document.getElementById("leaveBtn");

  if (modal) {
    if (localStorage.getItem("verified")) {
      modal.style.display = "none";
    }

    if (enterBtn) {
      enterBtn.onclick = function () {
        localStorage.setItem("verified", "true");
        modal.style.display = "none";
      };
    }

    if (leaveBtn) {
      leaveBtn.onclick = function () {
        window.location.href = "https://google.com";
      };
    }
  }

  // 2. Mobile Menu Toggle
  const menuBtn = document.getElementById("menuBtn");
  const navMenu = document.getElementById("navMenu");

  if (menuBtn && navMenu) {
    menuBtn.onclick = function (e) {
      e.stopPropagation();
      navMenu.classList.toggle("active");
    };

    document.addEventListener("click", function (event) {
      const clickedInsideMenu = navMenu.contains(event.target);
      const clickedButton = menuBtn.contains(event.target);

      if (!clickedInsideMenu && !clickedButton) {
        navMenu.classList.remove("active");
      }
    });
  }

  // 3. FAQ Accordion Logic
  const faqs = document.querySelectorAll(".faq-item");

  faqs.forEach((item) => {
    const question = item.querySelector(".faq-question");

    if (question) {
      question.addEventListener("click", () => {
        faqs.forEach((faq) => {
          if (faq !== item) {
            faq.classList.remove("active");
          }
        });
        item.classList.toggle("active");
      });
    }
  });

  // 4. Initialize Cart Count & Load Database Products for Homepage
  updateGlobalCartCount();
  loadHomepageProducts();
});

// =====================================
// GLOBAL CART MANAGEMENT
// =====================================

/**
 * Updates all #cartCount badge instances across the site safely
 */
function updateGlobalCartCount() {
  const counter = document.getElementById("cartCount");
  if (counter) {
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem("cart")) || [];
    } catch (e) {
      cart = [];
    }

    // Safely aggregate items and skip null/invalid entries
    const totalItems = cart.reduce((sum, item) => {
      if (!item) return sum;
      return sum + (Number(item.quantity) || 1);
    }, 0);

    counter.textContent = totalItems;
  }
}

/**
 * Sync cart across multiple browser tabs
 */
window.addEventListener("storage", (event) => {
  if (event.key === "cart") {
    updateGlobalCartCount();
  }
});

/**
 * Global helper to save an item to localStorage and update badge
 */
window.addToCartGlobal = function (product) {
  if (!product || !product.id) {
    console.error("Invalid product data:", product);
    return;
  }

  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
  } catch (e) {
    cart = [];
  }

  const existingIndex = cart.findIndex(
    (item) => item && String(item.id) === String(product.id)
  );

  if (existingIndex > -1) {
    cart[existingIndex].quantity = (Number(cart[existingIndex].quantity) || 1) + 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name || "Research Compound",
      price: Number(product.price) || 0,
      image_url: product.image_url || "https://via.placeholder.com/200",
      quantity: 1,
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  
  updateGlobalCartCount();
  alert(`${product.name || "Item"} added to cart!`);
};

// =====================================
// DATABASE DYNAMIC PRODUCT LOADING
// =====================================

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

async function loadHomepageProducts() {
  const featuredContainer = document.getElementById("featuredContainer");
  const newArrivalsContainer = document.getElementById("newArrivalsContainer");

  if (!featuredContainer && !newArrivalsContainer) return;

  if (typeof supabaseClient === "undefined") {
    console.error("Supabase client is not initialized.");
    return;
  }

  try {
    const { data: products, error } = await supabaseClient
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !products) {
      console.error("Error fetching homepage products:", error);
      return;
    }

    // Populate Featured Products Container
    if (featuredContainer) {
      renderProductCards(featuredContainer, products.slice(0, 3));
    }

    // Populate New Arrivals Container
    if (newArrivalsContainer) {
      renderProductCards(newArrivalsContainer, products.slice(3, 6));
    }
  } catch (err) {
    console.error("Exception loading homepage products:", err);
  }
}

function renderProductCards(container, productList) {
  container.innerHTML = "";

  if (productList.length === 0) {
    container.innerHTML = `<p style="color:#64748b;">No products available right now.</p>`;
    return;
  }

  productList.forEach((product) => {
    const safeName = escapeHTML(product.name || "Research Compound");
    const imageUrl = product.image_url || "https://via.placeholder.com/300";
    const price = Number(product.price || 0).toFixed(2);

    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image">
        <img src="${imageUrl}" alt="${safeName}">
      </div>
      <div class="product-content">
        <h3>${safeName}</h3>
        <div class="product-meta">
          <span>${escapeHTML(product.category || "Lab Verified")}</span>
        </div>
        <p class="price">$${price}</p>
        <div class="product-actions">
          <a href="product.html?id=${product.id}">View Details</a>
          <button class="cart-btn" type="button">Add To Cart</button>
        </div>
      </div>
    `;

    const cartBtn = card.querySelector(".cart-btn");
    cartBtn.addEventListener("click", () => {
      window.addToCartGlobal(product);
    });

    container.appendChild(card);
  });
}
async function loadCategories() {
    const container = document.getElementById("categoriesContainer");
    if (!container) return;

    try {
        // Fetch all products from Supabase to extract unique categories dynamically
        const { data: products, error } = await supabaseClient
            .from("products")
            .select("category, image_url");

        if (error || !products) {
            console.error("Error fetching categories:", error);
            container.innerHTML = `<p style="color:#64748b;">Unable to load categories.</p>`;
            return;
        }

        // Group products by unique category (case-insensitive)
        const categoriesMap = {};
        products.forEach(p => {
            if (p.category) {
                const catLower = p.category.trim().toLowerCase();
                if (!categoriesMap[catLower]) {
                    categoriesMap[catLower] = {
                        name: p.category.trim(),
                        image: p.image_url || "https://via.placeholder.com/300"
                    };
                }
            }
        });

        const categories = Object.values(categoriesMap);

        if (categories.length === 0) {
            container.innerHTML = `<p style="color:#64748b;">No categories found.</p>`;
            return;
        }

        container.innerHTML = "";
        categories.forEach(cat => {
            const safeName = cat.name.replace(/[&<>'"]/g, '');
            const card = document.createElement("a");
            card.className = "product-card category-card";
            card.href = `products.html?category=${encodeURIComponent(safeName.toLowerCase())}`;
            card.style.textDecoration = "none";
            
            card.innerHTML = `
                <div class="product-image">
                    <img src="${cat.image}" alt="${safeName}">
                </div>
                <div class="product-content" style="text-align: center;">
                    <h3 style="text-transform: capitalize; margin: 15px 0;">${safeName}</h3>
                    <span class="btn-primary" style="display: inline-block; padding: 10px 20px; font-size: 14px; border-radius: var(--radius-md, 8px);">Browse Category</span>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error("Exception loading categories:", err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
});