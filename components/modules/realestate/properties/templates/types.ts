import { Property, Amenity, MediaItem } from '@/types';

export interface CustomContact {
    name: string;
    phone: string;
    email: string;
    website: string;
}

export interface SelectedImages {
    cover: string;
    bg1: string;
    bg2: string;
    bg3: string;
}

export interface BrochureToggles {
    showPrice: boolean;
    showAmenities: boolean;
    showQRCode: boolean;
    showStats: boolean;
}

export interface BaseTemplateProps {
    property: Property;
    mode: 'admin' | 'owner';
    companyInfo?: { name?: string };
    fontStyle?: string;
    accentColor?: string;
    textColor?: string;
    currency?: string;
    allAmenities?: Amenity[];
    allMedia?: MediaItem[];
    aiTagline?: string;
    aiDescription?: string;
    isPreview?: boolean;
    customContact?: CustomContact;
    selectedImages?: SelectedImages;
    toggles?: BrochureToggles;
    bgColor?: string;
}
