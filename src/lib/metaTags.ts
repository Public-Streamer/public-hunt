/**
 * Dynamic meta tag management for social media previews
 */

interface EventMetaData {
  title: string;
  description: string;
  image?: string;
  url: string;
  hostName?: string;
  date?: string;
  location?: string;
  price?: number;
}

export function updateEventMetaTags(eventData: EventMetaData) {
  // Update document title
  console.log(document.title);
  document.title = `${eventData.title} - Public Streamer`;
  console.log(document.title);

  // Helper function to update or create meta tag
  const updateMetaTag = (property: string, content: string) => {
    console.log(property, content);
    let metaTag = document.querySelector(
      `meta[property="${property}"], meta[name="${property}"]`
    );
    console.log(metaTag);
    if (metaTag) {
      console.log("Updating meta tag:", metaTag);
      metaTag.setAttribute("content", content);
    } else {
      console.log("Creating meta tag:", property, content);
      metaTag = document.createElement("meta");
      if (property.startsWith("og:") || property.startsWith("twitter:")) {
        metaTag.setAttribute("property", property);
      } else {
        metaTag.setAttribute("name", property);
      }
      metaTag.setAttribute("content", content);
      document.head.appendChild(metaTag);
    }
    console.log(document.head);
  };

  // Update meta description
  updateMetaTag("description", eventData.description);

  // Update Open Graph tags
  updateMetaTag("og:title", eventData.title);
  updateMetaTag("og:description", eventData.description);
  updateMetaTag("og:type", "event");
  updateMetaTag("og:url", eventData.url);
  updateMetaTag("og:site_name", "Public Streamer");

  if (eventData.image) {
    updateMetaTag("og:image", eventData.image);
    updateMetaTag("og:image:width", "1200");
    updateMetaTag("og:image:height", "630");
  }

  // Update Twitter Card tags
  updateMetaTag("twitter:card", "summary_large_image");
  updateMetaTag("twitter:title", eventData.title);
  updateMetaTag("twitter:description", eventData.description);
  updateMetaTag("twitter:site", "@publicstreamer");
  updateMetaTag("twitter:creator", "@publicstreamer");

  if (eventData.image) {
    updateMetaTag("twitter:image", eventData.image);
  }

  // Event specific tags
  if (eventData.date) {
    updateMetaTag("event:start_time", eventData.date);
  }

  if (eventData.location) {
    updateMetaTag("event:location", eventData.location);
  }

  if (eventData.hostName) {
    updateMetaTag("event:organizer", eventData.hostName);
  }

  // Update canonical URL
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink) {
    canonicalLink.setAttribute("href", eventData.url);
  } else {
    canonicalLink = document.createElement("link");
    canonicalLink.setAttribute("rel", "canonical");
    canonicalLink.setAttribute("href", eventData.url);
    document.head.appendChild(canonicalLink);
  }

  // Add JSON-LD structured data
  updateStructuredData(eventData);
}

function updateStructuredData(eventData: EventMetaData) {
  // Remove existing structured data
  const existingScript = document.querySelector(
    'script[type="application/ld+json"]'
  );
  if (existingScript) {
    existingScript.remove();
  }

  // Create new structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: eventData.title,
    description: eventData.description,
    url: eventData.url,
    image: eventData.image || `${window.location.origin}/placeholder.svg`,
    ...(eventData.date && { startDate: eventData.date }),
    ...(eventData.location && {
      location: {
        "@type": "Place",
        name: eventData.location,
      },
    }),
    ...(eventData.hostName && {
      organizer: {
        "@type": "Person",
        name: eventData.hostName,
      },
    }),
    offers: {
      "@type": "Offer",
      price: eventData.price || 0,
      priceCurrency: "USD",
      url: eventData.url,
    },
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
}

export function resetDefaultMetaTags() {
  // Reset to default site meta tags
  updateEventMetaTags({
    title: "Public Streamer - Live Event Streaming Platform",
    description:
      "Join live streaming events and connect with audiences worldwide",
    url: window.location.origin,
    image: `${window.location.origin}/placeholder.svg`,
  });
}
