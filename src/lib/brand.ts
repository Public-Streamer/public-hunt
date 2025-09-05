type BrandMode = 'doghunt' | 'publicstreamer';

export const brandName = import.meta.env.VITE_BRAND_NAME || 'Default';
export const brandUrl = import.meta.env.VITE_PROD_URL || 'Default';
export const brandMode: BrandMode = import.meta.env.MODE as BrandMode;
