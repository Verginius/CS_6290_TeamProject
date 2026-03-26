# Mock合约实现指南

## 📋 已实现的Mock合约

### 1. **MockToken.sol** 🪙
**文件位置**: `src/mocks/MockToken.sol`

#### 功能概述
标准的ERC20测试代币，支持灵活的铸造和销毁操作。

#### 主要特性
- ✅ ERC20标准实现
- ✅ ERC20Permit支持（无gas批准）
- ✅ 灵活的铸造机制
- ✅ 代币销毁功能
- ✅ 最大供应量上限（10亿代币）

#### 核心函数

**铸造函数**:
```solidity
// 单次铸造
function mint(address to, uint256 amount) external onlyOwner

// 批量铸造
function mintMultiple(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner

// 铸造剩余供应
function mintRemainingSupply(address to) external onlyOwner returns (uint256)
```

**销毁函数**:
```solidity
// 调用者销毁自己的代币
function burn(uint256 amount) external

// 所有者销毁他人的代币
function burnFrom(address from, uint256 amount) external onlyOwner
```

**查询函数**:
```solidity
function remainingSupply() external view returns (uint256)
function canMint(uint256 amount) external view returns (bool)
```

#### 使用场景
1. **治理代币模拟**: 作为测试中的投票权代币
2. **财宝库资产**: 模拟DAO财宝库中的资产代币
3. **灵活测试**: 支持任意数量的账户和供应量配置
4. **多代币测试**: 创建多个实例来测试多资产支持

#### 示例用法
```solidity
// 部署一个新的测试代币
MockToken token = new MockToken(
    "Mock Token",
    "MOCK",
    owner,
    1_000_000e18  // 初始供应：100万代币
);

// 给多个账户分配代币
address[] memory recipients = new address[](3);
uint256[] memory amounts = new uint256[](3);
recipients[0] = address(0x111); amounts[0] = 100e18;
recipients[1] = address(0x222); amounts[1] = 200e18;
recipients[2] = address(0x333); amounts[2] = 300e18;

token.mintMultiple(recipients, amounts);
```

---

### 2. **MockTreasury.sol** 💰
**文件位置**: `src/mocks/MockTreasury.sol`

#### 功能概述
模拟DAO财宝库，支持多签操作、支出限制和操作追踪。

#### 主要特性
- ✅ 多个ERC20代币管理
- ✅ ETH存取支持
- ✅ 多签访问控制（可配置阈值）
- ✅ 交易历史追踪
- ✅ 支出限制机制
- ✅ 攻击尝试记录
- ✅ 紧急恢复函数
- ✅ 重入攻击防护

#### 核心函数

**存款函数**:
```solidity
// 单个代币存款
function depositToken(address token, uint256 amount) external nonReentrant

// 批量代币存款
function depositMultiple(address[] calldata tokenList, uint256[] calldata amounts) external nonReentrant

// ETH通过receive()自动接收
receive() external payable
```

**提取函数**:
```solidity
// 在支出限制内提取（单签）
function withdrawWithinLimit(
    address token, 
    uint256 amount, 
    address to
) external onlySigner returns (bool)

// 提案提取（多签）
function proposeWithdrawal(
    address token,
    uint256 amount,
    address to,
    string calldata description
) external onlySigner returns (uint256)

// 执行提取
function executeWithdrawal(uint256 txId) external onlySigner returns (bool)
```

**紧急函数**:
```solidity
function emergencyPause() external onlyOwner
function resumeOperations() external onlyOwner
function emergencyRecoverToken(address token, uint256 amount, address to) external onlyOwner
```

**多签管理**:
```solidity
function addSigner(address newSigner) external onlyOwner
function removeSigner(address signer) external onlyOwner
function setThreshold(uint256 newThreshold) external onlyOwner
function setSpendingLimit(uint256 newLimit) external onlyOwner
```

**查询函数**:
```solidity
function getBalance(address token) external view returns (uint256)
function getETHBalance() external view returns (uint256)
function getTokens() external view returns (address[] memory)
function getSigners() external view returns (address[] memory)
function getTransaction(uint256 txId) external view returns (...)
function getTreasuryComposition() external view returns (address[], uint256[])
function getAttackSummary(address attacker) external view returns (...)
```

#### 使用场景

**1. 攻击测试 - Treasury Drain**
```solidity
// 攻击者尝试提取资金
treasury.attemptWithdrawal(token, 100e6, attacker);

// 验证是否被阻止
(uint256 failed, uint256 value) = treasury.getAttackSummary(attacker);
require(failed > 0, "Attack not recorded");
```

**2. 防御验证 - Multi-sig保护**
```solidity
// 提案提取大额资金（需多签批准）
uint256 txId = treasury.proposeWithdrawal(
    token, 
    1_000_000e18, 
    recipient,
    "Large withdrawal proposal"
);

// 执行需要足够的签名者批准
treasury.executeWithdrawal(txId);  // 由授权签名者调用
```

