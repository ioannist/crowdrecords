# Test Cases

events checks for all the functions that are called from a function within other contract

### Agreement contract

-   Creating agreement vote and declaring winner
-   Creating agreement vote, losing the vote and declaring winner
-   Trying to pay royalty to a rejected agreement, expect revert
-   After winning the voting for agreement contract
-   After winning the voting for agreement contract, Paying for royalty agreement 9000 tokens
-   After winning the voting for agreement contract, Paying for royalty agreement 200 tokens
-   After winning the voting for agreement contract, event check, Should emit RoyaltyPayment
-   After winning the voting for agreement contract, event check, Should emit RoyaltyPayment with correct amount
-   After winning the voting for agreement contract, event check, Should emit RoyaltyPaymentClaimed
-   After winning the voting for agreement contract, event check, Should emit RoyaltyPaymentClaimed with correct amount
-   After winning the voting for agreement contract, event check, trying to claim reward twice should revert
-   After winning the voting for agreement contract, Paying royalty for invalid agreement, transaction should revert
-   After winning the voting for agreement contract, Claiming without reward payment, transaction should revert
-   After winning the voting for agreement contract, Claiming Royalty : Single user royalty claim
-   After winning the voting for agreement contract, Claiming Royalty : No CRD remaining (Very small amount remaining) after all user claims token
-   After winning the voting for agreement contract, Claiming Royalty : Distributing then claim then distribute then claim for single user
-   After winning the voting for agreement contract, Claiming Royalty : Distributing then claim then distribute then claim for Multiple user
-   After winning the voting for agreement contract, Royalty distribution with single distribution New user purchases tokens and tries to claim reward, CRD balance should remain 0
-   After winning the voting for agreement contract, Royalty distribution with single distribution User not eligible for reward tries to claim twice, CRD balance should remain 0 and then second time expect revert
-   After winning the voting for agreement contract, Royalty distribution with single distribution Eligible user tries to claim twice, successful first time and then revert
-   After winning the voting for agreement contract, Royalty distribution with single distribution User only eligible for the latest royalty paid
-   After winning the voting for agreement contract, Distribution of small amount which results to near 0 wei per token, expect revert
-   After winning the voting for agreement contract, Distribution with multiple users, 3 distributors, 3 agreements, 1 record, 3 claimee
-   After winning the voting for agreement contract, Distribution with multiple users, 3 distributor accounts, 1 agreements, 1 record, 3 claimee

-   Haywire
-   -   Create agreement, move forward 10 blocks, create another agreement (different user), vote for both agreement, one has low turnOut and other one wins, declare winner for both, try to distribute royalty for low minTurnOut agreement, get rejected, create new voting from same user, pay for the other agreement royalty, claim royalty and then vote for 3rd agreement,after time over declare winner.

### Contribution contract

-   Creating a seed contribution
-   Creating seed contribution and record
-   Testing contribution voting, Tries to vote to INVALID: CONTRIBUTION_ID, expect revert
-   Testing contribution voting, User can vote and event is emitted
-   Testing contribution voting, Cannot Vote More than once
-   Testing contribution voting, Declaring voting winner, user wins and reward amount is transferred : One Person Vote
-   Testing contribution voting, Declaring voting winner, user loses and reward amount is not transferred
-   Testing contribution voting, Declaring winner, user should win and receive the reward : Multi Person Vote

-   Haywire
-   -   Create 3 contribution from 3 accounts different after interval of 10 blocks each, declare the winner for the last one first, check balance. New contribution created, now vote 1 for yes and 1 for no (66% winning), now declare winners for the first 2 (This will change the balance to less then 66% in winning side), then declare winner should lose.
-   -   Create 2 contribution from 2 accounts different after interval of 10 blocks each, for contribution 1 create counter offer for it and also vote yes

declare the winner for the last one first, check balance. New contribution created, now vote 1 for yes and 1 for no (66% winning), now declare winners for the first 2 (This will change the balance to less then 66% in winning side), then declare winner should lose.

### Contract deployment

-   Should deploy all contracts
-   All address set

### Dilution Contract

-   Create request with invalid tokenId, reject
-   Create a request without owning the token, reject
-   Dilution by voting, wins with votes
-   Dilution by voting, lose with votes
-   Dilution by voting, shifting weight of votes, wins the ballot
-   Dilution by voting, shifting weight of votes, lose the ballot
-   Dilution by voting, Dilution voting done, trying to create a new dilution request before set time, reject
-   Dilution by voting, Dilution voting done, trying to create a new dilution request after set time, creates successfully

