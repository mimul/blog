import React from "react";
import Layout from "../components/Layout";
import SEO from "../components/seo/SEO";
import StoriesRoll from "../components/StoriesRoll";
import { graphql } from "gatsby";
import Pagination from "../components/Pagination";

export default class RecommendedStoriesIndexPage extends React.Component {
  render() {
    const { pageContext, data } = this.props;
    const { previousPagePath, nextPagePath } = pageContext;
    const stories = data.recommendedStories.edges;
    return (
      <Layout>
        <div className="container">
          <SEO
            title="Developer Articles"
            description="Developer articles which Mimul recommends."
            slug="\recommended\stories"
          />
          <div className="section">
            <div className="columns">
              <div className="column main-loop">
                {/*}<h1 className="title is-6 text-uppercase mb-4">
                  <span className="has-text-weight-bold">Recommended</span>
                </h1>*/}
                <h4 className="title is-4 spanborder has-text-weight-bold">
                  <span>All Articles</span>
                </h4>
                <StoriesRoll posts={stories} />
                <Pagination
                  previousPagePath={previousPagePath}
                  nextPagePath={nextPagePath}
                ></Pagination>
              </div>

              {/*<div className="column">
                 {% include sidebar-featured.html %}
              </div>*/}
            </div>
          </div>
        </div>
      </Layout>
    );
  }
}

export const pageQuery = graphql`
  query RecommendedStoriesIndexPageQuery($skip: Int!, $limit: Int!) {
    recommendedStories: allStoriesJson(
      sort: { fields: [date], order: DESC }
      skip: $skip
      limit: $limit
    ) {
      edges {
        node {
          title
          date(formatString: "MMM DD, YYYY")
          description
          id
          tags
          url
        }
      }
    }
  }
`;
