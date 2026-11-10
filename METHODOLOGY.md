# Methodology

## Approach
1. Compared five fusion raw-material groups (tungsten, beryllium, lithium/Li-6, niobium-tin, REBCO rare earths). For each, recorded the fusion component, the top producing countries (USGS MCS 2026) and documented human-rights risks, using Tavily searches and page extraction.
2. Chose tungsten. It is a statutory conflict mineral in US (Dodd-Frank §1502) and EU (2017/821) law, it has a public RMI smelter audit list, it has its own HS codes (2611, 2841, 8101), and there is documented abuse in DRC, Rwanda and Myanmar.
3. In Sayari:
   - Resolved the anchors: ITER, Commonwealth Fusion Systems, Plansee, Xiamen Tungsten, China Tungsten High-Tech, Jiangxi Tungsten, Masan, Almonty and Trinity Nyakabingo.
   - Pulled upstream supply chains filtered by tungsten HS codes.
   - Searched trade corridors for six origin countries.
   - Screened each anchor on the watchlist to depth 2.
4. Labelled every claim with a confidence level and rated five risks for severity and traceability.

## Confidence levels
- **Confirmed**: stated in a primary or official source.
- **Reported**: credible NGO, academic or press source.
- **Sayari record**: present in the Sayari graph; not checked against the underlying document.
- **Inferred**: analyst judgment or an illustrative link.

## Key limitations
- Sayari shows **no inbound tungsten** for ITER or CFS. Customs data rarely names the consignee for finished components.
- Trade figures are shipment-row counts, not tonnes.
- `psa_` flags rest on possible-match entity resolution. Subtier forced-labor flags come from network analysis.
- The ITER→NIIEFA and CFS→S-Innovatsii HS 810199 rows come from Russian import data and need source-record verification.
- The UN's quantified laundering findings concern coltan, not wolframite. Bolivian tungsten is not on the DOL list. No tungsten firm is on the UFLPA Entity List.

The full list is in the site's Methodology tab and in `data/site.json`.
