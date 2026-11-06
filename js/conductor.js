const SUPABASE_URL = "https://gklquvthucityzgcamao.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-p-YL6bWXAQGTddkmm9_mA_HgKlR_eM";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let map;
let conductorMarker;
let userConductor = null;

window.addEventListener('DOMContentLoaded', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  userConductor = user;
  document.getElementById('user-name').innerText = user.user_metadata?.nombre_completo || user.email;

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

async function cargarViajesPendientes() {
  const { data: viajes, error } = await supabase
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

  if (viajes.length === 0) {
    contenedor.innerHTML = '<p class="text-sm text-slate-400 text-center py-4">Esperando nuevas solicitudes de pasajeros...</p>';
    return;
  }

  viajes.forEach(v => {
    const item = document.createElement('div');
    item.className = "bg-slate-900 p-4 rounded-xl border border-slate-700 flex justify-between items-center";
    item.innerHTML = `
      <div>
        <p class="text-sm font-bold text-slate-200">Destino: ${v.destino_direccion}</p>
        <p class="text-xs text-amber-400">Tarifa estimada: $${v.precio}</p>
      </div>
      <button onclick="aceptarViaje('${v.id}')" class="bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all">
        Aceptar
      </button>
    `;
    contenedor.appendChild(item);
  });
}

function escucharNuevosViajes() {
  supabase
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
  const { error } = await supabase
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
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}
