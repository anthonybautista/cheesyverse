// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface ICow {
    function walletOfOwner(address _owner) external view returns (uint256[] memory);
}

interface IThief {
    function checkSteal(uint farmerLevel) external view returns (address catOwner, uint cat, bool stolen);
}

contract CowMilk is ERC20, Ownable, ReentrancyGuard {

    address public COW_CONTRACT = 0x6b16639137F017898A5bd711c450DA6f33fF3D11;
    address public THIEF_CONTRACT = 0x6d93DF876AB3aEE719dbC1c566E39Dc5Db5c5D35;
    address public KGOLD_CONTRACT = 0xaE2938DFfdEEC4082d391610eDb6333Fb031B421;

    uint public MILK_RATIO = 6;
    uint public MILK_PRODUCE_TIME = 86400;
    uint public MILK_SPOIL_TIME = 129600;

    mapping(address => bool) public cheesyAddresses;
    mapping(address => bool) public isFarming;
    mapping(uint => uint) public cowStakedFrom;
    mapping(address => uint) public farmerLevel;

    constructor() ERC20("Cow Milk", "cMILK"){}

    event ClaimedMilk(address staker, uint cMilk);
    event StolenMilk(address staker, address catOwner, uint cat, uint cMilk);
    event StakedCows(address staker, uint numCows);

    function _mintCowMilk(address account, uint256 amount) internal {
        _mint(account, amount);
    }

    function cheesyMint(address account, uint256 amount) external {
        require(cheesyAddresses[msg.sender], "You aren't allowed to mint.");
        _mint(account, amount);
    }

    function claimableView(address account) public view returns(uint, uint[] memory, uint) {
        require(isFarming[account], "You aren't farming!");
        ICow c = ICow(COW_CONTRACT);
        uint[] memory _cowsStaked = c.walletOfOwner(account);
        uint _count = _cowsStaked.length;
        require(_count > 0, "You don't have any cows!");

        if(_count > 1) {
            _count = 2;
        } 

        uint milkProduced = 0;

        for (uint i = 0; i < _count; i++) {
            uint product = 0;

            if(block.timestamp > cowStakedFrom[_cowsStaked[i]] + MILK_PRODUCE_TIME) {
                product = MILK_RATIO;
            }

            if(block.timestamp > cowStakedFrom[_cowsStaked[i]] + MILK_SPOIL_TIME) {
                product = 0;
            }

            milkProduced += product;
        }

        return (milkProduced * 10**18, _cowsStaked, _count);
    }

    function claimCowMilk() public nonReentrant {
        (uint claimable, uint[] memory cows, uint count) = claimableView(msg.sender);
        require(claimable > 0, "Nothing to claim!");

        for (uint i = 0; i < count; i++) {
            cowStakedFrom[cows[i]] = block.timestamp;
        }

        IThief t = IThief(THIEF_CONTRACT);
        (address catOwner, uint cat, bool stolen) = t.checkSteal(checkFarmerLevel(msg.sender));

        if (!stolen) {
            _mintCowMilk(msg.sender, claimable);
            emit ClaimedMilk(msg.sender, claimable);
        } else {
            _mintCowMilk(catOwner, claimable);
            emit StolenMilk(msg.sender, catOwner, cat, claimable);
        }
        
    }

    function startFarming() external {
        ICow c = ICow(COW_CONTRACT);
        uint[] memory _cowsStaked = c.walletOfOwner(msg.sender);
        uint _count = _cowsStaked.length;
        require(_count > 0, "You don't have any cows!");

        if(_count > 1) {
            _count = 2;
        } 

        isFarming[msg.sender] = true;

        for (uint i = 0; i < _count; i++) {
            cowStakedFrom[_cowsStaked[i]] = block.timestamp;
        }

        emit StakedCows(msg.sender, _count);
    }

    function checkFarmerLevel(address farmer) public view returns(uint) {
        return farmerLevel[farmer];
    }

    function increaseFarmerLevel(address farmer) external {
        require(msg.sender == KGOLD_CONTRACT, "Only King Pyro can call this function!");
        farmerLevel[farmer] += 1;
    }

    function burn(address acc, uint amount) external {
        require(cheesyAddresses[msg.sender], "Only cheesy addresses can burn!"); 
        _burn(acc, amount);
    }

    // <AdminStuff>
    function updateRatio(uint _milkRatio) external onlyOwner {
        MILK_RATIO = _milkRatio;
    }

    function updateTime(uint _produceTime, uint _spoilTime) external onlyOwner {
        MILK_PRODUCE_TIME = _produceTime;
        MILK_SPOIL_TIME = _spoilTime;
    }

    function airdropCowMilk(address account, uint amount) external onlyOwner {
        _mintCowMilk(account, amount*10**18);
    }

    function airdropManyCowMilk(address[] memory accounts, uint[] memory amounts) external onlyOwner {
        require(accounts.length == amounts.length, "Mismatching array lengths!");

        for (uint i = 0; i < accounts.length; i++) {
            _mintCowMilk(accounts[i], amounts[i]*10**18);
        }
        
    }

    function addCheesyAddress(address account) external onlyOwner {
        cheesyAddresses[account] = true;
    }

    function setKingAddress(address _kAddr) public onlyOwner {
      KGOLD_CONTRACT = _kAddr;
    }

    function updateCowAddress(address cow) external onlyOwner {
        COW_CONTRACT = cow;
    }

    function updateThiefAddress(address thief) external onlyOwner {
        THIEF_CONTRACT = thief;
    }

}