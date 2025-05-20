export function loadHeader() {
  const userString = localStorage.getItem("user");
  let user = null;
  let isLoggedIn = false;
  if (userString && userString !== "undefined" && userString !== "null") {
    try {
      user = JSON.parse(userString);
      isLoggedIn = Boolean(user && user.id && user.name && user.role);
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
  }

  const currentPath = window.location.pathname;
  const isInAdminSection = currentPath.includes("/admin/");
  const isInDashboard = currentPath.includes("dashboard.html");
  const homePath = isInAdminSection ? "../index.html" : "/index.html";

  return `
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div class="container">
            <a class="navbar-brand" href="${homePath}">
                <h3 class="m-0 text-primary">CrowdFund</h3>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <!-- Search icon for mobile (outside collapse) -->
            <div class="d-lg-none ms-auto me-2">
                <div class="search-container" role="search">
                    <div class="d-flex align-items-center">
                        <input id="search-input-mobile" class="form-control me-1 search-input" type="search" placeholder="Search campaigns..." aria-label="Search" style="width: 0; padding: 0; border: none; transition: all 0.3s ease;"/>
                        <button class="btn btn-outline-primary rounded-circle" id="search-btn-mobile"><i class="fas fa-search"></i></button>
                    </div>
                </div>
            </div>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="${homePath}">Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="${homePath}#discover">Discover</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="${homePath}#discover">About Us</a>
                    </li>
                    ${
                      isLoggedIn
                        ? user.role === "campaigner"
                          ? `
                        <li class="nav-item">
                            <a class="nav-link" href="${
                              isInAdminSection
                                ? "../campaigner/dashboard.html"
                                : "/campaigner/dashboard.html"
                            }">My Campaigns</a>
                        </li>`
                          : user.role === "backer"
                          ? `
                        <li class="nav-item">
                            <a class="nav-link" href="${
                              isInAdminSection
                                ? "../backer/dashboard.html"
                                : "/backer/dashboard.html"
                            }">My Pledges</a>
                        </li>`
                          : ""
                        : ""
                    }
                </ul>
                
                <!-- Search icon for desktop -->
                
                
                <div class="d-flex gap-2">
                    ${
                      isLoggedIn
                        ? `
                        <a href="${
                          isInAdminSection ? "../profile.html" : "/profile.html"
                        }" class="btn btn-outline-secondary">
                            <i class="fas fa-user-circle me-1"></i> ${
                              user.name || "User"
                            }
                        </a>
                        ${
                          user.role === "admin"
                            ? `
                            <a href="${
                              isInAdminSection
                                ? "./dashboard.html"
                                : "/admin/dashboard.html"
                            }" class="btn btn-outline-primary">
                                <i class="fas fa-tachometer-alt me-1"></i> Dashboard
                            </a>
                        `
                            : ""
                        }
                        <button onclick="logout()" class="btn btn-outline-danger">
                            <i class="fas fa-sign-out-alt me-1"></i> Logout
                        </button>
                    `
                        : `
                        <a href="${
                          isInAdminSection ? "../login.html" : "/login.html"
                        }" class="btn btn-outline-primary">Sign In</a>
                        <a href="${
                          isInAdminSection
                            ? "../register.html"
                            : "/register.html"
                        }" class="btn btn-outline-primary">Start Fundraising</a>
                    `
                    }
                </div>
                
                <!-- Search container -->
                <div class="search-container ms-2" role="search">
                    <div class="d-flex align-items-center">
                        <input id="search-input" class="form-control me-1 search-input" type="search" placeholder="Search campaigns..." aria-label="Search" style="width: 0; padding: 0; border: none; transition: all 0.3s ease;"/>
                        <button class="btn btn-outline-primary rounded-circle" id="search-btn"><i class="fas fa-search"></i></button>
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <!-- Search Modal -->
    <div class="modal fade" id="searchModal" tabindex="-1" aria-labelledby="searchModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="searchModalLabel">Search Campaigns</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <!-- Search Input -->
            <div class="input-group mb-4">
              <input type="text" id="modal-search-input" class="form-control form-control-lg" placeholder="Search campaigns..." autocomplete="off">
              <button id="modal-search-btn" class="btn btn-primary">
                <i class="fas fa-search"></i> Search
              </button>
            </div>

            <!-- Empty Query Message -->
            <div id="empty-search-message" class="alert alert-warning d-none" role="alert">
              Please enter a search term.
            </div>

            <!-- Loader -->
            <div id="search-loader" class="d-none text-center my-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Searching campaigns...</p>
            </div>
            
            <!-- Results Grid -->
            <div id="results" class="row g-4">
              <!-- Campaign cards will appear here -->
            </div>

            <!-- No Results Message -->
            <div id="noResults" class="alert alert-info d-none" role="alert">
              No campaigns found matching your search.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
    `;
}
