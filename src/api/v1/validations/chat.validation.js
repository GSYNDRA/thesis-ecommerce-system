import z from "zod";

const sessionParamsSchema = z.object({
  sessionUuid: z.string().uuid("sessionUuid must be a valid UUID"),
});

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const getSessionHistorySchema = z.object({
  body: z.object({}).optional(),
  params: sessionParamsSchema,
  query: historyQuerySchema.optional(),
});

export const requestHumanSupportSchema = z.object({
  body: z
    .object({
      reason: z.string().trim().min(1).max(500).optional(),
    })
    .optional(),
  params: sessionParamsSchema,
  query: z.object({}).optional(),
});

export const closeChatSessionSchema = z.object({
  body: z.object({}).optional(),
  params: sessionParamsSchema,
  query: z.object({}).optional(),
});

export const updateStaffAvailabilitySchema = z.object({
  body: z.object({
    isAvailable: z.boolean({
      required_error: "isAvailable is required",
      invalid_type_error: "isAvailable must be a boolean",
    }),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const getStaffWorkloadSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
});

