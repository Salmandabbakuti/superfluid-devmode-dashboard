import { BigInt, Address, ethereum, crypto, Bytes } from "@graphprotocol/graph-ts";
import { FlowUpdated as FlowUpdatedEvent } from "../generated/Superfluid/Superfluid";
import { Stream, StreamRevision } from "../generated/schema";

let ZERO_BI = BigInt.fromI32(0);

function getFlowStatus(
  currentFlowRate: BigInt
): string {
  return currentFlowRate.equals(ZERO_BI)
    ? "TERMINATED"
    : "UPDATED";
}

function getStreamID(
  senderAddress: Address,
  receiverAddress: Address,
  tokenAddress: Address,
  revisionIndex: number
): string {
  return (
    senderAddress.toHex() +
    "-" +
    receiverAddress.toHex() +
    "-" +
    tokenAddress.toHex() +
    "-" +
    revisionIndex.toString()
  );
}

/**
 * Take an array of ethereum values and return the encoded bytes.
 * @param values
 * @returns the encoded bytes
 */
export function encode(values: Array<ethereum.Value>): Bytes {
  return ethereum.encode(
    // forcefully cast Value[] -> Tuple
    ethereum.Value.fromTuple(changetype<ethereum.Tuple>(values))
  )!;
}

// Get Higher Order Entity ID functions
// CFA Higher Order Entity
export function getStreamRevisionID(
  senderAddress: Address,
  receiverAddress: Address,
  tokenAddress: Address
): string {
  const values: Array<ethereum.Value> = [
    ethereum.Value.fromAddress(senderAddress),
    ethereum.Value.fromAddress(receiverAddress),
  ];
  const flowId = crypto.keccak256(encode(values));
  return (
    flowId.toHex() +
    "-" +
    tokenAddress.toHex()
  );
}
/**
 * Gets or initializes the Stream Revision helper entity.
 */
export function getOrInitStreamRevision(
  senderAddress: Address,
  recipientAddress: Address,
  tokenAddress: Address
): StreamRevision {
  const streamRevisionId = getStreamRevisionID(
    senderAddress,
    recipientAddress,
    tokenAddress
  );
  let streamRevision = StreamRevision.load(streamRevisionId);
  if (streamRevision == null) {
    streamRevision = new StreamRevision(streamRevisionId);
    streamRevision.revisionIndex = 0;
    streamRevision.periodRevisionIndex = 0;
  }
  return streamRevision as StreamRevision;
}

export function handleFlowUpdated(event: FlowUpdatedEvent): void {
  // Create a streamRevision entity for this stream if one doesn't exist.
  const streamRevision = getOrInitStreamRevision(
    event.params.sender,
    event.params.receiver,
    event.params.token
  );
  const streamId = getStreamID(event.params.sender, event.params.receiver, event.params.token, streamRevision.revisionIndex);
  // set stream id
  streamRevision.mostRecentStream = streamId;
  streamRevision.save();

  let stream = Stream.load(streamId);
  // if stream is newly created, status should be CREATED
  // else get the status from the current flow rate
  const streamStatus = stream == null ? "CREATED" : getFlowStatus(event.params.flowRate);
  const currentTimestamp = event.block.timestamp;
  if (stream == null) {
    stream = new Stream(streamId);
    stream.sender = event.params.sender.toHex();
    stream.receiver = event.params.receiver.toHex();
    stream.token = event.params.token.toHex();
    stream.createdAt = currentTimestamp;
    stream.txHash = event.transaction.hash.toHex();
  }
  stream.status = streamStatus;
  stream.updatedAt = currentTimestamp;
  stream.flowRate = event.params.flowRate;
  stream.save();
}