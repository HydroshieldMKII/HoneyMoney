# Backend server
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
npx hardhat node
```

### Deploy Smart Contract
```bash
npx hardhat ignition deploy ./ignition/modules/honeymoney.ts --network localhost
```

### Run Contract Deployment Script
```bash
npx hardhat run ./ignition/modules/honeymoney.ts --network localhost
```