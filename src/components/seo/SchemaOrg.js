import React from "react";
import Helmet from "react-helmet";

export default React.memo(
  ({
    author,
    siteUrl,
    datePublished,
    dateModified,
    description,
    image,
    isBlogPost,
    organization,
    title,
    url
  }) => {
    const baseSchema = [
      {
        "@context": "http://schema.org",
        "@type": "Organization",
        "@id": "https://mimul.com#organization",
        name: "Mimul",
        url: "https://mimul.com",
        sameAs: ["https://twitter.com/mimul"],
        legalName: "HoJin Ha",
        logo: {
          "@type": "ImageObject",
          url: "https://mimul.com/img/mimul-logo.gif",
          width: 144,
          height: 144
        },
        founder: {
          "@type": "Person",
          name: "Mimul",
          image: {
            "@type": "ImageObject",
            url: "https://s.gravatar.com/avatar/7cc5be42cbe1d05d12b8a816f4432dd2",
            width: 300,
            height: 300
          }
        }
      },
      {
        "@context": "http://schema.org",
        "@type": "WebSite",
        "@id": "https://mimul.com#website",
        url: "https://mimul..com",
        name: "Mimul",
        alternateName: "Software Engineer | Mimul",
        author: {
          "@id": "https://mimul.com#organization"
        }
      },
      {
        "@context": "http://schema.org",
        "@type": "WebPage",
        "@id": url,
        url,
        headline: title,
        description,
        publisher: {
          "@id": "https://mimul.com#organization"
        },
        sourceOrganization: {
          "@id": "https://mimul.com#organization"
        }
      }
    ];

    const schema = isBlogPost
      ? [
          ...baseSchema,
          {
            "@context": "http://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                item: {
                  "@id": url,
                  name: title,
                  image
                }
              }
            ]
          },
          {
            "@context": "http://schema.org",
            "@type": "BlogPosting",
            url,
            name: title,
            headline: title,
            image: {
              "@type": "ImageObject",
              url: image
            },
            description,
            author: {
              "@id": "https://mimul.com#organization"
            },
            publisher: {
              "@id": "https://mimul.com#organization"
            },
            mainEntityOfPage: {
              "@type": "WebSite",
              "@id": siteUrl
            },
            datePublished,
            dateModified: dateModified ? dateModified : datePublished
          }
        ]
      : baseSchema;

    return (
      <Helmet>
        {/* Schema.org tags */}
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
        <script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
      </Helmet>
    );
  }
);
