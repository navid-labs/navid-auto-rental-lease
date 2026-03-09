import {
  parseAsString,
  parseAsInteger,
  createSearchParamsCache,
} from 'nuqs/server'

export const searchParamsParsers = {
  brand: parseAsString.withDefault(''),
  model: parseAsString.withDefault(''),
  gen: parseAsString.withDefault(''),
  yearMin: parseAsInteger,
  yearMax: parseAsInteger,
  priceMin: parseAsInteger,
  priceMax: parseAsInteger,
  mileMin: parseAsInteger,
  mileMax: parseAsInteger,
  sort: parseAsString.withDefault('newest'),
  page: parseAsInteger.withDefault(1),
}

export const searchParamsCache = createSearchParamsCache(searchParamsParsers)

export const PAGE_SIZE = 12
