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
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSpecificUser() {
  const email = 'raulferreiradesouza@gmail.com';
  console.log(`Checking user: ${email}`);

  const { data: dbUser, error: dbError } = await supabase
    .from('system_users')
    .select('*')
    .eq('email', email)
    .single();

  console.log('--- DB Data ---');
  console.log(dbUser || dbError);

  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  const authUser = users.find(u => u.email === email);

  console.log('\n--- Auth Data ---');
  console.log(authUser || 'Not found in Auth');
}

checkSpecificUser();
