const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) {
      process.env[parts[0].trim()] = parts[1].trim();
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const { data, error } = await supabase
    .from('system_users')
    .select('id, email, auth_id, temp_password, must_change_password')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log('--- system_users (Public Schema) ---');
  data.forEach(u => {
    console.log(`Email: ${u.email} | AuthID: ${u.auth_id || 'NULL'} | Temp: ${u.temp_password || 'NULL'} | MustChange: ${u.must_change_password}`);
  });

  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }

  console.log('\n--- auth.users (Auth Schema) ---');
  users.forEach(u => {
    console.log(`Email: ${u.email} | ID: ${u.id} | Confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'} | LastSign: ${u.last_sign_in_at || 'NEVER'}`);
  });
}

checkUsers();
