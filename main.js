// --- Navegación y dispatch ---
import { renderDashboard } from './modules/dashboard.js';
import { renderProductos, setupProductoModalHooks } from './modules/productos.js';
import { renderVentas, setupVentasModalHooks } from './modules/ventas.js';
import { renderClientes, setupClientesModalHooks } from './modules/clientes.js';
import { renderEmpleados, setupEmpleadosModalHooks } from './modules/empleados.js';
import { renderReportes, setupReportesHooks } from './modules/reportes.js';
import { showModal, closeModal } from './modules/modales.js';
import { STORAGE_KEYS, getData, setData } from './modules/data.js';

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  // Navegación por secciones
  const navButtons = document.querySelectorAll("header nav button[data-section]");
  const sections = document.querySelectorAll("main > section");

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      sections.forEach(sec => sec.classList.remove("active"));
      navButtons.forEach(b => b.classList.remove("active"));
      document.getElementById(btn.dataset.section).classList.add("active");
      btn.classList.add("active");
      switch (btn.dataset.section) {
        case "dashboard":
          renderDashboard();
          break;
        case "productos":
          renderProductos();
          break;
        case "ventas":
          renderVentas();
          break;
        case "clientes":
          renderClientes();
          break;
        case "empleados":
          renderEmpleados();
          break;
        case "reportes":
          renderReportes();
          break;
        // no default
      }
    });
  });

  // ----------- Eventos para botones principales y modales ----------
  setupProductoModalHooks();
  setupVentasModalHooks();
  setupClientesModalHooks();
  setupEmpleadosModalHooks();
  setupReportesHooks();

  // --------- Render inicial --------------
  renderDashboard();
  document.getElementById("dashboard").classList.add("active");
  if (navButtons[0]) navButtons[0].classList.add("active");
});