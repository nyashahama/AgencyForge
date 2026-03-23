export default function Testimonials() {
  return (
    <section className="sec">
      <div className="container">
        <div className="sec-head reveal">
          <div>
            <div className="sec-label">In their words</div>
            <h2 className="sec-h2">
              Agencies that
              <br />
              <i>changed how they work.</i>
            </h2>
          </div>
        </div>
        <div className="testi-grid reveal">
          <div className="testi">
            <p className="testi-q">
              "We used to spend three weeks on creative development. AgencyForge
              gets us to first-review <i>in under four hours.</i> We've taken on
              six new retainer clients without a single hire."
            </p>
            <div className="testi-who">
              <div className="testi-av">JK</div>
              <div>
                <div className="testi-name">Jamie Kovacs</div>
                <div className="testi-role">Founder, Voltage Creative</div>
              </div>
            </div>
          </div>
          <div className="testi">
            <p className="testi-q">
              "The legal docs come out clean on the first pass.{" "}
              <i>That alone saves us $4k a month</i> in outside counsel — before
              we even count the production time saved."
            </p>
            <div className="testi-who">
              <div className="testi-av">MR</div>
              <div>
                <div className="testi-name">Marcus Reid</div>
                <div className="testi-role">COO, Meridian Agency</div>
              </div>
            </div>
          </div>
          <div className="testi">
            <p className="testi-q">
              "Our creatives now spend time on the 10% that actually needs a
              human — <i>strategy and relationships.</i> Every executional task
              is Forge now."
            </p>
            <div className="testi-who">
              <div className="testi-av">SL</div>
              <div>
                <div className="testi-name">Sophia Lund</div>
                <div className="testi-role">
                  Creative Director, Neon & Stone
                </div>
              </div>
            </div>
          </div>
          <div className="testi">
            <p className="testi-q">
              "We tripled our client roster in five months without adding
              headcount. <i>The client portal closed three deals on its own</i>{" "}
              — they just want that experience."
            </p>
            <div className="testi-who">
              <div className="testi-av">DK</div>
              <div>
                <div className="testi-name">Dev Kapoor</div>
                <div className="testi-role">Managing Partner, Fieldwork</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
