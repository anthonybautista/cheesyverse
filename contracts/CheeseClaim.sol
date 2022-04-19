// SPDX-License-Identifier: MIT
pragma solidity 0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";


interface ICheese {
    function airdropCheese(address to, uint amount) external;
    function transferOwnership(address newOwner) external;
}

contract SocClaimCheese is Ownable {

    address public BURRATA_CONTRACT = 0xc8b11B6Ed6328F4a405D3923B90075DeEC16631A;
    address public DOLCE_CONTRACT = 0xcc2aECd665461ddaE6bd7C611A5F9e7E352910E0;
    address public PARM_CONTRACT = 0x922dB6eCD9ba5d04D770Db027F33E5e63A1e1926;

    uint public BURRATA_RATIO = 10;
    uint public DOLCE_RATIO = 10;
    uint public PARM_RATIO = 5;

    bool public paused = false;

    bytes32 public merkleRoot;

    mapping(address => uint8) public whitelistContracts;
    mapping(address => uint8) public whitelistClaimed;

    constructor() {}

    event ClaimedCheese(address claimer, uint cheeseType);

    function claimBurrata(address _contract, bytes32[] calldata _merkleProof) public {
        require(_claimable(msg.sender, _merkleProof, _contract), "You've got no fromage!");
        ICheese c = ICheese(BURRATA_CONTRACT);

        c.airdropCheese(msg.sender, BURRATA_RATIO);
        whitelistClaimed[msg.sender] = 1;
        emit ClaimedCheese(msg.sender, 1);
    }

    function claimDolcelatte(address _contract, bytes32[] calldata _merkleProof) public {
        require(_claimable(msg.sender, _merkleProof, _contract), "You've got no fromage!");
        ICheese c = ICheese(DOLCE_CONTRACT);

        c.airdropCheese(msg.sender, DOLCE_RATIO);
        whitelistClaimed[msg.sender] = 1;
        emit ClaimedCheese(msg.sender, 2);
    }

    function claimParmesan(address _contract, bytes32[] calldata _merkleProof) public {
        require(_claimable(msg.sender, _merkleProof, _contract), "You've got no fromage!");
        ICheese c = ICheese(PARM_CONTRACT);

        c.airdropCheese(msg.sender, PARM_RATIO);
        whitelistClaimed[msg.sender] = 1;
        emit ClaimedCheese(msg.sender, 3);
    }

    function _claimable(address _claimer, bytes32[] calldata _merkleProof, address _contract) internal view returns (bool){
        require(!paused, "Claiming is paused!");
        require(whitelistContracts[_contract] == 1, "Invalid whitelist contract!");
        require(whitelistClaimed[_claimer] == 0, "You've already claimed your cheese!");
        bytes32 leaf = keccak256(abi.encodePacked(_claimer));
        require(MerkleProof.verify(_merkleProof, merkleRoot, leaf), "Invalid proof!");
        IERC721 nft = IERC721(_contract);
        require(nft.balanceOf(_claimer) > 0, "You don't own the required NFT!");

        return true;
    }

    // <AdminStuff>
    function transferCheeseOwnership(address _contract, address _newOwner) public onlyOwner {
        ICheese c = ICheese(_contract);
        c.transferOwnership(_newOwner);
    }

    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function updateWhitelistContract(address _contract, uint8 _setting) public onlyOwner {
        whitelistContracts[_contract] = _setting;
    }
    
    function updateWhitelistClaimed(address _claimer, uint8 _setting) public onlyOwner {
        whitelistClaimed[_claimer] = _setting;
    }

    function updateBurrataAddress(address _burr) public onlyOwner {
        BURRATA_CONTRACT = _burr;
    }

    function updateDolceAddress(address _dolce) public onlyOwner {
        DOLCE_CONTRACT = _dolce;
    }

    function updateParmAddress(address _parm) public onlyOwner {
        PARM_CONTRACT = _parm;
    }

    function flipPaused() public onlyOwner {
        paused = !paused;
    }

    function updateRatios(uint _burr, uint _dolce, uint _parm) public onlyOwner {
        BURRATA_RATIO = _burr;
        DOLCE_RATIO = _dolce;
        PARM_RATIO = _parm;
    }

}