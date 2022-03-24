import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";
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
    Cat: Contract,
    Thief: Contract, 
    Cow: Contract,
    Milk: Contract,
    Burrata: Contract,
    Dolce: Contract,
    Parm: Contract,
    Gold: Contract;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const [facCat, facThief, facCow, facMilk, facBurr, facDolce, facParm, facGold] = await Promise.all([
      ethers.getContractFactory("contracts/Cat.sol:RatCats"),
      ethers.getContractFactory("contracts/CatThief.sol:CatThief"),
      ethers.getContractFactory("contracts/Cow.sol:CheeseCow"),
      ethers.getContractFactory("contracts/CowMilk.sol:CowMilk"),
      ethers.getContractFactory("contracts/Burrata.sol:Burrata"),
      ethers.getContractFactory("contracts/Dolce.sol:Dolcelatte"),
      ethers.getContractFactory("contracts/Parm.sol:Parmesan"),
      ethers.getContractFactory("contracts/KingsGold.sol:KingsGold"),
    ]);

    Cow = await facCow.deploy();
    Cat = await facCat.deploy();
    Thief = await facThief.deploy();
    Milk = await facMilk.deploy();
    Burrata = await facBurr.deploy();
    Dolce = await facDolce.deploy();
    Parm = await facParm.deploy();
    Gold = await facGold.deploy();

    await Cow.deployed();
    await Cat.deployed();
    await Thief.deployed();
    await Milk.deployed();
    await Burrata.deployed();
    await Dolce.deployed();
    await Parm.deployed();
    await Gold.deployed();

    await Milk.updateCowAddress(Cow.address);
    await Milk.updateThiefAddress(Thief.address);
    await Milk.addCheesyAddress(Burrata.address);
    await Milk.addCheesyAddress(Dolce.address);
    await Milk.addCheesyAddress(Parm.address);
    await Milk.addCheesyAddress(Gold.address);

    await Burrata.setMilkAddress(Milk.address);
    await Dolce.setMilkAddress(Milk.address);
    await Parm.setMilkAddress(Milk.address);

    await Burrata.setKingAddress(Gold.address);
    await Dolce.setKingAddress(Gold.address);
    await Parm.setKingAddress(Gold.address);
    await Milk.setKingAddress(Gold.address);
    await Thief.setKingAddress(Gold.address);

    await Thief.updateCatAddress(Cat.address);

    await Cow.mint(addr1.address);
    await Cow.mint(addr1.address);
    await Cow.mint(addr2.address);

    await Cat.mint(1,addr1.address);
    await Cat.mint(2,addr3.address);
    await Cat.mint(3,addr3.address);

    await Gold.setMilkAddress(Milk.address);
    await Gold.updateCatAddress(Cat.address);
    await Gold.updateThiefAddress(Thief.address);
    await Gold.updateBurrataAddress(Burrata.address);
    await Gold.updateDolceAddress(Dolce.address);
    await Gold.updateParmAddress(Parm.address);

  });

  it("Check that Cows and Cats are minted to addresses", async function () {
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
    let balance1cat = await Cat.balanceOf(addr1.address);
    expect(balance1cat.toString()).to.equal(
      "1"
    );
    let balance2cat = await Cat.balanceOf(addr2.address);
    expect(balance2cat.toString()).to.equal(
      "0"
    );
    let balance3cat = await Cat.balanceOf(addr3.address);
    expect(balance3cat.toString()).to.equal(
      "2"
    );
  });

  it("Check that Cats are catching", async function () {
    await Thief.connect(addr1).startCatching();
    await Thief.connect(addr3).startCatching();

    expect(await Thief.isCatching(1)).to.equal(true);
    expect(await Thief.isCatching(2)).to.equal(true);
    expect(await Thief.isCatching(3)).to.equal(true);
  });

  it("Check that cMILK is airdropped", async function () {
    await Milk.connect(owner).airdropCowMilk(addr1.address, powTen18("1"));
    await Milk.connect(owner).airdropCowMilk(addr2.address, powTen18("5"));
    await Milk.connect(owner).airdropCowMilk(addr3.address, powTen18("2"));
    
    let balance1 = await Milk.balanceOf(addr1.address);
    expect(balance1.toString().slice(0, 5)).to.equal(
      "10000"
    );
    let balance2 = await Milk.balanceOf(addr2.address);
    expect(balance2.toString().slice(0, 5)).to.equal(
      "50000"
    );
    let balance3 = await Milk.balanceOf(addr3.address);
    expect(balance3.toString().slice(0, 5)).to.equal(
      "20000"
    );
  });

  it("Should fail to stake or claim with amount == 0", async function () {

    await expect(
      Thief.connect(addr2).startCatching()
    ).to.be.revertedWith("You don't have any cats!");

    await expect(
      Milk.connect(addr3).startFarming()
    ).to.be.revertedWith("You don't have any cows!");
    
    await expect(
      Milk.connect(addr3).claimCowMilk()
    ).to.be.revertedWith("You aren't farming!");

    await Milk.connect(addr1).startFarming();

    await wait(0.5, 1); // day 0 - 12 hours.

    await expect(
      Milk.connect(addr1).claimCowMilk()
    ).to.be.revertedWith("Nothing to claim!");

    await wait(1, 1); // day 1.5

    await expect(
      Milk.connect(addr1).claimCowMilk()
    ).to.be.revertedWith("Nothing to claim!");
    
  });

  it("Should have claimable amount", async function () {

    await Milk.connect(addr1).startFarming();
    await Milk.connect(addr2).startFarming();

    await wait(1, 1); //day 1

    const claimable = await Milk.claimableView(addr1.address);
    expect(claimable.toString().slice(0, 4)).to.equal(
      (1200).toString().slice(0, 4)
    );

    const claimable2 = await Milk.claimableView(addr2.address);
    expect(claimable2.toString().slice(0, 4)).to.equal(
      (6000).toString().slice(0, 4)
    );

    await Milk.connect(addr1).claimCowMilk();
    const bal1 = await Milk.balanceOf(addr1.address);
    expect(bal1.toString().slice(0, 5)).to.equal(
      "12000"
    );

    await Milk.connect(addr2).claimCowMilk();
    const bal2 = await Milk.balanceOf(addr2.address);
    expect(bal2.toString().slice(0, 5)).to.equal(
      "60000"
    );

    await wait(1, 1); //day 2

    const claimable3 = await Milk.claimableView(addr1.address);
    expect(claimable3.toString().slice(0, 4)).to.equal(
      (1200).toString().slice(0, 4)
    );

    const claimable4 = await Milk.claimableView(addr2.address);
    expect(claimable4.toString().slice(0, 4)).to.equal(
      (6000).toString().slice(0, 4)
    );
    
  });

  it("Check that Burrata is made and claimed", async function () {
    await Milk.connect(owner).airdropCowMilk(addr1.address, powTen18("6"));
    await Milk.connect(owner).airdropCowMilk(addr2.address, powTen18("18"));
    
    let balance1 = await Milk.balanceOf(addr1.address);
    expect(balance1.toString().slice(0, 5)).to.equal(
      "60000"
    );
    let balance2 = await Milk.balanceOf(addr2.address);
    expect(balance2.toString().slice(0, 5)).to.equal(
      "18000"
    );
    
    await Burrata.connect(addr1).makeCheese(1);
    await Burrata.connect(addr2).makeCheese(3);

    await wait(0.5, 1); //day 0.5

    let claimable = await Burrata.connect(addr1).claimableView(addr1.address);
    expect(claimable.toString()).to.equal(
      "0"
    );

    let claimable2 = await Burrata.connect(addr2).claimableView(addr2.address);
    expect(claimable2.toString()).to.equal(
      "0"
    );

    await wait(1, 1); //day 1.5

    let claimable3 = await Burrata.connect(addr1).claimableView(addr1.address);
    expect(claimable3.toString()).to.equal(
      "1"
    );

    let claimable4 = await Burrata.connect(addr2).claimableView(addr2.address);
    expect(claimable4.toString()).to.equal(
      "3"
    );

    await Burrata.connect(addr1).claimCheese();
    await Burrata.connect(addr2).claimCheese();

    let balance1nft = await Burrata.balanceOf(addr1.address);
    expect(balance1nft.toString()).to.equal(
      "1"
    );
    let balance2nft = await Burrata.balanceOf(addr2.address);
    expect(balance2nft.toString()).to.equal(
      "3"
    );

  });

  it("Check that Burrata is airdropped", async function () {
    await Burrata.connect(owner).airdropCheese(addr1.address, 1);
    await Burrata.connect(owner).airdropCheese(addr2.address, 5);
    
    let balance1 = await Burrata.balanceOf(addr1.address);
    expect(balance1.toString()).to.equal(
      "1"
    );
    let balance2 = await Burrata.balanceOf(addr2.address);
    expect(balance2.toString()).to.equal(
      "5"
    );
  });

  it("Burrata revert tests", async function () {

    await expect(
      Burrata.connect(addr2).claimCheese()
    ).to.be.revertedWith("You aren't fromaging!");

    await Milk.connect(owner).airdropCowMilk(addr2.address, powTen18("18"));
    
    await expect(
      Burrata.connect(addr2).makeCheese(11)
    ).to.be.revertedWith("You can only make up to 10 cheese at a time!");

    await Burrata.connect(addr2).makeCheese(2);

    await expect(
      Burrata.connect(addr2).claimCheese()
    ).to.be.revertedWith("Nothing to claim!");

    await expect(
      Burrata.connect(addr2).makeCheese(1)
    ).to.be.revertedWith("You are already fromaging!");

    await Milk.connect(owner).airdropCowMilk(addr1.address, powTen18("5"));

    await expect(
      Burrata.connect(addr1).makeCheese(1)
    ).to.be.revertedWith("You don't have enough cMILK!");
    
  });

  it("Check that Dolcelatte is made and claimed", async function () {
    await Milk.connect(owner).airdropCowMilk(addr1.address, powTen18("6"));
    await Milk.connect(owner).airdropCowMilk(addr2.address, powTen18("18"));
    
    let balance1 = await Milk.balanceOf(addr1.address);
    expect(balance1.toString().slice(0, 5)).to.equal(
      "60000"
    );
    let balance2 = await Milk.balanceOf(addr2.address);
    expect(balance2.toString().slice(0, 5)).to.equal(
      "18000"
    );
    
    await Dolce.connect(addr1).makeCheese(1);
    await Dolce.connect(addr2).makeCheese(3);

    await wait(0.5, 1); //day 0.5

    let claimable = await Dolce.connect(addr1).claimableView(addr1.address);
    expect(claimable.toString()).to.equal(
      "0"
    );

    let claimable2 = await Dolce.connect(addr2).claimableView(addr2.address);
    expect(claimable2.toString()).to.equal(
      "0"
    );

    await wait(2, 1); //day 2.5

    let claimable3 = await Dolce.connect(addr1).claimableView(addr1.address);
    expect(claimable3.toString()).to.equal(
      "1"
    );

    let claimable4 = await Dolce.connect(addr2).claimableView(addr2.address);
    expect(claimable4.toString()).to.equal(
      "3"
    );

    await Dolce.connect(addr1).claimCheese();
    await Dolce.connect(addr2).claimCheese();

    let balance1nft = await Dolce.balanceOf(addr1.address);
    expect(balance1nft.toString()).to.equal(
      "1"
    );
    let balance2nft = await Dolce.balanceOf(addr2.address);
    expect(balance2nft.toString()).to.equal(
      "3"
    );

  });

  it("Check that Dolcelatte is airdropped", async function () {
    await Dolce.connect(owner).airdropCheese(addr1.address, 1);
    await Dolce.connect(owner).airdropCheese(addr2.address, 5);
    
    let balance1 = await Dolce.balanceOf(addr1.address);
    expect(balance1.toString()).to.equal(
      "1"
    );
    let balance2 = await Dolce.balanceOf(addr2.address);
    expect(balance2.toString()).to.equal(
      "5"
    );
  });

  it("Dolcelatte revert tests", async function () {

    await expect(
      Dolce.connect(addr2).claimCheese()
    ).to.be.revertedWith("You aren't fromaging!");

    await Milk.connect(owner).airdropCowMilk(addr2.address, powTen18("18"));
    
    await expect(
      Dolce.connect(addr2).makeCheese(11)
    ).to.be.revertedWith("You can only make up to 10 cheese at a time!");

    await Dolce.connect(addr2).makeCheese(2);

    await expect(
      Dolce.connect(addr2).claimCheese()
    ).to.be.revertedWith("Nothing to claim!");

    await expect(
      Dolce.connect(addr2).makeCheese(1)
    ).to.be.revertedWith("You are already fromaging!");

    await Milk.connect(owner).airdropCowMilk(addr1.address, powTen18("5"));
    await expect(
      Dolce.connect(addr1).makeCheese(1)
    ).to.be.revertedWith("You don't have enough cMILK!");
    
  });

  it("Check that Parmesan is made and claimed", async function () {
    await Milk.connect(owner).airdropCowMilk(addr1.address, powTen18("12"));
    await Milk.connect(owner).airdropCowMilk(addr2.address, powTen18("36"));
    
    let balance1 = await Milk.balanceOf(addr1.address);
    expect(balance1.toString().slice(0, 5)).to.equal(
      "12000"
    );
    let balance2 = await Milk.balanceOf(addr2.address);
    expect(balance2.toString().slice(0, 5)).to.equal(
      "36000"
    );
    
    await Parm.connect(addr1).makeCheese(1);
    await Parm.connect(addr2).makeCheese(3);

    await wait(0.5, 1); //day 0.5

    let claimable = await Parm.connect(addr1).claimableView(addr1.address);
    expect(claimable.toString()).to.equal(
      "0"
    );

    let claimable2 = await Parm.connect(addr2).claimableView(addr2.address);
    expect(claimable2.toString()).to.equal(
      "0"
    );

    await wait(3, 1); //day 2.5

    let claimable3 = await Parm.connect(addr1).claimableView(addr1.address);
    expect(claimable3.toString()).to.equal(
      "1"
    );

    let claimable4 = await Parm.connect(addr2).claimableView(addr2.address);
    expect(claimable4.toString()).to.equal(
      "3"
    );

    await Parm.connect(addr1).claimCheese();
    await Parm.connect(addr2).claimCheese();

    let balance1nft = await Parm.balanceOf(addr1.address);
    expect(balance1nft.toString()).to.equal(
      "1"
    );
    let balance2nft = await Parm.balanceOf(addr2.address);
    expect(balance2nft.toString()).to.equal(
      "3"
    );

  });

  it("Check that Parmesan is airdropped", async function () {
    await Parm.connect(owner).airdropCheese(addr1.address, 1);
    await Parm.connect(owner).airdropCheese(addr2.address, 5);
    
    let balance1 = await Parm.balanceOf(addr1.address);
    expect(balance1.toString()).to.equal(
      "1"
    );
    let balance2 = await Parm.balanceOf(addr2.address);
    expect(balance2.toString()).to.equal(
      "5"
    );
  });

  it("Parmesan revert tests", async function () {

    await expect(
      Parm.connect(addr2).claimCheese()
    ).to.be.revertedWith("You aren't fromaging!");

    await Milk.connect(owner).airdropCowMilk(addr2.address, powTen18("36"));
    
    await expect(
      Parm.connect(addr2).makeCheese(11)
    ).to.be.revertedWith("You can only make up to 10 cheese at a time!");

    await Parm.connect(addr2).makeCheese(2);

    await expect(
      Parm.connect(addr2).claimCheese()
    ).to.be.revertedWith("Nothing to claim!");

    await expect(
      Parm.connect(addr2).makeCheese(1)
    ).to.be.revertedWith("You are already fromaging!");

    await Milk.connect(owner).airdropCowMilk(addr1.address, powTen18("5"));

    await expect(
      Parm.connect(addr1).makeCheese(1)
    ).to.be.revertedWith("You don't have enough cMILK!");
    
  });

  it("Check that kGOLD is airdropped", async function () {
    await Gold.connect(owner).airdropKingsGold(addr1.address, powTen18("1"));
    await Gold.connect(owner).airdropKingsGold(addr2.address, powTen18("5"));
    await Gold.connect(owner).airdropKingsGold(addr3.address, powTen18("2"));
    
    let balance1 = await Gold.balanceOf(addr1.address);
    expect(balance1.toString().slice(0, 5)).to.equal(
      "10000"
    );
    let balance2 = await Gold.balanceOf(addr2.address);
    expect(balance2.toString().slice(0, 5)).to.equal(
      "50000"
    );
    let balance3 = await Gold.balanceOf(addr3.address);
    expect(balance3.toString().slice(0, 5)).to.equal(
      "20000"
    );
  });

  it("Check boosting levels", async function () {
    await expect(
      Gold.connect(addr3).boostCatLevel(2)
    ).to.be.revertedWith("You don't have enough kGOLD!");

    await Gold.connect(owner).airdropKingsGold(addr1.address, powTen18("20"));
    await Gold.connect(owner).airdropKingsGold(addr3.address, powTen18("20"));

    await expect(
      Gold.connect(addr2).boostFarmerLevel()
    ).to.be.revertedWith("You don't have enough kGOLD!");
    
    let farmerBefore = await Milk.checkFarmerLevel(addr1.address);
    expect(farmerBefore.toString()).to.equal(
      "0"
    );
    await Gold.connect(addr1).boostFarmerLevel();
    let farmerAfter = await Milk.checkFarmerLevel(addr1.address);
    expect(farmerAfter.toString()).to.equal(
      "1"
    );
    let balance1 = await Gold.balanceOf(addr1.address);
    expect(balance1.toString().slice(0, 5)).to.equal(
      "19000"
    );

    await expect(
      Gold.connect(addr2).boostBurrataLevel()
    ).to.be.revertedWith("You don't have enough kGOLD!");

    let burrataBefore = await Burrata.checkFromagerLevel(addr1.address);
    expect(burrataBefore.toString()).to.equal(
      "0"
    );
    await Gold.connect(addr1).boostBurrataLevel();
    let burrataAfter = await Burrata.checkFromagerLevel(addr1.address);
    expect(burrataAfter.toString()).to.equal(
      "1"
    );
    let balance2 = await Gold.balanceOf(addr1.address);
    expect(balance2.toString().slice(0, 5)).to.equal(
      "18000"
    );

    await expect(
      Gold.connect(addr2).boostDolcelatteLevel()
    ).to.be.revertedWith("You don't have enough kGOLD!");

    let dolceBefore = await Dolce.checkFromagerLevel(addr1.address);
    expect(dolceBefore.toString()).to.equal(
      "0"
    );
    await Gold.connect(addr1).boostDolcelatteLevel();
    let dolceAfter = await Dolce.checkFromagerLevel(addr1.address);
    expect(dolceAfter.toString()).to.equal(
      "1"
    );
    let balance3 = await Gold.balanceOf(addr1.address);
    expect(balance3.toString().slice(0, 5)).to.equal(
      "15000"
    );

    await expect(
      Gold.connect(addr2).boostParmesanLevel()
    ).to.be.revertedWith("You don't have enough kGOLD!");

    let parmBefore = await Parm.checkFromagerLevel(addr1.address);
    expect(parmBefore.toString()).to.equal(
      "0"
    );
    await Gold.connect(addr1).boostParmesanLevel();
    let parmAfter = await Parm.checkFromagerLevel(addr1.address);
    expect(parmAfter.toString()).to.equal(
      "1"
    );
    let balance4 = await Gold.balanceOf(addr1.address);
    expect(balance4.toString().slice(0, 5)).to.equal(
      "10000"
    );

    let catBefore = await Thief.checkCatLevel(2);
    expect(catBefore.toString()).to.equal(
      "0"
    );
    await Gold.connect(addr3).boostCatLevel(2);
    let catAfter = await Thief.checkCatLevel(2);
    expect(catAfter.toString()).to.equal(
      "1"
    );
    let balance5 = await Gold.balanceOf(addr3.address);
    expect(balance5.toString().slice(0, 5)).to.equal(
      "19000"
    );
  });

  it("kGOLD test exchanging", async function () {

    await Milk.connect(owner).airdropCowMilk(addr2.address, powTen18("36"));
    
    await Gold.connect(addr2).exchangeMilk(12);
    let milkBalance = await Milk.balanceOf(addr2.address);
    expect(milkBalance.toString().slice(0, 5)).to.equal(
      "24000"
    );

    let goldBalance1 = await Gold.balanceOf(addr2.address);
    expect(goldBalance1.toString().slice(0, 5)).to.equal(
      "10000"
    );

    await Burrata.connect(owner).airdropCheese(addr2.address, 2);
    await Burrata.connect(owner).airdropCheese(addr1.address, 1);

    await Gold.connect(addr1).exchangeBurrata(3);
    let goldBalance2 = await Gold.balanceOf(addr1.address);
    expect(goldBalance2.toString().slice(0, 5)).to.equal(
      "10000"
    );
    let burrataBalance1 = await Burrata.balanceOf(addr1.address);
    expect(burrataBalance1.toString()).to.equal(
      "0"
    );

    await Gold.connect(addr2).exchangeAllBurrata();
    let goldBalance3 = await Gold.balanceOf(addr2.address);
    expect(goldBalance3.toString().slice(0, 5)).to.equal(
      "30000"
    );
    let burrataBalance2 = await Burrata.balanceOf(addr2.address);
    expect(burrataBalance2.toString()).to.equal(
      "0"
    );

    await Dolce.connect(owner).airdropCheese(addr2.address, 2);
    await Dolce.connect(owner).airdropCheese(addr1.address, 1);

    await Gold.connect(addr1).exchangeDolce(3);
    let goldBalance4 = await Gold.balanceOf(addr1.address);
    expect(goldBalance4.toString().slice(0, 5)).to.equal(
      "40000"
    );
    let dolceBalance1 = await Dolce.balanceOf(addr1.address);
    expect(dolceBalance1.toString()).to.equal(
      "0"
    );

    await Gold.connect(addr2).exchangeAllDolce();
    let goldBalance5 = await Gold.balanceOf(addr2.address);
    expect(goldBalance5.toString().slice(0, 5)).to.equal(
      "90000"
    );
    let dolceBalance2 = await Dolce.balanceOf(addr2.address);
    expect(dolceBalance2.toString()).to.equal(
      "0"
    );

    await Parm.connect(owner).airdropCheese(addr2.address, 2);
    await Parm.connect(owner).airdropCheese(addr1.address, 1);

    await Gold.connect(addr1).exchangeParmesan(3);
    let goldBalance6 = await Gold.balanceOf(addr1.address);
    expect(goldBalance6.toString().slice(0, 5)).to.equal(
      "14000"
    );
    let parmBalance1 = await Parm.balanceOf(addr1.address);
    expect(parmBalance1.toString()).to.equal(
      "0"
    );

    await Gold.connect(addr2).exchangeAllParmesan();
    let goldBalance7 = await Gold.balanceOf(addr2.address);
    expect(goldBalance7.toString().slice(0, 5)).to.equal(
      "29000"
    );
    let parmBalance2 = await Parm.balanceOf(addr2.address);
    expect(parmBalance2.toString()).to.equal(
      "0"
    );

  });

  it("kGOLD revert tests", async function () {

    await expect(
      Gold.connect(addr2).cheesyMint(addr2.address, powTen18("1"))
    ).to.be.revertedWith("You aren't allowed to mint.");

    await Milk.connect(owner).airdropCowMilk(addr2.address, powTen18("36"));
    
    await expect(
      Gold.connect(addr2).exchangeMilk(11)
    ).to.be.revertedWith("Invalid amount entered!");

    await expect(
      Gold.connect(addr2).exchangeMilk(42)
    ).to.be.revertedWith("You don't have enough cMILK!");

    await expect(
      Gold.connect(addr2).exchangeAllBurrata()
    ).to.be.revertedWith("You don't have any Burrata!");

    await Burrata.connect(owner).airdropCheese(addr2.address, 1);
    await Burrata.connect(owner).airdropCheese(addr1.address, 1);

    await Burrata.connect(addr2).setApprovalForAll(Gold.address, true);
    await expect(
      Gold.connect(addr2).exchangeBurrata(2)
    ).to.be.revertedWith("You don't own that Burrata!");

    await expect(
      Gold.connect(addr2).exchangeAllDolce()
    ).to.be.revertedWith("You don't have any Dolcelatte!");

    await Dolce.connect(owner).airdropCheese(addr2.address, 1);
    await Dolce.connect(owner).airdropCheese(addr1.address, 1);

    await Dolce.connect(addr2).setApprovalForAll(Gold.address, true);
    await expect(
      Gold.connect(addr2).exchangeDolce(2)
    ).to.be.revertedWith("You don't own that Dolcelatte!");

    await expect(
      Gold.connect(addr2).exchangeAllParmesan()
    ).to.be.revertedWith("You don't have any Parmesan!");

    await Parm.connect(owner).airdropCheese(addr2.address, 1);
    await Parm.connect(owner).airdropCheese(addr1.address, 1);

    await Parm.connect(addr2).setApprovalForAll(Gold.address, true);
    await expect(
      Gold.connect(addr2).exchangeParmesan(2)
    ).to.be.revertedWith("You don't own that Parmesan!");

    await expect(
      Gold.connect(addr3).boostFarmerLevel()
    ).to.be.revertedWith("You don't have enough kGOLD!");

    await expect(
      Gold.connect(addr3).boostCatLevel(2)
    ).to.be.revertedWith("You don't have enough kGOLD!");

    await expect(
      Gold.connect(addr3).boostBurrataLevel()
    ).to.be.revertedWith("You don't have enough kGOLD!");

    await expect(
      Gold.connect(addr3).boostDolcelatteLevel()
    ).to.be.revertedWith("You don't have enough kGOLD!");

    await expect(
      Gold.connect(addr3).boostParmesanLevel()
    ).to.be.revertedWith("You don't have enough kGOLD!");
    
  });

/*
  it("Test Thieving", async function () {
    await Thief.connect(addr1).startCatching();
    await Thief.connect(addr3).startCatching();

    await Milk.connect(addr1).startFarming();
    await Milk.connect(addr2).startFarming();

    await wait(1, 1); //day 1

    const claimable = await Milk.claimableView(addr1.address);
    expect(claimable.toString().slice(0, 4)).to.equal(
      (1200).toString().slice(0, 4)
    );

    const claimable2 = await Milk.claimableView(addr2.address);
    expect(claimable2.toString().slice(0, 4)).to.equal(
      (6000).toString().slice(0, 4)
    );

    await Milk.connect(addr1).claimCowMilk();
    const bal1 = await Milk.balanceOf(addr1.address);
    expect(bal1.toString().slice(0, 5)).to.equal(
      "12000"
    );

    await Milk.connect(addr2).claimCowMilk();
    const bal2 = await Milk.balanceOf(addr2.address);
    expect(bal2.toString().slice(0, 5)).to.equal(
      "60000"
    );
    
  });
*/
});
