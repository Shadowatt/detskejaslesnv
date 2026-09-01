// Gallery configuration
const PHOTOS_PER_PAGE = 6;
let allPhotos = [];
let currentPage = 1;
let totalPages = 1;
let currentPreviewIndex = -1;
let activePhotos = []; // tracks which photo set (gallery or hero) is active in the preview modal

// Hero slider configuration
const heroPhotos = [
  { src: "./assets/images/hero/hero1.jpeg", tag: "Uvodný obrázok" },
  { src: "./assets/images/hero/hero2.jpg", tag: "Uvodný obrázok" },
];
let heroIndex = 0;

// Initialize gallery on page load
document.addEventListener("DOMContentLoaded", () => {
  loadGalleryPhotos();
  setupPagination();
  setupPreviewModal();
  initHeroSlider();
});

// Load photos from JSON file
async function loadGalleryPhotos() {
  try {
    const response = await fetch("./assets/json/gallery.json");

    if (!response.ok) {
      // Fallback if fetch fails - show placeholder message
      const container = document.getElementById("fotogallery-con");
      container.innerHTML =
        '<p class="col-span-full text-center text-gray-500 py-8">Fotografie budú doplnené neskôr</p>';
      return;
    }

    const photosData = await response.json();

    allPhotos = photosData.map((item) => {
      const filename = item.path.split("/").pop();
      return {
        src: item.path,
        tag: item.name,
        filename: filename,
      };
    });

    if (allPhotos.length === 0) {
      const container = document.getElementById("fotogallery-con");
      container.innerHTML = '<p class="col-span-full text-center text-gray-500 py-8">Fotografií nie sú dostupné</p>';
      return;
    }

    totalPages = Math.ceil(allPhotos.length / PHOTOS_PER_PAGE);
    renderGalleryPage(1);
    updatePaginationButtons();
  } catch (error) {
    console.log("Gallery JSON not accessible - using placeholder mode");
    const container = document.getElementById("fotogallery-con");
    container.innerHTML = '<p class="col-span-full text-center text-gray-500 py-8">Fotografie budú doplnené neskôr</p>';
  }
}

// Render current page of photos
function renderGalleryPage(page) {
  currentPage = page;
  const container = document.getElementById("fotogallery-con");

  if (!container) return;

  container.innerHTML = "";

  const startIdx = (page - 1) * PHOTOS_PER_PAGE;
  const endIdx = startIdx + PHOTOS_PER_PAGE;
  const pagePhotos = allPhotos.slice(startIdx, endIdx);

  pagePhotos.forEach((photo, index) => {
    const photoEl = document.createElement("div");
    photoEl.className = "group relative overflow-hidden rounded-2xl aspect-square cursor-pointer";
    photoEl.innerHTML = `
      <div class="skeleton absolute inset-0 rounded-2xl"></div>
      <img
        src="${photo.src}"
        alt="${photo.tag}"
        loading="lazy"
        decoding="async"
        class="gallery-img relative w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        onload="this.classList.add('loaded'); const sk = this.previousElementSibling; if (sk) sk.remove();"
        onerror="const sk = this.previousElementSibling; if (sk) sk.remove(); this.parentElement.style.opacity='0.5'; this.parentElement.title='Obrázok sa nepodarilo načítať';"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
        <span class="text-white font-medium">${photo.tag}</span>
      </div>
    `;

    photoEl.addEventListener("click", () => openPreview(photo, allPhotos));
    container.appendChild(photoEl);
  });

  if (totalPages > 1 && pagePhotos.length < PHOTOS_PER_PAGE) {
    const placeholders = PHOTOS_PER_PAGE - pagePhotos.length;
    for (let i = 0; i < placeholders; i += 1) {
      const placeholderEl = document.createElement("div");
      placeholderEl.className = "rounded-2xl aspect-square opacity-0 pointer-events-none";
      container.appendChild(placeholderEl);
    }
  }
}

