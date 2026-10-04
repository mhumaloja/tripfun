# Aluerajojen lähteet

TripFun-auton sovellus lataa maan paketin (`<MAA>.json`), kun auto saapuu maahan, ja tunnistaa sen avulla
kunnan ylityksen. Paketit tuotetaan työkalulla `tools/alueet.py` (auton sovelluksen repossa), ja ne on
yksinkertaistettu noin 50 metrin tarkkuuteen.

| Paketti | Lähde | Lisenssi |
|---|---|---|
| `FI.json` | Tilastokeskus, kuntapohjaiset tilastointialueet: kunnat ja maakunnat 1:1 000 000, 2026 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fi) |
| `EE.json` | Maa- ja Ruumiamet (Viro), haldus- ja asustusjaotus: omavalitsused, 12/2024 | Maa- ja Ruumiametin avoimen datan lisenssi (nimeäminen) |

Maiden ulkorajat (sovelluksen mukana): Natural Earth, public domain.

## Matkaopas (`opas-<MAA>.<kieli>.json`, `vaakunat/`)

Tuotetaan työkalulla `tools/opas.py` (auton sovelluksen repossa). Kunta yhdistetään Wikidataan virallisella kuntakoodilla.

| Sisältö | Lähde | Lisenssi |
|---|---|---|
| Tiivistelmä (1–2 lausetta) | Wikipedia sovelluksen kielellä; artikkelin osoite kentässä `wikipedia` | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.fi) |
| Väkiluku, pinta-ala, perustamisvuosi, henkilöt | Wikidata | CC0 |
| Vaakunat (`vaakunat/<MAA>/<koodi>.png`) | Wikimedia Commons; tiedostokohtainen lisenssi ja lähde kentässä `vaakuna` | tiedostokohtainen (suomalaiset vaakunat pääosin public domain) |

Henkilöt: kunnassa syntyneet, kolme eniten Wikipedia-artikkeleita omaavaa; rikoksesta tuomitut (Wikidata P1399) suodatettu pois. Lista tarkistetaan PR:ssä ennen julkaisua.
