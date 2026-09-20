import type { Category, CreateCategoryRequest } from '../types'
import { apiRequest } from './client'

export function listCategories() {
  return apiRequest<Category[]>('/categories')
}

export function createCategory(data: CreateCategoryRequest) {
  return apiRequest<Category>('/category', {
    method: 'POST',
    body: data,
  })
}

export function updateCategoryRequest(id: string, data: CreateCategoryRequest) {
  return apiRequest<Category>(`/category/${id}`, {
    method: 'PATCH',
    body: data,
  })
}

export function deleteCategory(id: string) {
  return apiRequest<string>(`/category/${id}`, { method: 'DELETE' })
}
