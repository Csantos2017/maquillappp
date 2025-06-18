// Cliente functions moved to separate module
import { getData, setData, STORAGE_KEYS } from './data.js';
import { showModal, closeModal } from './modales.js';

export function renderClientes() {
  const tbody = document.querySelector("#tablaClientes tbody");
  const clientes = getData("clientes");
  tbody.innerHTML = "";
  for(let c of clientes) {
    tbody.innerHTML += `<tr>
      <td>${c.nombre}</td>
      <td>${c.email||''}</td>
      <td>${c.telefono||''}</td>
      <td>${c.historial&&c.historial.length||0}</td>
      <td>
        <button onclick="window.editarCliente('${c.id}')">✏️</button>
        <button onclick="window.borrarCliente('${c.id}')">🗑️</button>
        <button onclick="window.verHistorialCliente('${c.id}')">👁️</button>
      </td>
    </tr>`;
  }
}

export function setupClientesModalHooks() {
  document.getElementById("btnAddCliente").onclick = ()=>{
    showModal(`
      <h3>Agregar Cliente</h3>
      <form id="formCli">
        <div class="form-group"><label>Nombre</label><input required name="nombre"></div>
        <div class="form-group"><label>Email</label><input name="email" type="email"></div>
        <div class="form-group"><label>Teléfono</label><input name="telefono"></div>
        <div style="text-align:right;">
          <button type="button" onclick="window.closeModal()">Cancelar</button>
          <button type="submit">Guardar</button>
        </div>
      </form>
    `);
    // CORRECIÓN: asigna el submit handler después del showModal
    document.getElementById('formCli').onsubmit=function(ev){
      ev.preventDefault();
      let datos = Object.fromEntries(new FormData(this).entries());
      datos.id = crypto.randomUUID();
      datos.historial = [];
      let arr = getData('clientes');
      arr.push(datos);
      setData('clientes', arr);
      window.closeModal(); window.renderClientes();
    };
  };
}

// Expose these functions because the modal code uses them via window
window.editarCliente = function(id){
  let clientes = getData("clientes");
  let c = clientes.find(cl=>cl.id===id);
  showModal(`
    <h3>Editar Cliente</h3>
    <form id="formEditCli">
      <div class="form-group"><label>Nombre</label><input required name="nombre" value="${c.nombre}"></div>
      <div class="form-group"><label>Email</label><input name="email" type="email" value="${c.email||""}"></div>
      <div class="form-group"><label>Teléfono</label><input name="telefono" value="${c.telefono||""}"></div>
      <div style="text-align:right;">
        <button type="button" onclick="window.closeModal()">Cancelar</button>
        <button type="submit">Guardar</button>
      </div>
    </form>
  `);
  document.getElementById('formEditCli').onsubmit=function(ev){
    ev.preventDefault();
    let datos = Object.fromEntries(new FormData(this).entries());
    datos.id = c.id;
    let arr = getData('clientes');
    let ix = arr.findIndex(x=>x.id==c.id);
    datos.historial = arr[ix].historial||[];
    arr[ix]=datos;
    setData('clientes', arr);
    window.closeModal(); window.renderClientes();
  };
};
window.borrarCliente = function(id) {
  if(!confirm("¿Borrar cliente?")) return;
  let arr = getData('clientes').filter(c=>c.id!==id);
  setData('clientes', arr); renderClientes();
};
window.verHistorialCliente = function(id) {
  let clientes = getData('clientes');
  let c = clientes.find(cl=>cl.id===id);
  let html = `<h3>Historial de ${c.nombre}</h3><ul>`;
  if(!c.historial||c.historial.length==0) html += "<li>Sin compras aún.</li>";
  else for(let h of c.historial)
    html+=`<li>${(new Date(h.fecha)).toLocaleDateString()}: ${h.productos.join(", ")} - $${h.total}</li>`;
  html += `</ul><div style="text-align:right"><button onclick="window.closeModal()">Cerrar</button></div>`;
  showModal(html);
};

// For modals to work correctly
window.closeModal = closeModal;
window.renderClientes = renderClientes;