import z from "zod";

export const previewCheckoutSchema = z.object({
  body: z
    .object({
      cartId: z
        .string({ required_error: "cartId is required" })
        .min(1, "cartId cannot be empty"),

      items: z
        .array(
          z.object({
            productId: z
              .string({ required_error: "productId is required" })
              .min(1, "productId cannot be empty"),
            quantity: z
              .number({ required_error: "quantity is required" })
              .int("quantity must be an integer")
              .positive("quantity must be greater than 0"),
          }),
        )
        .min(1, "At least one item is required"),

      vouchers: z
        .array(
          z.object({
            voucherId: z
              .string({ required_error: "voucherId is required" })
              .min(1, "voucherId cannot be empty"),
            voucherCode: z
              .string({ required_error: "voucherCode is required" })
              .min(1, "voucherCode cannot be empty"),
          }),
        )
        .optional(),
    })
    .strict(),
});
