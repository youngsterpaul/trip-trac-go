import { ReactNode } from "react";

interface DetailSectionBoxProps {
  title: string;
  children: ReactNode;
}

export const DetailSectionBox = ({ title, children }: DetailSectionBoxProps) => {
  return (
    <div className="mt-6 sm:mt-4 p-4 sm:p-3 border bg-card rounded-lg">
      <h2 className="text-xl sm:text-lg font-semibold mb-4 sm:mb-3">{title}</h2>
      {children}
    </div>
  );
};

// Color constants for consistent styling
export const TEAL_COLOR = "#008080";
export const ORANGE_COLOR = "#FF9800";
export const RED_COLOR = "#EF4444";

interface ItemGridProps {
  items: { name: string; price?: number; capacity?: number }[];
  color: string;
  showPrice?: boolean;
  showCapacity?: boolean;
}

export const ItemGrid = ({ items, color, showPrice = true, showCapacity = false }: ItemGridProps) => {
  if (!items || items.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="px-3 py-1.5 text-white rounded-full text-xs flex flex-col items-center justify-center text-center"
          style={{ backgroundColor: color }}
        >
          <span className="font-medium">{item.name}</span>
          {showPrice && item.price !== undefined && (
            <span className="text-[10px] opacity-90">
              {item.price === 0 ? "Free" : `KSh ${item.price}`}
            </span>
          )}
          {showCapacity && item.capacity !== undefined && (
            <span className="text-[10px] opacity-90">
              Cap: {item.capacity}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

interface AmenityGridProps {
  items: string[];
  color: string;
}

export const AmenityGrid = ({ items, color }: AmenityGridProps) => {
  if (!items || items.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="px-3 py-1.5 text-white rounded-full text-xs flex items-center justify-center text-center"
          style={{ backgroundColor: color }}
        >
          <span className="font-medium">{item}</span>
        </div>
      ))}
    </div>
  );
};

interface ContactInfoBoxProps {
  phone?: string | string[] | null;
  email?: string | null;
}

export const ContactInfoBox = ({ phone, email }: ContactInfoBoxProps) => {
  const phones = Array.isArray(phone) ? phone : phone ? [phone] : [];
  
  if (phones.length === 0 && !email) return null;
  
  return (
    <DetailSectionBox title="Contact Information">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {phones.map((p, idx) => (
          <a
            key={idx}
            href={`tel:${p}`}
            className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-muted transition-colors"
            style={{ borderColor: TEAL_COLOR }}
          >
            <svg className="h-4 w-4" style={{ color: TEAL_COLOR }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-sm" style={{ color: TEAL_COLOR }}>{p}</span>
          </a>
        ))}
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-muted transition-colors"
            style={{ borderColor: TEAL_COLOR }}
          >
            <svg className="h-4 w-4" style={{ color: TEAL_COLOR }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm" style={{ color: TEAL_COLOR }}>{email}</span>
          </a>
        )}
      </div>
    </DetailSectionBox>
  );
};
