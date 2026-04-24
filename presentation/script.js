const slides = document.querySelectorAll(".slide");
const totalSlides = slides.length;
let current = 0;

document.getElementById("totalSlides").textContent = totalSlides;

function showSlide(index) {
  slides.forEach(s => s.classList.remove("active"));
  slides[index].classList.add("active");
  document.getElementById("currentSlide").textContent = index + 1;
  document.getElementById("prevBtn").disabled = index === 0;
  document.getElementById("nextBtn").disabled = index === totalSlides - 1;
}

function changeSlide(dir) {
  const next = current + dir;
  if (next >= 0 && next < totalSlides) {
    current = next;
    showSlide(current);
  }
}

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
    e.preventDefault();
    changeSlide(1);
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    changeSlide(-1);
  } else if (e.key === "Home") {
    current = 0;
    showSlide(0);
  } else if (e.key === "End") {
    current = totalSlides - 1;
    showSlide(current);
  }
});

// Touch swipe support
let touchStartX = 0;
document.addEventListener("touchstart", (e) => { touchStartX = e.touches[0].clientX; });
document.addEventListener("touchend", (e) => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) changeSlide(diff > 0 ? 1 : -1);
});

showSlide(0);
