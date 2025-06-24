const fs = require('fs');
const path = require('path');

// Paths to check
const DEPLOYMENT_PATH = path.join(__dirname, '../deployments/devpros-deployment.json');
const FRONTEND_CONSTANTS_PATH = path.join(__dirname, '../../frontend/src/constants/contracts.js');

// Function to extract addresses from frontend constants file
function extractFrontendAddresses(content) {
  const addresses = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Match lines like: NFTVault: "0x32B3275Fa5E3E52AF6c42C9143699086dc83E760",
    const match = line.match(/(\w+):\s*["']([0-9a-fA-Fx]+)["']/);
    if (match) {
      const [, contractName, address] = match;
      addresses[contractName] = address;
    }
  }
  
  return addresses;
}

// Function to normalize contract names
function normalizeContractName(name) {
  // Map from frontend names to deployment file names
  const nameMap = {
    'NFTVault': 'NFTVaultV3',
    'DPOToken': 'DPOTokenV3',
    'GameFiOracle': 'GameFiOracleV3',
    'MockNFT': 'MockGameNFT'
  };
  
  return nameMap[name] || name;
}

// Main function
function main() {
  console.log('🔍 Verifying Frontend Contract Addresses...');
  
  // Check if deployment file exists
  if (!fs.existsSync(DEPLOYMENT_PATH)) {
    console.error('❌ Deployment file not found:', DEPLOYMENT_PATH);
    console.error('   Run the setup script first to create the deployment file.');
    return;
  }
  
  // Check if frontend constants file exists
  if (!fs.existsSync(FRONTEND_CONSTANTS_PATH)) {
    console.error('❌ Frontend constants file not found:', FRONTEND_CONSTANTS_PATH);
    console.error('   Make sure the path is correct.');
    return;
  }
  
  // Read deployment file
  const deployment = JSON.parse(fs.readFileSync(DEPLOYMENT_PATH, 'utf8'));
  const deployedContracts = deployment.contracts;
  
  // Read frontend constants file
  const frontendContent = fs.readFileSync(FRONTEND_CONSTANTS_PATH, 'utf8');
  const frontendAddresses = extractFrontendAddresses(frontendContent);
  
  console.log('\nDeployment Addresses:');
  console.log('--------------------');
  Object.entries(deployedContracts).forEach(([name, address]) => {
    console.log(`${name}: ${address}`);
  });
  
  console.log('\nFrontend Addresses:');
  console.log('------------------');
  Object.entries(frontendAddresses).forEach(([name, address]) => {
    console.log(`${name}: ${address}`);
  });
  
  console.log('\nAddress Comparison:');
  console.log('------------------');
  
  let hasDiscrepancy = false;
  
  // Compare addresses
  Object.entries(frontendAddresses).forEach(([frontendName, frontendAddress]) => {
    const normalizedName = normalizeContractName(frontendName);
    const deployedAddress = deployedContracts[normalizedName];
    
    if (!deployedAddress) {
      console.log(`❓ ${frontendName}: No matching contract found in deployment file`);
      return;
    }
    
    if (frontendAddress.toLowerCase() === deployedAddress.toLowerCase()) {
      console.log(`✅ ${frontendName}: Addresses match`);
    } else {
      console.log(`❌ ${frontendName}: Addresses DO NOT match!`);
      console.log(`   Frontend: ${frontendAddress}`);
      console.log(`   Deployed: ${deployedAddress}`);
      hasDiscrepancy = true;
    }
  });
  
  // Check for missing contracts in frontend
  Object.keys(deployedContracts).forEach(deployedName => {
    const frontendNames = Object.keys(frontendAddresses).map(normalizeContractName);
    if (!frontendNames.includes(deployedName)) {
      console.log(`⚠️ ${deployedName}: Contract is deployed but not found in frontend constants`);
    }
  });
  
  if (hasDiscrepancy) {
    console.log('\n⚠️ DISCREPANCIES FOUND!');
    console.log('This is likely the cause of your frontend issues.');
    console.log('Please update your frontend constants to match the deployed addresses.');
    console.log('\nRecommended frontend constants:');
    console.log('```javascript');
    console.log('export const CONTRACT_ADDRESSES = {');
    console.log(`  NFTVault: "${deployedContracts.NFTVaultV3}",`);
    console.log(`  DPOToken: "${deployedContracts.DPOTokenV3}",`);
    console.log(`  GameFiOracle: "${deployedContracts.GameFiOracleV3}",`);
    console.log(`  MosaicalGovernance: "${deployedContracts.MosaicalGovernance}",`);
    console.log(`  MockGameNFT: "${deployedContracts.MockGameNFT}"`);
    console.log('};');
    console.log('```');
  } else {
    console.log('\n✅ All addresses match!');
    console.log('If you are still having issues, the problem is likely elsewhere in your code.');
  }
}

main(); 