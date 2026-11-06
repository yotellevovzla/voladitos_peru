const SUPABASE_URL = "https://gklquvthucityzgcamao.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-p-YL6bWXAQGTddkmm9_mA_HgKlR_eM";

let supabaseClient = null;
let map = null;
let conductorMarker = null;
let userConductor = null;

window.addEventListener('DOMContentLoaded', async () => {
  // Inicializar el cliente usando una variable que no colisione con el SDK global
  if (window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.error("SDK de Supabase no cargado.");
    return;
  }

  // Validar sesión
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  userConductor = user;
  document.getElementById('user-name').innerText = user.user_metadata?.nombre_completo || user.email;

  // Validar estado de la cuenta en la tabla perfiles
  const { data: perfil, error } = await supabaseClient
    .from('perfiles')
    .select('estado_cuenta')
    .eq('id', user.id)
    .single();

  if (error || !perfil) {
    console.error("Error al obtener perfil del conductor:", error);
    return;
  }

  if (perfil.estado_cuenta !== 'aprobado') {
    mostrarPantallaBloqueo(perfil.estado_cuenta);
    return;
  }

  // Inicializar mapa si la cuenta está APROBADA
  map = L.map('map').setView([10.4806, -66.9036], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      map.setView([lat, lng], 15);
      conductorMarker = L.marker([lat, lng]).addTo(map).bindPopup("<b>Tu Vehículo</b>").openPopup();
    });
  }

  cargarViajesPendientes();
  escucharNuevosViajes();
});

function mostrarPantallaBloqueo(estado) {
  const contenedor = document.getElementById('lista-viajes');
  const esPendiente = estado === 'pendiente';
  
  contenedor.innerHTML = `
    <div class="text-center py-6 px-2">
      <div class="text-4xl mb-3">${esPendiente ? '⌛' : '🚫'}</div>
      <h3 class="text-base font-bold ${esPendiente ? 'text-blue-700' : 'text-red-600'}">
        ${esPendiente ? 'Cuenta en Proceso de Revisión' : 'Solicitud No Aprobada'}
      </h3>
      <p class="text-xs text-slate-500 mt-2 leading-relaxed">
        ${esPendiente 
          ? 'Gracias por unirte a Voladitos. Tu documentación está siendo validada por nuestro equipo. Te notificaremos al activarse tu cuenta.' 
          : 'Lamentablemente tu solicitud de conductor no cumple con los requisitos mínimos.'}
      </p>
    </div>
  `;
}

async function cargarViajesPendientes() {
  const { data: viajes, error } = await supabaseClient
    .from('viajes')
    .select('*, perfiles(nombre_completo)')
    .eq('estado', 'buscando');

  if (error) {
    console.error("Error cargando viajes:", error);
    return;
  }

  renderizarViajes(viajes);
}

function renderizarViajes(viajes) {
  const contenedor = document.getElementById('lista-viajes');
  contenedor.innerHTML = '';

  if (!viajes || viajes.length === 0) {
    contenedor.innerHTML = '<p class="text-sm text-slate-400 text-center py-4 font-medium">Esperando nuevas solicitudes de pasajeros...</p>';
    return;
  }

  viajes.forEach(v => {
    const item = document.createElement('div');
    item.className = "bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-xs";
    item.innerHTML = `
      <div>
        <p class="text-sm font-bold text-slate-800">Destino: ${v.destino_direccion}</p>
        <p class="text-xs font-semibold text-blue-700">Tarifa estimada: $${v.precio}</p>
      </div>
      <button onclick="aceptarViaje('${v.id}')" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20">
        Aceptar
      </button>
    `;
    contenedor.appendChild(item);
  });
}

function escucharNuevosViajes() {
  supabaseClient
    .channel('viajes-disponibles')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'viajes' },
      () => {
        cargarViajesPendientes();
      }
    )
    .subscribe();
}

async function aceptarViaje(idViaje) {
  const { error } = await supabaseClient
    .from('viajes')
    .update({
      conductor_id: userConductor.id,
      estado: 'aceptado'
    })
    .eq('id', idViaje);

  if (error) {
    alert("No se pudo aceptar el viaje: " + error.message);
    return;
  }

  alert("🚀 ¡Viaje Aceptado! Dirígete a buscar al pasajero.");
  cargarViajesPendientes();
}

async function logout() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  window.location.href = 'index.html';
}
