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
    handelCollatorBondedMore,
    handelCollatorBondedLess,
    handleCollatorLeft,
    handleJoinedCollatorCandidates,
} from '../handlers/parachain-handler';
// import { Chronicle } from '../types/models/Chronicle';
import { ChronicleKey } from '../constants';


const noop = async () => {};

const eventsMapping = {
  'parachainStaking/NewRound': handleNewRoundStarted,
  'parachainStaking/CollatorChosen': handleCollatorChosen,
  'parachainStaking/Nomination': handleNomination,
  'parachainStaking/NominationIncreased': handleNominationIncreased,
  'parachainStaking/NominationDecreased': handleNominationDecreased,
  'parachainStaking/NominatorLeftCollator': handleNominatorLeftCollator,
  'parachainStaking/Rewarded':handleRewarded,
  'parachainStaking/JoinedCollatorCandidates':handleJoinedCollatorCandidates,
  'parachainStaking/CollatorBondedMore':handelCollatorBondedMore,
  'parachainStaking/CollatorBondedLess':handelCollatorBondedLess,
  'parachainStaking/CollatorLeft':handleCollatorLeft,
};

export async function handleBlock(block: SubstrateBlock): Promise<void> {
  let number = block.block.header.number.toNumber();
  let extrinsics = block.block.extrinsics;
  extrinsics.forEach((ex, index) => {
    const { isSigned, meta, method: { args, method, section } } = ex;
    // check the points award
    if (section == 'authorInherent') {
      //logger.info(`${section}.${method}(${args.map((a) => a.toString()).join(', ')})`);
      let id = number.toString();
      let pointHistory = new PointHistory(id);
      pointHistory.roundindex = Math.floor(number/300) + 1;
      pointHistory.block = BigInt(number);
      pointHistory.account = args[0].toString();
      pointHistory.save();
    }
  });

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



