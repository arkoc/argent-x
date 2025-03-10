import { number } from "starknet"

import { TransactionActionPayload } from "../../shared/actionQueue"
import { ExtQueueItem } from "../actionQueue"
import { BackgroundService } from "../background"
import { getNonce, increaseStoredNonce } from "../nonce"
import { nameTransaction } from "../transactions/transactionNames"

type TransactionAction = ExtQueueItem<{
  type: "TRANSACTION"
  payload: TransactionActionPayload
}>

export const executeTransaction = async (
  action: TransactionAction,
  { wallet, transactionTracker }: BackgroundService,
) => {
  const { transactions, abis, transactionsDetail } = action.payload
  if (!wallet.isSessionOpen()) {
    throw Error("you need an open session")
  }
  const selectedAccount = await wallet.getSelectedAccount()
  const starknetAccount = await wallet.getSelectedStarknetAccount()
  if (!selectedAccount) {
    throw Error("no accounts")
  }

  // if nonce doesnt get provided by the UI, we can use the stored nonce to allow transaction queueing
  const nonceWasProvidedByUI = transactionsDetail?.nonce !== undefined // nonce can be a number of 0 therefore we need to check for undefined
  const nonce = nonceWasProvidedByUI
    ? number.toHex(number.toBN(transactionsDetail?.nonce || 0))
    : await getNonce(starknetAccount)

  // FIXME: mainnet hack to dont pay fees as long as possible
  const maxFee =
    selectedAccount.network.id === "mainnet-alpha" ? "0x0" : undefined

  const transaction = await starknetAccount.execute(transactions, abis, {
    ...transactionsDetail,
    nonce,
    // For now we want to set the maxFee to 0 in case the user has not provided a maxFee. This will change with the next release. The default behavior in starknet.js is to estimate the fee, so we need to pass 0 explicitly.
    // TODO: remove in next release
    ...(maxFee ? { maxFee } : {}),
  })

  transactionTracker.add({
    hash: transaction.transaction_hash,
    account: selectedAccount,
    meta: nameTransaction(transactions, abis),
  })

  if (!nonceWasProvidedByUI) {
    increaseStoredNonce(selectedAccount.address)
  }
  return transaction
}
