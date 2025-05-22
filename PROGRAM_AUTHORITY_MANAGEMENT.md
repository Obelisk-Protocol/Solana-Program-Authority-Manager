# Program Upgrade Authority Management in XGODS-Contracts

This document outlines the findings, procedures, and scripts related to managing the upgrade authority of Solana programs within the XGODS-Contracts project, specifically focusing on delegating this authority to a Program Derived Address (PDA) controlled by the multisig program.

## 1. Objective

The primary goal was to transfer the upgrade authority of on-chain programs (e.g., `test_upgradeable_program`, and eventually `multisig_program` and `vault_program`) from a keypair to a PDA. This PDA is intended to be controlled by the `multisig_program`, enabling program upgrades to be managed via multisignature proposals.

## 2. Key Challenges and Findings

### a. Direct `@solana/web3.js` Usage for `BpfLoaderUpgradeable.setAuthority`
Initial attempts to use `@solana/web3.js` library functions, specifically `BpfLoaderUpgradeable.setAuthority()` or constructing the `TransactionInstruction` manually, faced persistent issues:
- **Linter/Runtime Errors:** For `@solana/web3.js@^1.98.2`, the `BpfLoaderUpgradeable` class and its static methods were not found at the expected import paths (e.g., `web3.BpfLoaderUpgradeable` or named import `{ BpfLoaderUpgradeable }`).
- **"Invalid Instruction Data":** When manually constructing the `SetAuthority` instruction for the BPF Upgradeable Loader program, transactions repeatedly failed with "invalid instruction data," even after meticulous alignment with the Rust instruction format and account meta requirements (writable flags, signers).

