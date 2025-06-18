// DATA - Utilidades para almacenamiento local y claves

export const STORAGE_KEYS = {
  productos: "productos_maq",
  ventas: "ventas_maq",
  clientes: "clientes_maq",
  empleados: "empleados_maq",
};

export function getData(key) {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS[key]) || "[]");
}

export function setData(key, arr) {
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(arr));
}

