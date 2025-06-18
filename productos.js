import { getData, setData, STORAGE_KEYS } from './data.js';
import { showModal, closeModal } from './modales.js';
import { renderDashboard } from './dashboard.js';

export function renderProductos() {
  const tbody = document.querySelector("#tablaProductos tbody");
  const productos = getData("productos");
  tbody.innerHTML = "";
  for (let prod of productos) {
    let promoTxt = prod.promoActiva ? `${prod.promocionTipo === 'porcentaje' ? prod.promocionCantidad + '%' : ('$' + prod.promocionCantidad)}` : "";
    tbody.innerHTML += `<tr${prod.stock <= prod.critico ? ' style="color:red"' : ''}>
      <td>${prod.nombre}</td>
      <td>${prod.categoria}</td>
      <td>$${Number(prod.costoCompra).toFixed(2)}</td>
      <td class="editable-precio" title="Haz clic para modificar rápidamente">$${Number(prod.precio).toFixed(2)}</td>
      <td>${prod.stock}</td>
      <td>${promoTxt}</td>
      <td>
        <button class="btn-editar-prod" data-id="${prod.id}">✏️</button>
        <button class="btn-borrar-prod" data-id="${prod.id}">🗑️</button>
      </td>
    </tr>`;
  }
}

export function setupProductoModalHooks() {
  document.getElementById("btnAddProducto").onclick = handleAddProductoModal;
  document.querySelector("#tablaProductos").addEventListener("click", onTablaProductosClick);
}

function handleAddProductoModal() {
  showModal(`
    <h3>Agregar Producto</h3>
    <form id="formProd">
      <div class="form-group"><label>Nombre</label><input required name="nombre"></div>
      <div class="form-group"><label>Categoría</label>
        <select name="categoria" required>
          <option value="Bases">Bases</option>
          <option value="Labiales">Labiales</option>
          <option value="Sombras">Sombras</option>
          <option value="Brochas">Brochas</option>
          <option value="Otros">Otros</option>
        </select>
      </div>
      <div class="form-group"><label>Costo de Compra</label>
        <input required step="0.01" min="0" name="costoCompra" type="number"></div>
      <div class="form-group"><label>Precio Venta</label>
        <input step="0.01" min="0" name="precio" type="number" value="0" placeholder="0 (asigne luego si desea)">
        <small style="color:#b90015">Puede dejar en CERO y modificar después</small>
      </div>
      <div class="form-group"><label>Stock</label>
        <input required min="0" name="stock" type="number"></div>
      <div class="form-group"><label>Stock Crítico</label>
        <input required min="1" name="critico" type="number" value="5"></div>
      <div class="form-group"><label>
        <input type="checkbox" name="promoActiva"> Promoción/Descuento</label>
      </div>
      <div id="promoCampos" style="display:none;">
        <div class="form-group"><label>Tipo</label>
          <select name="promocionTipo">
            <option value="porcentaje">% Descuento</option>
            <option value="monto">Monto Descuento</option>
          </select>
        </div>
        <div class="form-group"><label>Cantidad</label>
          <input name="promocionCantidad" type="number" min="0" value="10">
        </div>
      </div>
      <div style="text-align:right;">
        <button type="button" onclick="window.closeModal()">Cancelar</button>
        <button type="submit">Guardar</button>
      </div>
    </form>
  `);

  // CORRECCIÓN: asigna el submit handler después de inyectar el HTML
  const form = document.getElementById('formProd');
  form.onsubmit = function(ev) {
    ev.preventDefault();
    const datos = Object.fromEntries(new FormData(this).entries());
    datos.id = crypto.randomUUID();
    datos.costoCompra = +datos.costoCompra; 
    // Acepta precio vacío o cero, se convierte a 0 si vacío
    datos.precio = (datos.precio === "" || isNaN(Number(datos.precio))) ? 0 : +datos.precio;
    datos.stock = +datos.stock;
    datos.critico = +datos.critico;
    datos.promoActiva = !!datos.promoActiva && datos.promoActiva !== 'false';
    if (datos.promoActiva) {
      datos.promocionTipo = datos.promocionTipo;
      datos.promocionCantidad = +datos.promocionCantidad;
    } else {
      datos.promocionTipo = undefined;
      datos.promocionCantidad = undefined;
    }
    let arr = getData('productos');
    arr.push(datos);
    setData('productos', arr);
    window.closeModal(); window.renderProductos(); window.renderDashboard();
  };

  document.querySelector('[name=promoActiva]').onchange = function(e){
    document.getElementById('promoCampos').style.display = e.target.checked ? 'block' : 'none';
  };
}

