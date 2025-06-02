# MetaMask add local blockchain
## Values
| Field                  | Value                                    |
| ---------------------- | ---------------------------------------- |
| **Network Name**       | *name*                                   |
| **New RPC URL**        | *url*                                    |
| **Chain ID**           | `31337` (default for Hardhat)            |
| **Currency Symbol**    | ETH                                      |
| **Block Explorer URL** | *Leave empty*                            |



# Backend server

## Dependency

```bash
sudo apt update
sudo apt install build-essential libssl-dev zlib1g-dev libreadline-dev libyaml-dev libsqlite3-dev sqlite3 libxml2-dev libxslt1-dev libcurl4-openssl-dev libffi-dev ruby-full ruby-dev
```

```bash
gem install sinatra puma rackup
```

## Running the Backend Server

```bash
ruby main.rb
```

**Backend server**: `localhost:3000`

## Blockchain & Smart Contract Honeymoney

**Contract Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`  
**Account #0**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`  
**Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

## Development Commands

### Compile Smart Contract
```bash
npx hardhat compile
```

### Start Local Blockchain Node
```bash
npx hardhat node --hostname 0.0.0.0 --port 8545
```

### Deploy Smart Contract
```bash
npx hardhat ignition deploy ./ignition/modules/honeymoney.ts --network localhost
```

### Run Contract Deployment Script
```bash
npx hardhat run ./ignition/modules/honeymoney.ts --network localhost
```