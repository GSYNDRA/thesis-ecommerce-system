import { CatalogService } from "../services/catalog.service.js";
import { SuccessResponse } from "../utils/response.util.js";

export class CatalogController {
  constructor() {
    this.catalogService = new CatalogService();
  }

  getProducts = async (req, res, next) => {
    try {
      const result = await this.catalogService.getProducts(req.query);
      SuccessResponse.ok(result, "Get products successfully").send(res);
    } catch (error) {
      next(error);
    }
  };

  getProductDetail = async (req, res, next) => {
    try {
      const result = await this.catalogService.getProductBySlug(req.params.slug);
      SuccessResponse.ok(result, "Get product detail successfully").send(res);
    } catch (error) {
      next(error);
    }
  };

  getFilters = async (req, res, next) => {
    try {
      const result = await this.catalogService.getFilters();
      SuccessResponse.ok(result, "Get catalog filters successfully").send(res);
    } catch (error) {
      next(error);
    }
  };
}

