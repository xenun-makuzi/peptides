// =====================================
// LAB RESULTS / COA GALLERY ENGINE
// =====================================

const coaGrid = document.getElementById("coaGrid");
const searchInput = document.getElementById("searchInput");

const lightboxModal = document.getElementById("lightboxModal");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCaption = document.getElementById("lightboxCaption");
const closeLightbox = document.getElementById("closeLightbox");

let allReports = [];

// 1. Fetch products that have lab test images from Supabase
async function fetchLabReports() {
  if (!coaGrid) return;

  // Fixed: Replaced updated_at with created_at to match your table schema
  const { data, error } = await supabaseClient
    .from("products")
    .select("id, name, lab_test_url, created_at")
    .not("lab_test_url", "is", null);

  if (error) {
    console.error("Error fetching lab reports:", error);
    coaGrid.innerHTML = `<p class="loading-state" style="color:var(--danger)">Failed to load COA reports.</p>`;
    return;
  }

  // Fallback sample data if database has no lab images attached yet
  if (!data || data.length === 0) {
    allReports = [
      {
        id: "sample-1",
        name: "Ipamorelin – 10 mg",
        lab_test_url: "tet.jpg" // Uses the uploaded test report sample image
      }
    ];
  } else {
    allReports = data;
  }

  renderReports(allReports);
}

// 2. Render Cards
function renderReports(reports) {
  if (reports.length === 0) {
    coaGrid.innerHTML = `<p class="loading-state">No matching lab reports found.</p>`;
    return;
  }

  coaGrid.innerHTML = "";

  reports.forEach((report) => {
    const card = document.createElement("div");
    card.className = "coa-card";

    const imageUrl = report.lab_test_url || "tet.jpg";

    card.innerHTML = `
      <div class="coa-img-wrapper">
        <img src="${imageUrl}" alt="${report.name} Lab Report" loading="lazy">
        <div class="zoom-overlay">
          <i data-lucide="zoom-in"></i> Click to Inspect Certificate
        </div>
      </div>
      <div class="coa-info">
        <div>
          <h3>${report.name}</h3>
          <span>Certified Janoshik Report</span>
        </div>
        <i data-lucide="file-check" style="color: var(--success);"></i>
      </div>
    `;

    // Click to open lightbox
    card.querySelector(".coa-img-wrapper").addEventListener("click", () => {
      openLightbox(imageUrl, report.name);
    });

    coaGrid.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

// 3. Search Filter
searchInput?.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase().trim();
  const filtered = allReports.filter(report => 
    report.name.toLowerCase().includes(query)
  );
  renderReports(filtered);
});

// 4. Lightbox Functions
function openLightbox(imgSrc, name) {
  lightboxImg.src = imgSrc;
  lightboxCaption.textContent = `${name} - Full Certificate of Analysis`;
  lightboxModal.style.display = "flex";
}

closeLightbox?.addEventListener("click", () => {
  lightboxModal.style.display = "none";
});

lightboxModal?.addEventListener("click", (e) => {
  if (e.target === lightboxModal) {
    lightboxModal.style.display = "none";
  }
});

// On Load
document.addEventListener("DOMContentLoaded", fetchLabReports);