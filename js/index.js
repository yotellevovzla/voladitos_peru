// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = "https://gklquvthucityzgcamao.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-p-YL6bWXAQGTddkmm9_mA_HgKlR_eM";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    btnLogin.className = "flex-1 py-2 text-sm font-semibold rounded-md bg-amber-400 text-slate-900 transition-all";
    btnRegister.className = "flex-1 py-2 text-sm font-semibold rounded-md text-slate-400 hover:text-slate-200 transition-all";
  } else {
    formRegister.classList.remove('hidden');
    formLogin.classList.add('hidden');
    btnRegister.className = "flex-1 py-2 text-sm font-semibold rounded-md bg-amber-400 text-slate-900 transition-all";
    btnLogin.className = "flex-1 py-2 text-sm font-semibold rounded-md text-slate-400 hover:text-slate-200 transition-all";
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

  const { data, error } = await supabase.auth.signUp({
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    showMessage(error.message, 'error');
    return;
  }

  const { data: perfil } = await supabase
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
  box.classList.remove('hidden', 'bg-red-900/50', 'text-red-300', 'bg-green-900/50', 'text-green-300', 'bg-slate-700', 'text-slate-200');
  
  if (type === 'error') {
    box.classList.add('bg-red-900/50', 'text-red-300');
  } else if (type === 'success') {
    box.classList.add('bg-green-900/50', 'text-green-300');
  } else {
    box.classList.add('bg-slate-700', 'text-slate-200');
  }
  box.innerText = msg;
}

function hideMessage() {
  document.getElementById('status-message').classList.add('hidden');
}
