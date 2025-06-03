import { inject, Injectable } from '@angular/core';
import { ethers, JsonRpcProvider } from 'ethers';

@Injectable({
    providedIn: 'root'
})
export class EthersService {
    readonly providerUrl = 'rpc.honey-money.hydroshield.dev';

    getEthersProvider(): JsonRpcProvider {
        return new JsonRpcProvider(this.providerUrl);
    }
}
