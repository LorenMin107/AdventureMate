const { comparePassword } = require('./utils/passwordUtils');

async function testAdminPassword() {
  try {
    console.log('Testing admin password...');

    const password = 'asdf!';
    const storedHash = '$2b$12$6midRgL2IxoQUJLvB5Ley.50xQhgimIxIT7PYM1tc86z5kT9mcU9C';

    console.log('Testing password:', password);
    console.log('Stored hash:', storedHash);

    // Compare the password
    const isMatch = await comparePassword(password, storedHash);
    console.log('Password match:', isMatch);

    console.log('✅ Admin password test completed!');
  } catch (error) {
    console.error('❌ Admin password test failed:', error);
  }
}

testAdminPassword();
