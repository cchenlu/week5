// Mobile navigation toggle
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", function () {
    toggle.classList.toggle("open");
    links.classList.toggle("open");
  });

  // Close menu when a link is clicked (mobile)
  links.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      toggle.classList.remove("open");
      links.classList.remove("open");
    });
  });
})();

// Contact form — demo handler (no backend)
(function () {
  var form = document.querySelector(".contact-form");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var note = form.querySelector(".form-success");
    if (note) {
      note.style.display = "block";
      note.textContent = "Thanks for reaching out! I'll get back to you soon.";
    }
    form.reset();
    setTimeout(function () {
      if (note) note.style.display = "none";
    }, 5000);
  });
})();

// Highlight active nav link based on current page
(function () {
  var path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (link) {
    var href = link.getAttribute("href");
    if (href === path) link.classList.add("active");
  });
})();
