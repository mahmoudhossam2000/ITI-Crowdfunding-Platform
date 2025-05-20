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
                    ${isLoggedIn
            ? user.role === "campaigner"
                ? `
                            <li class="nav-item">
                                <a class="nav-link" href="${isInAdminSection
                    ? "../campaigner/dashboard.html"
                    : "/campaigner/dashboard.html"
                }">My Campaigns</a>
                            </li>
                        `
                : user.role === "backer"
                    ? `
                            <li class="nav-item">
                                <a class="nav-link" href="${isInAdminSection
                        ? "../backer/dashboard.html"
                        : "/backer/dashboard.html"
                    }">My Pledges</a>
                            </li>
                        `
                    : ""
            : ""
        }
                </ul>
                <div class="d-flex me-5" role="search">
                    <input id="search-input" class="form-control rounded-end-0" type="search" placeholder="Search" aria-label="Search"/>
                    <button class="btn btn-outline-success rounded-start-0" id="search-btn" data-bs-toggle="modal" data-bs-target="#searchModal"><i class="fas fa-search"></i></button>
                </div>
                <form class="dash-logout-btns d-flex me-3 ">
                    <!-- <div class="input-group">
                        <input class="form-control" type="search" placeholder="Search campaigns..." aria-label="Search">
                        <button class="btn btn-outline-primary" type="submit">
                            <i class="fas fa-search"></i>
                        </button>
                    </div> -->
                </form>
                <div class="d-flex gap-2">
                    ${isLoggedIn
            ? `
                        <a href="${isInAdminSection ? "../profile.html" : "/profile.html"
            }" class="btn btn-outline-secondary">
                            <i class="fas fa-user-circle me-1"></i> ${user.name || "User"
            }
                        </a>
                        ${user.role === "admin"
                ? `
                            <a href="${isInAdminSection
                    ? "./dashboard.html"
                    : "/admin/dashboard.html"
                }" class="btn btn-primary">
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
                        <a href="${isInAdminSection ? "../login.html" : "/login.html"
            }" class="btn btn-outline-primary">Sign In</a>
                        <a href="${isInAdminSection
                ? "../register.html"
                : "/register.html"
            }" class="btn btn-primary">Start Fundraising</a>
                    `
        }
                </div>
            </div>
        </div>
    </nav>

    <!-- Fullscreen Modal -->
    <div class="modal fade" id="searchModal" tabindex="-1" aria-labelledby="searchModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-fullscreen">
      <div class="modal-content">
        <div class="modal-header border-0">
          <h5 class="modal-title" id="searchModalLabel">Search Campaigns</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body px-4 pb-5">
          <!-- Search Input -->
          <!-- <div class="mb-4">
            <input type="text" id="searchInput" class="form-control form-control-lg" placeholder="Search campaigns..."
              autofocus>
          </div> -->

          <!-- Empty Query Message -->
          <div id="empty-search-message" class="alert alert-warning d-none mt-3" role="alert">
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
          <div id="noResults" class="alert alert-info d-none mt-4" role="alert">
            No campaigns found matching your search.
          </div>
        </div>
      </div>
    </div>
  </div>
    `;
}
