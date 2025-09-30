// Script to run the guruwali supervision migration

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'

async function runMigration() {
  try {
    // Create admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables')
    }
    
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'database_migrations', 'add_guruwali_supervision.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    console.log('Running migration: add_guruwali_supervision.sql')
    
    // Split SQL statements and execute them one by one
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 100) + '...')
      const { error } = await adminClient.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.error('Statement failed:', error)
        console.error('Statement was:', statement)
        process.exit(1)
      }
    }
    
    console.log('Migration completed successfully!')
    
  } catch (err) {
    console.error('Error running migration:', err)
    process.exit(1)
  }
}

runMigration()
