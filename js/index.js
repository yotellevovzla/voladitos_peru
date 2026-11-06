// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = "https://gklquvthucityzgcamao.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-p-YL6bWXAQGTddkmm9_mA_HgKlR_eM";

let supabaseClient = null;

// Esperar a que el DOM esté completamente cargado
window.addEventListener('DOMContentLoaded', () => {
  // Inicializar cliente Supabase
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.error("Supabase SDK no se ha cargado correctamente.");
  }

  // Capturar botones y formularios
  const btnTabLogin = document.getElementById('btn-tab-login');
  const btnTabRegister = document.getElementById('btn-tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  // Eventos de Pestañas
  if (btnTabLogin) {
    btnTabLogin.addEventListener('click', () => switchTab('login'));
  }
  
  if (btnTabRegister) {
    btnTabRegister.addEventListener('click', () => switchTab('register'));
  }

  // Eventos de Formularios
  if (formLogin) {
    formLogin.addEventListener('submit', handleLogin);
  }

  if (formRegister) {
    formRegister.addEventListener('submit', handleRegister);
  }
});

// CAMBIO DE PESTAÑAS (LOGIN / REGISTRO)
function switchTab(tab) {
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const btnLogin = document.getElementById('btn-tab-login');
  const btnRegister = document.getElementById('btn-tab-register');
  hideMessage();

  if (tab === 'login') {
    formLogin.classList.remove('hidden');
    formRegister.classList.add('hidden');
    btnLogin.className = "flex-1 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white shadow-sm transition-all";
    btnRegister.className = "flex-1 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-all";
  } else {
    formRegister.classList.remove('hidden');
    formLogin.classList.add('hidden');
    btnRegister.className = "flex-1 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white shadow-sm transition-all";
    btnLogin.className = "flex-1 py-2 text-sm font-semibold rounded-lg text-slate-600 hover:text-slate-900 transition-all";
  }
}

// MANEJO DE REGISTRO
async function handleRegister(event) {
  event.preventDefault();
  showMessage('Registrando usuario en Voladitos...', 'info');

  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const role = document.querySelector('input[name="role"]:checked').value;

  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        nombre_completo: name,
        rol: role
      }
    }
  });

  if (error) {
    showMessage(error.message, 'error');
    return;
  }

  showMessage('¡Registro exitoso! Ya puedes iniciar sesión.', 'success');
  switchTab('login');
}

// MANEJO DE INICIO DE SESIÓN
async function handleLogin(event) {
  event.preventDefault();
  showMessage('Iniciando sesión...', 'info');

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    showMessage(error.message, 'error');
    return;
  }

  const { data: perfil } = await supabaseClient
    .from('perfiles')
    .select('rol')
    .eq('id', data.user.id)
    .single();

  const rol = perfil ? perfil.rol : (data.user.user_metadata?.rol || 'pasajero');
  
  showMessage(`Bienvenido a Voladitos. Redirigiendo...`, 'success');

  setTimeout(() => {
    if (rol === 'conductor') {
      window.location.href = 'conductor.html';
    } else {
      window.location.href = 'pasajero.html';
    }
  }, 1200);
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

function hideMessage() {
  document.getElementById('status-message').classList.add('hidden');
}