// Setup pagination functionality
function setupPagination() {
  const paginationContainer = document.querySelector(".flex.justify-center.items-center.gap-2");

  if (!paginationContainer) return;

  const prevBtn = paginationContainer.querySelector("button:first-child");
  const nextBtn = paginationContainer.querySelector("button:last-child");
  const pageButtons = paginationContainer.querySelectorAll("button:not(:first-child):not(:last-child)");

  // Previous button
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      const newPage = currentPage > 1 ? currentPage - 1 : totalPages;
      renderGalleryPage(newPage);
      updatePaginationButtons();
    });
  }

  // Next button
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const newPage = currentPage < totalPages ? currentPage + 1 : 1;
      renderGalleryPage(newPage);
      updatePaginationButtons();
    });
  }

  // Number buttons
  pageButtons.forEach((btn, index) => {
    const pageNum = index + 1;
    btn.addEventListener("click", () => {
      if (pageNum <= totalPages) {
        renderGalleryPage(pageNum);
        updatePaginationButtons();
      }
    });
  });
}

// Update pagination button states
function updatePaginationButtons() {
  const paginationContainer = document.querySelector(".flex.justify-center.items-center.gap-2");

  if (!paginationContainer) return;

  const buttons = paginationContainer.querySelectorAll("button");

  buttons.forEach((btn, index) => {
    // First button (prev)
    if (index === 0) {
      btn.disabled = false;
      btn.style.opacity = "1";
      return;
    }

    // Last button (next)
    if (index === buttons.length - 1) {
      btn.disabled = false;
      btn.style.opacity = "1";
      return;
    }

    // Number buttons
    const pageNum = index;
    if (pageNum <= totalPages) {
      btn.style.display = "flex";
      if (pageNum === currentPage) {
        btn.classList.remove(
          "bg-white",
          "text-[var(--dark-text-color)]",
          "hover:bg-[var(--primary-color)]",
          "hover:text-white",
        );
        btn.classList.add("bg-[var(--primary-color)]", "text-white");
      } else {
        btn.classList.remove("bg-[var(--primary-color)]", "text-white");
        btn.classList.add(
          "bg-white",
          "text-[var(--dark-text-color)]",
          "hover:bg-[var(--primary-color)]",
          "hover:text-white",
        );
      }
    } else {
      btn.style.display = "none";
    }
  });
}

// Setup preview modal
function setupPreviewModal() {
  const modal = document.getElementById("photo-preview-modal");
  if (modal) {
    // Click outside to close
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closePreview();
    });

    // Escape key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) {
        closePreview();
      }
    });
  }
}

// Open preview modal
// photosArray lets the modal know which photo set is active (gallery photos or hero photos),
// so next/prev navigation stays within the correct set.
function openPreview(photo, photosArray = allPhotos) {
  const modal = document.getElementById("photo-preview-modal");
  if (!modal) return;

  activePhotos = photosArray;
  currentPreviewIndex = activePhotos.findIndex((p) => p.src === photo.src);

  const img = modal.querySelector("#preview-image");
  const tag = modal.querySelector("#preview-tag");

  img.src = photo.src;
  img.alt = photo.tag;
  tag.textContent = photo.tag;

  modal.classList.remove("hidden");
}

// Go to next photo in preview (wraps to first after the last)
function goToNextPhoto() {
  if (activePhotos.length === 0) return;
  currentPreviewIndex = (currentPreviewIndex + 1) % activePhotos.length;
  openPreview(activePhotos[currentPreviewIndex], activePhotos);
}

// Go to previous photo in preview (wraps to last after the first)
function goToPreviousPhoto() {
  if (activePhotos.length === 0) return;
  currentPreviewIndex = (currentPreviewIndex - 1 + activePhotos.length) % activePhotos.length;
  openPreview(activePhotos[currentPreviewIndex], activePhotos);
}

// Close preview modal
function closePreview() {
  const modal = document.getElementById("photo-preview-modal");
  if (modal) {
    modal.classList.add("hidden");
    currentPreviewIndex = -1;
  }
}

