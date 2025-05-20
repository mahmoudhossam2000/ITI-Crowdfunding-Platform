import { loadHeader } from "../components/header.js";
import { loadFooter } from "../components/footer.js";

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

document.getElementById("header").innerHTML = loadHeader();
document.getElementById("footer").innerHTML = loadFooter();

const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get("id");

const campaignDetailsContainer = document.getElementById("campaign-details");

function getImageUrl(imagePath) {
  if (!imagePath) return "../assets/images/default-campaign.jpg";

  if (imagePath.startsWith("http") || imagePath.startsWith("data:")) {
    return imagePath;
  }

  return `${window.config.API_URL}/${imagePath.replace(/^\/+/, "")}`;
}

function formatCurrency(amount) {
  return `$${amount.toLocaleString()}`;
}

function getDaysLeft(deadline) {
  const deadlineDate = new Date(deadline);
  const today = new Date();
  const timeDiff = deadlineDate - today;
  const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return "Ended";
  if (daysLeft === 0) return "Last day";
  return `${daysLeft} days left`;
}

function formatDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function getUserActionButtons(campaign, userRole) {
  if (!userRole) {
    return `
            <div class="alert alert-info mb-3">
                <p class="mb-2">Sign in to back this project</p>
                <a href="login.html" class="btn btn-primary w-100">Sign In</a>
            </div>
        `;
  }

  switch (userRole) {
    case "backer":
      return `
                <a href="#" onclick='openPledgeModal("${campaign.id}")' class="btn btn-primary w-100 mb-3">
                    Back this project
                </a>
            `;
    case "admin":
      return `
              
            `;
    case "campaigner":
      return `
             
            `;
    default:
      return "";
  }
}

async function loadCampaignDetails() {
  if (!campaignId) {
    showError("Campaign ID not found in the URL");
    return;
  }

  try {
    const response = await fetch(
      `${window.config.API_URL}/campaigns/${campaignId}`
    );

    if (!response.ok) {
      throw new Error(`Campaign not found (Status ${response.status})`);
    }

    const campaign = await response.json();

    if (!campaign.isApproved) {
      showError(
        "This campaign is not currently available. It may be pending approval."
      );
      return;
    }

    displayCampaignDetails(campaign);
  } catch (error) {
    console.error("Error loading campaign details:", error);
    showError("Failed to load campaign details. Please try again later.");
  }
}

function displayCampaignDetails(campaign) {
  const progress = (campaign.currentAmount / campaign.goal) * 100;
  const backerCount = campaign.backers ? campaign.backers.length : 0;
  const categoryDisplay = campaign.category
    ? `<span class="badge bg-secondary">${campaign.category.charAt(0).toUpperCase() + campaign.category.slice(1)
    }</span>`
    : "";

  const currentUser = getCurrentUser();
  const userRole = currentUser ? currentUser.role : null;

  campaignDetailsContainer.innerHTML = `
        <div class="row">
            <div class="col-lg-8">
                <img src="${getImageUrl(campaign.image)}" 
                     class="img-fluid rounded mb-4" 
                     alt="${campaign.title}"
                     style="width: 100%; max-height: 400px; object-fit: cover;"
                     onerror="this.src='assets/images/default-campaign.jpg'">
                
                <h1 class="mb-3">${campaign.title}</h1>
                
                <div class="d-flex mb-4 gap-2 align-items-center">
                    ${categoryDisplay}
                    <span class="text-muted">Created on ${formatDate(
    campaign.createdAt
  )}</span>
                </div>
                
                <div class="mb-4">
                    <h4>About this campaign</h4>
                    <p>${campaign.description}</p>
                </div>
                
                <!-- Campaign Updates Section -->
                <div class="mb-4">
                    <h4>Updates</h4>
                    <div id="updates-container">
                        ${campaign.updates && campaign.updates.length > 0
      ? campaign.updates
        .map(
          (update) => `
                                <div class="card mb-3">
                                    <div class="card-body">
                                        <h5 class="card-title">${update.title
            }</h5>
                                        <p class="card-text text-muted small mb-2">${formatDate(
              update.date
            )}</p>
                                        <p class="card-text">${update.content
            }</p>
                                    </div>
                                </div>
                            `
        )
        .join("")
      : '<p class="text-muted">No updates yet</p>'
    }
                    </div>
                </div>
            </div>
            
            <div class="col-lg-4">
                <div class="card mb-4">
                    <div class="card-body">
                        <h4 class="mb-3">${formatCurrency(
      campaign.currentAmount
    )} raised</h4>
                        <p class="text-muted">of ${formatCurrency(
      campaign.goal
    )} goal</p>
                        
                        <div class="progress mb-3">
                            <div class="progress-bar" role="progressbar" 
                                 style="width: ${progress}%" 
                                 aria-valuenow="${progress}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100"></div>
                        </div>
                        
                        <div class="d-flex justify-content-between mb-4">
                            <div>
                                <p class="fw-bold mb-0">${backerCount}</p>
                                <p class="text-muted">Backers</p>
                            </div>
                            <div>
                                <p class="fw-bold mb-0">${getDaysLeft(
      campaign.deadline
    )}</p>
                                <p class="text-muted">Deadline: ${formatDate(
      campaign.deadline
    )}</p>
                            </div>
                        </div>
                        
                        ${getUserActionButtons(campaign, userRole)}
                    </div>
                </div>
                
                <!-- Rewards Section -->
                <h4 class="mb-3">Rewards</h4>
                <div id="rewards-container">
                    ${campaign.rewards && campaign.rewards.length > 0
      ? campaign.rewards
        .map(
          (reward) => `
                            <div class="card mb-3">
                                <div class="card-body">
                                    <h5 class="card-title">${reward.title}</h5>
                                    <p class="card-text fw-bold mb-2">${formatCurrency(
            reward.amount
          )}</p>
                                    <p class="card-text">${reward.description
            }</p>
                                    ${userRole === "backer"
              ? `<a href="backer/pledge.html?id=${campaign.id}&reward=${reward.amount}" 
                                            class="btn btn-outline-primary w-100">
                                            Select this reward
                                        </a>`
              : ""
            }
                                </div>
                            </div>
                        `
        )
        .join("")
      : '<p class="text-muted">No rewards available for this campaign</p>'
    }
                </div>
            </div>
        </div>
    `;
}

function showError(message) {
  campaignDetailsContainer.innerHTML = `
        <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i> ${message}
        </div>
        <div class="text-center mt-4">
            <a href="index.html" class="btn btn-primary">
                <i class="fas fa-arrow-left me-2"></i> Back to Home
            </a>
        </div>
    `;
}

document.addEventListener("DOMContentLoaded", loadCampaignDetails);
