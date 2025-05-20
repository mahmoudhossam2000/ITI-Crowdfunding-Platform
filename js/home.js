function getImageUrl(imagePath) {
  if (!imagePath) return "../assets/images/90112949_1743953827906232_r.webp";

  if (imagePath.startsWith("data:image")) {
    return imagePath;
  }

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  if (
    imagePath.includes("imgur.com") ||
    imagePath.includes("postimages.org") ||
    imagePath.includes("i.ibb.co")
  ) {
    return imagePath.startsWith("//")
      ? `https:${imagePath}`
      : `https://${imagePath}`;
  }

  const cleanPath = imagePath.startsWith("/")
    ? imagePath.substring(1)
    : imagePath;

  return `../${cleanPath}`;
}

let allCampaigns = [];
let filteredCampaigns = [];
let currentSearchQuery = null;

function renderCampaignCard(campaign) {
  const progress = (campaign.currentAmount / campaign.goal) * 100;
  const daysLeft = Math.ceil(
    (new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24)
  );
  const imageUrl = getImageUrl(campaign.image);

  return `
    <div class="col-md-4 mb-4">
      <div class="card h-100">
        <img src="${imageUrl}" 
             class="card-img-top" 
             alt="${campaign.title}"
             style="height: 200px; object-fit: cover;"
             onerror="this.src='../assets/images/90112949_1743953827906232_r.webp'">
        <div class="card-body">
          <h5 class="card-title">${campaign.title}</h5>
          <p class="card-text text-muted">${
            campaign.description
              ? campaign.description.substring(0, 100) + "..."
              : ""
          }</p>
          <div class="progress mb-3">
            <div class="progress-bar" role="progressbar" style="width: ${progress}%" 
                 aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">$${campaign.currentAmount.toLocaleString()} raised</small>
            <small class="text-muted">${
              daysLeft > 0 ? daysLeft + " days left" : "Campaign ended"
            }</small>
          </div>
        </div>
        <div class="card-footer bg-white border-0">
          <a href="campaign.html?id=${
            campaign.id
          }" class="btn btn-outline-primary w-100">Learn More</a>
        </div>
      </div>
    </div>
  `;
}

function handlePaginationClick(event, page, searchQuery = null) {
  event.preventDefault();

  const url = new URL(window.location);
  url.searchParams.set("page", page);
  if (searchQuery) {
    url.searchParams.set("search", searchQuery);
  } else {
    url.searchParams.delete("search");
  }
  window.history.pushState({}, "", url);

  displayCampaignsForPage(page);

  document.getElementById("discover").scrollIntoView({ behavior: "smooth" });

  return false;
}

function displayCampaignsForPage(page) {
  const campaignsPerPage = 6;
  const campaigns = currentSearchQuery ? filteredCampaigns : allCampaigns;
  const totalCampaigns = campaigns.length;
  const totalPages = Math.ceil(totalCampaigns / campaignsPerPage);

  const startIndex = (page - 1) * campaignsPerPage;
  const endIndex = Math.min(startIndex + campaignsPerPage, totalCampaigns);
  const campaignsForPage = campaigns.slice(startIndex, endIndex);

  const campaignsContainer = document.getElementById("featured-campaigns");

  if (campaignsForPage.length > 0) {
    campaignsContainer.innerHTML = campaignsForPage
      .map(renderCampaignCard)
      .join("");
  } else {
    campaignsContainer.innerHTML = `
      <div class="col-12 text-center">
        <p class="text-muted">No campaigns found.</p>
      </div>
    `;
  }

  updatePagination(page, totalPages);

  updateCampaignCountInfo(campaignsForPage.length, totalCampaigns);
}