-   Haywire
-   -   Create 3 contribution from 3 accounts different after interval of 10 blocks each, declare the winner for the last one first, check balance. New contribution created, now vote 1 for yes and 1 for no (66% winning), now declare winners for the first 2 (This will change the balance to less then 66% in winning side), then declare winner should lose.

### Sale Contract

#### locked sale

-   User can create lock sale request and cancel it
-   Sale tokens should belong to single record only
-   Cannot create buy order without sufficient CRD, expect revert
-   With locked asset purchase order, Try to purchase self order, expect revert
-   With locked asset purchase order, Try to fulfill order with insufficient token balance, expect revert
-   With locked asset purchase order, Should not be able to purchase locked asset if the ratio is wrong, expect revert
-   With locked asset purchase order, Trying to purchase more than available, get's rejected
-   With locked asset purchase order, Should able to purchase locked asset and sale should close, and event check
-   With locked asset purchase order, Order fulfilled by more than one user
-   With locked asset purchase order, Check platform fee amount
-   With locked asset purchase order, Should able to purchase locked asset with decimal values and sale should close

#### not locked sale

-   User can create normal Buy request and cancel it
-   Sale tokens should belong to same record, expect revert
-   Should able to purchase non locked asset and sale should close
-   Should able to purchase non locked asset with decimal values and sale should close
-   Should able to purchase non locked asset the buy order is less than 1
-   Should able to purchase non locked asset the CRD amount is less than 1
-   Buy order is fulfilled and the transaction fees are transferred to wallet
-   Buy order is fulfilled and the transaction fees are transferred to wallet. Order amount is greater than 1

### Records Contract

-   Creating seed contribution and record
-   Creating record with invalid seed contribution Id, expect revert
-   Creating a normal contribution and try to create record with it, expect reject
-   New Record Version, Creating a new record version request, VersionRequest event emitted
-   New Record Version, creating new record request from existing records check ballot created
-   New Record Version, creating new record request from existing records check ballot created get voting done, perform multiple votes, generates event
-   New Record Version, creating new record request from existing records check ballot created get voting done, perform multiple votes, check can only vote once
-   New Record Version, creating new record request from existing records check ballot created get voting done. perform multiple votes and lose
-   New Record Version, creating new record request from existing records check ballot created get voting done. perform multiple votes and win
-   New Record Version, creating new record request from existing records check ballot created get voting done. perform multiple votes and win, make reward claim check if correct amount received
-   New Record Version, creating new record request from existing records check ballot created get voting done. Multiple ballots and multiple claim, Owner can also claim
-   user create seed contribution, creates new record, different user tries to create one more record with same see but rejected
-   user create seed contribution, different user tries to create rejected. (only the same user should be able to create new record, incase of new version anyone can create it.)
-   Mashing up the orders of the creation of record, expect rejection.

-   user create seed contribution, creates new record, tries to create one more record with same see but rejected
-   user create seed contribution, creates new record, different user tries to create one more record with same see but rejected
-   user create seed contribution, different user tries to create rejected. (only the same user should be able to create new record, incase of new version anyone can create it.)
-   Mashing up the orders of the creation of record, expect rejection.
-   Voting check, some votes are performed before expiry of ballot and some of them are performed after expiry, expecting rejection for after expiry
-   check for case where user provides with more reward then total minting amount / treasury amount, expect revert
-   Test the voting with record reward limit, check what happens when user gives reward amount less then 1 ether
-   Allowing 0 to be possible option as a reward for existing records owner on new record version creation
-   Allowing user to own all the tokens in record creation and new version creation
-   New record version requested, voting done, user won, dilution takes place and tokens are transferred to user before winner declared, causing ballot to lose
-   New record version requested, voting done, user won, dilution takes place and tokens are transferred to user before winner declared, user who owned token during winner declaration gets reward
-   New record version requested, voting done, user won, dilution takes place and tokens are transferred to user after winner declared, user who owned token during winner declaration gets reward

### Tracks Contract

-   Creating a track
-   Creating multiple tracks

### Voting Contract

#### BaseVoting contract

