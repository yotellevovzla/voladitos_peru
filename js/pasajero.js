// -------------------------------------------------------------
// CONFIGURACIÓN DE SUPABASE
// -------------------------------------------------------------
const SUPABASE_URL = "https://gklquvthucityzgcamao.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-p-YL6bWXAQGTddkmm9_mA_HgKlR_eM";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let map;
let userMarker;
let currentLat = null;
let currentLng = null;
let viajeActivoId = null;

// -------------------------------------------------------------
// INICIALIZACIÓN DE SESIÓN Y MAPA
// -------------------------------------------------------------
window.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificar sesión activa
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('user-name').innerText = user.user_metadata?.nombre_completo || user.email;

  // 2. Inicializar Mapa (Coordenadas base por defecto)
  map = L.map('map').setView([10.4806, -66.9036], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // 3. Obtener Ubicación GPS
  obtenerUbicacionActual();
});

// -------------------------------------------------------------
// GEOLOCALIZACIÓN DEL PASAJERO
// -------------------------------------------------------------
function obtenerUbicacionActual() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        currentLat = position.coords.latitude;
        currentLng = position.coords.longitude;

        document.getElementById('origen-txt').value = "Ubicación Actual Detectada 📍";

        map.setView([currentLat, currentLng], 16);

        if (userMarker) {
          userMarker.setLatLng([currentLat, currentLng]);
        } else {
          userMarker = L.marker([currentLat, currentLng])
            .addTo(map)
            .bindPopup("<b>Estás aquí</b>")
            .openPopup();
        }
      },
      (error) => {
        console.warn("Error leyendo GPS:", error);
        document.getElementById('origen-txt').value = "Ubicación por defecto (Permiso denegado)";
      },
      { enableHighAccuracy: true }
    );
  }
}

// -------------------------------------------------------------
// SOLICITAR UN VIAJE
// -------------------------------------------------------------
async function solicitarViaje() {
  const destino = document.getElementById('destino-txt').value;
  
  if (!destino) {
    alert("Por favor ingresa tu dirección de destino.");
    return;
  }

  if (!currentLat || !currentLng) {
    alert("Aún estamos obteniendo tus coordenadas GPS. Intenta de nuevo en unos segundos.");
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();

  const btnSolicitar = document.getElementById('btn-solicitar');
  btnSolicitar.disabled = true;
  btnSolicitar.innerText = "Enviando solicitud...";

  // Insertar en la tabla viajes
  const { data, error } = await supabase
    .from('viajes')
    .insert([
      {
        pasajero_id: user.id,
        origen_lat: currentLat,
        origen_lng: currentLng,
        destino_direccion: destino,
        estado: 'buscando',
        precio: 5.00
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Error solicitando viaje:", error);
    alert("Error al solicitar el viaje: " + error.message);
    btnSolicitar.disabled = false;
    btnSolicitar.innerText = "Pedir un Voladito 🚀";
    return;
  }

  viajeActivoId = data.id;
  
  // Cambiar interfaz al estado "buscando"
  document.getElementById('estado-viaje-box').classList.remove('hidden');
  document.getElementById('estado-viaje-texto').innerText = "Buscando conductor cercano...";
  btnSolicitar.innerText = "Viaje en proceso...";

  // Escuchar cambios en tiempo real para este viaje
  escucharEstadoViaje(viajeActivoId);
}

// -------------------------------------------------------------
// ESCUCHAR EN TIEMPO REAL SI UN CONDUCTOR ACEPTA
// -------------------------------------------------------------
function escucharEstadoViaje(idViaje) {
  supabase
    .channel(`viaje-${idViaje}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'viajes',
        filter: `id=eq.${idViaje}`
      },
      (payload) => {
        const nuevoEstado = payload.new.estado;
        const textoEstado = document.getElementById('estado-viaje-texto');

        if (nuevoEstado === 'aceptado') {
          textoEstado.innerText = "¡Conductor en camino a tu ubicación! 🚗";
        } else if (nuevoEstado === 'en_curso') {
          textoEstado.innerText = "¡Viaje iniciado! En ruta al destino... 🛣️";
        } else if (nuevoEstado === 'finalizado') {
          textoEstado.innerText = "¡Has llegado a tu destino! 🎉";
          alert("¡Viaje completado!");
          location.reload();
        }
      }
    )
    .subscribe();
}

// -------------------------------------------------------------
// CERRAR SESIÓN
// -------------------------------------------------------------
async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}
