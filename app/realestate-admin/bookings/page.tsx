import { Suspense } from 'react';
import Loader from '@/components/common/Loader';
import BookingsManager from '@/components/modules/realestate/bookings/BookingsManager';

export default function AdminBookingsPage() {
    return (
        <Suspense fallback={<div className="p-5 text-center"><Loader size="md" message="Loading Bookings..." /></div>}>
            <BookingsManager mode="admin" />
        </Suspense>
    );
}
