import { Op } from "sequelize";
import BaseRepository from "./base.reponsitory.js";
import StaffAvailabilityModel from "../models/staff_availability.js";

export default class StaffAvailabilityRepository extends BaseRepository {
  constructor() {
    super(StaffAvailabilityModel);
  }

  async upsertStaffStatus(staffId, updates = {}, options = {}) {
    const payload = {
      staff_id: staffId,
      ...updates,
      updated_at: new Date(),
    };

    return this.getModel().upsert(payload, options);
  }

  async findByStaffId(staffId, options = {}) {
    return this.getModel().findByPk(staffId, options);
  }

  async findAvailableStaff(
    { maxConcurrent = 3, excludeStaffIds = [] } = {},
    options = {},
  ) {
    const where = {
      is_online: true,
      is_available: true,
      current_chats: {
        [Op.lt]: maxConcurrent,
      },
    };

    if (Array.isArray(excludeStaffIds) && excludeStaffIds.length > 0) {
      where.staff_id = {
        [Op.notIn]: excludeStaffIds,
      };
    }

    return this.getModel().findAll({
      where,
      order: [
        ["current_chats", "ASC"],
        ["updated_at", "ASC"],
      ],
      ...options,
    });
  }

  async incrementCurrentChats(staffId, options = {}) {
    return this.getModel().increment("current_chats", {
      by: 1,
      where: { staff_id: staffId },
      ...options,
    });
  }

  async decrementCurrentChats(staffId, options = {}) {
    return this.getModel().update(
      {
        current_chats: this.sequelize.literal("GREATEST(current_chats - 1, 0)"),
        updated_at: new Date(),
      },
      {
        where: { staff_id: staffId },
        ...options,
      },
    );
  }
}

