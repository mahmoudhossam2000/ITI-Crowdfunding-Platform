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
                            </li>
                        `
                          : user.role === "backer"
                          ? `
                            <li class="nav-item">
                                <a class="nav-link" href="${
                                  isInAdminSection
                                    ? "../backer/dashboard.html"
                                    : "/backer/dashboard.html"
                                }">My Pledges</a>
                            </li>
                        `
                          : ""
                        : ""
                    }
                </ul>
          
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
                        <a href="${
                          isInAdminSection ? "../login.html" : "/login.html"
                        }" class="btn btn-outline-primary">Sign In</a>
                        <a href="${
                          isInAdminSection
                            ? "../register.html"
                            : "/register.html"
                        }" class="btn btn-primary">Start Fundraising</a>
                    `
                    }
                </div>
            </div>
        </div>
    </nav>
    `;
}
