// Empleados module actualizado según requerimiento: salario diario * días trabajados + bono por ventas (editable)
import { getData, setData } from './data.js';
import { showModal, closeModal } from './modales.js';

export function renderEmpleados() {
  const tbody = document.querySelector("#tablaEmpleados tbody");
  const arr = getData("empleados");
  tbody.innerHTML = "";
  for (let emp of arr) {
    // Total a pagar = salarioDia * diasTrabajados + bonoVentaMes
    let salarioDia = Number(emp.salarioDia) || 0;
    let diasTrabajados = Number(emp.diasTrabajados) || 0;
    let bonoVentaMes = Number(emp.bonoVentaMes) || 0;
    let total = (salarioDia * diasTrabajados) + bonoVentaMes;
    tbody.innerHTML += `<tr>
      <td>${emp.nombre}</td>
      <td>$${salarioDia.toFixed(2)}</td>
      <td>
        <span class="editable-celda" data-id="${emp.id}" data-campo="diasTrabajados">${diasTrabajados}</span>
      </td>
      <td>$${total.toFixed(2)}</td>
      <td>
        <button onclick="window.editarEmpleado('${emp.id}')">✏️</button>
        <button onclick="window.borrarEmpleado('${emp.id}')">🗑️</button>
      </td>
    </tr>`;
  }
  // Añade manejador para edición rápida de días trabajados
  setTimeout(setupEditableDias, 200); // para asegurar que el DOM está disponible
}

function setupEditableDias() {
  document.querySelectorAll('.editable-celda').forEach(el => {
    el.onclick = function () {
      if (el.querySelector('input')) return; // ya está editando
      const old = el.textContent;
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.value = old;
      input.style.width = '50px';
      input.onblur = guardarDias;
      input.onkeydown = e => { if (e.key === 'Enter') input.blur(); };
      el.textContent = '';
      el.appendChild(input);
      input.focus();
      function guardarDias() {
        let nuevoValor = Number(input.value) || 0;
        el.textContent = nuevoValor;
        let arr = getData("empleados");
        let ix = arr.findIndex(e => e.id === el.dataset.id);
        arr[ix].diasTrabajados = nuevoValor;
        setData("empleados", arr);
        renderEmpleados();
      }
    };
  });
}

export function setupEmpleadosModalHooks() {
  document.getElementById("btnAddEmpleado").onclick = () => {
    showModal(`
      <h3>Agregar Empleado</h3>
      <form id="formEmp">
        <div class="form-group"><label>Nombre</label><input required name="nombre"></div>
        <div class="form-group"><label>Salario por Día</label>
          <input name="salarioDia" min="0" step="0.01" type="number" required></div>
        <div class="form-group"><label>Días Trabajados (mes actual)</label>
          <input name="diasTrabajados" min="0" step="1" type="number" value="0" required></div>
        <div class="form-group"><label>Bono por Ventas Mes</label>
          <input name="bonoVentaMes" min="0" step="0.01" type="number" value="0"></div>
        <div style="text-align:right;">
          <button type="button" onclick="window.closeModal()">Cancelar</button>
          <button type="submit">Guardar</button>
        </div>
      </form>
    `);
    document.getElementById('formEmp').onsubmit = function (ev) {
      ev.preventDefault();
      let datos = Object.fromEntries(new FormData(this).entries());
      datos.id = crypto.randomUUID();
      datos.salarioDia = +datos.salarioDia;
      datos.diasTrabajados = +datos.diasTrabajados || 0;
      datos.bonoVentaMes = +datos.bonoVentaMes || 0;
      let arr = getData('empleados');
      arr.push(datos);
      setData('empleados', arr);
      window.closeModal(); window.renderEmpleados();
    };
  };
}

// Edición de empleado
window.editarEmpleado = function (id) {
  let arr = getData("empleados");
  let emp = arr.find(e => e.id === id);
  showModal(`
    <h3>Editar Empleado</h3>
    <form id="formEditEmp">
      <div class="form-group"><label>Nombre</label><input required name="nombre" value="${emp.nombre}"></div>
      <div class="form-group"><label>Salario por Día</label>
        <input name="salarioDia" min="0" step="0.01" type="number" required value="${emp.salarioDia || 0}"></div>
      <div class="form-group"><label>Días Trabajados (mes actual)</label>
        <input name="diasTrabajados" min="0" step="1" type="number" required value="${emp.diasTrabajados || 0}"></div>
      <div class="form-group"><label>Bono por Ventas Mes</label>
        <input name="bonoVentaMes" min="0" step="0.01" type="number" value="${emp.bonoVentaMes || 0}"></div>
      <div style="text-align:right;">
        <button type="button" onclick="window.closeModal()">Cancelar</button>
        <button type="submit">Guardar</button>
      </div>
    </form>
  `);
  document.getElementById('formEditEmp').onsubmit = function (ev) {
    ev.preventDefault();
    let datos = Object.fromEntries(new FormData(this).entries());
    datos.id = emp.id;
    datos.salarioDia = +datos.salarioDia;
    datos.diasTrabajados = +datos.diasTrabajados || 0;
    datos.bonoVentaMes = +datos.bonoVentaMes || 0;
    let ix = arr.findIndex(e => e.id === emp.id);
    arr[ix] = datos;
    setData('empleados', arr);
    window.closeModal(); window.renderEmpleados();
  };
};

window.borrarEmpleado = function (id) {
  if (!confirm("¿Borrar empleado?")) return;
  let arr = getData("empleados").filter(x => x.id !== id);
  setData("empleados", arr);
  renderEmpleados();
};

window.renderEmpleados = renderEmpleados;
window.closeModal = closeModal;