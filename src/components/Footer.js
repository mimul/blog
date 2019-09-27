import React from "react";
import { OutboundLink } from "gatsby-plugin-google-analytics";
import { Link, useStaticQuery, graphql } from "gatsby";
import { FaStar } from "react-icons/fa";

function Footer() {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            description
          }
        }
      }
    `
  );

  return (
    <footer className="mimul-footer">
      <div className="container">
        <p className="k-copyright">© 2019 | Mimul. All Rights Reserved</p>
      </div>
    </footer>
  );
}
export default Footer;
