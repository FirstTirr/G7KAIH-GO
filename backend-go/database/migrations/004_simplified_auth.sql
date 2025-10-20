-- Drop existing auth-related constraints and columns
ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_user_id_fkey;
ALTER TABLE user_profiles DROP COLUMN user_id;
ALTER TABLE user_profiles ADD COLUMN token_hash VARCHAR(255) NOT NULL;
ALTER TABLE user_profiles ALTER COLUMN role SET DEFAULT 'siswa';

-- Drop users table as it's no longer needed
DROP TABLE users CASCADE;

-- Add unique constraint on token_hash
CREATE UNIQUE INDEX idx_user_profiles_token_hash ON user_profiles(token_hash) WHERE deleted_at IS NULL;

-- Update activities and comments to reference user_profiles instead of users
ALTER TABLE activities 
    DROP CONSTRAINT activities_user_id_fkey,
    ADD COLUMN user_profile_id UUID,
    ADD CONSTRAINT activities_user_profile_id_fkey 
        FOREIGN KEY (user_profile_id) 
        REFERENCES user_profiles(id) 
        ON DELETE CASCADE;

UPDATE activities 
SET user_profile_id = (
    SELECT id FROM user_profiles 
    WHERE user_profiles.user_id = activities.user_id
);

ALTER TABLE activities 
    DROP COLUMN user_id,
    ALTER COLUMN user_profile_id SET NOT NULL;

ALTER TABLE comments
    DROP CONSTRAINT comments_user_id_fkey,
    ADD COLUMN user_profile_id UUID,
    ADD CONSTRAINT comments_user_profile_id_fkey 
        FOREIGN KEY (user_profile_id) 
        REFERENCES user_profiles(id) 
        ON DELETE CASCADE;

UPDATE comments
SET user_profile_id = (
    SELECT id FROM user_profiles 
    WHERE user_profiles.user_id = comments.user_id
);

ALTER TABLE comments
    DROP COLUMN user_id,
    ALTER COLUMN user_profile_id SET NOT NULL;

-- Add indexes for performance
CREATE INDEX idx_activities_user_profile_id ON activities(user_profile_id);
CREATE INDEX idx_comments_user_profile_id ON comments(user_profile_id);