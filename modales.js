// MODALES - mostrar o cerrar, eventos generales

export function showModal(html) {
  const container = document.getElementById("modalContainer");
  container.innerHTML = `<div class="modal">${html}</div>`;
  container.style.display = "flex";
}
export function closeModal() {
  const container = document.getElementById("modalContainer");
  container.style.display = "none";
  container.innerHTML = "";
}

window.addEventListener("click", e => {
  if (e.target.classList.contains("modal-container")) closeModal();
});

