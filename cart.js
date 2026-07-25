// =====================================
// CART PAGE MANAGEMENT & CHECKOUT
// =====================================

// IMPORTANT: Replace these placeholders with your actual EmailJS credentials
const EMAILJS_PUBLIC_KEY = "-jelCCty2LCpxiANV"; 
const EMAILJS_SERVICE_ID = "Peptides";
const EMAILJS_TEMPLATE_ID = "template_0ksa73m";

document.addEventListener("DOMContentLoaded", () => {
  // Initialize EmailJS
  if (window.emailjs && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  renderCart();

  // Setup Delivery Method toggle logic
  const shippingSelect = document.getElementById("requireShipping");
  if (shippingSelect) {
    shippingSelect.addEventListener("change", renderCart);
  }

  // Setup Place Order button handler
  const placeOrderBtn = document.getElementById("placeOrderBtn");
  if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", handleCheckout);
  }
});

// Helper function to escape HTML characters safely
function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Get cart safely from localStorage while filtering out invalid/null items
function getSafeCart() {
  let cart = [];
  try {
    const raw = localStorage.getItem("cart");
    if (raw) {
      cart = JSON.parse(raw);
    }
  } catch (e) {
    console.error("Error parsing cart JSON:", e);
    cart = [];
  }

  if (!Array.isArray(cart)) return [];
  return cart.filter((item) => item && typeof item === "object" && item.id);
}

// Save clean cart back to localStorage and update global badge
function saveCart(cart) {
  const cleanCart = cart.filter((item) => item && typeof item === "object" && item.id);
  localStorage.setItem("cart", JSON.stringify(cleanCart));

  if (typeof updateGlobalCartCount === "function") {
    updateGlobalCartCount();
  }
}

