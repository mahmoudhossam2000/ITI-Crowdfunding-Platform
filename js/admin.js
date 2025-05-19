function checkAdminAuth() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.role !== config.ROLES.ADMIN) {
    window.location.href = "../login.html";
    return false;
  }
  return true;
}
async function loadPendingUsers() {
  try {
    const response = await fetch(
      `${config.API_URL}${config.ROUTES.USERS}?role=${config.ROLES.CAMPAIGNER}&status=${config.STATUS.PENDING}`
    );
    const users = await response.json();

    const tbody = document.getElementById("pending-users");
    tbody.innerHTML = users
      .map(
        (user) => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td><span class="badge bg-warning">${
                  config.STATUS.PENDING
                }</span></td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="approveUser('${
                      user.id
                    }')">Approve</button>
                    <button class="btn btn-danger btn-sm" onclick="rejectUser('${
                      user.id
                    }')">Reject</button>
                </td>
            </tr>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading users:", error);
    alert("Failed to load pending users");
  }
}

async function approveUser(userId) {
  try {
    const response = await fetch(
      `${config.API_URL}${config.ROUTES.USERS}/${userId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: true,
          status: config.STATUS.APPROVED,
        }),
      }
    );

    if (response.ok) {
      alert("User approved successfully!");
      loadPendingUsers();
    } else {
      throw new Error("Failed to approve user");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to approve user");
  }
}

async function rejectUser(userId) {
  try {
    const response = await fetch(
      `${config.API_URL}${config.ROUTES.USERS}/${userId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: false,
          status: config.STATUS.REJECTED,
        }),
      }
    );

    if (response.ok) {
      alert("User rejected successfully!");
      loadPendingUsers();
    } else {
      throw new Error("Failed to reject user");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to reject user");
  }
}

function logout() {
  localStorage.removeItem("user");
  window.location.href = "../login.html";
}

function initAdminDashboard() {
  if (checkAdminAuth()) {
    loadPendingUsers();
  }
}

document.addEventListener("DOMContentLoaded", initAdminDashboard);
