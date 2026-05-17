const BACKEND_BASE_URL = "https://complaints-registration-platform-full-tdqx.onrender.com";
const API_BASE = `${BACKEND_BASE_URL}/api`;

// State
let currentUser = null;
let currentComplaint = {
    text: "",
    ai_question: "",
    user_answer: ""
};

// DOM Elements
const sections = {
    register: document.getElementById("register-section"),
    login: document.getElementById("login-section"),
    myComplaints: document.getElementById("my-complaints-section"),
    submitComplaint: document.getElementById("submit-complaint-section"),
    admin: document.getElementById("admin-section")
};

const header = document.getElementById("main-header");
const navButtons = {
    my: document.getElementById("nav-my-complaints"),
    new: document.getElementById("nav-new-complaint"),
    admin: document.getElementById("nav-admin")
};

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    checkSession();
    setupEventListeners();
});

async function checkSession() {
    const token = localStorage.getItem("token");
    if (!token) {
        showSection("login");
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            currentUser = await res.json();
            showDashboard();
        } else {
            showSection("login");
        }
    } catch (err) {
        showSection("login");
    }
}

function showSection(name) {
    Object.values(sections).forEach(s => s.classList.add("hidden"));
    sections[name].classList.remove("hidden");

    if (name === "login" || name === "register") {
        header.classList.add("hidden");
    } else {
        header.classList.remove("hidden");
        // Update nav visibility based on role
        if (currentUser?.role === "admin") {
            navButtons.admin.classList.remove("hidden");
        } else {
            navButtons.admin.classList.add("hidden");
        }
    }
}

function showDashboard() {
    if (currentUser.role === "admin") {
        showSection("admin");
        loadAdminComplaints();
    } else {
        showSection("myComplaints");
        loadMyComplaints();
    }
}

function setupEventListeners() {
    // Navigation
    document.getElementById("go-to-login").onclick = () => showSection("login");
    document.getElementById("go-to-register").onclick = () => showSection("register");
    navButtons.my.onclick = () => { showSection("myComplaints"); loadMyComplaints(); };
    navButtons.new.onclick = () => {
        showSection("submitComplaint");
        resetComplaintForm();
    };
    navButtons.admin.onclick = () => { showSection("admin"); loadAdminComplaints(); };
    document.getElementById("create-new-complaint-btn").onclick = () => {
        showSection("submitComplaint");
        resetComplaintForm();
    };

    document.getElementById("logout-btn").onclick = logout;

    // Register Flow
    document.getElementById("send-otp-btn").onclick = sendOTP;
    document.getElementById("verify-otp-btn").onclick = verifyOTP;
    document.getElementById("complete-reg-btn").onclick = completeRegistration;

    // Login
    document.getElementById("login-btn").onclick = login;

    // Complaint Flow
    document.getElementById("get-ai-question-btn").onclick = getAIQuestion;
    document.getElementById("final-submit-btn").onclick = submitComplaint;
}

// --- Auth Actions ---

