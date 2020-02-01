import React from "react";
import AdSense from 'react-adsense';
import { graphql } from "gatsby";
import Layout from "../components/Layout";
import SEO from "../components/seo/SEO";
import ServicesRoll from "../components/ServicesRoll";
import Pagination from "../components/Pagination";

export default class RecommendedServicesIndexPage extends React.Component {
  render() {
    const { pageContext, data } = this.props;
    const { previousPagePath, nextPagePath } = pageContext;
    const services = data.recommendedServices.edges;
    return (
      <Layout>
        <div className="container">
          <SEO
            title="Services"
            description="Service/Service providers which Mimul recommends."
            slug="\recommended\services"
          />
          <div className="section">
            <h1 className="title is-6 has-text-weight-bold mb-4">
              <span>Recommended</span>
            </h1>
            <h4 className="title is-4 has-text-weight-bold spanborder">
              <span>Services</span>
            </h4>
            <div className="columns">
              <div className="column is-two-thirds">
                <ServicesRoll services={services} />
                <div class="blog-post mb-2">
                  <AdSense.Google
                    client='ca-pub-1357079034135808'
                    slot='5864854981'
                    style={{ display: 'block' }}
                    format='auto'
                    responsive='true'
                  />
                </div>
                <Pagination
                  previousPagePath={previousPagePath}
                  nextPagePath={nextPagePath}
                ></Pagination>
              </div>
              <div className="column"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
}

export const pageQuery = graphql`
  query RecommendedServicesIndexPageQuery($skip: Int!, $limit: Int!) {
    recommendedServices: allServicesJson(
      sort: { fields: [date], order: DESC }
      skip: $skip
      limit: $limit
    ) {
      edges {
        node {
          title
          id
          tags
          url
          description
          image
        }
      }
    }
  }
`;
