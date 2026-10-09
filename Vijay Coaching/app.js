const STORAGE_KEY = "vijay-coaching-assignments";

function getAssignments() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
}

function saveAssignments(assignments) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function updateDashboardStats() {
  const totalAssignments = getAssignments().length;
  const uniqueClasses = new Set(getAssignments().map((item) => item.className.trim())).size;
  const uploadCount = getAssignments().filter((item) => item.fileData).length;
  const dueSoonCount = getAssignments().filter((item) => {
    if (!item.dueDate) return false;
    const today = new Date();
    const due = new Date(item.dueDate);
    const diff = due - today;
    return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 7;
  }).length;

  const totalAssignmentsEl = document.getElementById("totalAssignments");
  if (totalAssignmentsEl) totalAssignmentsEl.textContent = totalAssignments;

  const classCountEl = document.getElementById("classCount");
  if (classCountEl) classCountEl.textContent = uniqueClasses;

  const uploadCountEl = document.getElementById("uploadCount");
  if (uploadCountEl) uploadCountEl.textContent = uploadCount;

  const dueSoonCountEl = document.getElementById("dueSoonCount");
  if (dueSoonCountEl) dueSoonCountEl.textContent = dueSoonCount;

  const assignmentCountEl = document.getElementById("assignmentCount");
  if (assignmentCountEl) {
    assignmentCountEl.textContent = `${totalAssignments} assignment${totalAssignments === 1 ? "" : "s"}`;
  }
}

function renderAssignments() {
  const assignmentList = document.getElementById("assignmentList");
  if (!assignmentList) return;

  const assignments = getAssignments();

  if (!assignments.length) {
    assignmentList.innerHTML = '<div class="empty-state">No assignments uploaded yet. Add your first task from the upload page.</div>';
    updateDashboardStats();
    return;
  }

  assignmentList.innerHTML = assignments
    .map((assignment, index) => {
      const fileMarkup = assignment.fileData
        ? `<a class="card-btn" href="${assignment.fileData}" download="${assignment.fileName}">Download</a>`
        : '<button class="card-btn" type="button" disabled>No file</button>';

      return `
        <article class="task-card">
          <div class="card-top">
            <span class="tag">${assignment.subject}</span>
            <span class="class-badge">${assignment.className}</span>
          </div>
          <h3>${assignment.title}</h3>
          <p>${assignment.instructions || "No extra instructions were added for this assignment."}</p>
          <ul class="meta-list">
            <li><strong>Due:</strong> ${formatDate(assignment.dueDate)}</li>
            <li><strong>File:</strong> ${assignment.fileName}</li>
          </ul>
          <div class="card-actions">
            ${fileMarkup}
            <button class="delete-btn" type="button" data-index="${index}">Remove</button>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      const assignments = getAssignments();
      assignments.splice(index, 1);
      saveAssignments(assignments);
      renderAssignments();
    });
  });

  updateDashboardStats();
}

function handleAssignmentForm() {
  const form = document.getElementById("assignmentForm");
  if (!form) return;

  const fileInput = document.getElementById("assignmentFile");
  const fileNameEl = document.getElementById("selectedFileName");

  if (fileInput && fileNameEl) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      fileNameEl.textContent = file ? file.name : "No file chosen";
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const subject = document.getElementById("subject").value;
    const className = document.getElementById("className").value.trim();
    const dueDate = document.getElementById("dueDate").value;
    const instructions = document.getElementById("instructions").value.trim();
    const file = fileInput ? fileInput.files[0] : null;

    if (!title || !subject || !className || !dueDate) {
      alert("Please complete all required assignment details.");
      return;
    }

    const assignments = getAssignments();
    const newAssignment = {
      id: Date.now(),
      title,
      subject,
      className,
      dueDate,
      instructions,
      fileName: file ? file.name : "No file uploaded",
      fileData: "",
      uploadedAt: new Date().toISOString(),
    };

    if (file) {
      newAssignment.fileData = await readFileAsDataURL(file);
    }

    assignments.unshift(newAssignment);
    saveAssignments(assignments);

    form.reset();
    if (fileInput) fileInput.value = "";
    if (fileNameEl) fileNameEl.textContent = "No file chosen";

    window.location.href = "./assignments.html";
  });
}

function handleClearAll() {
  const clearButton = document.getElementById("clearAssignments");
  if (!clearButton) return;

  clearButton.addEventListener("click", () => {
    const shouldClear = window.confirm("This will remove all saved assignments from this browser. Continue?");
    if (!shouldClear) return;

    saveAssignments([]);
    renderAssignments();
  });
}

function renderStudents() {
  const table = document.getElementById("studentTable");
  if (!table) return;

  const students = [
    { name: "Aarav Sharma", className: "Class 8-A", submitted: 3, total: 4, status: "On track" },
    { name: "Meera Nair", className: "Class 8-A", submitted: 2, total: 4, status: "Needs attention" },
    { name: "Rohan Verma", className: "Class 9-B", submitted: 4, total: 4, status: "On track" },
    { name: "Ishita Joshi", className: "Class 9-B", submitted: 1, total: 4, status: "Late" },
    { name: "Kabir Singh", className: "Class 10-C", submitted: 3, total: 4, status: "On track" },
    { name: "Nisha Patel", className: "Class 10-C", submitted: 2, total: 4, status: "Needs attention" },
  ];

  const rows = students
    .map((student) => {
      const ratio = `${student.submitted}/${student.total}`;
      const badgeClass = student.status === "On track" ? "success" : student.status === "Late" ? "warning" : "danger";
      return `
        <tr>
          <td>${student.name}</td>
          <td>${student.className}</td>
          <td>${ratio}</td>
          <td><span class="badge ${badgeClass}">${student.status}</span></td>
        </tr>
      `;
    })
    .join("");

  table.innerHTML = `
    <thead>
      <tr>
        <th>Student</th>
        <th>Class</th>
        <th>Assignments</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  handleAssignmentForm();
  handleClearAll();
  renderAssignments();
  renderStudents();
  updateDashboardStats();
});
