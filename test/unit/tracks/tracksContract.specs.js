const setup = require("../../utils/deployContracts");
const helper = require("../../utils/helper");
const chai = require("chai");
const BN = require("bn.js");
const expectEvent = require("@openzeppelin/test-helpers/src/expectEvent");
const expect = chai.expect;

contract("Tracks Contract", async function() {
    before(createContribution);

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

        expectEvent(tx, "TrackCreated", {
            filehash: "preview.hash",
        });
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

        expectEvent(tx, "TrackCreated", {
            filehash: "preview.hash1",
        });
    });
});

