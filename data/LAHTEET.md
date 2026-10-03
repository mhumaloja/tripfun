# Aluerajojen lähteet

TripFun-auton sovellus lataa maan paketin (`<MAA>.json`), kun auto saapuu maahan, ja tunnistaa sen avulla
kunnan ylityksen. Paketit tuotetaan työkalulla `tools/alueet.py` (auton sovelluksen repossa), ja ne on
yksinkertaistettu noin 50 metrin tarkkuuteen.

| Paketti | Lähde | Lisenssi |
|---|---|---|
| `FI.json` | Tilastokeskus, kuntapohjaiset tilastointialueet: kunnat ja maakunnat 1:1 000 000, 2026 | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fi) |
| `EE.json` | Maa- ja Ruumiamet (Viro), haldus- ja asustusjaotus: omavalitsused, 12/2024 | Maa- ja Ruumiametin avoimen datan lisenssi (nimeäminen) |

Maiden ulkorajat (sovelluksen mukana): Natural Earth, public domain.