async function sendOTP() {
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const error = document.getElementById("reg-error");

    error.innerText = "";
    if (!name || !email) return error.innerText = "Please fill all fields.";

    try {
        const res = await fetch(`${API_BASE}/auth/send-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        document.getElementById("otp-sent-email").innerText = email;
        document.getElementById("register-step-1").classList.add("hidden");
        document.getElementById("register-step-2").classList.remove("hidden");
        showToast("OTP sent successfully!");
    } catch (err) {
        error.innerText = err.message;
    }
}

async function verifyOTP() {
    const otp = document.getElementById("reg-otp").value;
    const error = document.getElementById("reg-error");
    if (!otp) return error.innerText = "Please enter OTP.";

    // In this simplified flow, we just move to step 3 and verify at the end
    // Or we could verify here. Let's just move to step 3 as per standard "setup password" flow.
    document.getElementById("register-step-2").classList.add("hidden");
    document.getElementById("register-step-3").classList.remove("hidden");
}

async function completeRegistration() {
    const email = document.getElementById("reg-email").value;
    const otp = document.getElementById("reg-otp").value;
    const password = document.getElementById("reg-pass").value;
    const confirm = document.getElementById("reg-confirm-pass").value;
    const error = document.getElementById("reg-error");

    if (password !== confirm) return error.innerText = "Passwords do not match.";

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        showToast("Registration successful!");
        showSection("login");
    } catch (err) {
        error.innerText = err.message;
    }
}

async function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-pass").value;
    const error = document.getElementById("login-error");

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        localStorage.setItem("token", data.token);
        currentUser = data;
        showToast(`Welcome, ${data.name}!`);
        showDashboard();
    } catch (err) {
        error.innerText = err.message;
    }
}

async function logout() {
    const token = localStorage.getItem("token");
    await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    });
    localStorage.removeItem("token");
    currentUser = null;
    showSection("login");
}

// --- Complaint Actions ---

function resetComplaintForm() {
    document.getElementById("complaint-text").value = "";
    document.getElementById("user-answer").value = "";
    document.getElementById("complaint-step-1").classList.remove("hidden");
    document.getElementById("complaint-step-2").classList.add("hidden");
    document.getElementById("submit-error").innerText = "";
}

async function getAIQuestion() {
    const text = document.getElementById("complaint-text").value;
    const error = document.getElementById("submit-error");
    if (!text) return error.innerText = "Please describe your complaint.";

    try {
        document.getElementById("get-ai-question-btn").innerText = "Analyzing...";
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/ai/question`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ complaint_text: text })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        currentComplaint.text = text;
        currentComplaint.ai_question = data.ai_question;

        document.getElementById("ai-question-text").innerText = data.ai_question;
        document.getElementById("complaint-step-1").classList.add("hidden");
        document.getElementById("complaint-step-2").classList.remove("hidden");
    } catch (err) {
        error.innerText = err.message;
    } finally {
        document.getElementById("get-ai-question-btn").innerText = "Analyze with AI";
    }
}

async function submitComplaint() {
    const answer = document.getElementById("user-answer").value;
    const error = document.getElementById("submit-error");
    if (!answer) return error.innerText = "Please answer the AI question.";

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/complaints`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                complaint_text: currentComplaint.text,
                ai_question: currentComplaint.ai_question,
                user_answer: answer
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        showToast("Complaint submitted successfully!");
        showSection("myComplaints");
        loadMyComplaints();
    } catch (err) {
        error.innerText = err.message;
    }
}

// --- Loading Data ---

async function loadMyComplaints() {
    const list = document.getElementById("my-complaints-list");
    list.innerHTML = "<p>Loading...</p>";

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/complaints/my`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        list.innerHTML = data.map(c => `
            <div class="complaint-card">
                <h3>Complaint #${c.id} <span class="date">${new Date(c.created_at).toLocaleDateString()}</span></h3>
                <div class="text-block">
                    <label>Description</label>
                    <p>${c.complaint_text}</p>
                </div>
                <div class="ai-q-block">
                    <label>AI Question</label>
                    <p>${c.ai_question}</p>
                </div>
                <div class="text-block">
                    <label>Your Answer</label>
                    <p>${c.user_answer}</p>
                </div>
            </div>
        `).join("");

        if (data.length === 0) list.innerHTML = "<p>No complaints yet.</p>";
    } catch (err) {
        list.innerHTML = "<p class='error-msg'>Failed to load complaints.</p>";
    }
}

async function loadAdminComplaints() {
    const list = document.getElementById("admin-complaints-list");
    list.innerHTML = "<p>Loading dashboard...</p>";

    try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/admin/complaints`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        list.innerHTML = data.map(c => `
            <div class="complaint-card">
                <div class="admin-info">
                    <span class="user-name">${c.user_name}</span>
                    <span class="user-email">${c.user_email}</span>
                </div>
                <h3>Complaint #${c.id} <span class="date">${new Date(c.created_at).toLocaleDateString()}</span></h3>
                <div class="text-block">
                    <label>Original Complaint</label>
                    <p>${c.complaint_text}</p>
                </div>
                <div class="ai-q-block">
                    <label>AI Follow-up</label>
                    <p>${c.ai_question}</p>
                </div>
                <div class="text-block">
                    <label>User Answer</label>
                    <p>${c.user_answer}</p>
                </div>
            </div>
        `).join("");

        if (data.length === 0) list.innerHTML = "<p>No complaints in the system.</p>";
    } catch (err) {
        list.innerHTML = "<p class='error-msg'>Failed to load admin dashboard.</p>";
    }
}

// Utils
function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}
