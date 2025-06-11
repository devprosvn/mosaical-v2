
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function compile() {
    try {
        console.log('🔨 Compiling contracts...');
        
        // Create build directory if it doesn't exist
        const buildDir = path.join(__dirname, '../build');
        if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, { recursive: true });
        }
        
        // Get all Solidity files
        const contractsDir = path.join(__dirname, '../contracts');
        const files = fs.readdirSync(contractsDir).filter(file => file.endsWith('.sol'));
        
        for (const file of files) {
            const contractPath = path.join(contractsDir, file);
            const contractName = file.replace('.sol', '');
            
            console.log(`Compiling ${file}...`);
            
            // Compile with solc
            const output = execSync(`solc --combined-json abi,bin,bin-runtime --optimize --base-path . --include-path node_modules "${contractPath}"`, {
                encoding: 'utf8',
                cwd: path.join(__dirname, '..')
            });
            
            const compiled = JSON.parse(output);
            
            // Save compilation output
            const outputPath = path.join(buildDir, `${contractName}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(compiled, null, 2));
            
            console.log(`✅ ${contractName} compiled successfully`);
        }
        
        console.log('🎉 All contracts compiled successfully!');
    } catch (error) {
        console.error('❌ Compilation failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    compile();
}

module.exports = { compile };
