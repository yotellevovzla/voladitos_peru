const SUPABASE_URL = "https://gklquvthucityzgcamao.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-p-YL6bWXAQGTddkmm9_mA_HgKlR_eM";

let supabaseClient = null;

window.addEventListener('DOMContentLoaded', async () => {
  if (window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.error("SDK de Supabase no cargado.");
    return;
  }

  // Verificar que haya sesión activa
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    alert("Debes iniciar sesión primero.");
    window.location.href = 'index.html';
    return;
  }

  // Precargar nombre si ya existe
  if (user.user_metadata?.nombre_completo) {
    document.getElementById('reg-nombre').value = user.user_metadata.nombre_completo;
  }

  const form = document.getElementById('form-registro-conductor');
  form.addEventListener('submit', guardarDatosConductor);
});

async function guardarDatosConductor(event) {
  event.preventDefault();
  showMessage("Guardando información del conductor...", "info");

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const datosActualizacion = {
    nombre_completo: document.getElementById('reg-nombre').value,
    cedula: document.getElementById('reg-cedula').value,
    fecha_nacimiento: document.getElementById('reg-fnac').value,
    licencia: document.getElementById('reg-licencia').value,
    carnet: document.getElementById('reg-carnet').value,
    vehiculo_placa: document.getElementById('veh-placa').value.toUpperCase(),
    vehiculo_marca: document.getElementById('veh-marca').value,
    vehiculo_modelo: document.getElementById('veh-modelo').value,
    vehiculo_color: document.getElementById('veh-color').value,
    vehiculo_anio: document.getElementById('veh-anio').value,
    vehiculo_titulo: document.getElementById('veh-titulo').value,
    estado_cuenta: 'pendiente' // Queda pendiente de aprobación por el admin
  };

  const { error } = await supabaseClient
    .from('perfiles')
    .update(datosActualizacion)
    .eq('id', user.id);

  if (error) {
    console.error("Error al guardar:", error);
    showMessage("Error al guardar: " + error.message, "error");
    return;
  }

  showMessage("¡Datos guardados con éxito! Redirigiendo a tu panel...", "success");

  setTimeout(() => {
    window.location.href = 'conductor.html';
  }, 1500);
}

function showMessage(msg, type) {
  const box = document.getElementById('status-message');
  box.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700', 'bg-slate-100', 'text-slate-700');
  
  if (type === 'error') {
    box.classList.add('bg-red-100', 'text-red-700');
  } else if (type === 'success') {
    box.classList.add('bg-green-100', 'text-green-700');
  } else {
    box.classList.add('bg-slate-100', 'text-slate-700');
  }
  box.innerText = msg;
}
