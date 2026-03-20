/* ============================================================
   nav.js — Aircraft2Sell
   Auth persistante + nav unifiée sur toutes les pages
   ============================================================ */

(function(){

  /* -- Clés localStorage ------------------------------------ */
  const KEY_LOGGED = 'a2s_logged_in';
  const KEY_NAME   = 'a2s_user_name';
  const KEY_EMAIL  = 'a2s_user_email';
  const KEY_PLAN   = 'a2s_user_plan';

  /* -- Utilitaires ------------------------------------------ */
  function isLoggedIn(){ return localStorage.getItem(KEY_LOGGED) === 'true'; }
  function getUserName(){ return localStorage.getItem(KEY_NAME) || ''; }
  function getUserEmail(){ return localStorage.getItem(KEY_EMAIL) || ''; }
  function getUserPlan(){ return localStorage.getItem(KEY_PLAN) || 'Essentiel'; }

  function getInitials(name, email){
    if(name && name.trim()){
      return name.trim().split(/\s+/).map(w=>w[0]).join('').substring(0,2).toUpperCase();
    }
    if(email) return email[0].toUpperCase();
    return 'U';
  }

  /* -- Mettre à jour la nav ---------------------------------- */
  function updateNav(){
    const logged    = isLoggedIn();
    const btnLogin  = document.getElementById('btnLogin');
    const navUser   = document.getElementById('navUser');
    const navAvatar = document.getElementById('navAvatar');
    const navUName  = document.getElementById('navUserName');
    const navUPlan  = document.getElementById('navUserPlan');
    const btnPost   = document.getElementById('btnPost');

    if(logged){
      /* Masquer Connexion, afficher avatar */
      if(btnLogin) btnLogin.style.display = 'none';
      if(navUser){
        navUser.style.display = 'flex';
        if(navAvatar) navAvatar.textContent = getInitials(getUserName(), getUserEmail());
        if(navUName)  navUName.textContent  = getUserName() || getUserEmail().split('@')[0] || 'Mon compte';
        if(navUPlan)  navUPlan.textContent  = getUserPlan();
      }
      /* Bouton post : lien direct (déjà connecté) */
      if(btnPost){
        btnPost.removeAttribute('onclick');
        btnPost.href = 'post-listing.html';
      }
    } else {
      /* Non connecté */
      if(btnLogin) btnLogin.style.display = '';
      if(navUser)  navUser.style.display  = 'none';
      /* Bouton post : requiert login */
      if(btnPost){
        btnPost.href = '#';
        btnPost.onclick = function(e){
          e.preventDefault();
          window.location.href = 'login.html?redirect=post-listing.html';
        };
      }
    }
  }

  /* -- Exposer les fonctions globales ----------------------- */
  window.a2sAuth = {
    isLoggedIn,
    login: function(name, email, plan){
      localStorage.setItem(KEY_LOGGED, 'true');
      if(name)  localStorage.setItem(KEY_NAME,  name);
      if(email) localStorage.setItem(KEY_EMAIL, email);
      if(plan)  localStorage.setItem(KEY_PLAN,  plan || 'Essentiel');
      updateNav();
    },
    logout: function(){
      localStorage.removeItem(KEY_LOGGED);
      localStorage.removeItem(KEY_NAME);
      localStorage.removeItem(KEY_EMAIL);
      localStorage.removeItem(KEY_PLAN);
      updateNav();
      window.location.href = 'homepage.html';
    },
    requireLogin: function(e, dest){
      if(e) e.preventDefault();
      if(isLoggedIn()){
        window.location.href = dest;
      } else {
        window.location.href = 'login.html?redirect=' + encodeURIComponent(dest);
      }
    }
  };

  /* -- Lancer dès que le DOM est prêt ----------------------- */
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', updateNav);
  } else {
    updateNav();
  }

})();
