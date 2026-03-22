/**
 * Shared Prisma include for vehicle queries.
 * Used by both the page Server Component and the loadMoreVehicles server action.
 */
export const vehicleInclude = {
  trim: {
    include: {
      generation: {
        include: {
          carModel: {
            include: { brand: true },
          },
        },
      },
    },
  },
  images: true,
  dealer: {
    select: { id: true, name: true, email: true, phone: true },
  },
} as const