function updatePagination(currentPage, totalPages) {
  const existingPagination = document.querySelector(".pagination")?.parentNode;
  if (existingPagination) {
    existingPagination.remove();
  }

  if (totalPages <= 1) return;

  const campaignsContainer = document.getElementById("featured-campaigns");

  let paginationHTML = `
    <nav aria-label="Campaign pagination" class="mt-5">
      <ul class="pagination justify-content-center" id="campaigns-pagination">
  `;

  paginationHTML += `
    <li class="page-item ${currentPage <= 1 ? "disabled" : ""}">
      <a class="page-link" href="#" data-page="${
        currentPage - 1
      }" aria-label="Previous" ${
    currentPage <= 1 ? 'tabindex="-1" aria-disabled="true"' : ""
  }>
        <span aria-hidden="true">&laquo;</span>
      </a>
    </li>
  `;

  const maxVisibleLinks = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisibleLinks / 2));
  let endPage = Math.min(totalPages, startPage + maxVisibleLinks - 1);

  if (endPage - startPage + 1 < maxVisibleLinks) {
    startPage = Math.max(1, endPage - maxVisibleLinks + 1);
  }

  if (startPage > 1) {
    paginationHTML += `
      <li class="page-item">
        <a class="page-link" href="#" data-page="1">1</a>
      </li>
    `;
    if (startPage > 2) {
      paginationHTML += `
        <li class="page-item disabled">
          <span class="page-link">...</span>
        </li>
      `;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      paginationHTML += `
        <li class="page-item active" aria-current="page">
          <span class="page-link">${i}</span>
        </li>
      `;
    } else {
      paginationHTML += `
        <li class="page-item">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
    }
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `
        <li class="page-item disabled">
          <span class="page-link">...</span>
        </li>
      `;
    }
    paginationHTML += `
      <li class="page-item">
        <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
      </li>
    `;
  }

  paginationHTML += `
    <li class="page-item ${currentPage >= totalPages ? "disabled" : ""}">
      <a class="page-link" href="#" data-page="${
        currentPage + 1
      }" aria-label="Next" ${
    currentPage >= totalPages ? 'tabindex="-1" aria-disabled="true"' : ""
  }>
        <span aria-hidden="true">&raquo;</span>
      </a>
    </li>
  `;

  paginationHTML += `
      </ul>
    </nav>
  `;

  campaignsContainer.insertAdjacentHTML("afterend", paginationHTML);

  document
    .querySelectorAll("#campaigns-pagination .page-link:not(.disabled)")
    .forEach((link) => {
      if (!link.closest(".disabled") && link.hasAttribute("data-page")) {
        link.addEventListener("click", (e) => {
          handlePaginationClick(
            e,
            parseInt(link.getAttribute("data-page")),
            currentSearchQuery
          );
        });
      }
    });
}

function updateCampaignCountInfo(currentCount, totalCount) {
  const existingCountInfo = document.querySelector(
    ".text-center.text-muted.mb-4"
  );
  if (existingCountInfo) {
    existingCountInfo.remove();
  }

  const campaignsContainer = document.getElementById("featured-campaigns");

  const countInfo = document.createElement("div");
  countInfo.className = "text-center text-muted mb-4";
  countInfo.innerHTML = currentSearchQuery
    ? `Showing ${currentCount} of ${totalCount} results for "${currentSearchQuery}"`
    : `Showing ${currentCount} of ${totalCount} campaigns`;

  campaignsContainer.parentNode.insertBefore(countInfo, campaignsContainer);
}

async function loadFeaturedCampaigns() {
  try {
    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "text-center my-5";
    loadingIndicator.innerHTML = `
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Loading campaigns...</p>
    `;

    const campaignsContainer = document.getElementById("featured-campaigns");
    campaignsContainer.innerHTML = "";
    campaignsContainer.appendChild(loadingIndicator);

    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get("search");
    const pageParam = urlParams.get("page");
    const currentPage = pageParam ? parseInt(pageParam) : 1;

    currentSearchQuery = searchQuery;

    const campaignsPerPage = 6;

    const sectionTitle = document.querySelector("#discover h2");

    if (searchQuery) {
      sectionTitle.textContent = `Search Results for "${searchQuery}"`;

      const response = await fetch(
        `${config.API_URL}${config.ROUTES.CAMPAIGNS}?isApproved=true&status=active`
      );
      allCampaigns = await response.json();

      filteredCampaigns = allCampaigns.filter(
        (campaign) =>
          campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredCampaigns.length === 0) {
        campaignsContainer.innerHTML = `
          <div class="col-12 text-center">
            <p class="text-muted">No campaigns found matching "${searchQuery}". Try a different search term.</p>
            <a href="index.html" class="btn btn-outline-primary mt-3">View All Campaigns</a>
          </div>
        `;
        return;
      }

      displayCampaignsForPage(currentPage);

      const paginationEl = document.querySelector(".pagination")?.parentNode;
      const backButtonHTML = `
        <div class="text-center mt-4">
          <a href="index.html" class="btn btn-outline-secondary">Back to Featured Campaigns</a>
        </div>
      `;

      if (paginationEl) {
        paginationEl.insertAdjacentHTML("afterend", backButtonHTML);
      } else {
        campaignsContainer.insertAdjacentHTML("afterend", backButtonHTML);
      }
    } else {
      sectionTitle.textContent = "Featured Campaigns";

      const response = await fetch(
        `${config.API_URL}${config.ROUTES.CAMPAIGNS}?isApproved=true&status=active&_sort=createdAt&_order=desc`
      );
      allCampaigns = await response.json();
      filteredCampaigns = [];

      if (allCampaigns.length === 0) {
        campaignsContainer.innerHTML = `
          <div class="col-12 text-center">
            <p class="text-muted">No campaigns available yet. Be the first to start one!</p>
          </div>
        `;
        return;
      }

      displayCampaignsForPage(currentPage);
    }
  } catch (error) {
    console.error("Error loading campaigns:", error);
    document.getElementById("featured-campaigns").innerHTML = `
      <div class="col-12 text-center">
        <p class="text-danger">Error loading campaigns. Please try again later.</p>
      </div>
    `;
  }
}

function updateNavigation() {
  const user = JSON.parse(localStorage.getItem("user"));
  const navbarNav = document.getElementById("navbarNav");
}
function logout() {
  localStorage.removeItem("user");
  window.location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  loadFeaturedCampaigns();
  updateNavigation();
});
