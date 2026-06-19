#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 SafeMeds Environment Setup');
console.log('============================\n');

// Check if .env.local already exists
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists. Please check if DATABASE_URL is configured.');
  console.log('   If you need to update it, edit the file manually.\n');
  process.exit(0);
}

// Get database URL from user
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Please provide your PostgreSQL database connection details:');
console.log('(Press Enter to use default values)\n');

rl.question('Database host (default: localhost): ', (host) => {
  rl.question('Database port (default: 5432): ', (port) => {
    rl.question('Database name (default: safemeds): ', (dbName) => {
      rl.question('Database username (default: postgres): ', (username) => {
        rl.question('Database password: ', (password) => {
          rl.question('NextAuth secret (press Enter to generate): ', (nextAuthSecret) => {
            rl.question('NextAuth URL (default: http://localhost:3000): ', (nextAuthUrl) => {
              
              // Set defaults
              host = host || 'localhost';
              port = port || '5432';
              dbName = dbName || 'safemeds';
              username = username || 'postgres';
              nextAuthUrl = nextAuthUrl || 'http://localhost:3000';
              
              // Generate NextAuth secret if not provided
              if (!nextAuthSecret) {
                nextAuthSecret = require('crypto').randomBytes(32).toString('hex');
              }
              
              if (!password) {
                console.log('\n❌ Database password is required!');
                rl.close();
                return;
              }
              
              // Create .env.local content
              const envContent = `# Database Configuration
DATABASE_URL="postgresql://${username}:${password}@${host}:${port}/${dbName}"

# NextAuth Configuration
NEXTAUTH_SECRET="${nextAuthSecret}"
NEXTAUTH_URL="${nextAuthUrl}"

# Firebase Configuration (if using Firebase services)
# Add your Firebase config here if needed
`;

              // Write .env.local file
              try {
                fs.writeFileSync(envPath, envContent);
                console.log('\n✅ .env.local file created successfully!');
                console.log('\n📋 Next steps:');
                console.log('1. Make sure PostgreSQL is running');
                console.log('2. Create the database if it doesn\'t exist:');
                console.log(`   CREATE DATABASE ${dbName};`);
                console.log('3. Run database migrations:');
                console.log('   npm run db:push');
                console.log('4. Start the development server:');
                console.log('   npm run dev');
                console.log('\n🎉 You\'re all set!');
              } catch (error) {
                console.log('\n❌ Error creating .env.local file:', error.message);
              }
              
              rl.close();
            });
          });
        });
      });
    });
  });
});
