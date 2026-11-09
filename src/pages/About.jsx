import { Link } from "react-router-dom";
import { IMG } from "@/lib/assets";
import Marquee from "@/components/cb/Marquee";
import { FLOORS } from "@/lib/programme";

const MARQUEE = ["run by group sustainability", "30% participation target per floor", "monthly leadership review", "gri 306-4 preparation for reuse"];

export default function About() {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-sub">about the programme</p>
        <h1 className="display mt-3 max-w-[18ch] text-[54px] sm:text-[86px] xl:text-[104px]">
          run by the bank,
          <br />
          measured by the kilo.
        </h1>
      </div>

      <Marquee items={MARQUEE} className="-mx-5 sm:-mx-8" />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6 text-[14px] leading-relaxed text-ink">
          <p>
            CoffeeBot Re is a corporate sustainability programme operated inside Harbourline Bank&rsquo;s
            offices. CoffeeBot supplies the tabletop machines, collects the spent grounds and operates the
            platform. Harbourline&rsquo;s Group Sustainability team runs and enforces the programme.
          </p>
          <p>
            The programme was launched by an email from the Chief Sustainability Officer to all Marina Bay
            staff. Every office has one weekly Ground Drop day, chosen by the bank. Grounds are emptied into a
            lidded 5 litre caddy on each floor&rsquo;s collection table, away from the pantry, and stay until the
            clear-out two days later.
          </p>
          <p>
            CoffeeBot does not control machine screens. All programme communication runs through the
            bank&rsquo;s internal email.
          </p>

          <div className="border-t border-rule pt-5">
            <h2 className="text-[15px] lowercase">governance</h2>
            <dl className="mt-3 divide-y divide-rule border-y border-rule">
              {[
                ["Programme owner", "Group Sustainability, Harbourline Bank"],
                ["Launched by", "Chief Sustainability Officer, internal email to all staff"],
                ["Participation target", "30% of eligible employees per floor, per month"],
                ["Floor Champions", "One named champion per floor validates reuse records"],
                ["Pledge Auction", "Monthly: each floor bids the uplift it will reach. Half volume, half uplift."],
                ["Volunteer time", "1 validated activity = 0.5 h, max 1 h a month · every 10 h = half a day of volunteer leave"],
                ["Leadership review", "Monthly, with the results table exported for the ESG report"],
                ["Evidence standard", "Weighed at collection · Reported at reuse · Validated by the Champion"],
                ["Reporting line", "GRI 306-4 Waste diverted from disposal — preparation for reuse"],
                ["For the bank", "weighed kg reported under GRI 306-4, participation by floor, no extra CoffeeBot trips."],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[200px_1fr] sm:gap-4">
                  <dt className="text-[12px] uppercase tracking-[0.12em] text-sub">{k}</dt>
                  <dd className="text-[13px] text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <figure>
            <img src={IMG.machine} alt="A tabletop coffee machine in a corporate pantry" className="h-[260px] w-full rounded-[2px] object-cover" />
            <figcaption className="mt-2 text-[12px] text-sub">
              Every coffee leaves about 15 g of wet spent grounds. About 3,000 coffee-based drinks a month at Marina
              Bay, 45 kg of grounds, 300 g per employee.
            </figcaption>
          </figure>
          <figure>
            <img src={IMG.table} alt="A floor collection table with a caddy and scale" className="h-[260px] w-full rounded-[2px] object-cover" />
            <figcaption className="mt-2 text-[12px] text-sub">
              Collection table, away from the pantry. Scoop into your own jar or a supplied lined kraft pouch,
              then weigh.
            </figcaption>
          </figure>
        </div>
      </div>

      <div>
        <div className="border-b border-rule pb-3">
          <h2 className="text-[15px] lowercase">marina bay · six programme floors</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-px bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {FLOORS.map((f) => (
            <div key={f.code} className="bg-canvas px-4 py-4">
              <div className="display text-[28px]">{f.code}</div>
              <div className="mt-1 text-[13px] text-ink">{f.name}</div>
              <div className="text-[11px] uppercase tracking-[0.12em] text-sub">{f.eligible} eligible</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-sub">
          No L13. Harbourline also operates Changi Business Park and Raffles Place; their figures appear in the
          offices ranking as aggregated data only.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5 text-[12px] text-sub">
        <span>CoffeeBot Re v2.3 · Privacy · Data retention policy · Support</span>
        <Link to="/demo" className="hover:text-ink">demo accounts</Link>
      </div>
    </div>
  );
}