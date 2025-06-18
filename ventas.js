// Ventas functions extracted into a separate module
import { getData, setData, STORAGE_KEYS } from './data.js';
import { showModal, closeModal } from './modales.js';
import { renderProductos } from './productos.js';
import { renderDashboard } from './dashboard.js';

export function renderVentas() {
  const tbody = document.querySelector("#tablaVentas tbody");
  const ventas = getData("ventas");
  tbody.innerHTML = "";
  for(let v of ventas) {
    tbody.innerHTML += `<tr>
      <td>${v.idFactura}</td>
      <td>${v.clienteNombre}</td>
      <td>${(new Date(v.fecha)).toLocaleDateString()}</td>
      <td>$${v.totalCostoVenta.toFixed(2)}</td>
      <td>
        <button onclick="window.verFactura('${v.id}')">🧾 Ver</button>
        <button onclick="window.descargarFactura('${v.id}')">PDF</button>
        <button onclick="window.borrarVenta('${v.id}')" style="background:#fff0f0;color:#b90015;">🗑️ Borrar</button>
      </td>
    </tr>`;
  }
}

export function setupVentasModalHooks() {
  document.getElementById("btnNuevaVenta").onclick = window.nuevaVentaModal = nuevaVentaModal;
}

// Borra una venta y actualiza stock de productos
window.borrarVenta = function(id){
  if(!confirm("¿Seguro que desea borrar esta venta? Esta acción es irreversible.")) return;
  let ventas = getData("ventas");
  let venta = ventas.find(v => v.id === id);
  if (!venta) return;
  // Devolver stock de productos
  let productos = getData("productos");
  for (let dt of venta.detalles) {
    let ix = productos.findIndex(p=>p.id===dt.id);
    if (ix >= 0) {
      productos[ix].stock += dt.cantidad;
    }
  }
  setData("productos", productos);
  // Eliminar la venta
  ventas = ventas.filter(v=>v.id !== id);
  setData("ventas", ventas);
  // Borra del historial de cliente asociado
  let clientes = getData("clientes");
  let cliente = clientes.find(c=>c.id === venta.clienteId);
  if (cliente && cliente.historial) {
    cliente.historial = cliente.historial.filter(h=>!(h.fecha===venta.fecha && h.total===venta.totalCostoVenta)); // mejor usar un id en historial para evitar eliminar accidentalmente otras compras con igual total/fecha
    let cliIx = clientes.findIndex(c=>c.id === venta.clienteId);
    clientes[cliIx] = cliente;
    setData("clientes", clientes);
  }
  renderVentas();
  renderProductos();
  renderDashboard();
};

