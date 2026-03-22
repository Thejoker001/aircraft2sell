/* ============================================================
   supabase.js — Aircraft2Sell
   Client Supabase centralisé — inclure sur toutes les pages :
   <script src="supabase.js"></script>
   ============================================================ */

const SUPABASE_URL  = 'https://hlivysnlzlqdjcigqgvk.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsaXZ5c25semxxZGpjaWdxZ3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjIwNzAsImV4cCI6MjA4OTc5ODA3MH0.5tKQLlx9LsSujgILJKpmo__ByHorH6KuLyznE-mBVwU';

/* ── Requête générique ── */
async function sbRequest(method, path, body) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    method,
    headers: {
      'apikey':        SUPABASE_ANON,
      'Authorization': 'Bearer ' + SUPABASE_ANON,
      'Content-Type':  'application/json',
      'Prefer':        method === 'POST' ? 'return=representation' : 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

/* ── LISTINGS ── */
window.A2S = window.A2S || {};

A2S.getListings = async function(filters) {
  let path = 'listings?order=submitted_at.desc';
  if (filters && filters.status) path += '&status=eq.' + filters.status;
  const rows = await sbRequest('GET', path);
  return rows.map(sbToListing);
};

A2S.getLiveListings = async function() {
  return A2S.getListings({ status: 'live' });
};

A2S.getPendingListings = async function() {
  return A2S.getListings({ status: 'pending' });
};

A2S.insertListing = async function(listing) {
  const row = listingToSb(listing);
  const result = await sbRequest('POST', 'listings', row);
  return Array.isArray(result) ? result[0] : result;
};

A2S.updateListingStatus = async function(id, status, rejectionReason) {
  const body = { status };
  if (rejectionReason !== undefined) body.rejection_reason = rejectionReason;
  return sbRequest('PATCH', 'listings?id=eq.' + id, body);
};

A2S.updateListing = async function(id, fields) {
  const body = listingToSb(fields);
  return sbRequest('PATCH', 'listings?id=eq.' + id, body);
};

A2S.deleteListing = async function(id) {
  return sbRequest('DELETE', 'listings?id=eq.' + id);
};

/* ── USERS ── */
A2S.getUsers = async function() {
  return sbRequest('GET', 'users?order=registered_at.desc');
};

A2S.upsertUser = async function(user) {
  // Upsert par email
  const body = {
    name:          user.name  || '',
    email:         user.email || '',
    plan:          user.plan  || 'Essentiel',
    status:        user.status || 'active',
    registered_at: user.registeredAt || user.registered_at || new Date().toISOString()
  };
  if (user.id) body.id = user.id;
  return sbRequest('POST', 'users?on_conflict=email', { ...body, _upsert: true });
};

A2S.updateUser = async function(id, fields) {
  return sbRequest('PATCH', 'users?id=eq.' + id, fields);
};

A2S.deleteUser = async function(id) {
  return sbRequest('DELETE', 'users?id=eq.' + id);
};

A2S.ensureUser = async function(email, name, plan) {
  // Crée l'utilisateur s'il n'existe pas encore
  try {
    const existing = await sbRequest('GET', 'users?email=eq.' + encodeURIComponent(email));
    if (existing && existing.length > 0) {
      // Mettre à jour le nom/plan si fournis
      if (name || plan) {
        const upd = {};
        if (name) upd.name = name;
        if (plan) upd.plan = plan;
        await sbRequest('PATCH', 'users?email=eq.' + encodeURIComponent(email), upd);
      }
      return existing[0];
    }
    // Créer
    const newUser = {
      id:            Date.now(),
      name:          name  || email.split('@')[0],
      email:         email,
      plan:          plan  || 'Essentiel',
      status:        'active',
      registered_at: new Date().toISOString()
    };
    const result = await sbRequest('POST', 'users', newUser);
    return Array.isArray(result) ? result[0] : result;
  } catch(e) {
    console.error('A2S.ensureUser error:', e);
  }
};

/* ── CONVERTISSEURS ── */
// Supabase snake_case → JS camelCase
function sbToListing(row) {
  return {
    id:              row.id,
    make:            row.make,
    model:           row.model,
    year:            row.year,
    price:           row.price,
    currency:        row.currency || 'EUR',
    category:        row.category,
    airport:         row.airport,
    country:         row.country,
    desc:            row.desc,
    status:          row.status || 'pending',
    sellerName:      row.seller_name,
    sellerEmail:     row.seller_email,
    views:           row.views || 0,
    enquiries:       row.enquiries || 0,
    icon:            row.icon || '✈',
    rejectionReason: row.rejection_reason,
    submittedAt:     row.submitted_at,
    title:           [row.make, row.model, row.year ? '(' + row.year + ')' : ''].filter(Boolean).join(' ')
  };
}

// JS camelCase → Supabase snake_case
function listingToSb(l) {
  const row = {};
  if (l.id          !== undefined) row.id            = l.id;
  if (l.make        !== undefined) row.make          = l.make;
  if (l.model       !== undefined) row.model         = l.model;
  if (l.year        !== undefined) row.year          = l.year;
  if (l.price       !== undefined) row.price         = l.price;
  if (l.currency    !== undefined) row.currency      = l.currency;
  if (l.category    !== undefined) row.category      = l.category;
  if (l.airport     !== undefined) row.airport       = l.airport;
  if (l.country     !== undefined) row.country       = l.country;
  if (l.desc        !== undefined) row.desc          = l.desc;
  if (l.status      !== undefined) row.status        = l.status;
  if (l.sellerName  !== undefined) row.seller_name   = l.sellerName;
  if (l.sellerEmail !== undefined) row.seller_email  = l.sellerEmail;
  if (l.views       !== undefined) row.views         = l.views;
  if (l.enquiries   !== undefined) row.enquiries     = l.enquiries;
  if (l.icon        !== undefined) row.icon          = l.icon;
  if (l.submittedAt !== undefined) row.submitted_at  = l.submittedAt;
  if (l.rejectionReason !== undefined) row.rejection_reason = l.rejectionReason;
  return row;
}

/* ── FALLBACK localStorage (si Supabase indisponible) ── */
A2S.isOnline = async function() {
  try {
    await sbRequest('GET', 'listings?limit=1');
    return true;
  } catch(e) {
    return false;
  }
};

console.log('[A2S] Supabase client chargé —', SUPABASE_URL);
