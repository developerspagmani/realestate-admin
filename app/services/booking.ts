import { makeApiCall, bookingEndpoints } from '@/app/api/config/endpoints';
import { Booking } from './types';

export const bookingService = {
    getBookings: async (token: string, params?: { page?: string; limit?: string; status?: string; userId?: string; unitId?: string; startDate?: string; endDate?: string; tenantId?: string; ownerId?: string; industryType?: number | string }, skipCache: boolean = false) => {
        return await makeApiCall(bookingEndpoints.getAll(params), {
            headers: { 'Authorization': `Bearer ${token}` },
            ...({ skipCache } as any)
        });
    },

    getBookingById: async (token: string, bookingId: string, tenantId?: string) => {
        const params: Record<string, string> = {};
        if (tenantId) params.tenantId = tenantId;
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/bookings/${bookingId}?${queryString}` : `/bookings/${bookingId}`;

        return await makeApiCall(endpoint, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    createBooking: async (token: string, bookingData: Partial<Booking>) => {
        return await makeApiCall('/bookings', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(bookingData),
        });
    },

    updateBooking: async (token: string, bookingId: string, bookingData: Partial<Booking>) => {
        return await makeApiCall(bookingEndpoints.update(bookingId, (bookingData as any).tenantId), {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(bookingData),
        });
    },

    updateBookingStatus: async (token: string, bookingId: string, status: number, notes?: string, tenantId?: string) => {
        const url = tenantId ? `/bookings/${bookingId}/status?tenantId=${tenantId}` : `/bookings/${bookingId}/status`;
        return await makeApiCall(url, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status, notes }),
        });
    },

    cancelBooking: async (token: string, bookingId: string, reason?: string, tenantId?: string) => {
        const url = tenantId ? `/bookings/${bookingId}/cancel?tenantId=${tenantId}` : `/bookings/${bookingId}/cancel`;
        return await makeApiCall(url, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ reason }),
        });
    },

    deleteBooking: async (token: string, bookingId: string, tenantId?: string) => {
        const url = tenantId ? `/bookings/${bookingId}?tenantId=${tenantId}` : `/bookings/${bookingId}`;
        return await makeApiCall(url, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    checkAvailability: async (token: string, params: { unitId: string; startAt: string; endAt: string; bookingId?: string; tenantId?: string }) => {
        const queryString = new URLSearchParams(params as any).toString();
        return await makeApiCall(`/bookings/check-availability?${queryString}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    getBookingStats: async (token: string, params?: { period?: string; startDate?: string; endDate?: string; tenantId?: string; industryType?: number | string }) => {
        return await makeApiCall(bookingEndpoints.getStats(params), {
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },

    sendVisitInfo: async (token: string, bookingId: string, tenantId?: string) => {
        const params: Record<string, string> = {};
        if (tenantId) params.tenantId = tenantId;
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/bookings/${bookingId}/send-info?${queryString}` : `/bookings/${bookingId}/send-info`;

        return await makeApiCall(endpoint, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    },
};