### b. Success with Solana CLI
The Solana Command Line Interface (CLI) proved to be a reliable method for changing program upgrade authority. The key to successfully setting a PDA (or a keypair that won't sign the `setAuthority` transaction itself) as the new upgrade authority is the `--skip-new-upgrade-authority-signer-check` flag.

**Example Successful CLI Command (Keypair to Keypair):**
```bash
solana program set-upgrade-authority <PROGRAM_ID> \
    --upgrade-authority <PATH_TO_CURRENT_AUTHORITY_KEYPAIR_JSON> \
    --new-upgrade-authority <NEW_AUTHORITY_PUBKEY> \
    --skip-new-upgrade-authority-signer-check \
    --url <CLUSTER_URL> \
    -v
```

**Example Successful CLI Command (Keypair to PDA):**
```bash
solana program set-upgrade-authority <PROGRAM_ID> \
    --upgrade-authority <PATH_TO_CURRENT_AUTHORITY_KEYPAIR_JSON> \
    --new-upgrade-authority <PDA_PUBKEY> \
    --skip-new-upgrade-authority-signer-check \
    --url <CLUSTER_URL> \
    -v
```

### c. The Role of `--skip-new-upgrade-authority-signer-check`
This flag is essential because:
- When the new authority is a PDA, the PDA cannot sign the transaction. This flag tells the Solana runtime not to require a signature from the new authority.
- Even for keypair-to-keypair transfers, if the new authority keypair is not intended to be a co-signer of *this specific `setAuthority` transaction*, this flag is necessary.

## 3. Automation Script: `scripts/transfer-upgrade-authority.ts`

To automate the process and integrate it into a Node.js/TypeScript environment, the script `XGODS-Contracts/scripts/transfer-upgrade-authority.ts` was developed.

**Core Logic:**
- The script uses Node.js's `child_process.execSync` to execute the Solana CLI `program set-upgrade-authority` command.
- It dynamically constructs the CLI command based on constants defined at the top of the script.
- It handles loading the necessary keypair (the *current* upgrade authority) to sign the transaction via the CLI.
- It includes basic parsing of the CLI output to confirm success.

**Key Configuration Constants in the Script:**
- `CURRENT_AUTHORITY_KEYPAIR_PATH`: (String) WSL-compatible path to the JSON file of the keypair that is the *current* upgrade authority of the program. This keypair pays the transaction fees.
- `TARGET_PROGRAM_ID_STRING`: (String) The public key of the program whose authority is to be changed.
- `NEW_UPGRADE_AUTHORITY_PUBKEY_STRING`: (String) The public key of the new desired upgrade authority (can be a PDA or another keypair's public key).
- `SOLANA_CLUSTER_URL`: (String) The Solana cluster URL (e.g., `https://api.devnet.solana.com`).

## 4. Procedure for Transferring Program Upgrade Authority

### Step 1: Identify Current and New Authorities
- **Current Authority:** Determine the public key of the current upgrade authority for the program you want to modify. You will need the file path to its keypair JSON.
    - Use `solana program show <PROGRAM_ID> --url <CLUSTER_URL>` to find the current authority.
- **New Authority:** Determine the public key of the desired new upgrade authority. This can be:
    - A PDA (e.g., your multisig PDA: `CJu1upenXeUXtujm48W4YZE3FHiaTdz1Bdw2rFyVcESe`).
    - Another keypair's public key.

### Step 2: Configure `transfer-upgrade-authority.ts`
Open `XGODS-Contracts/scripts/transfer-upgrade-authority.ts` and update the following constants:
- `CURRENT_AUTHORITY_KEYPAIR_PATH`: Set to the WSL path of the current authority's keypair file.
    - *Example for `test_upgradeable_program` after its authority was set to `4QTs...`*: `"/mnt/c/Users/caleb/Desktop/xgodsvault/temp_new_authority_3.json"`
- `TARGET_PROGRAM_ID_STRING`: The program ID to modify.
    - *Example*: `"2iFJrGRfi3BLDtDRNkesvDBEWAyojrn8ZpZhCr6FvL3B"`
- `NEW_UPGRADE_AUTHORITY_PUBKEY_STRING`: The public key of the new authority.
    - *Example for Multisig PDA*: `"CJu1upenXeUXtujm48W4YZE3FHiaTdz1Bdw2rFyVcESe"`

### Step 3: Ensure Solana CLI is Configured and Funded
- The Solana CLI used by the script will typically use the default fee payer configured in your Solana CLI settings, but the script explicitly passes the `--upgrade-authority` keypair, which also acts as the fee payer for this specific transaction.
- Ensure the keypair specified by `CURRENT_AUTHORITY_KEYPAIR_PATH` has sufficient SOL on the target cluster to cover transaction fees. The script includes an airdrop function for devnet if the balance is low.

### Step 4: Run the Script
Execute the script from your WSL terminal, from the root of the `XGODS-Contracts` directory:
```bash
npx ts-node scripts/transfer-upgrade-authority.ts
```

### Step 5: Verify
- Check the script output for success messages and the transaction signature (if parsed).
- Manually verify the change on-chain:
  ```bash
  solana program show <TARGET_PROGRAM_ID_STRING> --url <SOLANA_CLUSTER_URL>
  ```
  Confirm that the "Authority" field now shows the `NEW_UPGRADE_AUTHORITY_PUBKEY_STRING`.

## 5. Important Program IDs and Keypairs (Devnet Examples)

- **Test Upgradeable Program ID:** `2iFJrGRfi3BLDtDRNkesvDBEWAyojrn8ZpZhCr6FvL3B`
    - Program Data Address: `497rj6TBito4H7rRSqDL1y3RKuTGbH4JzM8LQwbNtYE5`
- **Original User Keypair (used as initial authority for test program):** `BgEd4oEKC765G3RZCpHMMQeVxRQgjzrTpKUfdKNhqAKc`
    - Path: `/mnt/c/Users/caleb/Desktop/1-belac/id.json` (WSL) or `C:\Users\caleb\Desktop\1-belac\id.json` (Windows)
- **Intermediate Keypair 1 (became authority of test program):** `7PsvveLfrwV2eCx1SUgsctHxcUvwq32QS7ygzfS8coH5`
    - Path: `/home/belacosaur/.config/solana/id.json` (WSL default after a `solana-keygen new --force`)
- **Intermediate Keypair 2 (became authority of test program):** `4QTssPYWmDGWMtW7HWzWKDMDESTXWifeyBrEVLG35Jna`
    - Path: `/mnt/c/Users/caleb/Desktop/xgodsvault/temp_new_authority_3.json` (WSL)
- **Target Multisig PDA:** `CJu1upenXeUXtujm48W4YZE3FHiaTdz1Bdw2rFyVcESe`

This document should serve as a reference for future program authority management tasks. 