// Hero image slider - rotates image every 5 seconds, opens preview modal on click
function initHeroSlider() {
  const heroImg = document.getElementById("hero-image");
  if (!heroImg || heroPhotos.length === 0) return;

  // Preload all hero images so the crossfade never shows a blank frame
  heroPhotos.forEach((p) => {
    const img = new Image();
    img.src = p.src;
  });

  heroImg.addEventListener("click", () => openPreview(heroPhotos[heroIndex], heroPhotos));

  if (heroPhotos.length <= 1) return;

  // Respect users who prefer reduced motion - skip auto-rotation
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  setInterval(() => {
    heroIndex = (heroIndex + 1) % heroPhotos.length;
    heroImg.style.opacity = "0";
    setTimeout(() => {
      heroImg.src = heroPhotos[heroIndex].src;
      heroImg.style.opacity = "1";
    }, 350);
  }, 8000);
}

// Mobile menu toggle
document.addEventListener("DOMContentLoaded", () => {
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("open");
      mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close menu when clicking on a link
    const menuLinks = mobileMenu.querySelectorAll("a");
    menuLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("open");
        mobileMenuToggle.setAttribute("aria-expanded", "false");
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !mobileMenu.contains(e.target) &&
        !mobileMenuToggle.contains(e.target) &&
        mobileMenu.classList.contains("open")
      ) {
        mobileMenu.classList.remove("open");
        mobileMenuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }
});

// Kopírovanie e-mailu a telefónu do schránky
document.addEventListener("DOMContentLoaded", () => {
  const copyButtons = document.querySelectorAll(".copy-btn");

  copyButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const textToCopy = btn.getAttribute("data-copy");
      if (!textToCopy) return;

      try {
        await navigator.clipboard.writeText(textToCopy);
      } catch (err) {
        // Fallback pre staršie prehliadače
        const tempInput = document.createElement("input");
        tempInput.value = textToCopy;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
      }

      const icon = btn.querySelector("i");
      const originalClass = icon.className;
      const originalLabel = btn.getAttribute("aria-label");

      icon.className = "fa-solid fa-check text-green-500 text-sm";
      btn.setAttribute("aria-label", "Skopírované");

      setTimeout(() => {
        icon.className = originalClass;
        btn.setAttribute("aria-label", originalLabel);
      }, 1500);
    });
  });
});

// Automatický rok v pätičke
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});

// Legal pages toggle (Privacy Policy & Terms of Use)
document.addEventListener("DOMContentLoaded", () => {
  const mainSections = ["hero", "o-nas", "fotogaleria", "stravovanie", "cennik", "informacie", "dokumenty", "kontakt"];
  const legalSections = ["ochrana-udajov", "podmienky-pouzivania"];

  // Handle all link clicks
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[href^='#']");
    if (!link) return;

    const hash = link.getAttribute("href").substring(1);

    // If clicking on a legal section link
    if (legalSections.includes(hash)) {
      e.preventDefault();

      // Hide all main sections
      mainSections.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) section.classList.add("hidden");
      });

      // Hide all legal sections first
      legalSections.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) section.classList.add("hidden");
      });

      // Show the clicked legal section
      const targetSection = document.getElementById(hash);
      if (targetSection) {
        targetSection.classList.remove("hidden");
        // Scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (hash && !legalSections.includes(hash)) {
      // If clicking on any other link (main sections)
      // Hide all legal sections
      legalSections.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) section.classList.add("hidden");
      });

      // Show all main sections
      mainSections.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) section.classList.remove("hidden");
      });
    }
  });

  // Handle browser back/forward buttons
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.substring(1);

    if (legalSections.includes(hash)) {
      // Hide main sections, show legal section
      mainSections.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) section.classList.add("hidden");
      });

      legalSections.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) {
          if (sectionId === hash) {
            section.classList.remove("hidden");
          } else {
            section.classList.add("hidden");
          }
        }
      });
    } else {
      // Show main sections, hide legal sections
      legalSections.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) section.classList.add("hidden");
      });

      mainSections.forEach((sectionId) => {
        const section = document.getElementById(sectionId);
        if (section) section.classList.remove("hidden");
      });
    }
  });
});
