// CABANA auth (modal-based, localStorage-backed)
(function () {
  // Feature flag: if auth is disabled, hide login links and skip initializing auth modal
  try {
    var authEnabled = typeof window !== 'undefined' && window.CABANA_FLAGS && window.CABANA_FLAGS.authEnabled === true;
    if (!authEnabled) {
      document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[data-login-open]')?.forEach(function (el) {
          el.remove();
        });
      });
      return;
    }
  } catch (_) {}
  const USER_KEY = 'cabanaUser';

  function createModal() {
    if (document.getElementById('authModal')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
    <div id="authModal" class="fixed inset-0 z-[1000] hidden" role="dialog" aria-modal="true" aria-labelledby="authTitle">
      <div class="absolute inset-0 bg-black/50" data-auth-close></div>
      <div class="relative mx-auto my-12 w-[90%] max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 id="authTitle" class="font-heading text-2xl">Account</h2>
            <button class="text-gray-500 hover:text-black" aria-label="Close" data-auth-close>&times;</button>
          </div>
          <div id="authTabs" class="flex gap-4 text-sm mb-6">
            <button data-auth-tab="signin" class="px-3 py-2 border-b-2 border-black">Sign in</button>
            <button data-auth-tab="register" class="px-3 py-2 border-b-2 border-transparent">Register</button>
            <button data-auth-tab="recovery" class="ml-auto text-gray-500">Forgot?</button>
          </div>
          <form id="authSignIn" class="space-y-3">
            <label class="block">
              <span class="text-sm">Email</span>
              <input type="email" class="w-full px-3 py-2 border border-gray-300" required />
            </label>
            <label class="block">
              <span class="text-sm">Password</span>
              <input type="password" class="w-full px-3 py-2 border border-gray-300" required />
            </label>
            <label class="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <button type="submit" class="w-full bg-black text-white py-3">Sign in</button>
          </form>
          <form id="authRegister" class="space-y-3 hidden">
            <label class="block">
              <span class="text-sm">Email</span>
              <input type="email" class="w-full px-3 py-2 border border-gray-300" required />
            </label>
            <label class="block">
              <span class="text-sm">Password</span>
              <input type="password" class="w-full px-3 py-2 border border-gray-300" required />
            </label>
            <button type="submit" class="w-full bg-black text-white py-3">Create account</button>
          </form>
          <form id="authRecovery" class="space-y-3 hidden">
            <p class="text-sm text-gray-600">Enter your email and we'll send reset instructions.</p>
            <label class="block">
              <span class="text-sm">Email</span>
              <input type="email" class="w-full px-3 py-2 border border-gray-300" required />
            </label>
            <button type="submit" class="w-full bg-black text-white py-3">Send reset link</button>
          </form>
        </div>
      </div>
    </div>`;
    document.body.appendChild(wrapper.firstElementChild);
  }

  function openModal(tab) {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    switchTab(tab || 'signin');
  }

  function closeModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.add('hidden');
  }

  function switchTab(tab) {
    const signIn = document.getElementById('authSignIn');
    const register = document.getElementById('authRegister');
    const recovery = document.getElementById('authRecovery');
    signIn.classList.toggle('hidden', tab !== 'signin');
    register.classList.toggle('hidden', tab !== 'register');
    recovery.classList.toggle('hidden', tab !== 'recovery');
    const tabs = document.querySelectorAll('[data-auth-tab]');
    tabs.forEach((t) => {
      const active = t.getAttribute('data-auth-tab') === tab;
      t.classList.toggle('border-black', active);
      t.classList.toggle('border-transparent', !active);
    });
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }

  function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    updateHeaderAuth();
  }

  function clearUser() {
    localStorage.removeItem(USER_KEY);
    updateHeaderAuth();
  }

  function updateHeaderAuth() {
    const link = document.querySelector('[data-login-open]');
    const user = getUser();
    if (!link) return;
    if (user) {
      link.textContent = `Hi, ${user.email}`;
      link.setAttribute('title', 'Click to sign out');
      link.onclick = function (e) {
        e.preventDefault();
        clearUser();
        alert('Signed out');
      };
    } else {
      link.textContent = 'Login';
      link.setAttribute('title', 'Sign in or register');
      link.onclick = function (e) {
        e.preventDefault();
        openModal('signin');
      };
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    createModal();
    updateHeaderAuth();

    document.querySelectorAll('[data-login-open]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (!getUser()) {
          e.preventDefault();
          openModal('signin');
        }
      });
    });

    document.querySelectorAll('[data-auth-close]').forEach((el) => {
      el.addEventListener('click', closeModal);
    });

    document.getElementById('authTabs')?.addEventListener('click', (e) => {
      const tab = e.target.getAttribute('data-auth-tab');
      if (tab) switchTab(tab);
    });

    document.getElementById('authSignIn')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const [emailInput] = e.target.querySelectorAll('input[type="email"]');
      const [passwordInput] = e.target.querySelectorAll('input[type="password"]');
      const remember = e.target.querySelector('input[type="checkbox"]').checked;
      const email = emailInput.value.trim();
      if (!email || !passwordInput.value) return;
      setUser({ email, remember });
      closeModal();
    });

    document.getElementById('authRegister')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const [emailInput] = e.target.querySelectorAll('input[type="email"]');
      const email = emailInput.value.trim();
      if (!email) return;
      setUser({ email, remember: true });
      closeModal();
    });

    document.getElementById('authRecovery')?.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('If this were live, a password reset email would be sent.');
      switchTab('signin');
    });
  });
})();


