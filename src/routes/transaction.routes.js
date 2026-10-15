const express=require('express');
const { authMiddleware,authSystemUserMiddleware } = require('../middleware/auth.middleware');
const transactionController=require('../controller/transaction.controller')

const transactionRoutes=express.Router();

/**
 * -POST api/tranactions/
 * - Create a new transaction
 */

transactionRoutes.post('/', authMiddleware, transactionController.createNewTransaction)

transactionRoutes.post('/system/initial-funds',authSystemUserMiddleware,transactionController.createInitialFundsTransaction)
module.exports=transactionRoutes;
