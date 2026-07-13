import axiosInstance from '@/lib/axios'

// Approve a doctor verification. Server syncs the user to `verified` and sets
// the expiry from the licence.
export async function verifyDoctor(id: string): Promise<void> {
  await axiosInstance.patch(`/verification/admin/${id}/verify`)
}

// Reject with a reason shown back to the user.
export async function rejectDoctor(id: string, rejectionReason: string): Promise<void> {
  await axiosInstance.patch(`/verification/admin/${id}/reject`, { rejectionReason })
}
