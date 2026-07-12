// ─── Filter operators ────────────────────────────────────────────────────────

type ScalarValue = string | number | boolean | null

/** Operators whose value is a single scalar. */
type ScalarOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'ilike'
  | 'like'
  | 'isnull'
  | 'isnotnull'

/** Operators whose value is an array (in, nin) or a 2-element tuple (between). */
type ArrayOperator = 'in' | 'nin'
type RangeOperator = 'between'

export type ScalarFilter = { operator: ScalarOperator; value: ScalarValue }
export type ArrayFilter = { operator: ArrayOperator; value: ScalarValue[] }
export type RangeFilter = { operator: RangeOperator; value: [ScalarValue, ScalarValue] }
export type FilterEntry = ScalarFilter | ArrayFilter | RangeFilter

// ─── Searcher ────────────────────────────────────────────────────────────────

/**
 * Map from field name → FilterEntry.
 * Generic so callers can constrain which fields are valid:
 *   Searcher<'status' | 'price' | 'title'>
 */
export type Searcher<Fields extends string = string> = {
  [K in Fields]?: FilterEntry
}

// ─── Sorter ──────────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc'

export type SorterEntry<Fields extends string = string> = {
  field: Fields
  direction: SortDirection
}

/** Accept a single sort or an ordered array for multi-sort. */
export type Sorter<Fields extends string = string> = SorterEntry<Fields> | SorterEntry<Fields>[]

// ─── Query input ─────────────────────────────────────────────────────────────

export interface QueryInput<
  SearchFields extends string = string,
  SortFields extends string = string,
> {
  page?: number
  pageSize?: number
  searcher?: Searcher<SearchFields>
  sorter?: Sorter<SortFields>
}

// ─── Output ──────────────────────────────────────────────────────────────────

export type QueryParams = Record<string, string | number>

// ─── Builder ─────────────────────────────────────────────────────────────────

/**
 * Converts developer-friendly query input into the flat param object
 * expected by the API (filters[field][operator]=value, sort=field:dir, …).
 *
 * Usage:
 *   axiosInstance.get('/documents', {
 *     params: buildQuery({
 *       page: 1,
 *       pageSize: 20,
 *       searcher: {
 *         status: { operator: 'eq', value: 'PUBLISHED' },
 *         price:  { operator: 'between', value: [10000, 200000] },
 *         title:  { operator: 'ilike', value: 'toán' },
 *       },
 *       sorter: { field: 'createdAt', direction: 'desc' },
 *     }),
 *   })
 */
export function buildQuery<
  SearchFields extends string = string,
  SortFields extends string = string,
>(input: QueryInput<SearchFields, SortFields>): QueryParams {
  const params: QueryParams = {}

  // ── Pagination ─────────────────────────────────────────────────────────────
  if (input.page !== undefined) params['page'] = input.page
  if (input.pageSize !== undefined) params['limit'] = input.pageSize

  // ── Sort ───────────────────────────────────────────────────────────────────
  if (input.sorter) {
    const entries = Array.isArray(input.sorter) ? input.sorter : [input.sorter]
    params['sort'] = entries.map(s => `${s.field}:${s.direction}`).join(',')
  }

  // ── Filters ────────────────────────────────────────────────────────────────
  if (input.searcher) {
    for (const field of Object.keys(input.searcher) as SearchFields[]) {
      const entry: FilterEntry | undefined = input.searcher[field]
      if (entry === undefined) continue

      const key = `filters[${field}][${entry.operator}]`

      if (Array.isArray(entry.value)) {
        params[key] = entry.value.join(',')
      } else if (entry.value === null) {
        params[key] = 'null'
      } else if (typeof entry.value === 'boolean') {
        params[key] = entry.value ? 'true' : 'false'
      } else {
        params[key] = entry.value
      }
    }
  }

  return params
}
