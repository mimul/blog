import React, { Component } from "react";
import { FaFlag } from "react-icons/fa";

export default class Timeline extends Component {
  render() {
    return (
      <section className="section">
        <div className="container">
          <div className="divider is-centered"></div>
          <h2 className="title is-semibold has-text-centered is-spaced">
            Career Path
          </h2>
          <h4 className="subtitle is-6 has-text-centered is-compact">
            An overview of my career timeline shown below.
          </h4>

          <div className="timeline is-centered mt-3">
            <header className="timeline-header">
              <span className="tag is-medium is-primary">Now</span>
            </header>
            <div className="timeline-item">
              <div className="timeline-marker is-icon">
                <FaFlag></FaFlag>
              </div>
              <div className="timeline-content">
                <p className="heading has-text-info	has-text-weight-bold">
                  January 2016
                </p>
                <p>Bodies & Souls - CTO</p>
              </div>
            </div>
            <header className="timeline-header">
              <span className="tag is-primary">2016</span>
            </header>
            <div className="timeline-item">
              <div className="timeline-marker is-icon">
                <FaFlag></FaFlag>
              </div>
              <div className="timeline-content">
                <p className="heading has-text-info has-text-weight-bold">
                  December 2010
                </p>
                <p>WiseEco — Co-Founder</p>
              </div>
            </div>
            <header className="timeline-header">
              <span className="tag is-primary">2010</span>
            </header>
            <div className="timeline-item">
              <div className="timeline-marker is-icon">
                <FaFlag></FaFlag>
              </div>
              <div className="timeline-content">
                <p className="heading has-text-info has-text-weight-bold">
                  August 2000
                </p>
                <p>KTH(KT Hitel) — Software Engineer</p>
              </div>
            </div>
            <header className="timeline-header">
              <span className="tag is-primary">2000</span>
            </header>
            <div className="timeline-item">
              <div className="timeline-marker is-icon">
                <FaFlag></FaFlag>
              </div>
              <div className="timeline-content">
                <p className="heading has-text-info has-text-weight-bold">
                  January 1999
                </p>
                <p>
                  DaeWoo Telecom — Software Engineer
                </p>
              </div>
            </div>
            <div className="timeline-header">
              <span className="tag is-medium is-primary">Start</span>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
