import { Router } from "express";
import { CatalogController } from "../controllers/catalog.controller.js";

const catalogRouter = Router();
const catalogController = new CatalogController();

// ==================== PUBLIC ROUTES ====================
catalogRouter.get("/products", catalogController.getProducts);
catalogRouter.get("/products/:slug", catalogController.getProductDetail);
catalogRouter.get("/filters", catalogController.getFilters);

export default catalogRouter;

