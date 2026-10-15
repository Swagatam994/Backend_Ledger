const express=require("express")
const authMiddleware=require("../middleware/auth.middleware")
const accountController=require("../controller/account.controller")
const router=express.Router()


/** 
* - post/api/account
* - Create a new account
* - Protected Route
*/

router.post("/",authMiddleware.authMiddleware,accountController.createAccountController)

/**
 * GET /api/accounts/
 * Get all accounts of the logged in user
 * protected routes
 */

router.get('/',authMiddleware.authMiddleware,accountController.getUserAccountsController)

/**
 * GET/api/accounts/balance/:accountId
 */

router.get('/balance/:accountId',authMiddleware.authMiddleware,accountController.getBalanceAccountController);

module.exports=router;