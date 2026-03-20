import axiosInstance from '@/lib/axios'
import type { User } from '@/models/User'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'
import { buildQuery, type QueryInput } from '@/utils/buildQuery'

const USER_ENDPOINT = '/users'

type UserSearchFields = 'email' | 'fullName' | 'role' | 'status' | 'createdAt'
type UserSortFields = 'fullName' | 'email' | 'createdAt' | 'updatedAt'

export type ListUserInput = QueryInput<UserSearchFields, UserSortFields>
export type ListUserOutput = ApiListData<User>

export async function listUser(input?: ListUserInput): Promise<ListUserOutput> {
  const response = await axiosInstance.get<ApiListResponse<User>>(USER_ENDPOINT, {
    params: input ? buildQuery(input) : undefined,
  })

  return unwrapList(response.data)
}
