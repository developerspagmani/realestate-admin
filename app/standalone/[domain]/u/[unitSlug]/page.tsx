import { Metadata } from 'next';
import UnitDetailClient from './UnitDetailClient';

const BACKEND_URL = process.env.BACKEND_URL;

async function getUnitData(idOrSlug: string) {
    if (!idOrSlug) return null;
    try {
        const url = `${BACKEND_URL}/api/public/units/${idOrSlug}`;
        const res = await fetch(url, {
            next: { revalidate: 1 }
        });
        if (!res.ok) return null;
        return res.json();
    } catch (err) {
        console.error('Error fetching unit data for SEO:', err);
        return null;
    }
}

export async function generateMetadata(props: any): Promise<Metadata> {
    try {
        const params = await props.params;
        const { unitSlug } = params;
        const data = await getUnitData(unitSlug);

        if (!data?.success || !data?.data) {
            return { title: 'Unit Not Found' };
        }

        const unit = data.data;
        const propertyTitle = unit.property?.title || 'Property Detail';
        const title = `${unit.name || `Unit ${unit.unitCode}`} | ${propertyTitle}`;

        return {
            title,
            description: `View details for ${unit.name || `Unit ${unit.unitCode}`} at ${propertyTitle}.`,
        };
    } catch (e) {
        return { title: 'Unit Detail' };
    }
}

export default async function UnitPage(props: any) {
    const params = await props.params;
    const { unitSlug } = params;

    if (!unitSlug) return <div className="p-5 text-center">Invalid unit address.</div>;

    return <UnitDetailClient unitSlug={unitSlug} />;
}
