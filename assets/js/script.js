// Gallery configuration
const PHOTOS_PER_PAGE = 6;
let allPhotos = [];
let currentPage = 1;
let totalPages = 1;
let currentPreviewIndex = -1;

// Initialize gallery on page load
document.addEventListener("DOMContentLoaded", () => {
  loadGalleryPhotos();
  setupPagination();
  setupPreviewModal();
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
      const tag = filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      return {
        src: item.path,
        tag: tag,
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
      <img
        src="${photo.src}"
        alt="${photo.tag}"
        class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        onerror="this.parentElement.style.opacity='0.5'; this.parentElement.title='Unable to load image'"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
        <span class="text-white font-medium">${photo.tag}</span>
      </div>
    `;

    photoEl.addEventListener("click", () => openPreview(photo));
    container.appendChild(photoEl);
  });
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
      if (currentPage > 1) {
        renderGalleryPage(currentPage - 1);
        updatePaginationButtons();
      }
    });
  }

  // Next button
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        renderGalleryPage(currentPage + 1);
        updatePaginationButtons();
      }
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
      btn.disabled = currentPage === 1;
      btn.style.opacity = currentPage === 1 ? "0.5" : "1";
      return;
    }

    // Last button (next)
    if (index === buttons.length - 1) {
      btn.disabled = currentPage >= totalPages;
      btn.style.opacity = currentPage >= totalPages ? "0.5" : "1";
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
function openPreview(photo) {
  const modal = document.getElementById("photo-preview-modal");
  if (!modal) return;

  // Find the index of this photo in allPhotos
  currentPreviewIndex = allPhotos.findIndex((p) => p.src === photo.src);

  const img = modal.querySelector("#preview-image");
  const tag = modal.querySelector("#preview-tag");

  img.src = photo.src;
  img.alt = photo.tag;
  tag.textContent = photo.tag;

  // Update navigation button visibility
  updatePreviewNavigation();

  modal.classList.remove("hidden");
}

// Go to next photo in preview
function goToNextPhoto() {
  if (currentPreviewIndex >= 0 && currentPreviewIndex < allPhotos.length - 1) {
    openPreview(allPhotos[currentPreviewIndex + 1]);
  }
}

// Go to previous photo in preview
function goToPreviousPhoto() {
  if (currentPreviewIndex > 0) {
    openPreview(allPhotos[currentPreviewIndex - 1]);
  }
}

// Update preview navigation button visibility
function updatePreviewNavigation() {
  const prevBtn = document.getElementById("preview-prev");
  const nextBtn = document.getElementById("preview-next");

  if (prevBtn) {
    prevBtn.style.display = currentPreviewIndex > 0 ? "flex" : "none";
  }

  if (nextBtn) {
    nextBtn.style.display = currentPreviewIndex < allPhotos.length - 1 ? "flex" : "none";
  }
}

// Close preview modal
function closePreview() {
  const modal = document.getElementById("photo-preview-modal");
  if (modal) {
    modal.classList.add("hidden");
    currentPreviewIndex = -1;
  }
}

// Mobile menu toggle
document.addEventListener("DOMContentLoaded", () => {
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });

    // Close menu when clicking on a link
    const menuLinks = mobileMenu.querySelectorAll("a");
    menuLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.add("hidden");
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !mobileMenu.contains(e.target) &&
        !mobileMenuToggle.contains(e.target) &&
        !mobileMenu.classList.contains("hidden")
      ) {
        mobileMenu.classList.add("hidden");
      }
    });
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
