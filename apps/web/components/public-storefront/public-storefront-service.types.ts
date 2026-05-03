/** Shape used by public services listing + booking “service” step (subset of storefront service). */
export type PublicStorefrontServiceCard = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  address: string;
  durationMinutes: number;
  packSize: number;
  price: number;
  isFree: boolean;
};

export type PublicStorefrontCoachCard = {
  name: string;
  bio: string | null;
  imageUrl: string | null;
};
