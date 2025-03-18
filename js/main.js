// main.js

document.addEventListener("DOMContentLoaded", () => {
  console.log("Elegant Photo Editor Initialized");

  const headers = document.querySelectorAll(".accordion-header");
  headers.forEach((header) => {
    header.addEventListener("click", () => {
      const group = header.parentElement;
      group.classList.toggle("active");
    });
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const collapsibles = document.querySelectorAll(".collapsible");
  collapsibles.forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      const content = btn.nextElementSibling;
      content.classList.toggle("active");
    });
  });
});
