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

window.onload = loadPledges;