**3. 支出限制测试**
```solidity
// 设置支出限制为1000代币
treasury.setSpendingLimit(1000e18);

// 小额提取成功（单签）
treasury.withdrawWithinLimit(token, 500e18, user);

// 大额提取失败（超过限制）
// treasury.withdrawWithinLimit(token, 2000e18, user);  // 失败
```

**4. ETH管理**
```solidity
// 接收ETH
(bool sent, ) = address(treasury).call{value: 10 ether}("");
require(sent);

// 查询ETH余额
uint256 ethBalance = treasury.getETHBalance();

// 查询完整组成
(address[] tokens, uint256[] balances) = treasury.getTreasuryComposition();
```

---

## 📊 完整Mock合约生态

现在已实现的Mock合约：

| 合约 | 用途 | 主要功能 |
|------|------|--------|
| **MockFlashLoanProvider** | Aave风格闪电贷 | 贷款、费用计算、回调验证 |
| **MockToken** | 测试ERC20代币 | 铸造、销毁、多账户分配 |
| **MockTreasury** | DAO财宝库模拟 | 多签、支出限制、历史追踪 |

---

## 🎯 与Attack合约的整合

### Flash Loan Attack + Mock Contracts
```solidity
// 1. 创建治理代币
MockToken govToken = new MockToken("GOV", "GOV", owner, 100_000_000e18);

// 2. 创建财宝库
address[] memory signers = new address[](1);
signers[0] = owner;
MockTreasury treasury = new MockTreasury(signers, 1, 10_000e18);

// 3. 存入初始资金
govToken.mint(address(treasury), 1_000_000e18);
treasury.depositToken(address(govToken), 1_000_000e18);

// 4. 设置Flash Loan Provider
MockFlashLoanProvider provider = new MockFlashLoanProvider();
govToken.mint(address(provider), 100_000_000e18);

// 5. 发动Flash Loan攻击
FlashLoanAttack attack = new FlashLoanAttack(
    address(provider),
    address(govToken),
    address(governor),
    address(treasury)
);

attack.executeAttack(50_000_000e18, 500_000e18);
```

### Whale Manipulation + Mock Treasury
```solidity
// 1. 创建财宝库
MockTreasury treasury = new MockTreasury(signers, 1, 100e18);

// 2. 创建鲸鱼账户并分配大量代币
address whale = address(0x1);
govToken.mint(whale, 60_000_000e18);  // 60% of supply

// 3. 执行鲸鱼攻击
WhaleManipulation attacked = new WhaleManipulation(
    address(govToken),
    address(governor),
    address(treasury)
);

attacked.executeWhaleAttack(whale, 100_000e18);
```

---

## 🔧 部署配置示例

### 标准测试配置
```solidity
// MockToken - 10亿代币总供应
MockToken mockToken = new MockToken(
    "Mock Governance Token",
    "MGOV",
    admin,
    1_000_000_000e18
);

// MockTreasury - 3/5多签，1%支出限制
address[] memory signers = new address[](5);
signers[0] = signer1;
signers[1] = signer2;
signers[2] = signer3;
signers[3] = signer4;
signers[4] = signer5;

MockTreasury treasury = new MockTreasury(
    signers,
    3,  // 需要3个签名
    10_000_000e18  // 1%支出限制
);

// 初始化财宝库
mockToken.mint(address(treasury), 100_000_000e18);
treasury.depositToken(address(mockToken), 100_000_000e18);
```

### Flash Loan测试配置
```solidity
// 快速设置用于Flash Loan测试
MockFlashLoanProvider provider = new MockFlashLoanProvider();
MockToken token = new MockToken("TEST", "TEST", admin, 1_000_000_000e18);
token.mint(address(provider), 1_000_000_000e18);  // Flash loan资金

// 低保护配置（易受攻击）
MockTreasury treasury = new MockTreasury(
    new address[]{admin},
    1,
    1_000_000e18
);
```

---

## 📚 事件追踪

Mock合约发出的关键事件用于测试验证：

**MockToken**:
```
TokensMinted(address indexed to, uint256 amount)
TokensBurned(address indexed from, uint256 amount)
```

**MockTreasury**:
```
ETHReceived(address indexed from, uint256 amount)
TokenDeposited(address indexed token, uint256 amount)
TokenWithdrawn(address indexed token, address indexed to, uint256 amount)
TransactionCreated(uint256 indexed txId, address indexed initiator, ...)
TransactionExecuted(uint256 indexed txId, address indexed executor)
WithdrawalAttempted(address indexed attacker, address indexed token, uint256 amount)
UnauthorizedWithdrawalBlocked(address indexed attacker, uint256 amount)
```

---

## ✅ 编译和部署

```bash
# 编译所有Mock合约
forge build

# 运行包含Mock合约的测试
forge test

# 生成gas报告
forge test --gas-report
```

---

## 总结

✨ **完整的Mock生态已就位**:
- ✅ MockFlashLoanProvider - Flash loan模拟
- ✅ MockToken - 灵活的ERC20代币
- ✅ MockTreasury - 功能完整的DAO财宝库

现在可以：
1. 🚀 执行完整的攻击模拟
2. 🛡️ 测试防御机制
3. 📊 收集攻击数据
4. 📈 进行经济分析
