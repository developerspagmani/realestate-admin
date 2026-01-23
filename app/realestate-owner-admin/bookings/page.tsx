import { Suspense } from 'react';
import BookingsManager from '@/components/modules/realestate/bookings/BookingsManager';

export default function OwnerBookingsPage() {
    return (
        <Suspense fallback={<div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>}>
            <BookingsManager mode="owner" />
        </Suspense>
    );
}
