import React from "react";
import AdSense from 'react-adsense';
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
            title="Articles"
            description="Developer articles which Mimul recommends."
            slug="\recommended\articles"
          />
          <div className="section">
            <div className="columns">
              <div className="column main-loop">
                {/*}<h1 className="title is-6 text-uppercase mb-4">
                  <span className="has-text-weight-bold">Recommended</span>
                </h1>*/}
                <h4 className="title is-4 spanborder has-text-weight-bold">
                  <span>Articles</span>
                </h4>
                <StoriesRoll posts={stories} />
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
