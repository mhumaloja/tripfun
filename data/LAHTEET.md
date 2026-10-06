# Aluerajojen lähteet

TripFun-auton sovellus lataa maan paketin (`<MAA>.json`), kun auto saapuu maahan, ja tunnistaa sen avulla
kunnan ylityksen. Paketit tuotetaan työkalulla `tools/alueet.py` (auton sovelluksen repossa), ja ne on
yksinkertaistettu noin 50 metrin tarkkuuteen.

| Paketti | Lähde | Lisenssi |
|---|---|---|
| `FI.json` | Tilastokeskus, kuntapohjaiset tilastointialueet: kunnat ja maakunnat 1:1 000 000, 2026 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fi) |
| `EE.json` | Maa- ja Ruumiamet (Viro), haldus- ja asustusjaotus: omavalitsused, 12/2024 | [Maa- ja Ruumiameti avaandmete litsents](https://geoportaal.maaruum.ee/avaandmete-litsents) ([englanniksi](https://geoportaal.maaruum.ee/opendata-licence)): lähdemaininta "Maa- ja Ruumiamet, haldus- ja asustusjaotus 12/2024" näkyy sovelluksessa |
| `SE.json` | SCB (Statistiska centralbyrån), Digitala gränser: kommuner och län 2025 (tilastokäyttöön yksinkertaistettu) | [CC0](https://creativecommons.org/publicdomain/zero/1.0/deed.fi); suositeltu maininta "Källa: SCB" |
| `NO.json` | Kartverket, Administrative enheter kommuner 12/2025 (fylkenimet jaon 1.1.2024 mukaan) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fi) |
| `GB.json` | Office for National Statistics, Local Authority Districts (May 2026) Boundaries UK BGC ja alue-/maahaku WD26–CTRY26. Contains OS data © Crown copyright and database right 2026 | [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/) |

Maiden ulkorajat (sovelluksen mukana): Natural Earth, public domain.

## Matkaopas (`opas-<MAA>.<kieli>.json`, `vaakunat/`)

Tuotetaan työkalulla `tools/opas.py` (auton sovelluksen repossa) kielille fi, en, sv ja nb (norjan tiivistelmät no.wikipedia.org:sta). Kunta yhdistetään Wikidataan virallisella kuntakoodilla. Jos kunnalla ei ole artikkelia kielellä, esittelyssä on vain Wikidatan tiedot.

| Sisältö | Lähde | Lisenssi |
|---|---|---|
| Tiivistelmä (1–2 lausetta) | Wikipedia sovelluksen kielellä; artikkelin osoite kentässä `wikipedia` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fi) |
| Väkiluku, pinta-ala, perustamisvuosi, henkilöt | Wikidata | CC0 |
| Vaakunat (`vaakunat/<MAA>/<koodi>.png`) | Wikimedia Commons; tiedostokohtainen lisenssi ja lähde kentässä `vaakuna` | tiedostokohtainen (suomalaiset vaakunat pääosin public domain) |

Henkilöt: kunnassa syntyneet, kolme eniten Wikipedia-artikkeleita omaavaa; rikoksesta tuomitut (Wikidata P1399) suodatettu pois. Lista tarkistetaan PR:ssä ennen julkaisua.

## Bongausbingo (`bingo.<kieli>.json`)

Käsin koottu tienvarsipakka, käännetty kielille fi, en, sv ja nb (samat kohteet samassa järjestyksessä) (emoji ja nimi, valinnaisesti `maat` ja `kuukaudet`; puuttuva kenttä = kaikki). Ei ulkoista lähdettä, [CC0](https://creativecommons.org/publicdomain/zero/1.0/deed.fi). Tarkistetaan työkalulla `tools/bingo.py` (auton sovelluksen repossa): jokaiselle maan ja kuukauden yhdistelmälle vähintään 16 kohdetta 4×4-ruudukkoon.