-   Calling snapshot function of treasury UNAUTHORIZED: ONLY_SNAPSHOT_CALLERS
-   Creating a voting ballot UNAUTHORIZED: OWNER_CANNOT_VOTE
-   Creating a voting ballot owner can vote
-   Creating a voting ballot, single voter and declaring winner, ballot win
-   Creating a voting ballot, single voter and declaring winner, ballot lose
-   Creating a voting ballot, voting is done more than minTurnOut, ballot win with 67
-   Creating a voting ballot, voting is done more than minTurnOut, ballot lose with 65
-   Creating a voting ballot, multiple voter and declaring winner, ballot win
-   Creating a voting ballot, multiple voter and declaring winner, ballot lose
-   Moving tokens between 2 accounts after voting, should lose
-   Moving tokens between 2 accounts after ballot expired, should win
-   Moving tokens between 2 accounts after voting, should win
-   Moving tokens between 2 accounts after voting, should lose
-   Creating a voting ballot, less then minTurnOut vote
-   Creating a voting ballot, single vote, transfers the balance to a non-voter, less then minTurnOut vote
-   Creating a voting ballot, multiple vote, one transfers the balance to a non-voter, less then minTurnOut vote
-   3 voters => 1 votes yes, 2 votes no, current situation is ballot is losing. Transfer token from no voter to non-voter, new situation the yes voter weight is more than 66%, user wins.
-   Try to declare winner more than once, expect revert RESULT_ALREADY_DECLARED
-   Try to vote on expired ballot, expect revert VOTING_TIME_OVER
-   Try to vote twice, expect revert ALREADY_VOTED
-   Try to vote on already declared ballot, expect revert VOTING_TIME_OVER
-   Moving tokens between 2 accounts after ballot expired, tokens are transferred and minTurnOut ratio is not meet should win
-   ove all the tokens from A to B and then all B tokens to A, expect same resilt
-   Creating a voting ballot, multiple vote, less then minTurnOut vote
-   Create vote, multiple vote, tokens are diluted and transfer it to non-voter, now the minTurnOut is not meet due to high token dilution

#### BaseVotingCounterOffer

-   Creating a voting ballot UNAUTHORIZED: OWNER_CANNOT_VOTE
-   Creating a voting ballot owner can vote
-   Creating a voting ballot, single voter and declaring winner, ballot win
-   Creating a voting ballot, single voter and declaring winner, ballot lose
-   Creating a voting ballot, voting is done more than minTurnOut, ballot win with 67%
-   Creating a voting ballot, voting is done more than minTurnOut, ballot lose with 65%
-   Creating a voting ballot, multiple voter and declaring winner, ballot win
-   Creating a voting ballot, multiple voter and declaring winner, ballot lose
-   Creating a voting ballot, less then minTurnOut vote
-   Creating a voting ballot, Tries to vote after counter offer, expect revert
-   Creating a voting ballot, Tries to create counter offer after vote, expect revert
-   Creating a voting ballot, Tries to create 2 counter offers, expect revert
-   Creating a voting ballot, create counter offer, win
-   Creating a voting ballot, create counter offer, lose
-   Creating a voting ballot, create counter offer, no action taken lose
-   Owner of ballot Tries to take action without counter offer, expect revert
-   Creating a voting ballot, create counter offer, transfers token, wins

-   Creating a counter offer check if created
-   Creating a counter offer check if created, accepted check event
-   Creating a counter offer check if created, rejected check event
-   Creating a counter offer check if created, accepted check event try to reject it
-   Creating a counter offer check if created, rejected check event try to accept it
-   Creating a counter offer check if created, rejected check event try to reject it
-   Creating a counter offer check if created, accepted check event try to accept it
-   Creating a counter offer, only owner of ballot can accept counter offer
-   Creating a counter offer, only owner of ballot can reject counter offer
-   Creating a counter offer, owner of counter offer cannot accept counter offer
-   Creating a counter offer, owner of counter offer cannot reject counter offer

### Treasury Contracts

#### TreasuryCoreContract

-   Calling createNewGovernanceToken function and getting rejected
-   Calling createNewCommunityToken function and getting rejected
-   Calling mintTokens function and getting rejected
-   Calling snapshot function and getting rejected

#### TreasuryContract

-   Try to create community token with invalid recordId.
-   Try to create governance token with invalid recordId.
-   Create a record, other user tries to create community token.
-   Create a record, other user tries to create governance token.
-   Create a record, create community token twice, reject.
-   Create a record, create governance token twice, reject.
-   Calling createNewGovernanceTokenNewRecordVersion function outside of - records contract and getting rejected
-   Calling createNewCommunityTokenNewRecordVersion function outside of records - contract and getting rejected
-   Calling from outside of the contribution contract mintTokens with 3 params - function and getting rejected
-   Calling from outside of the dilution contract mintTokens with 3 params - function and getting rejected
-   Calling transferRewardAmount function from outside of contribution voting - contract and getting rejected
-   Calling getCommunityTokenId function and get token Id
-   Calling getCommunityTokenId with invalid id function and getting rejected
-   Calling getGovernanceTokenId function and get token Id
-   Calling getGovernanceTokenId with invalid id function and getting rejected
-   Calling setSymbolsAsUsed function from outside of the records voting - contract and getting rejected
-   Calling setSymbolsAsAvailable function from outside of the records voting - contract and getting rejected
-   Calling snapshot function from outside of the permitted address and getting rejected

