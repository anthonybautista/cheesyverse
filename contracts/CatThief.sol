// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


interface ICat {
    function ownerOf(uint cat) external view returns (address catOwner);
    function walletOfOwner(address _owner) external view returns (uint256[] memory);
}

contract CatThief is Ownable, ReentrancyGuard {

    address public CAT_CONTRACT = 0xeE18DBa45cb3ef6bd3211209eFE997C5cB314193;
    address public KGOLD_CONTRACT = 0xaE2938DFfdEEC4082d391610eDb6333Fb031B421;

    mapping(address => bool) public cheesyAddresses;
    mapping(uint => bool) public isCatching;
    mapping(uint => uint) public catLevel;

    uint public BASE_STEAL_PCT = 20;

    uint[] public catThieves;

    constructor() {}

    event StakedCats(address staker, uint numCats);

    function startCatching() external {
        ICat c = ICat(CAT_CONTRACT);
        uint[] memory _catsOwned = c.walletOfOwner(msg.sender);
        uint _count = _catsOwned.length;
        require(_count > 0, "You don't have any cats!");

        for (uint i = 0; i < _count; i++) {
            if (!isCatching[_catsOwned[i]]) {
                isCatching[_catsOwned[i]] = true;
                catThieves.push(_catsOwned[i]);
            }
        }

        emit StakedCats(msg.sender, _count);
    }

    function checkSteal(uint level) external view returns(address, uint, bool) { 
        if (catThieves.length > 0) {
            ICat c = ICat(CAT_CONTRACT);
            uint count = catThieves.length;
            uint rand = block.timestamp + block.difficulty * 2;
            uint cat = catThieves[rand % count];
            uint stealPct = 0;

            if ((20 + catLevel[cat]) > level) {
                stealPct = 20 + catLevel[cat] - level;
            } 

            uint rand2 = rand + block.number;

            if ((rand2 % 100) > stealPct) {
                return (c.ownerOf(cat), cat, false);
            } else {
                return (c.ownerOf(cat), cat, true);
            }
        } else {
            return (address(this), 0, false);
        }
    }

    function checkCatLevel(uint cat) public view returns(uint) {
        return catLevel[cat];
    }

    function increaseCatLevel(uint cat) external {
        require(msg.sender == KGOLD_CONTRACT, "Only King Pyro can call this function!");
        catLevel[cat] += 1;
    }

    // <AdminStuff>
    function updateSteal(uint _stealPct) external onlyOwner {
        BASE_STEAL_PCT = _stealPct;
    }

    function addCheesyAddress(address account) external onlyOwner {
        cheesyAddresses[account] = true;
    }

    function setKingAddress(address _kAddr) public onlyOwner {
      KGOLD_CONTRACT = _kAddr;
    }

    function updateCatAddress(address cat) external onlyOwner {
        CAT_CONTRACT = cat;
    }

}