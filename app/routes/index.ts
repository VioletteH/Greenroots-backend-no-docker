import express from "express";

import authController from "../controllers/authController";
import treeController from "../controllers/treeController";
import forestController from "../controllers/forestController";
import userController from "../controllers/userController";
import orderController from "../controllers/orderController";
import itemController from "../controllers/itemController";
import stripeController from "../controllers/stripeController";
import searchController from "../controllers/searchController";

import { isGranted } from "../middlewares/isGranted";

const routes = express.Router();

// AUTHENTICATION

routes.post("/login", authController.login);
routes.post("/register", authController.register);

// TREES 

// all trees
routes.get("/trees", treeController.trees); 
routes.get("/trees/forests", treeController.treesWithForests); 

// one tree
routes.get("/trees/:id", treeController.treeById); 
routes.get("/trees/:id/forests-and-stock", treeController.treeWithForestsAndStock); 

// association & filters
routes.get("/forests/:id/trees", treeController.treesByForest);
routes.get("/trees/country/:slug", treeController.treesByCountry);
routes.get("/trees/category/:slug", treeController.treesByCategory);

// post, patch et delete
routes.post("/trees", isGranted, treeController.addTree);
routes.patch("/trees/:id", isGranted, treeController.updateTree);
routes.delete("/trees/:id", isGranted, treeController.deleteTree);

//FORESTS

// all forests
routes.get("/forests", forestController.forests);

// one forest
routes.get("/forests/:id", forestController.forestById);
routes.get("/forests/:id/trees-and-stock", forestController.forestWithTreesAndStock);

// association
routes.get("/trees/:id/forests", forestController.forestsByTree); 

// post, patch et delete
routes.post("/forests", isGranted, forestController.addForest);
routes.patch("/forests/:id", isGranted, forestController.updateForest);
routes.delete("/forests/:id", isGranted, forestController.deleteForest);

//USERS

// all users
routes.get("/users", isGranted, userController.users);

// one user
routes.get("/users/:id", isGranted, userController.userById);
routes.get("/users/:id/impact" , isGranted, userController.impactByUserId);
routes.get("/user/:id/orders", isGranted, orderController.ordersByUserId); 

// post, patch et delete
routes.post("/users", isGranted, userController.addUser);
routes.patch("/users/:id", isGranted, userController.updateUser);
routes.delete("/users/:id", isGranted, userController.deleteUser);

//ORDERS

// all orders
routes.get("/orders", isGranted, orderController.orders);

// one order
routes.get("/orders/:id", isGranted, orderController.orderById); //
routes.get("/orders/:id/full", isGranted, orderController.orderByIdWithUser); 

// post et patch
routes.post("/orders", isGranted, orderController.addOrder); //
routes.patch("/orders/:id", isGranted, orderController.updateOrder);

//ORDER ITEMS

routes.get("/orders/:id/items", isGranted, itemController.itemsByOrderId); //
routes.post("/orders/:id/items", itemController.addOrderItem); 

//SEARCH

routes.get("/search", searchController);

//PAYMENT

routes.post("/create-payment-intent", stripeController.intent);

export default routes;