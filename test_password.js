const bcrypt = require('bcrypt');
const { hashPassword, comparePassword } = require('./utils/passwordUtils');

async function testPassword() {
  try {
    console.log('Testing password hashing and comparison...');

    const password = 'asdf!';
    console.log('Original password:', password);

    // Hash the password
    const hashedPassword = await hashPassword(password);
    console.log('Hashed password:', hashedPassword);

    // Compare the password
    const isMatch = await comparePassword(password, hashedPassword);
    console.log('Password match:', isMatch);

    // Test with wrong password
    const wrongMatch = await comparePassword('wrongpassword', hashedPassword);
    console.log('Wrong password match:', wrongMatch);

    console.log('✅ Password test completed successfully!');
  } catch (error) {
    console.error('❌ Password test failed:', error);
  }
}

testPassword();