function nuevaVentaModal(){
  const productos = getData("productos");
  const clientes = getData("clientes");
  if(productos.length==0) {
    alert("Primero registre al menos un producto.");
    return;
  }
  showModal(`
    <h3>Nueva Venta</h3>
    <form id="formVenta">
      <div class="form-group">
        <label>Cliente</label>
        <select name="clienteId" required>
          <option value="">--Seleccionar--</option>
          ${clientes.map(c=>`<option value="${c.id}">${c.nombre}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Productos y Cantidad</label>
        <div id="prodVentaCampos">
          ${productos.map(prod=>`
            <label>
              <input type="number" name="p_${prod.id}" min="0" max="${prod.stock}" value="0" style="width:45px;">
              ${prod.nombre} (${prod.categoria}) - Stock: ${prod.stock}
            </label><br>`).join('')}
        </div>
      </div>
      <div style="text-align:right;">
        <button type="button" onclick="window.closeModal()">Cancelar</button>
        <button type="submit">Facturar</button>
      </div>
    </form>
  `);

  // IMPORTANTE: Asignamos el submit handler AQUÍ (después de inyectar el modal)
  document.getElementById('formVenta').onsubmit = function(ev){
    ev.preventDefault();
    const datos = Object.fromEntries(new FormData(this).entries());
    const clienteId = datos.clienteId;
    if(!clienteId) return alert("Seleccione cliente.");
    let detalles=[];
    let total = 0; let totalCompra=0; let prodDesc = [];
    let productos = getData("productos");
    for(let k in datos) {
      if(k.startsWith("p_") && +datos[k]>0) {
        let prod = productos.find(p=>p.id===k.slice(2));
        let precio = prod.precio;
        let textoPromo = "";
        if(prod.promoActiva) {
          if(prod.promocionTipo==="porcentaje") {
            precio -= precio*prod.promocionCantidad/100;
            textoPromo = "(" + prod.promocionCantidad + "% desc.)";
          }
          else precio -= prod.promocionCantidad;
        }
        precio = Math.max(0, precio);
        let subtotal = precio * datos[k];
        detalles.push({id:prod.id, nombre:prod.nombre, cantidad:+datos[k], precioUnidad:precio, textoPromo, subtotal});
        total += subtotal;
        totalCompra += prod.costoCompra*datos[k];
        prodDesc.push(prod.nombre + " x" + datos[k]);
      }
    }
    if(detalles.length==0) return alert("Agregue al menos un producto.");
    // Actualizar stock productos
    for(let dt of detalles){
      let ix = productos.findIndex(p=>p.id==dt.id);
      productos[ix].stock -= dt.cantidad;
      if(productos[ix].stock < 0) {
        return alert("Stock insuficiente de " + productos[ix].nombre);
      }
    }
    setData("productos", productos);

    let ventas = getData("ventas");
    let id = crypto.randomUUID();
    let idFactura = "FCT-" + String(ventas.length+1).padStart(4,"0");
    let cliente = getData("clientes").find(c=>c.id===clienteId)||{};
    ventas.push({id, idFactura, clienteId, clienteNombre:cliente.nombre, detalles, totalCostoVenta: total, totalCostoCompra:totalCompra, fecha: new Date().toISOString()});
    setData("ventas", ventas);
    // historial de cliente
    if(cliente) {
      cliente.historial = cliente.historial||[];
      cliente.historial.push({fecha: new Date().toISOString(), productos: prodDesc, total});
      let clientes = getData("clientes");
      let ix = clientes.findIndex(x=>x.id===clienteId);
      clientes[ix] = cliente;
      setData("clientes", clientes);
    }
    window.closeModal();
    window.renderVentas();
    window.renderProductos();
    window.renderDashboard();
    // Notif inventario crítico
    let criticos = productos.filter(p=>p.stock<=p.critico);
    if(criticos.length>0) alert("Alerta: " + criticos.map(p=>p.nombre).join(', ') + " por agotarse.");
  };
}

window.verFactura = function(id){
  let ventas = getData("ventas");
  let v = ventas.find(x=>x.id===id);
  let html = `<h3>Factura ${v.idFactura}</h3>
      <p><strong>Cliente:</strong> ${v.clienteNombre}<br>
      <strong>Fecha:</strong> ${(new Date(v.fecha)).toLocaleString()}</p>
      <table style="width:100%"><tr><th>Producto</th><th>Cant.</th><th>PU</th><th>Descuento</th><th>T.Subtotal</th></tr>`;
  for(let dt of v.detalles)
    html+=`<tr>
      <td>${dt.nombre}</td>
      <td>${dt.cantidad}</td>
      <td>$${dt.precioUnidad.toFixed(2)}</td>
      <td>${dt.textoPromo||""}</td>
      <td>$${dt.subtotal.toFixed(2)}</td>
    </tr>`;
  html += `</table>
    <p><strong>Total: $${v.totalCostoVenta.toFixed(2)}</strong></p>
    <div style="text-align:right">
      <button onclick="window.descargarFactura('${id}')">Descargar PDF</button>
      <button onclick="window.borrarVenta('${id}')" style="background:#fff0f0;color:#b90015;">🗑️ Borrar Factura</button>
      <button onclick="window.closeModal()">Cerrar</button>
    </div>`;
  showModal(html);
};

window.descargarFactura = function(id){
  let ventas = getData("ventas");
  let v = ventas.find(x=>x.id===id);
  const { jsPDF } = window.jspdf;
  let doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // --- Estilo de factura bonito ---
  // Encabezado
  doc.setFillColor(194,24,91); // color principal
  doc.rect(0,0,210,22, 'F');
  doc.setTextColor(255,255,255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("MI NEGOCIO DE MAQUILLAJE", 105, 15, {align: "center"});

  // Cuerpo blanco
  doc.setTextColor(40,40,40);

  // Datos de la factura
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text(`Factura: ${v.idFactura}`, 16, 32);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Cliente: ${v.clienteNombre || ""}`, 16, 39);
  doc.text(`Fecha: ${(new Date(v.fecha)).toLocaleString()}`, 16, 45);

  // Detalles productos
  let startY = 54;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12);
  doc.setFillColor(255,211,220); // rosadito
  doc.rect(13, startY-7, 184, 8, 'F');
  doc.setDrawColor(194,24,91);
  doc.setLineWidth(0.2);
  doc.rect(13, startY-7, 184, 8, 'S');
  doc.setTextColor(90,0,60);
  doc.text("Producto", 17, startY-2.5);
  doc.text("Cant.", 76, startY-2.5);
  doc.text("PU", 97, startY-2.5);
  doc.text("Desc.", 119, startY-2.5);
  doc.text("Subtotal", 170, startY-2.5);

  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  doc.setTextColor(40,40,40);

  let y = startY+2;
  for(let dt of v.detalles){
    if(y > 260) { // saltar página si hace falta
      doc.addPage(); y = 26;
    }
    doc.text(dt.nombre, 16, y);
    doc.text(String(dt.cantidad), 78, y, {align:"right"});
    doc.text(`$${dt.precioUnidad.toFixed(2)}`, 102, y, {align:"right"});
    doc.text((dt.textoPromo||"-"), 122, y, {align:"right"});
    doc.text(`$${dt.subtotal.toFixed(2)}`, 192, y, {align:"right"});
    y += 8;
  }

  // Total
  y += 4;
  doc.setDrawColor(124,67,189);
  doc.setLineWidth(0.5);
  doc.line(140, y, 192, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", 139, y, {align:"right"});
  doc.text(`$${v.totalCostoVenta.toFixed(2)}`, 192, y, {align:"right"});

  // Pie de página
  doc.setFontSize(10);
  doc.setTextColor(194,24,91);
  doc.text("¡Gracias por su compra!", 105, 287, {align:"center"});
  doc.setTextColor(150,60,120);
  doc.setFontSize(9);
  doc.text("SISTEMA WEB DEMO", 105, 293, {align:"center"});

  doc.save(`factura_${v.idFactura}.pdf`);
};

// For inline modal scripts
window.closeModal = closeModal;
window.renderVentas = renderVentas;
window.renderProductos = renderProductos;
window.renderDashboard = renderDashboard;