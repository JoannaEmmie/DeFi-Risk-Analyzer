import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "DeFiRiskAnalyzer";
const rel = "../backend";
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/DeFiRiskAnalyzer/${dirname}${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);
  const deploymentFile = path.join(chainDeploymentDir, `${contractName}.json`);
  
  if (!fs.existsSync(chainDeploymentDir) || !fs.existsSync(deploymentFile)) {
    if (!optional) {
      console.error(
        `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
      );
      process.exit(1);
    }
    // Silently skip if optional
    return undefined;
  }
  
  const jsonString = fs.readFileSync(deploymentFile, "utf-8");
  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;
  return obj;
}

// Read deployments - automatically get existing deployments, skip if not found
const deployLocalhost = readDeployment(
  "localhost",
  31337,
  CONTRACT_NAME,
  true
);

const deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true);

// Collect all existing deployments
const deployments = [];
if (deployLocalhost) {
  deployments.push(deployLocalhost);
}
if (deploySepolia) {
  deployments.push(deploySepolia);
}

// If no deployments found, try to read ABI from artifacts
let referenceDeployment = null;
let abi = null;

if (deployments.length === 0) {
  // Try to read from artifacts
  const artifactsPath = path.join(dir, "artifacts", "contracts", `${CONTRACT_NAME}.sol`, `${CONTRACT_NAME}.json`);
  if (fs.existsSync(artifactsPath)) {
    const artifactsContent = fs.readFileSync(artifactsPath, "utf-8");
    const artifacts = JSON.parse(artifactsContent);
    abi = artifacts.abi;
    console.log(`Using ABI from artifacts (no deployments found)`);
  } else {
    console.error(
      `${line}No deployments found and artifacts not available. Please deploy the contract first or compile it.${line}`
    );
    process.exit(1);
  }
} else {
  // Use the first deployment's ABI (they should all be the same)
  referenceDeployment = deployments[0];
  abi = referenceDeployment.abi;
}

// Verify all deployments have the same ABI (only if we have deployments)
if (deployments.length > 1) {
  for (const deployment of deployments) {
    if (
      JSON.stringify(referenceDeployment.abi) !== JSON.stringify(deployment.abi)
    ) {
      console.error(
        `${line}Deployments have different ABIs. Consider re-deploying the contracts.${line}`
      );
      process.exit(1);
    }
  }
}

const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify(
  { abi: abi },
  null,
  2
)} as const;
\n`;

// Build addresses object only for existing deployments
const addressesObj = {};
for (const deployment of deployments) {
  if (deployment.chainId === 11155111) {
    addressesObj["11155111"] = {
      address: deployment.address,
      chainId: 11155111,
      chainName: "sepolia"
    };
  } else if (deployment.chainId === 31337) {
    addressesObj["31337"] = {
      address: deployment.address,
      chainId: 31337,
      chainName: "hardhat"
    };
  }
}

const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = ${JSON.stringify(addressesObj, null, 2)};
`;

console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(
  path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
  tsAddresses,
  "utf-8"
);


