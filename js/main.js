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
    // Function to initialize search once elements exist
    const initSearch = () => {
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        
        if (!searchInput || !searchBtn) {
            // Elements don't exist yet, try again in 100ms
            setTimeout(initSearch, 100);
            return;
        }
        
        console.log('Search elements found, initializing search functionality');
        
        // Toggle search input visibility when search button is clicked
        let isSearchOpen = false;
        
        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!isSearchOpen) {
                // Open search
                searchInput.style.width = '200px';
                searchInput.style.padding = '0.375rem 0.75rem';
                searchInput.style.border = '1px solid #ced4da';
                searchInput.focus();
                isSearchOpen = true;
            } else if (searchInput.value.trim() !== '') {
                // Perform search if input has value
                performSearch(searchInput.value.trim());
            } else {
                // Close search if clicking again with empty input
                searchInput.style.width = '0';
                searchInput.style.padding = '0';
                searchInput.style.border = 'none';
                isSearchOpen = false;
            }
        });
        
        // Handle clicking outside to close search
        document.addEventListener('click', function(e) {
            if (isSearchOpen && e.target !== searchInput && e.target !== searchBtn && !searchBtn.contains(e.target)) {
                searchInput.style.width = '0';
                searchInput.style.padding = '0';
                searchInput.style.border = 'none';
                isSearchOpen = false;
            }
        });
        
        // Handle Enter key press in search input
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                performSearch(this.value.trim());
            }
        });
    };
    
    // Start the initialization process
    initSearch();
    
    // Search function that handles the actual searching
    const performSearch = async (query) => {
        // Navigate to index.html with search query parameter
        window.location.href = `/index.html?search=${encodeURIComponent(query)}`;
    };
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
