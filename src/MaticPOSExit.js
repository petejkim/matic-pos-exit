const BN = require("bn.js");
const ethUtils = require("ethereumjs-util");
const ProofsUtil = require("./ProofsUtil");

const BN_ONE = new BN(1);
const BN_TWO = new BN(2);
const CHECKPOINT_ID_INTERVAL = new BN(10000);

const ROOT_CHAIN_ABI = [
  {
    constant: true,
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "headerBlocks",
    outputs: [
      { internalType: "bytes32", name: "root", type: "bytes32" },
      { internalType: "uint256", name: "start", type: "uint256" },
      { internalType: "uint256", name: "end", type: "uint256" },
      { internalType: "uint256", name: "createdAt", type: "uint256" },
      { internalType: "address", name: "proposer", type: "address" },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "getLastChildBlock",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "currentHeaderBlock",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

class MaticPOSExit {
  constructor(parentWeb3, maticWeb3, rootChainContractAddress) {
    this.rootChain = new parentWeb3.eth.Contract(
      ROOT_CHAIN_ABI,
      rootChainContractAddress
    );
    this.maticWeb3 = maticWeb3;
  }

  async buildExitData(burnTxHash, logEventSig) {
    // check checkpoint
    const lastChildBlock = await this.rootChain.methods
      .getLastChildBlock()
      .call();
    const burnTx = await this.maticWeb3.eth.getTransaction(burnTxHash);
    if (!burnTx) {
      throw new Error("Transaction not found")
    }
    if (typeof burnTx.blockNumber !== "number") {
      throw new Error("Failed to obtain block number for burn transaction");
    }
    const burnTxBlockNumber = new BN(burnTx.blockNumber);
    const receipt = await this.maticWeb3.eth.getTransactionReceipt(burnTxHash);
    if (!receipt) {
      throw new Error("Burn transaction receipt not found")
    }
    const block = await this.maticWeb3.eth.getBlock(burnTx.blockNumber, true);
    if (!block) {
      throw new Error("Block not found")
    }

    if (new BN(lastChildBlock, 10).lt(new BN(burnTx.blockNumber))) {
      throw new Error("Burn transaction has not yet been checkpointed");
    }

    const headerBlockNumber = await this.findHeaderBlockNumber(
      burnTxBlockNumber
    );
    const headerBlock = await this.rootChain.methods
      .headerBlocks("0x" + headerBlockNumber.toString(16))
      .call();

    // build block proof
    const blockProof = await ProofsUtil.buildBlockProof(
      this.maticWeb3,
      parseInt(headerBlock.start, 10),
      parseInt(headerBlock.end, 10),
      burnTx.blockNumber
    );

    const receiptProof = await ProofsUtil.getReceiptProof(
      receipt,
      block,
      this.maticWeb3
    );
    const logIndex = receipt.logs.findIndex(
      (log) => log.topics[0].toLowerCase() === logEventSig
    );

    if (logIndex < 0) {
      throw new Error("Log not found in receipt");
    }

    return encodePayload(
      headerBlockNumber,
      blockProof,
      burnTx.blockNumber,
      block.timestamp,
      Buffer.from(block.transactionsRoot.slice(2), "hex"),
      Buffer.from(block.receiptsRoot.slice(2), "hex"),
      ProofsUtil.getReceiptBytes(receipt), // rlp encoded
      receiptProof.parentNodes,
      receiptProof.path,
      logIndex
    );
  }

  async findHeaderBlockNumber(childBlockNumber) {
    // first checkpoint id = start * 10000
    let start = BN_ONE;

    // last checkpoint id = end * 10000
    let end = new BN(
      await this.rootChain.methods.currentHeaderBlock().call()
    ).div(CHECKPOINT_ID_INTERVAL);

    // binary search on all the checkpoints to find the checkpoint that contains the childBlockNumber
    let ans = null;
    while (start.lte(end)) {
      if (start.eq(end)) {
        ans = start;
        break;
      }
      const mid = start.add(end).div(BN_TWO);
      const headerBlock = await this.rootChain.methods
        .headerBlocks(mid.mul(CHECKPOINT_ID_INTERVAL).toString())
        .call();
      const headerStart = new BN(headerBlock.start);
      const headerEnd = new BN(headerBlock.end);
      if (
        headerStart.lte(childBlockNumber) &&
        childBlockNumber.lte(headerEnd)
      ) {
        // if childBlockNumber is between the upper and lower bounds of the headerBlock, we found our answer
        ans = mid;
        break;
      } else if (headerStart.gt(childBlockNumber)) {
        // childBlockNumber was checkpointed before this header
        end = mid.sub(BN_ONE);
      } else if (headerEnd.lt(childBlockNumber)) {
        // childBlockNumber was checkpointed after this header
        start = mid.add(BN_ONE);
      }
    }
    if (!ans) {
      throw new Error("Could not find header block number");
    }
    return ans.mul(CHECKPOINT_ID_INTERVAL);
  }
}

function encodePayload(
  headerNumber,
  buildBlockProof,
  blockNumber,
  timestamp,
  transactionsRoot,
  receiptsRoot,
  receipt,
  receiptParentNodes,
  path,
  logIndex
) {
  return ethUtils.bufferToHex(
    ethUtils.rlp.encode([
      headerNumber,
      buildBlockProof,
      blockNumber,
      timestamp,
      ethUtils.bufferToHex(transactionsRoot),
      ethUtils.bufferToHex(receiptsRoot),
      ethUtils.bufferToHex(receipt),
      ethUtils.bufferToHex(ethUtils.rlp.encode(receiptParentNodes)),
      ethUtils.bufferToHex(path),
      logIndex,
    ])
  );
}

module.exports = MaticPOSExit;
