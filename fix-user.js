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

async function fixUser() {
  const email = 'raulferreiradesouza@gmail.com';
  console.log(`Fixing user: ${email}`);

  // 1. Get auth user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const authUser = users.find(u => u.email === email);

  if (!authUser) {
    console.log('User not in Auth. Creating...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: 'Temporary123@',
      email_confirm: true
    });
    if (createError) {
        console.error('Create error:', createError);
        return;
    }
    console.log('Created as:', newUser.user.id);
  } else {
    console.log('User in Auth. Confirming and setting password...');
    const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
        email_confirm: true,
        password: 'Temporary123@' // Give them a known temp password to start over
    });
    if (updateError) {
        console.error('Update error:', updateError);
        return;
    }
    console.log('Updated Auth user.');
  }

  // 2. Update DB
  const finalAuthUser = (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === email);
  const { error: dbError } = await supabase.from('system_users').update({
    auth_id: finalAuthUser.id,
    temp_password: 'Temporary123@',
    must_change_password: true
  }).eq('email', email);

  if (dbError) {
    console.error('DB Error:', dbError);
  } else {
    console.log('DB Updated. User should now be able to login with Temporary123@ and reset.');
  }
}

fixUser();
