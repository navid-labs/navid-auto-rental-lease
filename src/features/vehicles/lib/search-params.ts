import {
  parseAsString,
  parseAsInteger,
  createSearchParamsCache,
} from 'nuqs/server'

export const searchParamsParsers = {
  // Existing filters
  brand: parseAsString.withDefault(''),
  model: parseAsString.withDefault(''),
  gen: parseAsString.withDefault(''),
  yearMin: parseAsInteger,
  yearMax: parseAsInteger,
  priceMin: parseAsInteger,
  priceMax: parseAsInteger,
  mileMin: parseAsInteger,
  mileMax: parseAsInteger,
  sort: parseAsString.withDefault('recommended'),
  page: parseAsInteger.withDefault(1),

  // New filters (comma-separated multi-select)
  fuel: parseAsString.withDefault(''),
  transmission: parseAsString.withDefault(''),
  color: parseAsString.withDefault(''),
  seats: parseAsInteger,
  driveType: parseAsString.withDefault(''),
  options: parseAsString.withDefault(''),
  region: parseAsString.withDefault(''),
  salesType: parseAsString.withDefault(''),
  keyword: parseAsString.withDefault(''),
  monthlyMin: parseAsInteger,
  monthlyMax: parseAsInteger,

  // Quick filters (boolean toggles as string)
  homeService: parseAsString.withDefault(''),
  timeDeal: parseAsString.withDefault(''),
  noAccident: parseAsString.withDefault(''),
  hasRental: parseAsString.withDefault(''),

  // View mode
  view: parseAsString.withDefault('grid'),
}

export const searchParamsCache = createSearchParamsCache(searchParamsParsers)

export const PAGE_SIZE = 12
