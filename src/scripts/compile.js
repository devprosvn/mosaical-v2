
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function compile() {
    console.log('🔨 Compiling smart contracts...');
    
    try {
        // Check if hardhat is available
        execSync('npx hardhat compile', { stdio: 'inherit' });
        console.log('✅ Contracts compiled successfully!');
    } catch (error) {
        console.error('❌ Compilation failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    compile();
}

module.exports = { compile };
