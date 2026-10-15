const transactionModel = require("../models/transaction.model");
const accountsModel = require("../models/accounts.model");
const ledgerModel = require("../models/ledger.model");
const emailService = require("../services/email.services");
const { default: mongoose } = require("mongoose");

/**
 * - Create a new tranaction
 * The 10 step transfer flow
 * 1. Validate request
 * 2. Validate idempotency key
 * 3.Check account status
 * 4.Derive sender balance from ledger
 * 5.Create tranaction(PENDING)
 * 6.Create DEBIT ledger entry
 * 7.Create CREDIT ledger entry
 * 8.Mark transaction complete
 * 9.Commit MongoDB session
 * 10.Send email notification
 */
async function createNewTransaction(req, res) {
  /**Validate request */
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey)
    return res.status(400).json({
      message: "fromAccount,toAccount,amount,idempotencyKey is missing",
    });

  const fromUser = await accountsModel.findOne({ _id: fromAccount });

  const toUser = await accountsModel.findOne({ _id: toAccount });

  if (!fromUser || !toUser)
    return res
      .status(400)
      .json({ message: "Invalid toAccount or fromAccount" });

  /**Validate idempotency key */

  const isTransactionAlreadyExist =await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });

  if (isTransactionAlreadyExist) {
    if (isTransactionAlreadyExist.status === "COMPLETED")
      return res.status(200).json({
        message: "Transaction is already completed",
        transaction: isTransactionAlreadyExist,
      });

    if (isTransactionAlreadyExist.status === "PENDING")
      return res.status(200).json({
        message: "Transaction is in pending",
      });

    if (isTransactionAlreadyExist.status === "FAILED")
      return res.status(500).json({
        message: "Transaction failed please try again",
      });

    if (isTransactionAlreadyExist.status === "REVERSED")
      return res.status(500).json({
        message: "Transaction is reversed, please try again",
      });
  }

  /**Check account status */

  if (fromUser.status !== "ACTIVE" && toUser.status !== "ACTIVE")
    return res
      .status(400)
      .json({ message: "Sender and Receiver account are not active" });

  /**Derive Sender balance from ledger */

  const balance = await fromUser.getBalanceData();

  if (balance < amount)
    return res
      .status(400)
      .json({ message: `Not enough balance. Available balance = ${balance}` });

  let transaction;
  try {
    /**Create transaction (PENDING) */
    const session = await mongoose.startSession();
    session.startTransaction();

    transaction = (
      await transactionModel.create(
        [
          {
            fromAccount: fromAccount,
            toAccount: toAccount,
            amount: amount,
            idempotencyKey: idempotencyKey,
            status: "PENDING",
          },
        ],
        { session },
      )
    )[0];
    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount: amount,
          transaction: transaction._id,
          type: "Debit",
        },
      ],
      { session },
    );

    await (() => {
      return new Promise((resolve) => setTimeout(resolve, 15 * 1000));
    })();

    const creditLedgerEntry = await ledgerModel.create(
      [
        {
          account: toAccount,
          amount: amount,
          transaction: transaction._id,
          type: "Credit",
        },
      ],
      { session },
    );

    // transaction.status="COMPLETED"
    // await transaction.save({session})

    await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        )

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    return res
      .status(400)
      .json({ message: "Transaction is in pending state please try later" });
  }

  /**Send confirmatin email */
  await emailService.sendTransactionEmail(
    req.user.email,
    req.user.name,
    amount,
    toAccount,
  );

  return res.status(201).json({
    message: "Transaction completed successfully",
    transaction: transaction,
  });
}

async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey)
    return res
      .status(400)
      .json({ message: "toAccount,amount,idempotencyKey are required" });

  const toUserAccount = await accountsModel.findOne({
    _id: toAccount,
  });

  if (!toUserAccount)
    return res.status(400).json({ message: "Invalid toAccount" });

  const fromUserAccount = await accountsModel.findOne({
    // systemUser: true,
    user: req.user._id,
  });

  if (!fromUserAccount)
    return res.status(400).json({
      message: "System user account not found",
    });

  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount,
    idempotencyKey,
    status: "PENDING",
  });

  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "Debit",
      },
    ],
    { session },
  );

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "Credit",
      },
    ],
    { session },
  );

  transaction.status = "COMPLETED";

  await transaction.save({ session });

  await session.commitTransaction();
  session.endSession();

  return res.status(201).json({
    message: "Initial funds transaction completed successfully",

    transaction: transaction,
  });
}
module.exports = { createNewTransaction, createInitialFundsTransaction };
