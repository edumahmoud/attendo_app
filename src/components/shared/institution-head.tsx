'use client';

import { useEffect } from 'react';
import { useInstitutionStore } from '@/stores/institution-store';

/**
 * InstitutionHead — dynamically updates the browser tab title and favicon
 * based on institution data (logo and name/tagline).
 */
export default function InstitutionHead() {
  const { institution, fetchInstitution, loaded } = useInstitutionStore();

  useEffect(() => {
    if (!loaded) fetchInstitution();
  }, [loaded, fetchInstitution]);

  useEffect(() => {
    if (!loaded) return;

    const name = institution?.name || 'أتيندو';
    const tagline = institution?.tagline;
    const title = tagline ? `${name} - ${tagline}` : name;

    // Update document title
    document.title = title;

    // Update favicon if institution has a logo
    if (institution?.logo_url) {
      // Check if we already have a dynamic favicon link
      let link = document.querySelector("link[rel='icon'][data-dynamic]") as HTMLLinkElement;
      if (!link) {
        // Remove existing favicon links
        const existingLinks = document.querySelectorAll("link[rel='icon']");
        existingLinks.forEach((l) => l.remove());

        // Create new dynamic favicon link
        link = document.createElement('link');
        link.rel = 'icon';
        link.setAttribute('data-dynamic', 'true');
        document.head.appendChild(link);
      }

      // Use the logo URL as favicon
      // For better compatibility, add a timestamp to bust cache
      link.href = institution.logo_url;
      link.type = 'image/png'; // Default type, browser will handle it
    } else {
      // Remove dynamic favicon if no logo, let the default favicon show
      const dynamicLink = document.querySelector("link[rel='icon'][data-dynamic]");
      if (dynamicLink) {
        dynamicLink.remove();
      }
    }
  }, [institution, loaded]);

  return null; // This component doesn't render anything
}
