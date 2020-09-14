import Web3 from "web3";

declare namespace MaticPOSExit {
  class MaticPOSExit {
    constructor(
      parentWeb3: Web3,
      maticWeb3: Web3,
      rootChainContractAddress: string
    );

    buildExitData(burnTxHash: string, logEventSig: string): Promise<string>;

    findHeaderBlockNumber(childBlockNumber: BN): Promise<BN>;
  }

  let ERC20_TRANSFER_EVENT_SIG: string;
  let ERC721_TRANSFER_EVENT_SIG: string;
  let ERC1155_TRANSFER_SINGLE_EVENT_SIG: string;
  let ERC1155_TRANSFER_BATCH_EVENT_SIG: string;
}

export = MaticPOSExit;
