-- Insert admin user with token hash for "0000"
INSERT INTO user_profiles (
    name,
    class,
    role,
    token_hash
) VALUES (
    'Administrator',
    'ADMIN',
    'admin',
    -- Hash of "0000" using SHA256
    '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0'
);