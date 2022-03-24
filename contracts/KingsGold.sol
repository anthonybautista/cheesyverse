// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IMilk {
    function burn(address account, uint amount) external;
    function balanceOf(address owner) external view returns(uint);
    function checkFarmerLevel(address farmer) external view returns(uint);
    function increaseFarmerLevel(address farmer) external;
}

interface ICheese {
    function ownerOf(uint tokenID) external view returns (address);
    function burnCheese(uint tokenID) external;
    function walletOfOwner(address _owner) external view returns (uint256[] memory);
    function checkFromagerLevel(address fromager) external view returns(uint);
    function increaseFromagerLevel(address fromager) external;
}

interface IThief {
    function checkCatLevel(uint cat) external view returns(uint);
    function increaseCatLevel(uint cat) external;
}

interface ICat {
    function ownerOf(uint cat) external view returns (address catOwner);
}

contract KingsGold is ERC20, Ownable, ReentrancyGuard {

    address public MILK_CONTRACT = 0x7FEF4c1b027a0eC266C57DCd1E30d5E6CA044711;
    address public BURRATA_CONTRACT = 0xc8b11B6Ed6328F4a405D3923B90075DeEC16631A;
    address public DOLCE_CONTRACT = 0xcc2aECd665461ddaE6bd7C611A5F9e7E352910E0;
    address public PARM_CONTRACT = 0x922dB6eCD9ba5d04D770Db027F33E5e63A1e1926;
    address public THIEF_CONTRACT = 0x6d93DF876AB3aEE719dbC1c566E39Dc5Db5c5D35;
    address public CAT_CONTRACT = 0xeE18DBa45cb3ef6bd3211209eFE997C5cB314193;

    uint public MILK_RATIO = 6;
    uint public BURRATA_RATIO = 1;
    uint public DOLCE_RATIO = 1;
    uint public PARM_RATIO = 1;
    uint public MILK_GOLD = 500000000000000000;
    uint public BURRATA_GOLD = 1000000000000000000;
    uint public DOLCE_GOLD = 3000000000000000000;
    uint public PARM_GOLD = 10000000000000000000;
    uint public FARMER_LEVEL_GOLD = 1000000000000000000;
    uint public CAT_LEVEL_GOLD = 1000000000000000000;
    uint public BURRATA_LEVEL_GOLD = 1000000000000000000;
    uint public DOLCE_LEVEL_GOLD = 3000000000000000000;
    uint public PARM_LEVEL_GOLD = 5000000000000000000;
    uint public MAX_LEVEL = 50;

    mapping(address => bool) public cheesyAddresses;

    constructor() ERC20("King's Gold", "kGOLD"){}

    event BurnedMilk(address owner, uint cMilk);
    event BurnedBurrata(address owner, uint count);
    event BurnedDolcelatte(address owner, uint count);
    event BurnedParmesan(address owner, uint count);
    event BurnedKingsGold(address owner, uint count);

    function _mintKingsGold(address account, uint256 amount) internal {
        _mint(account, amount);
    }

    function cheesyMint(address account, uint256 amount) external {
        require(cheesyAddresses[msg.sender], "You aren't allowed to mint.");
        _mint(account, amount);
    }

    function exchangeMilk(uint amount) public nonReentrant {
        require(amount % MILK_RATIO == 0, "Invalid amount entered!");
        burnMilk(msg.sender, amount);

        uint gold = (amount / MILK_RATIO) *  MILK_GOLD;

        _mintKingsGold(msg.sender, gold);
        emit BurnedMilk(msg.sender, amount);
    }

    function burnMilk(address account, uint _amount) internal {
        IMilk m = IMilk(MILK_CONTRACT);
        require(m.balanceOf(account) >= (_amount * 10**18), "You don't have enough cMILK!");
        
        m.burn(account,(_amount * 10**18));
    }

    function exchangeBurrata(uint tokenID) public nonReentrant {
        ICheese c = ICheese(BURRATA_CONTRACT);
        require(c.ownerOf(tokenID) == msg.sender, "You don't own that Burrata!");

        burnCheesy(BURRATA_CONTRACT, tokenID);

        uint gold = BURRATA_GOLD;

        _mintKingsGold(msg.sender, gold);
        emit BurnedBurrata(msg.sender, 1);
    }

    function exchangeAllBurrata() public nonReentrant {
        ICheese c = ICheese(BURRATA_CONTRACT);
        uint[] memory tokenIDs = c.walletOfOwner(msg.sender);
        require(tokenIDs.length > 0, "You don't have any Burrata!");

        burnAllCheesy(BURRATA_CONTRACT, tokenIDs);

        uint gold = BURRATA_GOLD * tokenIDs.length;

        _mintKingsGold(msg.sender, gold);
        emit BurnedBurrata(msg.sender, tokenIDs.length);
    }

    function exchangeDolce(uint tokenID) public nonReentrant {
        ICheese c = ICheese(DOLCE_CONTRACT);
        require(c.ownerOf(tokenID) == msg.sender, "You don't own that Dolcelatte!");

        burnCheesy(DOLCE_CONTRACT, tokenID);

        uint gold = DOLCE_GOLD;

        _mintKingsGold(msg.sender, gold);
        emit BurnedDolcelatte(msg.sender, 1);
    }

    function exchangeAllDolce() public nonReentrant {
        ICheese c = ICheese(DOLCE_CONTRACT);
        uint[] memory tokenIDs = c.walletOfOwner(msg.sender);
        require(tokenIDs.length > 0, "You don't have any Dolcelatte!");

        burnAllCheesy(DOLCE_CONTRACT, tokenIDs);

        uint gold = DOLCE_GOLD * tokenIDs.length;

        _mintKingsGold(msg.sender, gold);
        emit BurnedDolcelatte(msg.sender, tokenIDs.length);
    }

    function exchangeParmesan(uint tokenID) public nonReentrant {
        ICheese c = ICheese(PARM_CONTRACT);
        require(c.ownerOf(tokenID) == msg.sender, "You don't own that Parmesan!");

        burnCheesy(PARM_CONTRACT, tokenID);

        uint gold = PARM_GOLD;

        _mintKingsGold(msg.sender, gold);
        emit BurnedParmesan(msg.sender, 1);
    }

    function exchangeAllParmesan() public nonReentrant {
        ICheese c = ICheese(PARM_CONTRACT);
        uint[] memory tokenIDs = c.walletOfOwner(msg.sender);
        require(tokenIDs.length > 0, "You don't have any Parmesan!");

        burnAllCheesy(PARM_CONTRACT, tokenIDs);

        uint gold = PARM_GOLD * tokenIDs.length;

        _mintKingsGold(msg.sender, gold);
        emit BurnedParmesan(msg.sender, tokenIDs.length);
    }

    function burnAllCheesy(address _contract, uint[] memory _tokenIDs) internal {
        ICheese c = ICheese(_contract);
        
        for (uint i = 0; i < _tokenIDs.length; i++) {
            c.burnCheese(_tokenIDs[i]);
        }
        
    }

    function burnCheesy(address _contract, uint _tokenID) internal {
        ICheese c = ICheese(_contract);
        
        c.burnCheese(_tokenID);

    }

    function boostFarmerLevel() external nonReentrant {
        IMilk m = IMilk(MILK_CONTRACT);
        require(m.checkFarmerLevel(msg.sender) < MAX_LEVEL, "Farmer already at max level!");
        require(balanceOf(msg.sender) >= FARMER_LEVEL_GOLD, "You don't have enough kGOLD!");
        burnKingsGold(msg.sender, FARMER_LEVEL_GOLD);
        m.increaseFarmerLevel(msg.sender);
        emit BurnedKingsGold(msg.sender, FARMER_LEVEL_GOLD);
    }

    function boostCatLevel(uint cat) external nonReentrant {
        IThief t = IThief(THIEF_CONTRACT);
        require(t.checkCatLevel(cat) < MAX_LEVEL, "Cat is already at max level!");
        ICat c = ICat(CAT_CONTRACT);
        require(c.ownerOf(cat) == msg.sender, "You don't own that cat!");
        require(balanceOf(msg.sender) >= CAT_LEVEL_GOLD, "You don't have enough kGOLD!");
        burnKingsGold(msg.sender, CAT_LEVEL_GOLD);
        t.increaseCatLevel(cat);
        emit BurnedKingsGold(msg.sender, CAT_LEVEL_GOLD);
    }

    function boostBurrataLevel() external nonReentrant {
        ICheese c = ICheese(BURRATA_CONTRACT);
        require(c.checkFromagerLevel(msg.sender) < MAX_LEVEL, "Burrata already at max level!");
        require(balanceOf(msg.sender) >= BURRATA_LEVEL_GOLD, "You don't have enough kGOLD!");
        burnKingsGold(msg.sender, BURRATA_LEVEL_GOLD);
        c.increaseFromagerLevel(msg.sender);
        emit BurnedKingsGold(msg.sender, BURRATA_LEVEL_GOLD);
    }

    function boostDolcelatteLevel() external nonReentrant {
        ICheese c = ICheese(DOLCE_CONTRACT);
        require(c.checkFromagerLevel(msg.sender) < MAX_LEVEL, "Dolcelatte already at max level!");
        require(balanceOf(msg.sender) >= DOLCE_LEVEL_GOLD, "You don't have enough kGOLD!");
        burnKingsGold(msg.sender, DOLCE_LEVEL_GOLD);
        c.increaseFromagerLevel(msg.sender);
        emit BurnedKingsGold(msg.sender, DOLCE_LEVEL_GOLD);
    }

    function boostParmesanLevel() external nonReentrant {
        ICheese c = ICheese(PARM_CONTRACT);
        require(c.checkFromagerLevel(msg.sender) < MAX_LEVEL, "Parmesan already at max level!");
        require(balanceOf(msg.sender) >= PARM_LEVEL_GOLD, "You don't have enough kGOLD!");
        burnKingsGold(msg.sender, PARM_LEVEL_GOLD);
        c.increaseFromagerLevel(msg.sender);
        emit BurnedKingsGold(msg.sender, PARM_LEVEL_GOLD);
    }

    function burnKingsGold(address acc, uint amount) internal {
        _burn(acc, amount);
    }

    function burn(address acc, uint amount) external {
        require(cheesyAddresses[msg.sender], "Only cheesy addresses can burn!"); 
        _burn(acc, amount);
    }

    // <AdminStuff>
    function updateRatios(uint _milk, uint _burr, uint _dolce, uint _parm) external onlyOwner {
        MILK_RATIO = _milk;
        BURRATA_RATIO = _burr;
        DOLCE_RATIO = _dolce;
        PARM_RATIO = _parm;
    }

    function updateMilkGold(uint _newValue) external onlyOwner {
        MILK_GOLD = _newValue;
    }

    function updateBurrataGold(uint _newValue) external onlyOwner {
        BURRATA_GOLD = _newValue;
    }

    function updateDolceGold(uint _newValue) external onlyOwner {
        DOLCE_GOLD = _newValue;
    }

    function updateParmGold(uint _newValue) external onlyOwner {
        PARM_GOLD = _newValue;
    }

    function updateFarmerLevelGold(uint _newValue) external onlyOwner {
        FARMER_LEVEL_GOLD = _newValue;
    }

    function updateCatLevelGold(uint _newValue) external onlyOwner {
        CAT_LEVEL_GOLD = _newValue;
    }

    function updateBurrataLevelGold(uint _newValue) external onlyOwner {
        BURRATA_LEVEL_GOLD = _newValue;
    }

    function updateDolceLevelGold(uint _newValue) external onlyOwner {
        DOLCE_LEVEL_GOLD = _newValue;
    }

    function updateParmLevelGold(uint _newValue) external onlyOwner {
        PARM_LEVEL_GOLD = _newValue;
    }

    function updateMaxLevel(uint _newValue) external onlyOwner {
        MAX_LEVEL = _newValue;
    }

    function airdropKingsGold(address account, uint amount) external onlyOwner {
        _mintKingsGold(account, amount);
    }

    function airdropManyKingsGold(address[] memory accounts, uint[] memory amounts) external onlyOwner {
        require(accounts.length == amounts.length, "Mismatching array lengths!");

        for (uint i = 0; i < accounts.length; i++) {
            _mintKingsGold(accounts[i], amounts[i]);
        }
        
    }

    function addCheesyAddress(address account) external onlyOwner {
        cheesyAddresses[account] = true;
    }

    function setMilkAddress(address _milkAddr) public onlyOwner {
      MILK_CONTRACT = _milkAddr;
    }

    function updateCatAddress(address cat) external onlyOwner {
        CAT_CONTRACT = cat;
    }

    function updateThiefAddress(address thief) external onlyOwner {
        THIEF_CONTRACT = thief;
    }

    function updateBurrataAddress(address burr) external onlyOwner {
        BURRATA_CONTRACT = burr;
    }

    function updateDolceAddress(address dolce) external onlyOwner {
        DOLCE_CONTRACT = dolce;
    }

    function updateParmAddress(address parm) external onlyOwner {
        PARM_CONTRACT = parm;
    }

}