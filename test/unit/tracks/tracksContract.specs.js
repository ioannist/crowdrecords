const setup = require("../../utils/deployContracts");
const helper = require("../../utils/helper");
const chai = require("chai");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const BN = require("bn.js");
const chaiBN = require("chai-bn")(BN);
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiBN);
chai.use(chaiAsPromised);

contract("Tracks Contract", async function() {
    before(setup);

    let snapShot, snapshotId;
    beforeEach(async function() {
        snapShot = await helper.takeSnapshot();
        snapshotId = snapShot["result"];
    });
    afterEach(async function() {
        await helper.revertToSnapshot(snapshotId);
    });

    it("Creating a track", async function() {
        const tx = await this.tracksContract.createNewTracks([
            ["preview.hash", "preview.link", "Genre"],
        ]);

        expectEvent(tx, "TracksCreated");
    });

    it("Creating a track, check the owner", async function() {
        const tx = await this.tracksContract.createNewTracks([
            ["preview.hash", "preview.link", "Genre"],
        ]);
        const data = await this.tracksContract.tracksData(1);
        expect(data.owner).to.be.equals(await helper.getEthAccount(0));
    });

    it("Creating multiple tracks", async function() {
        await this.tracksContract.createNewTracks([["preview.hash", "preview.link", "Genre"]]);
        await this.tracksContract.createNewTracks([["preview.hash", "preview.link", "Genre"]]);
        await this.tracksContract.createNewTracks([["preview.hash", "preview.link", "Genre"]]);
        await this.tracksContract.createNewTracks([["preview.hash", "preview.link", "Genre"]]);
        await this.tracksContract.createNewTracks([["preview.hash", "preview.link", "Genre"]]);
        await this.tracksContract.createNewTracks([["preview.hash", "preview.link", "Genre"]]);
        await this.tracksContract.createNewTracks([["preview.hash", "preview.link", "Genre"]]);

        const tx = await this.tracksContract.createNewTracks([
            ["preview.hash1", "preview.link1", "Genre"],
        ]);

        expectEvent(tx, "TracksCreated");
    });
    // 23371225 with counter
    // 23380257 with local and counter
    it("Creating 100 tracks with single call", async function() {
        const tracks = Array(100).fill({
            filehash: "QmXKQTJp7ATCzy4op4V4Q2YvZ8hDQ2x6x3xA6X9P6jyL6U",
            filelink: "https://ipfs.io/ipfs/QmXKQTJp7ATCzy4op4V4Q2YvZ8hDQ2x6x3xA6X9P6jyL6U",
            category: "Rock",
        });

        const tx = await this.tracksContract.createNewTracks(tracks);
        console.log("Gas consumed ", await helper.calculateGasCost(tx));
        console.log("Gas units ", tx.receipt.gasUsed);

        expectEvent(tx, "TracksCreated");
    });
});

