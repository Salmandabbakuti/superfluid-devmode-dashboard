import { Address, ethereum, crypto, Bytes } from "@graphprotocol/graph-ts";
import { FlowUpdated as FlowUpdatedEvent } from "../generated/CFAV1/CFAV1";
import { Stream, StreamRevision } from "../generated/schema";

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

  const sender = event.params.sender;
  const receiver = event.params.receiver;
  const token = event.params.token;

  // Create a streamRevision entity for this stream if one doesn't exist.
  const streamRevision = getOrInitStreamRevision(
    sender,
    receiver,
    token
  );
  const streamId = getStreamID(sender, receiver, token, streamRevision.revisionIndex);
  // set stream id
  streamRevision.mostRecentStream = streamId;
  streamRevision.save();

  let stream = Stream.load(streamId);
  const currentTimestamp = event.block.timestamp;

  if (stream == null) {
    stream = new Stream(streamId);
    stream.sender = sender.toHex();
    stream.receiver = receiver.toHex();
    stream.token = token.toHex();
    stream.createdAt = currentTimestamp;
    stream.txHash = event.transaction.hash.toHex();
  }
  stream.flowRate = event.params.flowRate;
  stream.updatedAt = currentTimestamp;
  stream.save();
}