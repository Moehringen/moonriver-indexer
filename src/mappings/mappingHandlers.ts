import { SignedBlock } from '@polkadot/types/interfaces';
import { SubstrateExtrinsic, SubstrateEvent } from '@subql/types';
import { SubstrateBlock } from '@subql/types';
import { PointHistory } from '../types/models/PointHistory';

import {
  handleNewRoundStarted,
  handleCollatorChosen,
  handleNomination,
  handleNominationIncreased,
  handleNominationDecreased,
  handleNominatorLeftCollator,
  handleRewarded,
  handleNominatorDueReward,
  handelCollatorBondedMore,
  handelCollatorBondedLess,
  handleCollatorLeft,
  handleJoinedCollatorCandidates,
  handleTotalSelectedSetChange,
} from '../handlers/parachain-handler';
// import { Chronicle } from '../types/models/Chronicle';
import { ChronicleKey, PointReward } from '../constants';


const noop = async () => { };

const eventsMapping = {
  'parachainStaking/NewRound': handleNewRoundStarted,
  'parachainStaking/CollatorChosen': handleCollatorChosen,
  'parachainStaking/Delegation': handleNomination,
  'parachainStaking/DelegationIncreased': handleNominationIncreased,
  'parachainStaking/DelegationDecreased': handleNominationDecreased,
  'parachainStaking/DelegatorLeftCandidate': handleNominatorLeftCollator,
  'parachainStaking/Rewarded': handleRewarded,
  'parachainStaking/DelegatorDueReward': handleNominatorDueReward,
  'parachainStaking/JoinedCollatorCandidates': handleJoinedCollatorCandidates,
  'parachainStaking/CandidateBondedMore': handelCollatorBondedMore,
  'parachainStaking/CandidateBondedLess': handelCollatorBondedLess,
  'parachainStaking/CandidateLeft': handleCollatorLeft,
  'parachainStaking/TotalSelectedSet': handleTotalSelectedSetChange,
};

export async function handleBlock(block: SubstrateBlock): Promise<void> {
  let number = block.block.header.number.toNumber();
  let extrinsics = block.block.extrinsics;
  for (let i = 0; i < extrinsics.length; i++) {
    const { isSigned, meta, method: { args, method, section } } = extrinsics[i];
    // check the points award
    if (section == 'authorInherent') {
      //logger.info(`${section}.${method}(${args.map((a) => a.toString()).join(', ')})`);
      let id = number.toString();
      let pointHistory = new PointHistory(id);
      pointHistory.roundindex = Math.floor(number / 300) + 1;
      pointHistory.block = BigInt(number);
      pointHistory.account = args[0].toString();
      pointHistory.point = PointReward.PointPerBlock;
      await pointHistory.save();
    }
  };
}

export async function handleEvent(event: SubstrateEvent): Promise<void> {
  const {
    event: { method, section },
    block: {
      block: { header }
    },
    idx,
    extrinsic
  } = event;

  const eventType = `${section}/${method}`;
  const { method: extMethod, section: extSection } = extrinsic?.extrinsic.method || {};
  const handler = eventsMapping[eventType];
  if (handler) {
    logger.info(
      `
      Event ${eventType} at ${idx} received, block: ${header.number.toNumber()}, extrinsic: ${extSection}/${extMethod}:
      -------------
        ${JSON.stringify(event.toJSON(), null, 2)} ${JSON.stringify(event.toHuman(), null, 2)}
      =============
      `
    );
    await handler(event);
  }
}

// const init = async () => {
//   const chronicle = await Chronicle.get(ChronicleKey);
//   if (!chronicle) {
//     logger.info('Setup Chronicle');
//     await Chronicle.create({ id: ChronicleKey })
//       .save()
//       .catch((err) => logger.error(err));
//   }
// };

// init();


// import {SubstrateExtrinsic,SubstrateEvent,SubstrateBlock} from "@subql/types";
// import {Round} from "../types";
// import {Balance} from "@polkadot/types/interfaces";


// export async function handleBlock(block: SubstrateBlock): Promise<void> {

// }

// export async function handleEvent(event: SubstrateEvent): Promise<void> {
//     const {event: {data: [account, balance]}} = event;
//     //Retrieve the record by its ID
//     const record = await Round.get(event.extrinsic.block.block.header.hash.toString());

//     await record.save();
// }

// export async function handleCall(extrinsic: SubstrateExtrinsic): Promise<void> {

// }

// export async function handleRoundCreated(event): Promise<void> {
//     logger.info(`New Round created: ${JSON.stringify(event)}`);
//     const {event: {data: [blockNumber,roundindex,collators,balance]}} = event;
//     logger.info(`New Round created: ${roundindex}`);
//     let id = 'RoundCreated' + roundindex;
//     let record = new Round(id);
//     record.roundindex = roundindex;
//     await record.save();
//   }



