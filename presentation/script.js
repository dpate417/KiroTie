const slides = document.querySelectorAll(".slide");
const total = slides.length;
let cur = 0;

document.getElementById("tot").textContent = total;

function showSlide(n) {
  slides.forEach(s => s.classList.remove("active"));
  slides[n].classList.add("active");
  document.getElementById("cur").textContent = n + 1;
  document.getElementById("progressFill").style.width = ((n + 1) / total * 100) + "%";
  document.getElementById("prevBtn").disabled = n === 0;
  document.getElementById("nextBtn").disabled = n === total - 1;
}

function go(dir) {
  const next = cur + dir;
  if (next >= 0 && next < total) { cur = next; showSlide(cur); }
}

document.addEventListener("keydown", e => {
  if (["ArrowRight","ArrowDown"," "].includes(e.key)) { e.preventDefault(); go(1); }
  else if (["ArrowLeft","ArrowUp"].includes(e.key)) { e.preventDefault(); go(-1); }
  else if (e.key === "Home") { cur = 0; showSlide(0); }
  else if (e.key === "End") { cur = total - 1; showSlide(cur); }
});

let tx = 0;
document.addEventListener("touchstart", e => { tx = e.touches[0].clientX; });
document.addEventListener("touchend", e => {
  const d = tx - e.changedTouches[0].clientX;
  if (Math.abs(d) > 50) go(d > 0 ? 1 : -1);
});

showSlide(0);
