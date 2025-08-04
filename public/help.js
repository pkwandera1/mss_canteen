// Show button when user scrolls down
window.onscroll = function() {
  const btn = document.getElementById("backToTopBtn");
  if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
    btn.style.display = "block";
  } else {
    btn.style.display = "none";
  }
};

// Scroll back to top
document.getElementById("backToTopBtn").addEventListener("click", function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
    