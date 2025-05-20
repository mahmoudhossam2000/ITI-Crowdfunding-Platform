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

//Full Text Search
const fullTextSearch = () => {
    const searchText = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const resultsContainer = document.getElementById('results');
    const noResults = document.getElementById('noResults');
    const loader = document.getElementById('search-loader');
    const emptyMessage = document.getElementById('empty-search-message');

    searchBtn?.addEventListener('click', async function () {
        const query = searchText.value.trim().toLowerCase();

        resultsContainer.innerHTML = '';
        noResults.classList.add('d-none');
        emptyMessage.classList.add('d-none');
        loader.classList.remove('d-none');

        if (!query) {
            emptyMessage.classList.remove('d-none');
            loader.classList.add('d-none');
            return;
        }

        try {
            const res = await fetch(`http://localhost:3000/campaigns`);
            if (!res.ok) throw new Error("Failed to load campaigns");

            const campaigns = await res.json();

            //Manually filter the campaigns
            const filtered = campaigns.filter(campaign =>
                campaign.title.toLowerCase().includes(query) ||
                campaign.description.toLowerCase().includes(query)
            );

            loader.classList.add('d-none');

            if (filtered.length === 0) {
                noResults.classList.remove('d-none');
                return;
            }

            // Render filtered results
            filtered.forEach(campaign => {
                const progress = (campaign.currentAmount / campaign.goal) * 100;
                const daysLeft = Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                const imageUrl = getImageUrl(campaign.image);

                resultsContainer.innerHTML += `
                    <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <img src="${imageUrl}" 
                             class="card-img-top" 
                             alt="${campaign.title}"
                             style="height: 200px; object-fit: cover;"
                             onerror="this.src='../assets/images/90112949_1743953827906232_r.webp'">
                        <div class="card-body">
                            <h5 class="card-title">${campaign.title}</h5>
                            <p class="card-text text-muted">${campaign.description ? campaign.description.substring(0, 100) + '...' : ''}</p>
                            <div class="progress mb-3">
                                <div class="progress-bar" role="progressbar" style="width: ${progress}%" 
                                     aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">$${campaign.currentAmount.toLocaleString()} raised</small>
                                <small class="text-muted">${daysLeft} days left</small>
                            </div>
                        </div>
                        <div class="card-footer bg-white border-0">
                            <a href="/campaign.html?id=${campaign.id}" class="btn btn-outline-primary w-100">Learn More</a>
                        </div>
                    </div>
                </div>
                `;
            });

        } catch (error) {
            loader.classList.add('d-none');
            console.error("Search error:", error);
            alert("An error occurred while fetching results.");
        }
    });
};

const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

// Open modal and populate rewards
async function openPledgeModal(campaignId) {
    try {
        const res = await fetch(`${window.config.API_URL}/campaigns/${campaignId}`);
        if (!res.ok) throw new Error("Campaign not found");
        
        const campaign = await res.json();
        console.log(campaign);
        
        document.getElementById('campaignIdInput').value = campaign.id;
        document.getElementById('userIdInput').value = getCurrentUser().id;
        document.getElementById('amountInput').value = '';

        const rewardsContainer = document.getElementById('rewardsContainer');
        rewardsContainer.innerHTML = '';

        if (campaign.rewards && campaign.rewards.length > 0) {
            campaign.rewards.forEach(reward => {
                rewardsContainer.innerHTML += `
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="reward" id="reward-${reward.id}" value="${reward.id}" />
                        <label class="form-check-label" for="reward-${reward.id}">
                            $${reward.amount} - ${reward.title}
                        </label>
                    </div>
                `;
            });
        } else {
            rewardsContainer.innerHTML = "<em>No rewards available.</em>";
        }

        var modal = new bootstrap.Modal(document.getElementById('pledgeModal'));
        modal.show();

    } catch (error) {
        console.error("Error loading campaign:", error);
        alert("Failed to load campaign details.");
    }
}

// Handle form submission
    // document.getElementById('pledgeForm')?.addEventListener('submit', async (e) => {
    //     e.preventDefault();

    //     const campaignId = parseInt(document.getElementById('campaignIdInput').value);
    //     const userId = parseInt(document.getElementById('userIdInput').value); // You can replace this with real logged-in user
    //     const amount = parseFloat(document.getElementById('amountInput').value);
    //     const rewardId = document.querySelector('input[name="reward"]:checked')?.value || null;

    //     const pledge = {
    //         campaignId: campaignId,
    //         userId: userId,
    //         amount: amount,
    //         rewardId: rewardId ? parseInt(rewardId) : null,
    //         timestamp: new Date().toISOString()
    //     };

    //     try {
    //         const response = await fetch('http://localhost:3000/pledges', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify(pledge)
    //         });

    //         if (!response.ok) {
    //             throw new Error("Failed to submit pledge");
    //         }

    //         alert("Thank you for your pledge!");
    //         bootstrap.Modal.getInstance(document.getElementById('pledgeModal')).hide();
    //     } catch (error) {
    //         console.error("Error submitting pledge:", error);
    //         alert("There was a problem submitting your pledge.");
    //     }
    // });

async function handleFormSubmission() {
  const pledgeForm = document.getElementById("pledgeForm");
  if (pledgeForm) {
    pledgeForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const campaignId = document.getElementById("campaignIdInput").value;
      const userId = document.getElementById("userIdInput").value;
      const amount = parseFloat(document.getElementById("amountInput").value);
      const rewardId = document.querySelector('input[name="reward"]:checked')?.value || null;

      const pledge = {
        campaignId,
        userId,
        amount,
        rewardId,
        timestamp: new Date().toISOString()
      };

      try {
        // 1. Submit the pledge
        const res = await fetch(`${window.config.API_URL}/pledges`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(pledge)
        });

        if (!res.ok) throw new Error("Failed to submit pledge");

        // 2. Fetch the campaign to get currentAmount
        const campaignRes = await fetch(`${window.config.API_URL}/campaigns/${campaignId}`);
        if (!campaignRes.ok) throw new Error("Failed to fetch campaign");

        const campaign = await campaignRes.json();

        // 3. Update currentAmount
        const updatedAmount = campaign.currentAmount + amount;

        const updateRes = await fetch(`${window.config.API_URL}/campaigns/${campaignId}`, {
          method: "PATCH", // or "PUT" depending on your API
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ currentAmount: updatedAmount })
        });

        if (!updateRes.ok) throw new Error("Failed to update campaign amount");

        // 4. Done
        alert("Thank you for your pledge!");
        bootstrap.Modal.getInstance(document.getElementById("pledgeModal")).hide();
      } catch (error) {
        console.error("Error submitting pledge:", error);
        alert("There was a problem submitting your pledge.");
      }
    });
  }
}


document.addEventListener('DOMContentLoaded', () => {
    fullTextSearch();
    handleFormSubmission();
});
