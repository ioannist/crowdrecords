const ERC1155SnapshotMock = artifacts.require("ERC1155SnapshotMock");
const setup = require("../../utils/deployContracts");
const helper = require("../../utils/helper");
const chai = require("chai");
const BN = require("bn.js");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const expectRevert = require("@openzeppelin/test-helpers/src/expectRevert");
const chaiBN = require("chai-bn")(BN);
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

contract("SnapshotERC1155", function() {
    let initialHolder;
    let recipient;
    let other;
    const initialTokenId = 1;
    const secondTokenId = 2;

    const initialSupply = new BN(100);
    const initialSupplySecondToken = new BN(0);

    const uri = "DummyURI";

    let snapShot, snapshotId;
    beforeEach(async function() {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot["result"];

        initialHolder = await helper.getEthAccount(0);
        recipient = await helper.getEthAccount(1);
        other = await helper.getEthAccount(2);

        this.token = await ERC1155SnapshotMock.new(uri, initialHolder, initialSupply);
    });
    afterEach(async function() {
        await helper.revertToSnapshot(snapshotId);
    });

    describe("snapshot", function() {
        it("emits a snapshot event", async function() {
            const receipt = await this.token.snapshot();
            expectEvent(receipt, "Snapshot");
        });

        it("creates increasing snapshots ids, starting from 1", async function() {
            for (const id of ["1", "2", "3", "4", "5"]) {
                const receipt = await this.token.snapshot();
                expectEvent(receipt, "Snapshot", { id });
            }
        });
    });

    describe("totalSupplyAt", function() {
        it("reverts with a snapshot id of 0", async function() {
            await expectRevert(
                this.token.totalSupplyAt(0, initialTokenId),
                "ERC20Snapshot: id is 0"
            );
        });

        it("reverts with a not-yet-created snapshot id", async function() {
            await expectRevert(
                this.token.totalSupplyAt(1, initialTokenId),
                "ERC20Snapshot: nonexistent id"
            );
        });

        context("with initial snapshot", function() {
            beforeEach(async function() {
                this.initialSnapshotId = new BN("1");

                const receipt = await this.token.snapshot();
                expectEvent(receipt, "Snapshot", { id: this.initialSnapshotId });
            });

            context("with no supply changes after the snapshot", function() {
                it("returns the current total supply", async function() {
                    expect(
                        await this.token.totalSupplyAt(this.initialSnapshotId, initialTokenId)
                    ).to.be.bignumber.equal(initialSupply);
                });
            });

            context("with supply changes after the snapshot", function() {
                beforeEach(async function() {
                    await this.token.mint(other, initialTokenId, new BN("50"));
                    await this.token.createNewToken(other, new BN("50"));
                    await this.token.burn(initialHolder, initialTokenId, new BN("20"));
                });

                it("returns the total supply before the changes", async function() {
                    expect(
                        await this.token.totalSupplyAt(this.initialSnapshotId, initialTokenId)
                    ).to.be.bignumber.equal(initialSupply);
                    expect(
                        await this.token.totalSupplyAt(this.initialSnapshotId, secondTokenId)
                    ).to.be.bignumber.equal(initialSupplySecondToken);
                });

                context("with a second snapshot after supply changes", function() {
                    beforeEach(async function() {
                        this.secondSnapshotId = new BN("2");

                        const receipt = await this.token.snapshot();
                        expectEvent(receipt, "Snapshot", { id: this.secondSnapshotId });
                    });

                    it("snapshots return the supply before and after the changes", async function() {
                        expect(
                            await this.token.totalSupplyAt(this.initialSnapshotId, initialTokenId)
                        ).to.be.bignumber.equal(initialSupply);

                        expect(
                            await this.token.totalSupplyAt(this.secondSnapshotId, initialTokenId)
                        ).to.be.bignumber.equal(await this.token.totalSupply(initialTokenId));
                    });
                });

                context("with multiple snapshots after supply changes", function() {
                    beforeEach(async function() {
                        this.secondSnapshotIds = ["2", "3", "4"];

                        for (const id of this.secondSnapshotIds) {
                            const receipt = await this.token.snapshot();
                            expectEvent(receipt, "Snapshot", { id });
                        }
                    });

                    it("all posterior snapshots return the supply after the changes", async function() {
                        expect(
                            await this.token.totalSupplyAt(this.initialSnapshotId, initialTokenId)
                        ).to.be.bignumber.equal(initialSupply);

                        const currentSupply = await this.token.totalSupply(initialTokenId);

                        for (const id of this.secondSnapshotIds) {
                            expect(
                                await this.token.totalSupplyAt(id, initialTokenId)
                            ).to.be.bignumber.equal(currentSupply);
                        }
                    });
                });
            });
        });
    });

    describe("balanceOfAt", function() {
        it("reverts with a snapshot id of 0", async function() {
            await expectRevert(
                this.token.balanceOfAt(other, 0, initialTokenId),
                "ERC20Snapshot: id is 0"
            );
        });

        it("reverts with a not-yet-created snapshot id", async function() {
            await expectRevert(
                this.token.balanceOfAt(other, 1, initialTokenId),
                "ERC20Snapshot: nonexistent id"
            );
        });

        context("with initial snapshot", function() {
            beforeEach(async function() {
                this.initialSnapshotId = new BN("1");

                const receipt = await this.token.snapshot();
                expectEvent(receipt, "Snapshot", { id: this.initialSnapshotId });
            });

            context("with no balance changes after the snapshot", function() {
                it("returns the current balance for all accounts", async function() {
                    expect(
                        await this.token.balanceOfAt(
                            initialHolder,
                            this.initialSnapshotId,
                            initialTokenId
                        )
                    ).to.be.bignumber.equal(initialSupply);
                    expect(
                        await this.token.balanceOfAt(
                            recipient,
                            this.initialSnapshotId,
                            initialTokenId
                        )
                    ).to.be.bignumber.equal("0");
                    expect(
                        await this.token.balanceOfAt(other, this.initialSnapshotId, initialTokenId)
                    ).to.be.bignumber.equal("0");
                });
            });

            context("with balance changes after the snapshot", function() {
                beforeEach(async function() {
                    await this.token.safeTransferFrom(
                        initialHolder,
                        recipient,
                        initialTokenId,
                        new BN("10"),
                        "0x123456",
                        {
                            from: initialHolder,
                        }
                    );
                    await this.token.mint(other, initialTokenId, new BN("50"));
                    await this.token.createNewToken(initialHolder, new BN("50"));
                    await this.token.mint(other, secondTokenId, new BN("50"));
                    await this.token.burn(initialHolder, initialTokenId, new BN("20"));
                });

                it("returns the balances before the changes", async function() {
                    expect(
                        await this.token.balanceOfAt(
                            initialHolder,
                            this.initialSnapshotId,
                            initialTokenId
                        )
                    ).to.be.bignumber.equal(initialSupply);
                    expect(
                        await this.token.balanceOfAt(
                            recipient,
                            this.initialSnapshotId,
                            initialTokenId
                        )
                    ).to.be.bignumber.equal("0");
                    expect(
                        await this.token.balanceOfAt(other, this.initialSnapshotId, initialTokenId)
                    ).to.be.bignumber.equal("0");
                });

                context("with a second snapshot after supply changes", function() {
                    beforeEach(async function() {
                        this.secondSnapshotId = new BN("2");

                        const receipt = await this.token.snapshot();
                        expectEvent(receipt, "Snapshot", { id: this.secondSnapshotId });
                    });

                    it("snapshots return the balances before and after the changes", async function() {
                        expect(
                            await this.token.balanceOfAt(
                                initialHolder,
                                this.initialSnapshotId,
                                initialTokenId
                            )
                        ).to.be.bignumber.equal(initialSupply);
                        expect(
                            await this.token.balanceOfAt(
                                recipient,
                                this.initialSnapshotId,
                                initialTokenId
                            )
                        ).to.be.bignumber.equal("0");
                        expect(
                            await this.token.balanceOfAt(
                                other,
                                this.initialSnapshotId,
                                initialTokenId
                            )
                        ).to.be.bignumber.equal("0");

                        expect(
                            await this.token.balanceOfAt(
                                initialHolder,
                                this.secondSnapshotId,
                                initialTokenId
                            )
                        ).to.be.bignumber.equal(
                            await this.token.balanceOf(initialHolder, initialTokenId)
                        );
                        expect(
                            await this.token.balanceOfAt(
                                recipient,
                                this.secondSnapshotId,
                                initialTokenId
                            )
                        ).to.be.bignumber.equal(
                            await this.token.balanceOf(recipient, initialTokenId)
                        );
                        expect(
                            await this.token.balanceOfAt(
                                other,
                                this.secondSnapshotId,
                                initialTokenId
                            )
                        ).to.be.bignumber.equal(await this.token.balanceOf(other, initialTokenId));

                        expect(
                            await this.token.balanceOfAt(
                                initialHolder,
                                this.initialSnapshotId,
                                secondTokenId
                            )
                        ).to.be.bignumber.equal("0");
                        expect(
                            await this.token.balanceOfAt(
                                initialHolder,
                                this.secondSnapshotId,
                                secondTokenId
                            )
                        ).to.be.bignumber.equal("50");
                    });
                });

                context("with multiple snapshots after supply changes", function() {
                    beforeEach(async function() {
                        this.secondSnapshotIds = ["2", "3", "4"];

                        for (const id of this.secondSnapshotIds) {
                            const receipt = await this.token.snapshot();
                            expectEvent(receipt, "Snapshot", { id });
                        }
                    });

                    it("all posterior snapshots return the supply after the changes", async function() {
                        expect(
                            await this.token.balanceOfAt(
                                initialHolder,
                                this.initialSnapshotId,
                                initialTokenId
                            )
                        ).to.be.bignumber.equal(initialSupply);
                        expect(
                            await this.token.balanceOfAt(
                                recipient,
                                this.initialSnapshotId,
                                initialTokenId
                            )
                        ).to.be.bignumber.equal("0");
                        expect(
                            await this.token.balanceOfAt(
                                other,
                                this.initialSnapshotId,
                                initialTokenId
                            )
                        ).to.be.bignumber.equal("0");

                        for (const id of this.secondSnapshotIds) {
                            expect(
                                await this.token.balanceOfAt(initialHolder, id, initialTokenId)
                            ).to.be.bignumber.equal(
                                await this.token.balanceOf(initialHolder, initialTokenId)
                            );
                            expect(
                                await this.token.balanceOfAt(recipient, id, initialTokenId)
                            ).to.be.bignumber.equal(
                                await this.token.balanceOf(recipient, initialTokenId)
                            );
                            expect(
                                await this.token.balanceOfAt(other, id, initialTokenId)
                            ).to.be.bignumber.equal(
                                await this.token.balanceOf(other, initialTokenId)
                            );
                        }
                    });
                });
            });
        });
    });
});

