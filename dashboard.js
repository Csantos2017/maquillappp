import { getData } from './data.js';

let ventasChart, productosChart;

export function renderDashboard() {
  // Ventas/Mes
  const ventas = getData("ventas");
  const productos = getData("productos");
  const clientes = getData("clientes");
  const fechaIni = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const ventasMes = ventas.filter(v => new Date(v.fecha) > fechaIni);
  document.getElementById("ventasTotales").textContent = ventasMes.length;
  // Productos críticos
  const productosCriticos = productos.filter(p => p.stock <= p.critico);
  document.getElementById("productosCriticos").textContent = productosCriticos.length;
  // Producto más vendido
  let counts = {};
  ventas.forEach(v => v.detalles.forEach(dt => {
    counts[dt.nombre] = (counts[dt.nombre] || 0) + dt.cantidad;
  }));
  let masVendido = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("productosVendidos").textContent = masVendido ? `${masVendido[0]} (${masVendido[1]})` : "-";
  // Ganancias totales
  let ganancias = ventasMes.reduce((sum, v) => sum + v.totalCostoVenta - v.totalCostoCompra, 0);
  document.getElementById("gananciasTotales").textContent = `$${ganancias.toFixed(2)}`;

  // Chart Ventas por día (actual mes)
  const dias = Array.from({ length: 31 }, (_, i) => i + 1);
  const ventasPorDia = dias.map(d =>
    ventasMes.filter(v => new Date(v.fecha).getDate() === d).length);
  if (ventasChart) ventasChart.destroy();
  ventasChart = new Chart(
    document.getElementById("ventasChart"), {
      type: "line",
      data: { labels: dias, datasets: [{ label: "Ventas por Día", data: ventasPorDia, borderColor: "#c2185b", backgroundColor: "#ffd1dc88" }] },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: "Día" } } } }
    }
  );
  // Chart Productos más vendidos
  const nombres = Object.keys(counts);
  const datos = Object.values(counts);
  if (productosChart) productosChart.destroy();
  productosChart = new Chart(
    document.getElementById("productosChart"), {
      type: "bar",
      data: { labels: nombres, datasets: [{ label: "Cantidad Vendida", data: datos, backgroundColor: "#7c43bd" }] },
      options: {
        responsive: true, plugins: { legend: { display: false } },
        scales: { x: { title: { display: false } }, y: { beginAtZero: true } }
      }
    }
  );
}