function onTablaProductosClick(e) {
  if (e.target.classList.contains("btn-editar-prod")) {
    editarProductoHandler(e.target.dataset.id);
  } else if (e.target.classList.contains("btn-borrar-prod")) {
    borrarProductoHandler(e.target.dataset.id);
  } else if (e.target.classList.contains("editable-precio")) {
    // Hacer la celda editable para modificar el precio de venta rápidamente
    let td = e.target;
    if (td.querySelector('input')) return; // prevent multiple
    let oldValue = td.textContent.replace("$", "");
    let input = document.createElement("input");
    input.type = "number";
    input.step = "0.01";
    input.min = "0";
    input.value = Number(oldValue);
    input.style.width = "60px";
    input.onblur = () => savePrecioVenta(td, input);
    input.onkeydown = ev => { if(ev.key === "Enter") input.blur(); };
    td.textContent = "";
    td.appendChild(input);
    input.focus();
  }
}

function savePrecioVenta(td, input) {
  let nuevoValor = Number(input.value) || 0;
  let tr = td.closest('tr');
  let id = tr.querySelector('.btn-editar-prod').dataset.id;
  let productos = getData('productos');
  let prodIx = productos.findIndex(p => p.id === id);
  productos[prodIx].precio = nuevoValor;
  setData('productos', productos);
  window.renderProductos();
  window.renderDashboard();
}

function editarProductoHandler(id) {
  let productos = getData("productos");
  let prod = productos.find(p => p.id === id);
  showModal(`
    <h3>Editar Producto</h3>
    <form id="formEditProd">
      <div class="form-group"><label>Nombre</label><input required name="nombre" value="${prod.nombre}"></div>
      <div class="form-group">
        <label>Categoría</label>
        <select name="categoria" required>
          <option value="Bases"${prod.categoria === "Bases" ? " selected" : ""}>Bases</option>
          <option value="Labiales"${prod.categoria === "Labiales" ? " selected" : ""}>Labiales</option>
          <option value="Sombras"${prod.categoria === "Sombras" ? " selected" : ""}>Sombras</option>
          <option value="Brochas"${prod.categoria === "Brochas" ? " selected" : ""}>Brochas</option>
          <option value="Otros"${prod.categoria === "Otros" ? " selected" : ""}>Otros</option>
        </select>
      </div>
      <div class="form-group"><label>Costo de Compra</label>
        <input required step="0.01" min="0" name="costoCompra" type="number" value="${prod.costoCompra}"></div>
      <div class="form-group"><label>Precio Venta</label>
        <input required step="0.01" min="0" name="precio" type="number" value="${prod.precio}"></div>
      <div class="form-group"><label>Stock</label>
        <input required min="0" name="stock" type="number" value="${prod.stock}"></div>
      <div class="form-group"><label>Stock Crítico</label>
        <input required min="1" name="critico" type="number" value="${prod.critico || 5}"></div>
      <div class="form-group">
        <label><input type="checkbox" name="promoActiva" ${prod.promoActiva ? 'checked' : ''}> Promoción/Descuento</label>
      </div>
      <div id="promoCampos" style="display:${prod.promoActiva ? 'block' : 'none'};">
        <div class="form-group"><label>Tipo</label>
          <select name="promocionTipo">
            <option value="porcentaje"${prod.promocionTipo === "porcentaje" ? ' selected' : ''}>% Descuento</option>
            <option value="monto"${prod.promocionTipo === "monto" ? ' selected' : ''}>Monto Descuento</option>
          </select>
        </div>
        <div class="form-group"><label>Cantidad</label>
          <input name="promocionCantidad" type="number" min="0" value="${prod.promocionCantidad || 10}">
        </div>
      </div>
      <div style="text-align:right;">
        <button type="button" onclick="window.closeModal()">Cancelar</button>
        <button type="submit">Guardar</button>
      </div>
    </form>
  `);

  // CORRECCIÓN: asigna el submit handler después de inyectar el HTML
  const form = document.getElementById('formEditProd');
  form.onsubmit = function(ev) {
    ev.preventDefault();
    const datos = Object.fromEntries(new FormData(this).entries());
    datos.id = prod.id;
    datos.costoCompra = +datos.costoCompra; datos.precio = +datos.precio; datos.stock = +datos.stock; datos.critico = +datos.critico;
    datos.promoActiva = !!datos.promoActiva && datos.promoActiva !== 'false';
    if (datos.promoActiva) {
      datos.promocionTipo = datos.promocionTipo;
      datos.promocionCantidad = +datos.promocionCantidad;
    } else {
      datos.promocionTipo = undefined;
      datos.promocionCantidad = undefined;
    }
    let arr = getData('productos');
    let ix = arr.findIndex(p => p.id == prod.id);
    arr[ix] = datos;
    setData('productos', arr);
    window.closeModal(); window.renderProductos(); window.renderDashboard();
  };

  document.querySelector('[name=promoActiva]').onchange = function(e){
    document.getElementById('promoCampos').style.display = e.target.checked?'block':'none';
  };
}

function borrarProductoHandler(id) {
  if (!confirm("¿Borrar producto?")) return;
  let productos = getData("productos").filter(p => p.id !== id);
  setData("productos", productos);
  renderProductos();
  renderDashboard();
}

// Expose functions for modal inline script compatibility
window.renderProductos = renderProductos;
window.renderDashboard = renderDashboard;
window.closeModal = closeModal;