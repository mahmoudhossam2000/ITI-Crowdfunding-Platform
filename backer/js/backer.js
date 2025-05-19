import { loadHeader } from '../../components/header.js';
import { loadFooter } from '../../components/footer.js';

// Load header and footer
document.getElementById('header').innerHTML = loadHeader();
document.getElementById('footer').innerHTML = loadFooter();

// Get current user info
const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('user'));
};

//Get all categories
const getAllCategories = async () => {
  const categories = await fetch('http://localhost:3000/campaigns')
    .then(res => res.json())
    .then(data => {
      const values = data.map(item => item.category);
      return values;
    });

  return categories;
};




//Get my pledges
async function loadPledges() {
  const userId = getCurrentUser().id;
  const res = await fetch(`http://localhost:3000/pledges?userId=${userId}`);
  const pledges = await res.json();
  console.log(pledges);

  const container = document.getElementById('pledgeList');
  container.innerHTML = '';

  pledges.forEach(async (pledge) => {
    const campaignRes = await fetch(`http://localhost:3000/campaigns/${pledge.campaignId}`);
    const campaign = await campaignRes.json();

    const reward = Array.isArray(campaign.rewards)
      ? campaign.rewards.find(r => r.id === pledge.rewardId)
      : null;


    const card = `
      <div class="col-md-6 pledge-card">
        <div class="card shadow-sm h-100">
          <div class="row g-0">
            <div class="col-md-4">
              <img src="../../${campaign.image || 'https://via.placeholder.com/300x150 '}" class="img-fluid rounded-start">
            </div>
            <div class="col-md-8">
              <div class="card-body d-flex flex-column">
                <h5 class="card-title">${campaign.title}</h5>
                <p class="pledge-info mb-1"><strong>Campaign ID:</strong> #${campaign.id}</p>
                <p class="pledge-info mb-1"><strong>Pledged:</strong> $${pledge.amount}</p>
                <p class="pledge-info mb-1"><strong>Reward:</strong> ${reward ? reward.title : 'None'}</p>
                <p class="pledge-info mb-1"><strong>Date:</strong> ${new Date(pledge.timestamp).toLocaleDateString()}</p>
                <div class="mt-auto">
                  <a href="campaign-details.html?id=${campaign.id}" class="btn btn-outline-primary btn-sm">View Campaign</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += card;
  });
}

// Function to load and display unique categories
async function loadCategoriesAndCampaigns() {
  const campaignList = document.getElementById('campaignList');
  const categoryFilter = document.getElementById('categoryFilter');

  try {
    // Fetch all campaigns from JSON Server
    const res = await fetch('http://localhost:3000/campaigns');
    const campaigns = await res.json();

    // Extract unique categories
    const categories = [...new Set(campaigns.map(campaign => campaign.category))].filter(Boolean);

    // Populate the select dropdown
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = capitalizeFirstLetter(category);
      categoryFilter.appendChild(option);
    });

    // Display all campaigns initially
    renderCampaigns(campaigns);

    // Add event listener for filtering
    categoryFilter.addEventListener('change', () => {
      const selectedCategory = categoryFilter.value;

      if (!selectedCategory) {
        renderCampaigns(campaigns); // Show all
      } else {
        const filtered = campaigns.filter(campaign => campaign.category === selectedCategory);
        renderCampaigns(filtered);
      }
    });

  } catch (error) {
    console.error("Error loading categories or campaigns:", error);
    campaignList.innerHTML = '<p class="text-danger">Failed to load campaigns.</p>';
  }
}

// Helper function to render campaigns
function renderCampaigns(campaigns) {
  const campaignList = document.getElementById('campaignList');
  campaignList.innerHTML = '';

  if (campaigns.length === 0) {
    campaignList.innerHTML = '<p>No campaigns found.</p>';
    return;
  }

  campaigns.forEach(campaign => {
    const card = document.createElement('div');
    card.className = 'col-md-4';

    card.innerHTML = `
            <div class="card h-100 shadow-sm">
                <img src="${campaign.image || 'https://via.placeholder.com/400x200 '}" class="card-img-top" alt="${campaign.title}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${campaign.title}</h5>
                    <p class="card-text text-truncate">${campaign.description}</p>
                    <p><strong>Goal:</strong> $${campaign.goal}</p>
                    <p><strong>Deadline:</strong> ${new Date(campaign.deadline).toLocaleDateString()}</p>
                    <a href="campaign-details.html?id=${campaign.id}" class="btn btn-outline-primary mt-auto">View Campaign</a>
                </div>
            </div>
        `;

    campaignList.appendChild(card);
  });
}

// Helper: Capitalize first letter of a string
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}


document.addEventListener('DOMContentLoaded', () => {
  // loadCategoriesAndCampaigns();
  loadPledges();
});