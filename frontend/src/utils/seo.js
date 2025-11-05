export const SEO = {
  defaultConfig: {
    siteName: "Western Orchestral Music Performance",
    siteUrl: "https://wom.mythic3011.com",
    description:
      "Book tickets for world-class orchestral music performances in Hong Kong. Experience symphonies, concertos, and chamber music by renowned conductors and orchestras.",
    keywords:
      "orchestral music, symphony, concert tickets, classical music, Hong Kong concerts, music performance, beethoven, mozart, tchaikovsky",
    image: "/images/og-image.jpg",
    twitterHandle: "@WOMPerformance",
    locale: "en_US",
    type: "website",
  },

  setPageMeta(config = {}) {
    const meta = { ...this.defaultConfig, ...config };

    document.title = meta.title || this.defaultConfig.siteName;

    this.setMetaTag("description", meta.description);
    this.setMetaTag("keywords", meta.keywords);
    this.setMetaTag("author", "WOM Performance Team");
    this.setMetaTag("robots", "index, follow");
    this.setMetaTag("language", "English");
    this.setMetaTag("revisit-after", "7 days");

    this.setOpenGraph(meta);
    this.setTwitterCard(meta);
    this.setCanonicalUrl(meta.url);

    if (meta.structuredData) {
      this.setStructuredData(meta.structuredData);
    }
  },

  setMetaTag(name, content) {
    if (!content) return;

    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", name);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  },

  setMetaProperty(property, content) {
    if (!content) return;

    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("property", property);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
  },

  setOpenGraph(meta) {
    this.setMetaProperty("og:site_name", meta.siteName);
    this.setMetaProperty("og:title", meta.title || meta.siteName);
    this.setMetaProperty("og:description", meta.description);
    this.setMetaProperty("og:type", meta.type || "website");
    this.setMetaProperty("og:url", meta.url || window.location.href);
    this.setMetaProperty("og:image", meta.image);
    this.setMetaProperty("og:locale", meta.locale);

    if (meta.price) {
      this.setMetaProperty("og:price:amount", meta.price);
      this.setMetaProperty("og:price:currency", "HKD");
    }
  },

  setTwitterCard(meta) {
    this.setMetaTag("twitter:card", "summary_large_image");
    this.setMetaTag("twitter:site", meta.twitterHandle);
    this.setMetaTag("twitter:title", meta.title || meta.siteName);
    this.setMetaTag("twitter:description", meta.description);
    this.setMetaTag("twitter:image", meta.image);
  },

  setCanonicalUrl(url) {
    const canonical = url || window.location.href;
    let link = document.querySelector("link[rel='canonical']");

    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);
  },

  setStructuredData(data) {
    const existingScript = document.getElementById("structured-data");
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = "structured-data";
    script.type = "application/ld+json";
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  },

  generatePerformanceStructuredData(performance) {
    return {
      "@context": "https://schema.org",
      "@type": "MusicEvent",
      name: performance.title,
      description:
        performance.description ||
        `Experience ${performance.title} performed by ${performance.orchestra}`,
      startDate: performance.date,
      endDate: performance.date,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: performance.venue,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Hong Kong",
          addressCountry: "HK",
        },
      },
      performer: {
        "@type": "MusicGroup",
        name: performance.orchestra,
      },
      organizer: {
        "@type": "Organization",
        name: "Western Orchestral Music Performance",
        url: this.defaultConfig.siteUrl,
      },
      offers: {
        "@type": "Offer",
        url: `${this.defaultConfig.siteUrl}/performances/${performance.id}`,
        price: performance.price,
        priceCurrency: "HKD",
        availability: "https://schema.org/InStock",
        validFrom: new Date().toISOString(),
      },
      image: performance.image || this.defaultConfig.image,
    };
  },

  generateOrganizationStructuredData() {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: this.defaultConfig.siteName,
      url: this.defaultConfig.siteUrl,
      logo: `${this.defaultConfig.siteUrl}/images/logo.png`,
      description: this.defaultConfig.description,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+852-2734-2009",
        contactType: "Customer Service",
        areaServed: "HK",
        availableLanguage: ["English", "Chinese"],
      },
      sameAs: [
        "https://www.facebook.com/WOMPerformance",
        "https://twitter.com/WOMPerformance",
        "https://www.instagram.com/WOMPerformance",
      ],
    };
  },

  generateBreadcrumbStructuredData(breadcrumbs) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.label,
        item: crumb.path
          ? `${this.defaultConfig.siteUrl}${crumb.path}`
          : undefined,
      })),
    };
  },

  setHomePage() {
    this.setPageMeta({
      title:
        "Western Orchestral Music Performance | Book Concert Tickets in Hong Kong",
      description:
        "Book tickets for world-class orchestral music performances in Hong Kong. Experience symphonies, concertos, and chamber music by renowned conductors and orchestras.",
      url: this.defaultConfig.siteUrl,
      structuredData: this.generateOrganizationStructuredData(),
    });
  },

  setPerformancesPage() {
    this.setPageMeta({
      title: "All Performances | Classical Music Concerts in Hong Kong",
      description:
        "Browse our upcoming orchestral music performances. From Beethoven to Tchaikovsky, find your next musical experience in Hong Kong's finest venues.",
      url: `${this.defaultConfig.siteUrl}/performances`,
      type: "website",
    });
  },

  setPerformanceDetailPage(performance) {
    this.setPageMeta({
      title: `${performance.title} - ${performance.conductor} | WOM Performance`,
      description: `Experience ${performance.title} at ${performance.venue}. Conducted by ${performance.conductor}. Book your tickets now for this exceptional performance.`,
      url: `${this.defaultConfig.siteUrl}/performances/${performance.id}`,
      type: "music.song",
      price: performance.price,
      structuredData: this.generatePerformanceStructuredData(performance),
    });
  },

  setBookingPage(performance) {
    this.setPageMeta({
      title: `Book Seats - ${performance.title} | WOM Performance`,
      description: `Select your seats for ${performance.title}. Interactive seat map with real-time availability. Secure online booking.`,
      url: `${this.defaultConfig.siteUrl}/user/booking?performance=${performance.id}`,
      type: "website",
      structuredData: this.generatePerformanceStructuredData(performance),
    });
  },

  setUserDashboard() {
    this.setPageMeta({
      title: "My Dashboard | WOM Performance",
      description:
        "View your upcoming performances, booking history, and account details.",
      url: `${this.defaultConfig.siteUrl}/user/dashboard`,
      robots: "noindex, nofollow",
    });
  },

  setAdminDashboard() {
    this.setPageMeta({
      title: "Admin Dashboard | WOM Performance",
      description: "Manage performances, venues, bookings, and users.",
      url: `${this.defaultConfig.siteUrl}/admin/dashboard`,
      robots: "noindex, nofollow",
    });
  },

  preloadResources() {
    const resources = [
      { href: "/webfonts/fa-brands-400.woff2", as: "font", type: "font/woff2" },
      { href: "/webfonts/fa-solid-900.woff2", as: "font", type: "font/woff2" },
      {
        href: "/webfonts/fa-regular-400.woff2",
        as: "font",
        type: "font/woff2",
      },
    ];

    resources.forEach((resource) => {
      const existing = document.querySelector(`link[href="${resource.href}"]`);
      if (!existing) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.href = resource.href;
        link.as = resource.as;
        if (resource.type) link.type = resource.type;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }
    });
  },
};

export default SEO;
