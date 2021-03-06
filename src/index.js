const MaticPOSExit = require("./MaticPOSExit");

const ERC20_TRANSFER_EVENT_SIG =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ERC721_TRANSFER_EVENT_SIG =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ERC1155_TRANSFER_SINGLE_EVENT_SIG =
  "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62";
const ERC1155_TRANSFER_BATCH_EVENT_SIG =
  "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb";

module.exports = {
  MaticPOSExit,
  ERC20_TRANSFER_EVENT_SIG,
  ERC721_TRANSFER_EVENT_SIG,
  ERC1155_TRANSFER_SINGLE_EVENT_SIG,
  ERC1155_TRANSFER_BATCH_EVENT_SIG,
};
