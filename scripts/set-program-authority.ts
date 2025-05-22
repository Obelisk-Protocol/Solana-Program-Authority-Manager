import { execSync } from 'child_process';
import path from 'path'; // Used for resolving the keypair path, can be removed if absolute paths are always used.

// --- IMPORTANT: CONFIGURE THESE VALUES BEFORE RUNNING ---
// Note: If running in WSL, ensure paths are WSL-compatible (e.g., /mnt/c/Users/...)
// Ensure your Solana CLI is configured to the desired cluster or set it explicitly via --url.

// 1. Current Authority Keypair Path:
//    File path to the JSON keypair of the CURRENT upgrade authority.
//    This keypair signs the transaction and pays fees.
//    Example: "/home/user/.config/solana/id.json" or "C:\\Users\\YourUser\\keys\\current_auth.json"
const CURRENT_AUTHORITY_KEYPAIR_PATH: string = "REPLACE_WITH_PATH_TO_YOUR_CURRENT_AUTHORITY_KEYPAIR.json";

// 2. Target Program ID:
//    Public key (as a string) of the program whose authority you want to change.
//    Example: "YourProgramId11111111111111111111111111111111"
const TARGET_PROGRAM_ID_STRING: string = "REPLACE_WITH_YOUR_PROGRAM_ID";

// 3. New Upgrade Authority Pubkey:
//    Public key (as a string) of the NEW desired upgrade authority.
//    This can be a PDA or another keypair's public key.
//    Example (PDA): "YourPDAPubkey111111111111111111111111111111"
//    Example (Keypair): "NewAuthorityKeypairPubkey111111111111111111"
const NEW_UPGRADE_AUTHORITY_PUBKEY_STRING: string = "REPLACE_WITH_THE_NEW_UPGRADE_AUTHORITY_PUBKEY";

// 4. Solana Cluster URL:
//    The Solana cluster to target.
//    Examples:
//      Devnet: "https://api.devnet.solana.com"
//      Testnet: "https://api.testnet.solana.com"
//      Mainnet-Beta: "https://api.mainnet-beta.solana.com" (Use with extreme caution!)
const SOLANA_CLUSTER_URL: string = "https://api.devnet.solana.com";
// --- END CONFIGURATION ---

function main() {
    console.log("--- Solana Program Authority Setter ---");
    console.log("IMPORTANT: Ensure you have configured the constants at the top of this script!");
    console.log("This script will attempt to set the upgrade authority using the Solana CLI.");

    // Resolve the keypair path to an absolute path for robustness.
    // This helps if the script is called from a different directory.
    // const absoluteAuthorityKeypairPath = path.resolve(CURRENT_AUTHORITY_KEYPAIR_PATH);

    if (
        CURRENT_AUTHORITY_KEYPAIR_PATH === "REPLACE_WITH_PATH_TO_YOUR_CURRENT_AUTHORITY_KEYPAIR.json" ||
        TARGET_PROGRAM_ID_STRING === "REPLACE_WITH_YOUR_PROGRAM_ID" ||
        NEW_UPGRADE_AUTHORITY_PUBKEY_STRING === "REPLACE_WITH_THE_NEW_UPGRADE_AUTHORITY_PUBKEY"
    ) {
        console.error("\nERROR: Default placeholder values are still present in the script.");
        console.error("Please edit this script and replace the placeholder values in the configuration section.");
        process.exit(1);
    }
    
    // Construct the Solana CLI command
    // The --skip-new-upgrade-authority-signer-check flag is crucial for setting a PDA as authority
    // or when the new authority keypair is not intended to co-sign this specific transaction.
    const cliCommand = [
        "solana",
        "program",
        "set-upgrade-authority",
        TARGET_PROGRAM_ID_STRING,
        "--upgrade-authority", CURRENT_AUTHORITY_KEYPAIR_PATH, // Using path directly
        "--new-upgrade-authority", NEW_UPGRADE_AUTHORITY_PUBKEY_STRING,
        "--skip-new-upgrade-authority-signer-check",
        "--url", SOLANA_CLUSTER_URL,
        "--output", "json", // Request JSON output for easier parsing if needed later
        "-v" // Verbose output from Solana CLI
    ].join(" ");

    console.log("\nExecuting Solana CLI command:");
    console.log(cliCommand);
    console.log("\nThis may take a few moments...");

    try {
        // Execute the command
        const stdout = execSync(cliCommand, { encoding: 'utf8', stdio: 'pipe' });
        
        console.log("\nCLI Command Output:");
        console.log(stdout);

        // Basic success check (can be improved by parsing JSON output)
        if (stdout.includes("Finalizing transaction") || stdout.includes(NEW_UPGRADE_AUTHORITY_PUBKEY_STRING)) {
            console.log("\nSUCCESS: The Solana CLI command appears to have executed successfully.");
            console.log(`The new upgrade authority for program ${TARGET_PROGRAM_ID_STRING} should now be ${NEW_UPGRADE_AUTHORITY_PUBKEY_STRING}.`);
            console.log("\nTo verify, run manually:");
            console.log(`solana program show ${TARGET_PROGRAM_ID_STRING} --url ${SOLANA_CLUSTER_URL}`);
        } else {
            console.log("\nINFO: CLI command executed. Review the output above to confirm the authority change.");
             console.log("If you expected JSON output with a signature, ensure your Solana CLI version supports it and the command was successful.");
        }

    } catch (error: any) {
        console.error("\nERROR: Solana CLI command execution failed.");
        if (error.stderr) {
            console.error("CLI Error Output (stderr):");
            console.error(error.stderr.toString());
        }
        if (error.stdout) { // Sometimes errors also print to stdout
            console.error("CLI Standard Output (stdout, on error):");
            console.error(error.stdout.toString());
        }
        if (!error.stderr && !error.stdout) {
            console.error("Full error object:", error.message);
        }
        console.error("\nPlease check the command, paths, network, and your Solana CLI setup.");
        process.exit(1);
    }
}

main(); 