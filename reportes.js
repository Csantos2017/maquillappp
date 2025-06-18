// Reportes functions moved to a separate module

export function renderReportes() {
  // Utilizado para mostrar un estado limpio del contenedor de reportes
  document.getElementById("contenedorReportes").innerHTML = "";
}

export function setupReportesHooks() {
  document.getElementById("btnReporteVentas").onclick = function(){
    let ventas = JSON.parse(localStorage.getItem('ventas_maq')||"[]");
    let html = `<h3>Reporte de Ventas</h3>
      <table><tr><th>Factura</th><th>Cliente</th><th>Fecha</th><th>Productos</th><th>Total</th></tr>`;
    ventas.forEach(v=>{
      html+=`<tr>
        <td>${v.idFactura}</td>
        <td>${v.clienteNombre}</td>
        <td>${(new Date(v.fecha)).toLocaleDateString()}</td>
        <td>${v.detalles.map(dt=>dt.nombre+" x"+dt.cantidad).join("<br>")}</td>
        <td>$${v.totalCostoVenta.toFixed(2)}</td>
      </tr>`;
    });
    html+=`</table>`;
    document.getElementById("contenedorReportes").innerHTML = html;
  };

  document.getElementById("btnReporteMargen").onclick = function(){
    let ventas = JSON.parse(localStorage.getItem('ventas_maq')||"[]");
    let productos = JSON.parse(localStorage.getItem('productos_maq')||"[]");
    let margenPorProd = {};
    ventas.forEach(v=>{
      v.detalles.forEach(dt=>{
        if(!margenPorProd[dt.nombre]) margenPorProd[dt.nombre]={venta:0, compra:0, cantidad:0};
        margenPorProd[dt.nombre].venta += dt.subtotal;
        let prod = productos.find(p=>p.id===dt.id);
        margenPorProd[dt.nombre].compra += (prod && prod.costoCompra ? prod.costoCompra : 0)*dt.cantidad;
        margenPorProd[dt.nombre].cantidad += dt.cantidad;
      });
    });
    let html = `<h3>Margen de Ganancia por Producto</h3>
      <table><tr><th>Producto</th><th>Cantidad Vendida</th><th>Total Venta</th><th>Total Costo</th><th>Margen</th></tr>`;
    for(let k in margenPorProd){
      let m = margenPorProd[k];
      html+=`<tr>
        <td>${k}</td>
        <td>${m.cantidad}</td>
        <td>$${m.venta.toFixed(2)}</td>
        <td>$${m.compra.toFixed(2)}</td>
        <td>$${(m.venta-m.compra).toFixed(2)}</td>
      </tr>`;
    }
    html+=`</table>`;
    document.getElementById("contenedorReportes").innerHTML = html;
  };
}