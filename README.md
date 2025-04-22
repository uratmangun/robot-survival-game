# Nero AI Custodial Web

The NERO AI Custodial Wallet is an AI-powered chat interface built on Next.js, enabling users to manage NERO blockchain assets through natural language. Users can connect custodial wallets, query balances, initiate transfers, and inspect token details on NERO chain via tool functions.

# Web demo
https://lcd-purchases-subaru-trembl.trycloudflare.com/

# Video demo
https://youtu.be/1ukIsK-wnzQ

# List of tools
 - `check_address`: Get the connected wallet address.
 - `check_balance`: Get the balance of the connected wallet or an ERC-20 token if an address is provided.
   - `address` (string, optional): user address.
 - `faucet`: Show the faucet URL for obtaining testnet tokens.
 - `mint_test_token`: Mint test tokens to the connected wallet.
   - `amount` (string): amount of test tokens to mint in NERO.
 - `transfer`: Transfer tokens or ETH to a specified address.
   - `address` (string): recipient address.
   - `amount` (string): amount to transfer.
   - `token_name` (string, optional): ERC-20 token name.

# How to run with docker

## Prerequisites
- Copy `.env.example` to `.env` and fill in your API keys.

## Build and Start
1. Build the Docker image:
    ```fish
    docker build -t nero-ai-custodial-web .
    ```
2. Create (or reuse) a Docker network for the tunnel:
    ```fish
    docker network create nero-net
    ```
3. Run your Next.js app container on `nero-net`:
    ```fish
    docker run -d \
      --network nero-net \
      --env-file .env \
      --name nero-ai-custodial-web \
      nero-ai-custodial-web
    ```
4. Run the Cloudflare Tunnel on the same network:
    ```fish
    docker run -d \
      --network nero-net \
      --name nero-ai-custodial-tunnel \
      cloudflare/cloudflared:latest tunnel --url http://nero-ai-custodial-web:3000
    ```
5. Check the tunnel logs for your public URL:
    ```fish
    docker logs -f nero-ai-custodial-tunnel
    ```