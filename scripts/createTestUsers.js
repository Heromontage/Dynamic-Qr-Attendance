// Script to create test users
// Run: node scripts/createTestUsers.js

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // You need to download this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function createTestUsers() {
  const users = [
    {
      email: 'teacher@test.com',
      password: 'test123',
      displayName: 'Test Teacher',
      role: 'teacher'
    },
    {
      email: 'student@test.com',
      password: 'test123',
      displayName: 'Test Student',
      role: 'student'
    }
  ];

  for (const userData of users) {
    try {
      // Create user in Auth
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName
      });

      console.log(`✅ Created ${userData.role}: ${userData.email}`);

      // Add user profile to Firestore
      await db.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        createdAt: new Date().toISOString()
      });

      console.log(`✅ Added profile for: ${userData.email}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  User already exists: ${userData.email}`);
      } else {
        console.error(`❌ Error creating ${userData.email}:`, error.message);
      }
    }
  }

  console.log('\n✅ Test users created!');
  console.log('\nLogin Credentials:');
  console.log('Teacher: teacher@test.com / test123');
  console.log('Student: student@test.com / test123');
  
  process.exit(0);
}

createTestUsers();
