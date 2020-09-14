# matic-pos-exit

This package contains the bare-minimum code necessary to generate the data 
required for the exit() function in Matic's RootChainManager contract. The code
in this package was extracted from Matic.js and cleaned up. This package can be
used as a light-weight alternative to the full Matic.js package if all you need
is just the POS exit functionality.

## Example

```
const { MaticPOSExit, ERC20_TRANSFER_EVENT_SIG } = require("matic-pos-exit");

const posExit = new MaticPOSExit(
  parentWeb3,
  maticWeb3,
  rootChainContractAddress
);

const data = await posExit.buildExitData(burnTxHash, ERC20_TRANSFER_EVENT_SIG);
```

---
MIT License