// RENDER CART ITEMS & ORDER SUMMARY
function renderCart() {
  const cartItemsContainer = document.getElementById("cartItemsList");
  const cartSubtotal = document.getElementById("subtotalAmount");
  const cartShipping = document.getElementById("shippingAmount");
  const cartTotal = document.getElementById("totalAmount");
  const checkoutBtn = document.getElementById("placeOrderBtn");
  const shippingSelect = document.getElementById("requireShipping");

  if (!cartItemsContainer) return;

  const cart = getSafeCart();

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="empty-cart-message" style="text-align: center; padding: 40px 20px;">
        <h2>Your Cart is Empty</h2>
        <p style="color: #64748b; margin-bottom: 20px;">You haven't added any research products to your cart yet.</p>
        <a href="products.html" class="btn-primary" style="display: inline-block; padding: 10px 20px; text-decoration: none;">Browse Products</a>
      </div>
    `;

    if (cartSubtotal) cartSubtotal.textContent = "$0.00";
    if (cartShipping) cartShipping.textContent = "$0.00";
    if (cartTotal) cartTotal.textContent = "$0.00";
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  if (checkoutBtn) checkoutBtn.disabled = false;

  let subtotal = 0;
  cartItemsContainer.innerHTML = "";

  cart.forEach((item, index) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const itemTotal = price * qty;
    subtotal += itemTotal;

    const safeName = escapeHTML(item.name || "Research Compound");
    const safeImg = item.image_url || "https://via.placeholder.com/100";

    const itemRow = document.createElement("div");
    itemRow.className = "cart-item-row";
    itemRow.style.cssText = "display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 15px 0;";

    itemRow.innerHTML = `
      <div class="cart-item-info" style="display: flex; align-items: center; gap: 15px;">
        <img src="${safeImg}" alt="${safeName}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 6px;">
        <div>
          <h4 style="margin: 0 0 5px 0; font-size: 1rem;">${safeName}</h4>
          <span style="color: #64748b; font-size: 0.9rem;">$${price.toFixed(2)} each</span>
        </div>
      </div>

      <div class="cart-item-actions" style="display: flex; align-items: center; gap: 20px;">
        <div class="qty-controls" style="display: flex; align-items: center; border: 1px solid #cbd5e1; border-radius: 4px;">
          <button type="button" class="qty-btn dec-btn" data-index="${index}" style="padding: 4px 10px; background: none; border: none; cursor: pointer;">-</button>
          <span style="padding: 0 8px; font-weight: 600;">${qty}</span>
          <button type="button" class="qty-btn inc-btn" data-index="${index}" style="padding: 4px 10px; background: none; border: none; cursor: pointer;">+</button>
        </div>

        <span style="font-weight: 600; min-width: 70px; text-align: right;">$${itemTotal.toFixed(2)}</span>

        <button type="button" class="remove-btn" data-index="${index}" style="background: none; border: none; color: #ef4444; cursor: pointer;" aria-label="Remove item">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `;

    cartItemsContainer.appendChild(itemRow);
  });

  if (window.lucide) lucide.createIcons();

  // Determine delivery cost based on dropdown selection
  const isShipping = !shippingSelect || shippingSelect.value === "yes";
  const shippingFee = isShipping ? 50.00 : 0.00;
  const grandTotal = subtotal + shippingFee;

  if (cartSubtotal) cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
  if (cartShipping) cartShipping.textContent = `$${shippingFee.toFixed(2)}`;
  if (cartTotal) cartTotal.textContent = `$${grandTotal.toFixed(2)}`;

  attachCartEventListeners();
}

// ATTACH CLICK HANDLERS FOR +, -, AND REMOVE BUTTONS
function attachCartEventListeners() {
  const cart = getSafeCart();

  // Increment (+)
  document.querySelectorAll(".inc-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = e.currentTarget.dataset.index;
      if (cart[idx]) {
        cart[idx].quantity = (Number(cart[idx].quantity) || 1) + 1;
        saveCart(cart);
        renderCart();
      }
    });
  });

  // Decrement (-)
  document.querySelectorAll(".dec-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = e.currentTarget.dataset.index;
      if (cart[idx]) {
        const currentQty = Number(cart[idx].quantity) || 1;
        if (currentQty > 1) {
          cart[idx].quantity = currentQty - 1;
        } else {
          cart.splice(idx, 1);
        }
        saveCart(cart);
        renderCart();
      }
    });
  });

  // Remove Item
  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = e.currentTarget.dataset.index;
      if (cart[idx]) {
        cart.splice(idx, 1);
        saveCart(cart);
        renderCart();
      }
    });
  });
}

// CHECKOUT & EMAILJS SUBMISSION PROCESS
async function handleCheckout() {
  const name = document.getElementById("custName")?.value.trim();
  const email = document.getElementById("custEmail")?.value.trim();
  const phone = document.getElementById("custPhone")?.value.trim();
  const shippingSelect = document.getElementById("requireShipping");
  const deliveryMethod = shippingSelect?.options[shippingSelect.selectedIndex]?.text || "Standard Shipping";
  const address = document.getElementById("custAddress")?.value.trim();
  const notes = document.getElementById("custNotes")?.value.trim() || "N/A";

  // Validate form fields
  if (!name || !email || !phone || !address) {
    alert("Please fill in all required contact and shipping details.");
    return;
  }

  const cart = getSafeCart();
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  // Format cart items summary for email
  const itemsFormatted = cart
    .map((i) => `- ${i.name} (x${i.quantity}) @ $${Number(i.price).toFixed(2)} ea`)
    .join("\n");

  const grandTotal = document.getElementById("totalAmount")?.textContent || "$0.00";

  const templateParams = {
    user_name: name,
    user_email: email,
    user_phone: phone,
    delivery_method: deliveryMethod,
    shipping_address: address,
    order_notes: notes,
    order_summary: itemsFormatted,
    total_amount: grandTotal,
  };

  const btn = document.getElementById("placeOrderBtn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" class="spin"></i> Processing...`;
    if (window.lucide) lucide.createIcons();
  }

  try {
    // Send email via EmailJS
    if (window.emailjs && EMAILJS_SERVICE_ID !== "YOUR_SERVICE_ID") {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
    } else {
      console.warn("EmailJS IDs not configured yet. Proceeding with simulated confirmation.");
    }

    // Clear cart storage
    localStorage.removeItem("cart");
    if (typeof updateGlobalCartCount === "function") {
      updateGlobalCartCount();
    }

    // Display confirmation modal
    const modal = document.getElementById("successModal");
    if (modal) {
      modal.style.display = "flex";
    } else {
      alert("Order Received! Support will get back to you shortly.");
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Failed to send order email:", error);
    alert("There was an issue processing your order. Please try again.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="check-circle"></i> Complete & Place Order`;
      if (window.lucide) lucide.createIcons();
    }
  }
}
