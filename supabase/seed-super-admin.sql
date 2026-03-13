INSERT INTO system_users (id, auth_id, agency_id, email, name, role, must_change_password, temp_password)
VALUES (
    uuid_generate_v4(), 
    NULL, -- No auth_id yet, will link on first login
    NULL, -- Super admins are global
    'raul_fds@hotmail.com',
    'Raul Super Admin',
    'SUPER_ADMIN',
    true,
    'Warzone1@'
)
ON CONFLICT (email) DO NOTHING;
