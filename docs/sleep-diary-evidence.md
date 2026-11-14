# Manual sleep diary

The Sleep quality panel is a custom six-question diary for the most recent main sleep period. It records estimated sleep opportunity, estimated time asleep, sleep-onset latency, awakening count, perceived restedness and daytime impact. It is not a reproduction or scored adaptation of PSQI or RU-SATED.

The [Consensus Sleep Diary paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC3250369/) distinguishes numerical sleep estimates from subjective quality. That supports recording both, without converting a percentage into the astronaut's subjective rating. The current short diary is not the complete Consensus Sleep Diary and has not undergone its own clinical validation.

The calculated indicator is `estimated sleep efficiency = time asleep / time in bed × 100`, rounded to one decimal place. Zero sleep remains zero; absent, invalid or impossible estimates yield no efficiency. The [denominator discussion by Reed and Sacco](https://pmc.ncbi.nlm.nih.gov/articles/PMC4751425/) explains that nonsleep activities in bed can distort this ratio. The prompt should refer to the intended main sleep opportunity and clarify that leisure before trying to sleep is excluded. This app uses the simple stated denominator and does not claim a complete estimate of sleep continuity, stages or physiological quality.

The astronaut's Rested, Somewhat rested or Not rested answer supplies the subjective record. No answer remains missing. Efficiency does not replace it, and no green/red clinical threshold, insomnia diagnosis, treatment or composite sleep-quality score is inferred. A repeated pattern needs qualified review rather than automatic treatment advice.

[University of Pittsburgh instrument guidance](https://www.sleep.pitt.edu/research/measures-and-study-instruments) describes permission and modification conditions for its instruments. Those instruments should only be added after their use conditions, recall periods and exact scoring are addressed.

Validation rejects future observations, negative or out-of-range estimates, fractional awakening counts and combinations where sleep plus latency cannot fit within the stated sleep opportunity. Blank optional values remain absent. Existing values are preserved on validation failure. Sample time and entry time remain distinct; manual source metadata stays with the record.
