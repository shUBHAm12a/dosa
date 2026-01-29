// Simple carousel logic
const slides = document.querySelectorAll(".carousel-slide");
const dots = document.querySelectorAll(".dot");

let currentSlide = 0;
let carouselInterval;
const AUTO_PLAY_DELAY = 5000;

function setSlide(index) {
  if (!slides.length) return;

  currentSlide = (index + slides.length) % slides.length;

  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === currentSlide);
  });

  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === currentSlide);
  });
}

function nextSlide() {
  setSlide(currentSlide + 1);
}

function prevSlide() {
  setSlide(currentSlide - 1);
}

function startAutoPlay() {
  clearInterval(carouselInterval);
  carouselInterval = setInterval(nextSlide, AUTO_PLAY_DELAY);
}

dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    setSlide(index);
    startAutoPlay();
  });
});

// Initialize carousel
setSlide(0);
startAutoPlay();

// ---------------------------
// Reference-style menu rendering
// ---------------------------

// Menu data: loaded from menu.json (recommended). We keep a fallback in case
// the site is opened via file:// where fetch() may be blocked.
let MENU_ITEMS = [];

// const FALLBACK_MENU_ITEMS = [
//   // Dominion (examples)
//   {
//     id: "d1",
//     location: "dominion",
//     category: "Dosa",
//     title: "Masala Dosa",
//     price: 13.99,
//     image: "images/hero-1.jpg",
//     badge: "",
//   },
//   {
//     id: "s1",
//     location: "stoddard",
//     category: "Indo Chinese",
//     title: "Veg Manchurian",
//     price: 14.99,
//     image: "images/hero-2.jpg",
//     badge: "",
//   }
// ];

let activeLocation = "dominion";
let activeCategory = "All";

const locationButtons = document.querySelectorAll(".location-btn");
const chipsRoot = document.getElementById("category-chips");
const gridRoot = document.getElementById("menu-grid");
const DEFAULT_ITEM_IMAGE =
  document.querySelector(".carousel-slide img")?.getAttribute("src") || "";

const IMG_FALLBACK =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f6f7fb"/>
          <stop offset="1" stop-color="#eef1f6"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
        font-family="Poppins, Arial" font-size="28" fill="#7a7a7a">
        Image unavailable
      </text>
    </svg>`,
  );

function formatPrice(n) {
  if (typeof n !== "number") return "";
  return `$${n.toFixed(2)}`;
}

function getCategoriesForLocation(location) {
  const set = new Set(["All"]);
  MENU_ITEMS.filter((x) => x.location === location).forEach((x) => {
    set.add(x.category);
  });
  return Array.from(set);
}

function renderChips() {
  if (!chipsRoot) return;
  const categories = getCategoriesForLocation(activeLocation);
  if (!categories.includes(activeCategory)) activeCategory = "All";

  chipsRoot.innerHTML = categories
    .map((c) => {
      const isActive = c === activeCategory ? "active" : "";
      return `<button class="chip ${isActive}" data-category="${c}" type="button">${c}</button>`;
    })
    .join("");
}

function renderGrid() {
  if (!gridRoot) return;

  const items = MENU_ITEMS.filter((x) => {
    if (x.location !== activeLocation) return false;
    if (activeCategory === "All") return true;
    return x.category === activeCategory;
  });

  // Light enter animation
  gridRoot.style.opacity = "0";
  gridRoot.style.transform = "translateY(8px)";

  window.requestAnimationFrame(() => {
    if (!items.length) {
      gridRoot.innerHTML = `
        <div class="empty-state">
          <strong>No items found</strong>
          Try selecting a different category.
        </div>
      `;
      gridRoot.style.opacity = "1";
      gridRoot.style.transform = "translateY(0)";
      return;
    }

    gridRoot.innerHTML = items
      .map((item) => {
        const imgSrc = item.image || DEFAULT_ITEM_IMAGE || IMG_FALLBACK;
        return `
          <article class="menu-card">
            <img class="menu-card-image" src="${imgSrc}" alt="${item.title}" loading="lazy" onerror="this.onerror=null;this.src='${IMG_FALLBACK}'" />
            <div class="menu-card-body">
              <h3 class="menu-card-title">${item.title}</h3>
              <p class="menu-card-meta">${item.category}</p>
            </div>
            <div class="menu-card-footer">
              <span></span>
              <div class="price">${formatPrice(item.price)}</div>
            </div>
          </article>
        `;
      })
      .join("");

    gridRoot.style.opacity = "1";
    gridRoot.style.transform = "translateY(0)";
  });
}

function setLocation(nextLocation) {
  activeLocation = nextLocation;
  activeCategory = "All";
  renderChips();
  renderGrid();
}

locationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const location = button.getAttribute("data-location") || "dominion";
    locationButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    setLocation(location);
  });
});

// Chip click handling (event delegation so it never breaks after re-render)
if (chipsRoot) {
  chipsRoot.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const chip = target.closest(".chip");
    if (!chip) return;
    activeCategory = chip.getAttribute("data-category") || "All";
    chipsRoot
      .querySelectorAll(".chip")
      .forEach((x) => x.classList.toggle("active", x === chip));
    renderGrid();
  });
}

async function loadMenuData() {
  try {
    const res = await fetch("menu.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load menu.json (${res.status})`);
    const data = await res.json();
    MENU_ITEMS = Array.isArray(data?.items) ? data.items : [];
    if (!MENU_ITEMS.length) throw new Error("menu.json has no items[]");
  } catch (err) {
    console.warn(
      "[Menu] Could not load menu.json (likely file://). Falling back to sample items. Run a local server for JSON loading.",
      err,
    );
    MENU_ITEMS = FALLBACK_MENU_ITEMS;
  }
}

// Initial render (after data load)
(async function initMenu() {
  await loadMenuData();
  renderChips();
  renderGrid();
})();

// Dynamic year in footer
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}
