/**
 * This file is intended to be the store for FormHandler component, which will handle the state and logic related to form handling, such as form submission, validation, and error handling.
 */

import { create } from 'zustand'

interface FormHandlerState {
  formLoadings: Record<string, boolean>
  setFormLoading: ({ formId, loading }: { formId: string; loading: boolean }) => void
}

export const useFormHandlerStore = create<FormHandlerState>(set => ({
  formLoadings: {},
  setFormLoading: ({ formId, loading }) =>
    set(state => ({
      formLoadings: {
        ...state.formLoadings,
        [formId]: loading,
      },
    })),
}))
