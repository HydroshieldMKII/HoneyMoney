import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const HoneyMoney = buildModule("HoneyMoney", (m) => {
  const initialSupply = m.getParameter("initialSupply", 10000);

  const contract = m.contract("HoneyMoney", [initialSupply]);
  return { contract };
});

export default HoneyMoney;
