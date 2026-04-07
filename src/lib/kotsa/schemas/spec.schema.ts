import { z } from 'zod'

/**
 * KotsaSpec 관련 Zod 스키마
 * KotsaEngineSpec, KotsaTransmissionSpec 등 모든 제원 서브타입과 1:1 대응
 */

export const kotsaEngineSpecSchema = z.object({
  type: z.string(),
  displacement: z.number(),
  fuelType: z.string(),
  fuelSystem: z.string(),
  maxPower: z.string(),
  maxTorque: z.string(),
  emissionStandard: z.string(),
  catalyticConverter: z.boolean(),
  turbocharger: z.boolean(),
  hybridType: z.string().nullable(),
  evRange: z.number().nullable(),
  batteryCapacity: z.number().nullable(),
  chargingType: z.string().nullable(),
  hydrogenTankCapacity: z.number().nullable(),
  fuelTankCapacity: z.number(),
  fuelEfficiency: z.string(),
  co2Emission: z.number(),
})

export const kotsaTransmissionSpecSchema = z.object({
  type: z.string(),
  gears: z.number(),
  driveType: z.string(),
})

export const kotsaBodySpecSchema = z.object({
  type: z.string(),
  numberOfDoors: z.number(),
  length: z.number(),
  width: z.number(),
  height: z.number(),
  wheelbase: z.number(),
  trackFront: z.number(),
  trackRear: z.number(),
  overhangFront: z.number(),
  overhangRear: z.number(),
  groundClearance: z.number(),
  curbWeight: z.number(),
  grossWeight: z.number(),
  maxPayload: z.number(),
  towingCapacity: z.number(),
})

export const kotsaTireSpecSchema = z.object({
  frontSize: z.string(),
  rearSize: z.string(),
  spareTire: z.string(),
})

export const kotsaSuspensionSpecSchema = z.object({
  front: z.string(),
  rear: z.string(),
})

export const kotsaBrakeSpecSchema = z.object({
  front: z.string(),
  rear: z.string(),
  parkingBrake: z.string(),
})

export const kotsaSteeringSpecSchema = z.object({
  type: z.string(),
  turningRadius: z.number(),
})

export const kotsaSpecSchema = z.object({
  engine: kotsaEngineSpecSchema,
  transmission: kotsaTransmissionSpecSchema,
  body: kotsaBodySpecSchema,
  tire: kotsaTireSpecSchema,
  suspension: kotsaSuspensionSpecSchema,
  brake: kotsaBrakeSpecSchema,
  steering: kotsaSteeringSpecSchema,
})
