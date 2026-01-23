'use client';

import OwnerDetailLayout from '@/components/modules/realestate/owners/Detail/OwnerDetailLayout';

export default function RealEstateOwnerDetailLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <OwnerDetailLayout mode="realestate-admin">{children}</OwnerDetailLayout>;
}
