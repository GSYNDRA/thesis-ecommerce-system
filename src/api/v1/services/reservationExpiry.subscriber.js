import redisClient from "../database/init.redis.js";
import { Op } from "sequelize";
import OrderRepository from "../reponsitories/order.repository.js";
import { ReservationService } from "./reservation.service.js";

const EXPIRED_EVENT_PATTERN = "__keyevent@0__:expired";
const OPEN_ORDER_STATUSES = ["pending", "confirmed", "processing"];

class ReservationExpirySubscriber {
  constructor() {
    this.subscriber = null;
    this.worker = null;
    this.started = false;
    this.orderRepository = new OrderRepository();
    this.reservationService = new ReservationService();
  }

  async start() {
    if (this.started) return;

    this.worker = redisClient.duplicate();
    this.subscriber = redisClient.duplicate();

    await Promise.all([this.worker.connect(), this.subscriber.connect()]);
    await this.ensureKeyspaceNotificationConfig();

    await this.subscriber.pSubscribe(EXPIRED_EVENT_PATTERN, (message, channel) => {
      this.handleExpiredEvent(channel, message).catch((error) => {
        console.error(
          "[ReservationExpirySubscriber] handleExpiredEvent error:",
          error?.message || error,
        );
      });
    });

    this.started = true;
    console.log(
      `[ReservationExpirySubscriber] Listening on pattern: ${EXPIRED_EVENT_PATTERN}`,
    );
  }

  async stop() {
    if (!this.started) return;

    try {
      if (this.subscriber?.isOpen) {
        await this.subscriber.pUnsubscribe(EXPIRED_EVENT_PATTERN);
        await this.subscriber.quit();
      }
    } catch (error) {
      console.error(
        "[ReservationExpirySubscriber] Failed to stop subscriber:",
        error?.message || error,
      );
    }

    try {
      if (this.worker?.isOpen) {
        await this.worker.quit();
      }
    } catch (error) {
      console.error(
        "[ReservationExpirySubscriber] Failed to stop worker:",
        error?.message || error,
      );
    }

    this.subscriber = null;
    this.worker = null;
    this.started = false;
  }

  async ensureKeyspaceNotificationConfig() {
    try {
      const config = await this.worker.configGet("notify-keyspace-events");
      const current = config?.["notify-keyspace-events"] || "";
      if (current.includes("E") && current.includes("x")) return;

      const merged = Array.from(new Set(`${current}Ex`.split(""))).join("");
      await this.worker.configSet("notify-keyspace-events", merged);
      console.log(
        `[ReservationExpirySubscriber] notify-keyspace-events updated: ${merged}`,
      );
    } catch (error) {
      console.warn(
        "[ReservationExpirySubscriber] Could not auto-configure notify-keyspace-events. Set manually to include Ex.",
      );
      console.warn(error?.message || error);
    }
  }

  extractOrderIdFromReservationTtlKey(key) {
    const match = /^reservation:(.+):ttl$/.exec(key);
    return match?.[1] ?? null;
  }

  async handleExpiredEvent(channel, key) {
    if (channel !== EXPIRED_EVENT_PATTERN) return;
    if (!key?.startsWith("reservation:") || !key?.endsWith(":ttl")) return;

    const orderId = this.extractOrderIdFromReservationTtlKey(key);
    if (!orderId) return;

    await this.rollbackReservation(orderId);
    await this.markOrderAsCancelled(orderId);
  }

  async rollbackReservation(orderId) {
    const result = await this.reservationService.releaseReservation(
      String(orderId),
      this.worker,
    );

    console.log(
      `[ReservationExpirySubscriber] rollback result for order ${orderId}: ${result}`,
    );
  }

  async markOrderAsCancelled(orderId) {
    const numericOrderId = Number(orderId);
    if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) {
      console.warn(
        `[ReservationExpirySubscriber] Skip order status update, invalid order id: ${orderId}`,
      );
      return;
    }

    const [affectedCount] = await this.orderRepository.getModel().update(
      { order_status: "cancelled" },
      {
        where: {
          id: numericOrderId,
          order_status: { [Op.in]: OPEN_ORDER_STATUSES },
          payment_status: "pending",
        },
      },
    );

    console.log(
      `[ReservationExpirySubscriber] order ${numericOrderId} cancelled updates: ${affectedCount}`,
    );
  }
}

const reservationExpirySubscriber = new ReservationExpirySubscriber();
export default reservationExpirySubscriber;
