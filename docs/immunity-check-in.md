# Immunity check-in

The check-in records two research-informed laboratory reports: EBV DNA from saliva and CMV DNA from urine. Both sample/marker combinations were studied in [Mehta et al., npj Microgravity (2017)](https://www.nature.com/articles/s41526-017-0015-y). This does not turn the website into an assay or establish a universal measure of immune health. Results are copied from laboratory reports, with units required for numeric values. Qualitative “not detected” remains distinct from numeric zero. No immunity score, diagnosis or treatment threshold is inferred.

Reports are append-only in the existing browser record store, with sample type, named test, result, unit, collection/observation time, entry time and manual laboratory provenance. Both results can be saved in one check-in; a partial check-in is also allowed. The latest saved report remains visible within each test on reopening the tab. Other measurements are not modified. Invalid values are rejected before storage is changed.

The guides provide orientation, followed by the assigned mission sampling, containment and storage protocol. They do not prescribe reagents, connector operations, assay methods or storage temperatures for unidentified equipment. The selected research workflow uses a Salivette-type saliva collector and pooled urine; a dipstick or a spot sample is not silently substituted. Laboratory processing illustrations do not instruct the user to perform laboratory analysis aboard the spacecraft.

## Illustration sources

- Saliva action illustrations: SARSTEDT, *Salivette: Hygienic Saliva Collection*, brochure 00.20.156, page 2, panels 2, 5, 8 and 12. Extracted as printed from the [manufacturer's brochure](https://assets.ctfassets.net/0pfiw9onzzjd/71652/f7b692fafca66fcd8abf35146564c738/BRO_20_156_0300_200_NF_SALIVETTE__1021.PDF), linked from the [manufacturer product page](https://www.sarstedt.com/en/NP/c/pre-analytics/saliva-collection/salivette/p/salivette/51.1534). The interface uses a monochrome display filter; these remain credited manufacturer illustrations, not NASA flight instructions.
- Urine action illustrations: original schematic overviews created for this interface from the collection, transfer and containment concepts in NASA's [ROI ISS Facilities Overview](https://www.nasa.gov/wp-content/uploads/2023/11/roi-iss-facilities-june2023.pdf), page 32. These are explicitly labeled as collection overviews based on NASA hardware, not official or certified operating diagrams.
- Original hardware photographs retained as references: the same NASA overview, pages 32 and 34. NASA's public document notes that trade names are identification rather than endorsement and that availability changes with mission logistics.

The action visuals are distinct at every step. Guides use the existing check-in area rather than an overlay, keep result fields intact, support Back / Next / Enter result and honor reduced motion. Sources are available in the guide; images and text are bundled for offline use after the application shell is cached.

## Structured results and graphs

New numeric entries use one fixed unit, **copies/mL**, displayed beside the input. There is no free-text unit or conversion control. A result selector distinguishes numeric values, Not detected, Detected, Detected below quantification limit and Inconclusive. Numeric values must be finite and non-negative; zero remains zero. Invalid or incompatible units are rejected atomically by the save API, even if the UI is bypassed. Selecting a qualitative result ignores any previous numeric draft.

History provides separate saliva / EBV DNA and urine / CMV DNA plots. Only numeric reports explicitly recorded in copies/mL are plotted. Qualitative reports remain text reports, never numeric zeros. Older reports with another unit remain stored and visible as reports but are not plotted on the copies/mL axis. Individual points and hover / keyboard inspection reuse the existing history interaction; they are not connected into an inferred clinical trend across unknown assay methods. Reports should only be compared when the laboratory and assay match.

There is no universal conversion from IU/mL to copies/mL: FDA labeling for [COBAS CMV](https://www.accessdata.fda.gov/cdrh_docs/pdf11/P110037c.pdf) and [Abbott CMV](https://www.accessdata.fda.gov/cdrh_docs/pdf16/P160044C.pdf) provides different assay-specific factors. This interface does not apply either factor to unidentified saliva or urine assays. Reports in another unit must not be copied into the numeric field as if they were copies/mL.
