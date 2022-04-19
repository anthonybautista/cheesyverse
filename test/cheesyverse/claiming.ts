import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
// eslint-disable-next-line node/no-missing-import
import { NULL_ADDR } from "../utils";

const powTen18 = ethers.utils.parseEther;

// when doing multiple calls its not same block so we need to add seconds
async function wait(days: number, secondsToAdd: number = 0): Promise<void> {
  const seconds = days * 24 * 60 * 60 + secondsToAdd;

  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

describe("Cheesy Tests", function () {
  let owner: SignerWithAddress,
    addr1: SignerWithAddress,
    addr2: SignerWithAddress,
    addr3: SignerWithAddress,
    Claim: Contract,
    Cow: Contract,
    Burrata: Contract,
    Dolce: Contract,
    Parm: Contract;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const [facClaim, facCow, facBurr, facDolce, facParm] = await Promise.all([
      ethers.getContractFactory("contracts/CheeseClaim.sol:SocClaimCheese"),
      ethers.getContractFactory("contracts/Cow.sol:CheeseCow"),
      ethers.getContractFactory("contracts/Burrata.sol:Burrata"),
      ethers.getContractFactory("contracts/Dolce.sol:Dolcelatte"),
      ethers.getContractFactory("contracts/Parm.sol:Parmesan"),
    ]);

    Cow = await facCow.deploy();
    Claim = await facClaim.deploy();
    Burrata = await facBurr.deploy();
    Dolce = await facDolce.deploy();
    Parm = await facParm.deploy();

    await Claim.deployed();
    await Cow.deployed();
    await Burrata.deployed();
    await Dolce.deployed();
    await Parm.deployed();

    await Burrata.transferOwnership(Claim.address);
    await Dolce.transferOwnership(Claim.address);
    await Parm.transferOwnership(Claim.address);

    await Claim.updateBurrataAddress(Burrata.address);
    await Claim.updateDolceAddress(Dolce.address);
    await Claim.updateParmAddress(Parm.address);
    await Claim.updateWhitelistContract(Cow.address, 1);

    await Cow.mint(addr1.address);
    await Cow.mint(addr1.address);
    await Cow.mint(addr2.address);

    let whitelistAddresses = [
      addr1.address.toString(),
      addr2.address.toString()
    ];

    const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHash = merkleTree.getRoot();
    await Claim.connect(owner).setMerkleRoot(rootHash);


  });

  it("Check that Cows are minted to addresses", async function () {
    let balance1cow = await Cow.balanceOf(addr1.address);
    expect(balance1cow.toString()).to.equal(
      "2"
    );
    let balance2cow = await Cow.balanceOf(addr2.address);
    expect(balance2cow.toString()).to.equal(
      "1"
    );
    let balance3cow = await Cow.balanceOf(addr3.address);
    expect(balance3cow.toString()).to.equal(
      "0"
    );
  });

  it("Check that ownership changes", async function () {
    expect(await Burrata.owner()).to.equal(Claim.address);
    expect(await Burrata.owner()).to.equal(Claim.address);
    expect(await Burrata.owner()).to.equal(Claim.address);

    await Claim.connect(owner).transferCheeseOwnership(Burrata.address, owner.address);
    await Claim.connect(owner).transferCheeseOwnership(Dolce.address, owner.address);
    await Claim.connect(owner).transferCheeseOwnership(Parm.address, owner.address);

    expect(await Burrata.owner()).to.equal(owner.address);
    expect(await Burrata.owner()).to.equal(owner.address);
    expect(await Burrata.owner()).to.equal(owner.address);
  });

  it("Check claiming", async function () {
    let whitelistAddresses = [
      addr1.address.toString(),
      addr2.address.toString()
    ];

    const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

    const hexProof = merkleTree.getHexProof(leafNodes[0]);
    await Claim.connect(addr1).claimBurrata(Cow.address, hexProof);

    expect(await Burrata.balanceOf(addr1.address)).to.equal(10);

    let whitelistAddresses2 = [
      addr1.address.toString(),
      addr2.address.toString(),
      addr3.address.toString()
    ];

    const leafNodes2 = whitelistAddresses2.map(addr => keccak256(addr));
    const merkleTree2 = new MerkleTree(leafNodes2, keccak256, { sortPairs: true });
    const rootHash2 = merkleTree2.getRoot();

    const hexProof3 = merkleTree2.getHexProof(leafNodes2[2]);

    //await expect(
    //  Claim.connect(addr2).claimDolcelatte(Cow.address, hexProof3)
    //).to.be.revertedWith("Invalid proof!");

    await Claim.connect(owner).setMerkleRoot(rootHash2);

    await expect(
      await Claim.connect(addr3).claimDolcelatte(Cow.address, hexProof3)
    ).to.be.revertedWith("You don't own the required NFT!");

    await Cow.connect(addr3).mint(addr3.address);

    await Claim.connect(addr3).claimParmesan(Cow.address, hexProof3);
    expect(await Parm.balanceOf(addr3.address)).to.equal(5);

    const hexProof2 = merkleTree2.getHexProof(leafNodes2[1]);
    await Claim.connect(addr2).claimDolcelatte(Cow.address, hexProof2);
    expect(await Dolce.balanceOf(addr2.address)).to.equal(10);

  });

});
