# <!-- Placeholder for Obelisk Protocol Logo -->
# Obelisk Protocol: Solana Program Authority Manager (for PDAs & Non-Signing Authorities)

**Built to Last. Powered by Play.**

This script provides a straightforward way to set or change the upgrade authority of a Solana program using the Solana Command Line Interface (CLI). It is particularly useful for delegating upgrade authority to a Program Derived Address (PDA) or another keypair where the new authority cannot or will not sign the authority change transaction itself, leveraging the crucial `--skip-new-upgrade-authority-signer-check` flag.

[![Discord](https://img.shields.io/badge/Discord-Join%20Chat-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/your-obelisk-discord-link) <!-- TODO: Replace with actual Discord link -->
[![Twitter Follow](https://img.shields.io/twitter/follow/ObeliskProtocol?style=for-the-badge&logo=twitter&label=Follow%20on%20X)](https://twitter.com/ObeliskProtocol) <!-- TODO: Replace with actual X/Twitter profile if different -->

---

## Overview

Managing program upgrade authorities on Solana is a critical administrative task. While Solana provides mechanisms for this, directly using library functions like `@solana/web3.js`'s `BpfLoaderUpgradeable.setAuthority()` can sometimes present challenges with instruction data or linter errors. 

This tool simplifies the process by leveraging the robust and reliable Solana CLI. It automates the execution of the `solana program set-upgrade-authority` command, with a special focus on the `--skip-new-upgrade-authority-signer-check` flag. This flag is essential when:

*   Setting a PDA as the new upgrade authority (as PDAs cannot sign transactions).
*   Setting a new keypair as the authority without requiring that new keypair to co-sign the authority change transaction itself.

This script is born from the practical needs identified within the XGODS-Contracts project (now part of Obelisk Protocol) for managing program lifecycle and ensuring secure, auditable upgrade paths, often to multisig-controlled PDAs.

## Disclaimer

This tool is provided as-is, without any warranty. Always understand what a script does before running it, especially when dealing with program authorities and keypairs. Use at your own risk. This is not financial advice. Ensure you are operating on the correct Solana cluster (e.g., devnet, testnet, mainnet-beta) and have backed up all relevant keypairs.

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed and configured:

1.  **Node.js and npm (or yarn):** [Install Node.js](https://nodejs.org/) (which includes npm).
2.  **Solana CLI:** [Install the Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) and ensure it is configured correctly and accessible in your system's PATH. The script will use your default Solana CLI configuration unless overridden by the `SOLANA_CLUSTER_URL` in the script.
3.  **Project Setup:**
    *   Clone this repository or download the script into a directory.
    *   Navigate to the tool's directory (e.g., `1-transferauthtopda/` or your chosen folder name).
    *   Run the following command to install necessary dependencies (TypeScript, ts-node, and type definitions for Node.js) locally for this tool:
        ```bash
        npm install
        # or, if you prefer yarn:
        # yarn install
        ```
    *   This step uses the `package.json` file included with this tool.

## ⚙️ Configuration

Before running the script, you **MUST** configure the constants at the top of the `scripts/set-program-authority.ts` file:

1.  `CURRENT_AUTHORITY_KEYPAIR_PATH`: 
    *   **Description:** The file path to the JSON keypair of the *current* upgrade authority for the target program. This keypair will sign the transaction and pay the fees.
    *   **Format:** String. Use WSL-compatible paths if running in a WSL environment (e.g., `/mnt/c/Users/YourUser/keys/current_auth.json`). For standard systems, use the appropriate absolute or relative path.
    *   **Example:** `"/home/user/.config/solana/id.json"` or `"C:\\Users\\YourUser\\keys\\current_auth.json"`

2.  `TARGET_PROGRAM_ID_STRING`:
    *   **Description:** The public key (as a string) of the Solana program whose upgrade authority you want to change.
    *   **Format:** String.
    *   **Example:** `"YourProgramId11111111111111111111111111111111"`

3.  `NEW_UPGRADE_AUTHORITY_PUBKEY_STRING`:
    *   **Description:** The public key (as a string) of the *new* desired upgrade authority. **This is typically a PDA when using this script's primary intended functionality.** It can also be another keypair's public key if that keypair will not be signing this transaction.
    *   **Format:** String.
    *   **Example (for a PDA):** `"YourPDAPubkey111111111111111111111111111111"`
    *   **Example (for another keypair):** `"NewAuthorityKeypairPubkey111111111111111111"`

4.  `SOLANA_CLUSTER_URL`:
    *   **Description:** The Solana RPC cluster URL you are targeting.
    *   **Format:** String.
    *   **Examples:**
        *   Devnet: `"https://api.devnet.solana.com"`
        *   Testnet: `"https://api.testnet.solana.com"`
        *   Mainnet-Beta: `"https://api.mainnet-beta.solana.com"` (🔴 Use with extreme caution!)

## ▶️ Usage

1.  Ensure you have correctly configured `scripts/set-program-authority.ts` as described above.
2.  Navigate to the root directory of this tool (e.g., `1-transferauthtopda/`).
3.  Run the script using `ts-node` (you can also use the npm script `npm run set-authority` or `npm start`):
    ```bash
    npx ts-node ./scripts/set-program-authority.ts
    ```
    Alternatively, using npm scripts defined in `package.json`:
    ```bash
    npm run set-authority
    # or
    # npm start
    ```
4.  The script will output the Solana CLI command it is constructing and executing, followed by the result from the CLI.

## 🤔 How It Works

The script performs the following actions:

1.  Reads the configuration variables you set.
2.  Constructs a Solana CLI command similar to this:
    ```bash
    solana program set-upgrade-authority <TARGET_PROGRAM_ID_STRING> \
        --upgrade-authority <CURRENT_AUTHORITY_KEYPAIR_PATH> \
        --new-upgrade-authority <NEW_UPGRADE_AUTHORITY_PUBKEY_STRING> \
        --skip-new-upgrade-authority-signer-check \
        --url <SOLANA_CLUSTER_URL> \
        --output json -v
    ```
3.  Executes this command using Node.js's `child_process.execSync`.
4.  Prints the output from the Solana CLI.

**The `--skip-new-upgrade-authority-signer-check` flag is critical.** It allows the transaction to succeed even if the new authority (e.g., a PDA) cannot sign, or if you intend for a new keypair authority not to sign this specific transaction.

## ✅ Verification

After running the script, always verify the authority change on-chain:

1.  **Check Script Output:** Look for success messages or a transaction signature in the script's console output.
2.  **Manual CLI Check:** Use the Solana CLI to inspect the program's details:
    ```bash
    solana program show <TARGET_PROGRAM_ID_STRING> --url <SOLANA_CLUSTER_URL>
    ```
    In the output, look for the "Authority" or "Upgrade authority" field. It should now display the public key you set as `NEW_UPGRADE_AUTHORITY_PUBKEY_STRING`.

## ⚠️ Important Notes & Troubleshooting

*   **Fee Payer:** The keypair specified by `CURRENT_AUTHORITY_KEYPAIR_PATH` acts as the authority signing the `set-upgrade-authority` instruction and also pays the transaction fees. Ensure it has sufficient SOL on the target cluster.
*   **Keypair Security:** Handle your keypair JSON files with extreme care. Do not commit them to version control or expose them publicly.
*   **WSL Path Issues:** If using Windows Subsystem for Linux (WSL), ensure that `CURRENT_AUTHORITY_KEYPAIR_PATH` uses the correct WSL path format (e.g., `/mnt/c/Users/...` instead of `C:\Users\...`).
*   **CLI Errors:** If the script fails, carefully review the error messages from the Solana CLI output. Common issues include incorrect keypair paths, insufficient funds, or network problems.

## 🤝 Contributing

Contributions to enhance this tool or integrate it further into the Obelisk ecosystem are welcome! Please follow standard GitHub practices for contributions (fork, branch, pull request).

(Consider adding a `CONTRIBUTING.md` for more detailed guidelines if this project grows.)

## 📜 License

This project is licensed under the MIT License. See the `LICENSE.md` file for details.

---

**Obelisk Protocol** - _Built to Last. Powered by Play._

[Explore more Obelisk Protocol repositories on GitHub](https://github.com/Obelisk-Protocol)
