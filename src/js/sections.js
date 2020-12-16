(function (Sections, $) {

    Sections.SECTION_HEADER = "#header";
    Sections.SECTION_L_COVID = "#covidPanel";
    Sections.SECTION_L_DISASTERS = "#disasterPanel";
    Sections.SECTION_L_WIKI = "#wikiPanel";
    Sections.SECTION_L_WEATHER = "#weatherPanel";
    Sections.SECTION_L_EXCHANGE = "#exchangeratePanel";
    Sections.SECTION_L_NEWS = "#newsPanel";
    Sections.SECTION_R_REGION = "#cardRegions";
    Sections.SECTION_R_ISO_CODES = "#cardIsoCodes";
    Sections.SECTION_R_COORDS = "#cardCoords";
    Sections.SECTION_R_NAMES = "#cardNames";
    Sections.SECTION_R_LANGUAGES = "#cardLanguages";
    Sections.SECTION_R_TIME = "#cardTime";
    Sections.SECTION_R_CURRENCY = "#cardCurrency";
    Sections.SECTION_R_UNITS = "#cardUnits";
    Sections.SECTION_R_OTHER = "#cardOther";
    Sections.SECTION_R_POPULATION = "#cardPopulation";
    Sections.SECTION_R_AREA = "#cardArea";
    Sections.SECTION_R_AIR = "#cardAir";
    Sections.ALL_SECTIONS = [
        Sections.SECTION_HEADER,
        Sections.SECTION_L_COVID, Sections.SECTION_L_DISASTERS,
        Sections.SECTION_L_WIKI, Sections.SECTION_L_WEATHER,
        Sections.SECTION_L_EXCHANGE, Sections.SECTION_L_NEWS,
        Sections.SECTION_R_REGION, Sections.SECTION_R_ISO_CODES,
        Sections.SECTION_R_COORDS, Sections.SECTION_R_NAMES,
        Sections.SECTION_R_LANGUAGES, Sections.SECTION_R_TIME,
        Sections.SECTION_R_CURRENCY, Sections.SECTION_R_UNITS,
        Sections.SECTION_R_OTHER, Sections.SECTION_R_POPULATION,
        Sections.SECTION_R_AREA, Sections.SECTION_R_AIR
    ];

    class Section {
        constructor(id = "") {
            this.id = id;
            this.isUpdating = false;
            this.stamp = -1;
            this.globalData = null;
            this.countryData = null;
            this.receivedGlobalEndpoints = [];
            this.receivedCountryEndpoints = [];
            this.root = id;
            switch (id) {
                case Sections.SECTION_HEADER:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["opencageforward", "restcountries"];
                    this.updateFunction = setHeaderPanel;
                    this.loadingFunction = Sections.loadHeaderPanel;
                    this.emptyFunction = emptyHeaderPanel;
                    this.root = "#flag";
                    break;
                case Sections.SECTION_L_COVID:
                    this.globalEndpoints = ["coronatrackerglobal"];
                    this.countryEndpoints = ["coronatracker", "coronatrackertrend", "restcountries"];
                    this.updateFunction = setCovidLPanel;
                    this.loadingFunction = loadCovidLPanel;
                    this.emptyFunction = emptyCovidLPanel;
                    this.root = "#mainPanel";
                    break;
                case Sections.SECTION_L_DISASTERS:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["reliefwebdisasters", "reliefwebreports", "restcountries"];
                    this.updateFunction = setDisasterLPanel;
                    this.loadingFunction = loadDisasterLPanel;
                    this.emptyFunction = emptyDisasterLPanel;
                    this.root = "#mainPanel";
                    break;
                case Sections.SECTION_L_WIKI:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["wikimedia", "opencageforward", "restcountries"];
                    this.updateFunction = setWikiLPanel;
                    this.loadingFunction = loadWikiLPanel;
                    this.emptyFunction = emptyWikiLPanel;
                    this.root = "#mainPanel";
                    break;
                case Sections.SECTION_L_NEWS:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["thenews", "restcountries"];
                    this.updateFunction = setNewsLPanel;
                    this.loadingFunction = loadNewsLPanel;
                    this.emptyFunction = emptyNewsLPanel;
                    this.root = "#mainPanel";
                    break;
                case Sections.SECTION_L_WEATHER:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["yahooweather", "restcountries"];
                    this.updateFunction = setWeatherLPanel;
                    this.loadingFunction = loadWeatherLPanel;
                    this.emptyFunction = emptyWeatherLPanel;
                    this.root = "#mainPanel";
                    break;
                case Sections.SECTION_L_EXCHANGE:
                    this.globalEndpoints = ["openexchangerates", "openexchangeratesnames"];
                    this.countryEndpoints = ["opencageforward", "restcountries"];
                    this.updateFunction = setExchangeLPanel;
                    this.loadingFunction = loadExchangeLPanel;
                    this.emptyFunction = emptyExchangeLPanel;
                    this.root = "#mainPanel";
                    break;
                case Sections.SECTION_R_REGION:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["restcountries"];
                    this.updateFunction = setRegionRPanel;
                    this.loadingFunction = loadRegionRPanel;
                    this.emptyFunction = emptyRegionRPanel;
                    break;
                case Sections.SECTION_R_ISO_CODES:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["restcountries"];
                    this.updateFunction = setIsoCodesRPanel;
                    this.loadingFunction = loadIsoCodesRPanel;
                    this.emptyFunction = emptyIsoCodesRPanel;
                    break;
                case Sections.SECTION_R_COORDS:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["opencageforward", "restcountries"];
                    this.updateFunction = setCoordsRPanel;
                    this.loadingFunction = loadCoordsRPanel;
                    this.emptyFunction = emptyCoordsRPanel;
                    break;
                case Sections.SECTION_R_NAMES:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["restcountries"];
                    this.updateFunction = setNamesRPanel;
                    this.loadingFunction = loadNamesRPanel;
                    this.emptyFunction = emptyNamesRPanel;
                    break;
                case Sections.SECTION_R_LANGUAGES:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["restcountries"];
                    this.updateFunction = setLanguagesRPanel;
                    this.loadingFunction = loadLanguagesRPanel;
                    this.emptyFunction = emptyLanguagesRPanel;
                    break;
                case Sections.SECTION_R_TIME:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["opencageforward"];
                    this.updateFunction = setTimeRPanel;
                    this.loadingFunction = loadTimeRPanel;
                    this.emptyFunction = emptyTimeRPanel;
                    break;
                case Sections.SECTION_R_CURRENCY:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["opencageforward"];
                    this.updateFunction = setCurrencyRPanel;
                    this.loadingFunction = loadCurrencyRPanel;
                    this.emptyFunction = emptyCurrencyRPanel;
                    break;
                case Sections.SECTION_R_UNITS:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["opencageforward"];
                    this.updateFunction = setUnitsRPanel;
                    this.loadingFunction = loadUnitsRPanel;
                    this.emptyFunction = emptyUnitsRPanel;
                    break;
                case Sections.SECTION_R_OTHER:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["restcountries"];
                    this.updateFunction = setOtherRPanel;
                    this.loadingFunction = loadOtherRPanel;
                    this.emptyFunction = emptyOtherRPanel;
                    break;
                case Sections.SECTION_R_POPULATION:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["restcountries"];
                    this.updateFunction = setPopulationRPanel;
                    this.loadingFunction = loadPopulationRPanel;
                    this.emptyFunction = emptyPopulationRPanel;
                    break;
                case Sections.SECTION_R_AREA:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["restcountries"];
                    this.updateFunction = setAreaRPanel;
                    this.loadingFunction = loadAreaRPanel;
                    this.emptyFunction = emptyAreaRPanel;
                    break;
                case Sections.SECTION_R_AIR:
                    this.globalEndpoints = [];
                    this.countryEndpoints = ["ambeeair"];
                    this.updateFunction = setAirRPanel;
                    this.loadingFunction = loadAirRPanel;
                    this.emptyFunction = emptyAirRPanel;
                    break;
                default:
                    break;
            }
            this.globalRequired = this.globalEndpoints.length > 0;
            this.countryRequired = this.countryEndpoints.length > 0;
        }
    
        _setUpdated(success = true) {
            this.isUpdating = false;
            this.stamp = -1;
            this.globalData = null;
            this.countryData = null;
            this.receivedGlobalEndpoints = [];
            this.receivedCountryEndpoints = [];
            if (this.root) {
                const root = $(this.root);
                root.removeClass("loading loaded notLoaded");
                root.addClass(success ? "loaded" : "notLoaded");
                root.delay(1000).queue(next => {
                    root.removeClass("loaded notLoaded");
                    next();
                });
            }
        }
    
        _setUpdating() {
            if (!this.isUpdating) {
                this.stamp = Date.now();
            }
            this.isUpdating = true;
            this.globalData = null;
            this.countryData = null;
            this.receivedGlobalEndpoints = [];
            this.receivedCountryEndpoints = [];
            if (this.root) {
                const root = $(this.root);
                root.removeClass("loading loaded notLoaded");
                root.addClass("loading");
            }
            this.loadingFunction();
        }
    
        requiresUpdate() {
            if ($(this.id).is(":hidden")) return false;
            if (this.globalRequired || this.countryRequired) {
                this._setUpdating();
                return true;
            }
            return false;
        }
    
        validateAndUpdate(endpoint = "", data = {}, type = "", stamp = 0, success = true) {
            if (stamp !== this.stamp && this.stamp !== -1){
                return;
            }
            if (type === "global") {
                this.globalData = data;
            } else if (type === "country") {
                this.countryData = data;
            }
            if (this.globalEndpoints.includes(endpoint)) {
                this.receivedGlobalEndpoints.push(endpoint);
                if (!Object.keys(data).includes(endpoint)) {
                    success = false;
                }
            }
            if (this.countryEndpoints.includes(endpoint)) {
                this.receivedCountryEndpoints.push(endpoint);
                if (!Object.keys(data).includes(endpoint)) {
                    success = false;
                }
            }
    
            const globalReady = !this.globalRequired 
                || this.globalEndpoints.every(i => this.receivedGlobalEndpoints.includes(i));
            const countryReady = !this.countryRequired
                || this.countryEndpoints.every(i => this.receivedCountryEndpoints.includes(i));
            if (globalReady && countryReady) {
                if ((this.globalRequired && $.isEmptyObject(this.globalData)) 
                        || (this.countryRequired && $.isEmptyObject(this.countryData))) {
                    success = false;
                }
                try {
                    this.updateFunction({
                        global: this.globalData,
                        country: this.countryData
                    });
                } catch(e) {
                    success = false;
                    this.emptyFunction();
                }
                this._setUpdated(success);
            }
        }
    }

    Sections.get = (id = "") => new Section(id);

    const emptyHtmlL = `<p class="centered">Data not available.<br>Try again in a few minutes.</p>`;
    const loadingHtmlL = `<p class="centered">Finding information...</p>`;
    const emptyHtmlR = `<p>Data not available.<br>Try again in a few minutes.</p>`;
    const loadingHtmlR = `<p>Finding information...</p>`;

    const setHeaderPanel = (data = {global: {}, country: {}}) => {
        const rest = data.country.restcountries;
        const open = data.country.opencageforward;
        $("#flag").attr("src", rest.flagUrl);
        $("#country").html(open.country);
    }

    Sections.loadHeaderPanel = () => {
        $("#flag").attr("src", "");
        $("#country").html("Searching...");
    }

    const emptyHeaderPanel = () => {
        $("#flag").attr("src", "");
        $("#country").html("No country found");
    }

    const setCovidLPanel = (data = {global: {}, country: {}}) => {
        const global = data.global.coronatrackerglobal;
        const rest = data.country.restcountries;
        const country = data.country.coronatracker;
        const trend = data.country.coronatrackertrend;
        let htmlString = `
        <header>
            <h3 class="tHeading1">`+rest.demonym+` COVID-19 Statistics</h3>
        </header>

        <section>
            <h4 class="tHeading3 sticky padTB">Rates</h4>
            <div class="grid gC g3C g3R gGap tC pad card">
                <p class="tHeading6">Infection Fatality</p>
                <p class="tEmph accentNegative">`+country.infectionFatality+`</p>
                <p>Deaths compared to infections</p>
                <p class="tHeading6">Case Fatality</p>
                <p class="tEmph accentNegative">`+country.caseFatality+`</p>
                <p>Deaths compared to resolved cases</p>
                <p class="tHeading6">Recovery</p>
                <p class="tEmph accentPositive">`+country.recovery+`</p>
                <p>Recoveries compared to infections</p>
            </div>
        </section>

        <section>
            <h4 class="tHeading3 sticky padTB">`+rest.demonym+` Cases</h4>
            <div class="grid gR g4C gGap pad card">
                <p></p>
                <p class="tHeading6">Country</p>
                <p class="tHeading6">Per Million</p>
                <p class="tHeading6">% of Global</p>
                <p class="tHeading6">Confirmed Cases</p>
                <p>`+country.confirmed.toLocaleString()+`</p>
                <p>`+country.confirmedMil.toLocaleString()+`</p>
                <p>`+country.confirmedPercent+`</p>
                <p class="tHeading6">Active Cases</p>
                <p>`+country.active.toLocaleString()+`</p>
                <p>`+country.activeMil.toLocaleString()+`</p>
                <p>`+country.activePercent+`</p>
                <p class="tHeading6">Critical Cases</p>
                <p>`+country.critical.toLocaleString()+`</p>
                <p>`+country.criticalMil.toLocaleString()+`</p>
                <p>-</p>
                <p class="tHeading6">Recoveries</p>
                <p>`+country.recoveries.toLocaleString()+`</p>
                <p>`+country.recoveriesMil.toLocaleString()+`</p>
                <p>`+country.recoveriesPercent+`</p>
                <p class="tHeading6">Deaths</p>
                <p>`+country.deaths.toLocaleString()+`</p>
                <p>`+country.deathsMil.toLocaleString()+`</p>
                <p>`+country.deathsPercent+`</p>
            </div>
        </section>

        <section>
            <h4 class="tHeading3 sticky padTB">Global Cases</h4>
            <div class="grid gR g3C gGap pad card">
                <p></p>
                <p class="tHeading6">Global</p>
                <p class="tHeading6">Per Million</p>
                <p class="tHeading6">Confirmed Cases</p>
                <p>`+global.confirmed.toLocaleString()+`</p>
                <p>`+global.confirmedMil.toLocaleString()+`</p>
                <p class="tHeading6">Active Cases</p>
                <p>`+global.active.toLocaleString()+`</p>
                <p>`+global.activeMil.toLocaleString()+`</p>
                <p class="tHeading6">Recoveries</p>
                <p>`+global.recoveries.toLocaleString()+`</p>
                <p>`+global.recoveriesMil.toLocaleString()+`</p>
                <p class="tHeading6">Deaths</p>
                <p>`+global.deaths.toLocaleString()+`</p>
                <p>`+global.deathsMil.toLocaleString()+`</p>
            </div>
        </section>
        `;

        if (!$.isEmptyObject(trend)) {
            htmlString += `
            <section>
                <h4 class="tHeading3 sticky padTB">Recent Trend</h4>
                <div class="grid gR g3C gGap pad card">
                    <p class="tHeading6">Date</p>
                    <p class="tHeading6">Total Confirmed</p>
                    <p class="tHeading6">Total Deaths</p>
            `;
            for (let i = 0; i < 10; i++) {
                const t = trend.trends[i];
                if (!t) break;
                htmlString += `
                <p>`+t.date+`</p>
                <p>`+t.confirmed+`</p>
                <p>`+t.deaths+`</p>
                `;
            }
            htmlString += `
                </div><br>
                <a class="tNote" href="https://www.coronatracker.com/" target="_blank">Source: &copy; CORONATRACKER</a>
            </section>`;
        }
        $("#covidPanel").html(htmlString);
    }

    const loadCovidLPanel = () => {
        let htmlString = `
        <header>
            <h3 class="tHeading1">COVID-19 Statistics</h3>
        </header>
        ` + loadingHtmlL;
        $("#covidPanel").html(htmlString);
    }

    const emptyCovidLPanel = () => {
        let htmlString = `
        <header>
            <h3 class="tHeading1">COVID-19 Statistics</h3>
        </header>
        ` + emptyHtmlL;
        $("#covidPanel").html(htmlString);
    }

    const setWikiLPanel = (data = {global: {}, country: {}}) => {
        const rest = data.country.restcountries;
        const open = data.country.opencageforward;
        const wiki = data.country.wikimedia;
        let htmlString = `
        <header>
            <h3 class="tHeading1">Wiki Links near `+rest.capital+`</h3>
        </header>

        <section>
            <h4 class="tHeading3 sticky padTB">Wikidata</h4>
            <a href="https://www.wikidata.org/wiki/`+open.wikidataKey+`" title="`+rest.capital+` - Wikidata" target="_blank">
                <div class="pad card">
                    <p>`+rest.capital+`</p>
                    <p>https://www.wikidata.org/wiki/`+open.wikidataKey+`</p>
                </div>
            </a><br>
            <a class="tNote" href="https://wikidata.org/" target="_blank">Source: &copy; WikiData</a>
        </section>

        <section>
            <h4 class="tHeading3 sticky padTB">Wikipedia</h4>
            <ul>
        `;
        
        for (let i = 0; i < 10; i++) {
            const t = wiki.pages[i];
            if (!t) break;
            htmlString += `
            <li>
                <a title="`+t.title+` - Wikipedia" href="`+t.pageUrl+`" target="_blank">
                    <article>
                        <div class="grid gMinFillC gGapBig pad card">
                            <img class="iResult" src="`+t.thumbnailUrl+`" alt="No image">
                            <div class="gcTop">
                                <h5 class="tHeading5">`+t.title+`</h5>
                                <p>"`+t.extract+`"</p>
                            </div>
                        </div>
                    </article>
                </a>
            </li>
            `;
            if (i < 9) htmlString += "<br>";
        }
        htmlString += `
            </ul><br>
            <a class="tNote" href="https://en.wikipedia.org/" target="_blank">Source: &copy; Wikipedia</a>
        </section>`;
        $("#wikiPanel").html(htmlString);
    }

    const loadWikiLPanel = () => {
        let htmlString = `
        <header>
            <h3 class="tHeading1">Wikipedia Links</h3>
        </header>
        ` + loadingHtmlL;
        $("#wikiPanel").html(htmlString);
    }

    const emptyWikiLPanel = () => {
        let htmlString = `
        <header>
            <h3 class="tHeading1">Wikipedia Links</h3>
        </header>
        ` + emptyHtmlL;
        $("#wikiPanel").html(htmlString);
    }

    const setDisasterLPanel = (data = {global: {}, country: {}}) => {
        const rest = data.country.restcountries;
        const disasters = data.country.reliefwebdisasters;
        const reports = data.country.reliefwebreports;
        let htmlString = `
        <header>
            <h3 class="tHeading1">`+rest.demonym+` Disasters</h3>
        </header>

        <section>
            <h4 class="tHeading3 sticky padTB">Disasters</h4>
            <ul>
        `;
        for (let i = 0; i < 5; i++) {
            const t = disasters.disasters[i];
            if (!t) break;
            const glide = Util.getGlideEquivalent(t.glide);
            htmlString += `
            <li>
                <a title="`+t.name+`" href="`+t.url+`" target="_blank">
                    <article class="pad card">
                        <svg class="icon floatR"><use xlink:href="img/icons.svg#`+glide+`"></use></svg>
                        <h5 class="tHeading5">`+t.name+`</h5><br>
                        <p>`+t.extract+`</p>
                        <p>`+t.type+" - "+t.status+`</p>
                        <p>`+t.date+`</p>
                    </article>
                </a>
            </li>
            `;
            if (i < 4) htmlString += "<br>";
        }
        htmlString += `
            </ul>
        </section>
        <section>
            <h4 class="tHeading3 sticky padTB">Reports</h4>
            <ul>`;
        for (let i = 0; i < 5; i++) {
            const t = reports.reports[i];
            if (!t) break;
            htmlString += `
            <li>
                <a title="`+t.name+`" href="`+t.url+`" target="_blank">
                    <article class="pad card">
                        <h5 class="tHeading5">`+t.name+`</h5><br>
                        <p>Source - `+t.source+`</p>
                        <p>`+t.theme+" - "+t.format+`</p>
                        <p>`+t.date+`</p>
                    </article>
                </a>
            </li>
            `;
            if (i < 4) htmlString += "<br>";
        }
        htmlString += `
            </ul><br>
            <a class="tNote" href="https://reliefweb.int/" target="_blank">Source: &copy; ReliefWeb</a>
        </section>`;
        $("#disasterPanel").html(htmlString);
    }

    const loadDisasterLPanel = () => {
        let htmlString = `
        <header>
            <h3 class="tHeading1">Disasters</h3>
        </header>
        ` + loadingHtmlL;
        $("#disasterPanel").html(htmlString);
    }

    const emptyDisasterLPanel = () => {
        let htmlString = `
        <header>
            <h3 class="tHeading1">Disasters</h3>
        </header>
        ` + emptyHtmlL;
        $("#disasterPanel").html(htmlString);
    }

    const setWeatherLPanel = (data = {global: {}, country: {}}) => {
        const rest = data.country.restcountries;
        const yahoo = data.country.yahooweather.now;
        const date = new Date(yahoo.date * 1000);
        let htmlString = `
        <header>
            <h3 class="tHeading1">`+rest.capital+` Weather</h3>
        </header>

        <article>
            <h4 class="tHeading3 sticky padTB">Current Observation</h4>
            <div class="card pad">
                <header>
                    <div class="grid gMinFillC">
                        <img class="iLarge flipX mSides" src="`+yahoo.weather.image+`"/>
                        <div>
                            <p>`+Util.getDayString(date.getDay())+`, `+Util.getDateString(date.getDate())+`</p>
                            <h5>`+yahoo.city+`, `+yahoo.region+`</h5>
                            <p class="Tlabel tEmph">`+yahoo.weather.name+`</p>
                            <p class="tEmph">`+yahoo.weather.temperatureC+`&deg;C</p>
                        </div>
                    </div>
                </header><br>

                <section class="padT">
                    <h5 class="tHeading6 tC bT padT">Wind</h5>
                    <div class="grid gC g3C g2R gCenter tC">
                        <svg class="icon" style="rotate: `+yahoo.windDirectionDeg+`deg;"><use xlink:href="img/icons.svg#windDirection"></use></svg>
                        <p class="tLabel">`+Util.degreesToCardinal(yahoo.windDirectionDeg)+`</p>
                        <svg class="icon"><use xlink:href="img/icons.svg#windSpeed"></use></svg>
                        <p class="tLabel">`+yahoo.windSpeedKph+` kph</p>
                        <svg class="icon"><use xlink:href="img/icons.svg#windChill"></use></svg>
                        <p class="tLabel">`+yahoo.windChillC+`&deg;C</p>
                    </div>
                </section>
                
                <section class="padT">
                    <h5 class="tHeading6 tC bT padT">Atmosphere</h5>
                    <div class="grid gC g3C g2R gCenter tC">
                        <svg class="icon"><use xlink:href="img/icons.svg#humidity"></use></svg>
                        <p class="tLabel">`+yahoo.humidityPerc+`%</p>
                        <svg class="icon"><use xlink:href="img/icons.svg#pressure"></use></svg>
                        <p class="tLabel">`+yahoo.pressureMbar+` mbar</p>
                        <svg class="icon"><use xlink:href="img/icons.svg#visibility"></use></svg>
                        <p class="tLabel">`+yahoo.visibilityKm+` km</p>
                    </div>
                </section>
                
                <section class="padT">
                    <h5 class="tHeading6 tC bT padT">Twilight</h5>
                    <div class="grid gC g2C g2R gCenter tC">
                        <svg class="icon gEnd"><use xlink:href="img/icons.svg#sunrise"></use></svg>
                        <p class="tLabel">`+yahoo.sunrise+`</p>
                        <svg class="icon gEnd"><use xlink:href="img/icons.svg#sunset"></use></svg>
                        <p class="tLabel">`+yahoo.sunset+`</p>
                    </div>
                </section>
            </div>
        </article>
        
        <article>
            <h4 class="tHeading3 sticky padTB">Daily Forecast</h4>
            <ol>
        `;
        const forecasts = data.country.yahooweather.forecasts;
        for (let i = 0; i < 7; i++) {
            const t = forecasts[i];
            if (!t) break;
            htmlString += `
            <li>
                <article class="grid gC gWeatherC card pad">
                    <img class="iMedium gcStart" src="`+t.image+`"/>
                    <div>
                        <h5 class="tHeading6">`+t.day+`</h5>
                        <p>`+t.name+`</p>
                    </div>
                    <svg class="icon"><use xlink:href="img/icons.svg#tempHigh"></use></svg>
                    <p class="tLabel">`+t.highC+`&deg;C</p>
                    <svg class="icon"><use xlink:href="img/icons.svg#tempLow"></use></svg>
                    <p class="tLabel">`+t.lowC+`&deg;C</p>
                </article>
            </li>
            `;
            if (i < 6) htmlString += "<br>";
        }
        htmlString += `
            </ol><br>
            <a href="https://www.yahoo.com/?ilc=401" target="_blank"><img src="https://poweredby.yahoo.com/white.png"/></a> 
        </article>`;
        $("#weatherPanel").html(htmlString);
    }

    const loadWeatherLPanel = () => {
        let htmlString = `
        <header>
            <h3 class="tHeading1">Weather</h3>
        </header>
        ` + loadingHtmlL;
        $("#weatherPanel").html(htmlString);
    }

    const emptyWeatherLPanel = () => {
        let htmlString = `
        <header>
            <h3 class="tHeading1">Weather</h3>
        </header>
        ` + emptyHtmlL;
        $("#weatherPanel").html(htmlString);
    }

    const setExchangeLPanel = (data = {global: {}, country: {}}) => {
        const rest = data.country.restcountries;
        const rates = data.global.openexchangerates.conversions;
        const names = data.global.openexchangeratesnames.names;
        const open = data.country.opencageforward;
        const subunitString = open.currencySubunit ? " / " + open.currencySubunit : "";
        let formatString = "1" + open.currencySeparator + "000";
        if (open.currencyDecimal && open.currencyRatio && !open.currencyFormat) {
            formatString += open.currencyDecimal + (open.currencyRatio + "").substr(1);
        }
        if (open.currencySymbolFirst) {
            formatString = open.currencySymbol + " " + formatString;
        } else {
            formatString += " " + open.currencySymbol;
        }
        let htmlString = `
        <header>
            <h3 class="tHeading1">Exchange Rates</h3>
        </header>

        <section>
            <h4 class="tHeading3 sticky padTB">`+rest.demonym+` Currency</h4>
            <div class="card pad">
                <p>`+open.currencyUnit+` (`+open.currencyIso+`)`+subunitString+`</p>
                <p>Format: `+formatString+`</p>
            </div>
        </section>

        <article>
            <h4 class="tHeading3 sticky padTB">Common Conversions</h4>
            <div class="grid gR gExchangeC gGap card pad">
                <p class="tHeading6">Code</p>
                <p class="tHeading6">Currency</p>
                <p class="tHeading6">Conversion</p>
        `;
        const constants = ["USD", "EUR", "JPY", "GBP", "AUD", "CAD", "CHF", "CNH", "HKD", "NZD"];
        const countryIso = open.currencyIso;
        const countryRate = rates[countryIso];
        for (let i = 0; i < constants.length; i++) {
            if (constants[i] === countryIso) continue;
            const t = constants[i];
            const rate = Util.roundTo(1 / rates[t] * countryRate, 4);
            const inv = Util.roundTo(1 / rate, 4);
            htmlString += `
            <p>`+t+`</p>
            <p>`+names[t]+`</p>
            <div>
                <p>1 `+t+` : `+countryIso+` `+rate+`</p>
                <p>1 `+countryIso+` : `+t+` `+inv+`</p>
            </div>
            `;
        }
        htmlString += `
            </div><br>
            <a class="tNote" href="https://openexchangerates.org/" target="_blank">Source: &copy; OpenExchangeRates</a>
        </article>`;
        $("#exchangeratePanel").html(htmlString);
    }

    const loadExchangeLPanel = () => {
        let htmlString = `
        <header>
            <h3 class="tHeading1">Exchange Rates</h3>
        </header>
        ` + loadingHtmlL;
        $("#exchangePanel").html(htmlString);
    }

    const emptyExchangeLPanel = () => {
        let htmlString = `
        <header>
            <h3 class="tHeading1">Exchange Rates</h3>
        </header>
        ` + emptyHtmlL;
        $("#exchangePanel").html(htmlString);
    }

    const setNewsLPanel = (data = {global: {}, country: {}}) => {
        const rest = data.country.restcountries;
        const news = data.country.thenews.articles;
        let htmlString = `
        <header>
            <h3 class="tHeading1">`+rest.capital+` News Articles</h3>
        </header>

        <section>
            <h4 class="tHeading3 sticky padTB">Local News</h4>
            <ul>
        `;
        for (let i = 0; i < 10; i++) {
            const t = news[i];
            if (!t) break;
            htmlString += `
            <li>
                <a title="`+t.title+` - The News" href="`+t.link+`" target="_blank">
                    <article class="grid gMinFillC gGapBig pad card">
                        <img class="iResult" src="`+t.image+`" alt=" ">
                        <div class="gcTop">
                            <h5 class="tHeading5">`+t.title+`</h5>
                            <p>"`+t.extract+`"</p>
                        </div>
                    </article>
                </a>
            </li>
            `;
            if (i < 9) htmlString += "<br>";
        }
        htmlString += `
            </ul><br>
            <a class="tNote" href="https://thenewsapi.com/" target="_blank">Source: &copy; TheNewsAPI.com</a>
        </section>`;
        $("#newsPanel").html(htmlString);
    }

    const loadNewsLPanel = () => {
        let htmlString = `
        <header>
            <h3 class="tHeading1">Local News Articles</h3>
        </header>
        ` + loadingHtmlL;
        $("#newsPanel").html(htmlString);
    }

    const emptyNewsLPanel = () => {
        let htmlString = `
        <header>
            <h3 class="tHeading1">Local News Articles</h3>
        </header>
        ` + emptyHtmlL;
        $("#newsPanel").html(htmlString);
    }

    const setRegionRPanel = (data = {global: {}, country: {}}) => {
        const rest = data.country.restcountries;
        let htmlString = `
        <h3 class="tHeading6">Regions</h3>
        <p>Capital: `+rest.capital+`</p>
        <p>Region: `+rest.subregion+`</p>
        <p>Bloc: `+rest.regionalBlocs[0].acronym+`</p>
        `;
        $("#cardRegions").html(htmlString);
    }

    const loadRegionRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Regions</h3>
        ` + loadingHtmlR;
        $("#cardRegions").html(htmlString);
    }

    const emptyRegionRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Regions</h3>
        ` + emptyHtmlR;
        $("#cardRegions").html(htmlString);
    }

    const setIsoCodesRPanel = (data = {global: {}, country: {}}) => {
        const rest = data.country.restcountries;
        let htmlString = `
        <h3 class="tHeading6">Codes</h3>
        <p>Alpha-2: `+rest.isoA2+`</p>
        <p>Alpha-3: `+rest.isoA3+`</p>
        <p>Numeric: `+rest.isoN+`</p>
        `;
        $("#cardIsoCodes").html(htmlString);
    }

    const loadIsoCodesRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Codes</h3>
        ` + loadingHtmlR;
        $("#cardIsoCodes").html(htmlString);
    }

    const emptyIsoCodesRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Codes</h3>
        ` + emptyHtmlR;
        $("#cardIsoCodes").html(htmlString);
    }

    const setCoordsRPanel = (data = {global: {}, country: {}}) => {
        const open = data.country.opencageforward;
        const rest = data.country.restcountries;
        let htmlString = `
        <h3 class="tHeading6">`+rest.capital+`</h3>
        <p>Lat: `+Util.roundTo(open.cityLat, 4)+`</p>
        <p>Long: `+Util.roundTo(open.cityLng, 4)+`</p>
        `;
        $("#cardCoords").html(htmlString);
    }

    const loadCoordsRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Coordinates</h3>
        ` + loadingHtmlR;
        $("#cardCoords").html(htmlString);
    }

    const emptyCoordsRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Coordinates</h3>
        ` + emptyHtmlR;
        $("#cardCoords").html(htmlString);
    }

    const setNamesRPanel = (data = {global: {}, country: {}}) => {
        const rest = data.country.restcountries;
        let htmlString = `
            <h3 class="tHeading6">Names</h3>
            <p>Demonym: `+rest.demonym+`</p>
            <p>Native: `+rest.nativeName+`</p>
        `
        $("#cardNames").html(htmlString);
    }

    const loadNamesRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Names</h3>
        ` + loadingHtmlR;
        $("#cardNames").html(htmlString);
    }

    const emptyNamesRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Names</h3>
        ` + emptyHtmlR;
        $("#cardNames").html(htmlString);
    }

    const setLanguagesRPanel = (data = {global: {}, country: {}}) => {
        const rest = data.country.restcountries;
        let htmlString = '<h3 class="tHeading6">Languages</h3>';
        for (let i = 0; i < rest.languages.length; i++) {
            const lang = rest.languages[i];
            htmlString += "<p>"+lang.name+" - "+lang.isoA2+"/"+lang.isoA3+"</p>";
        }
        $("#cardLanguages").html(htmlString);
    }

    const loadLanguagesRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Languages</h3>
        ` + loadingHtmlR;
        $("#cardLanguages").html(htmlString);
    }

    const emptyLanguagesRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Languages</h3>
        ` + emptyHtmlR;
        $("#cardLanguages").html(htmlString);
    }

    const setTimeRPanel = (data = {global: {}, country: {}}) => {
        const open = data.country.opencageforward;
        const time = new Date();
        time.setHours(time.getHours() + parseInt(open.timezoneOffset.substr(0, 3)));
        let htmlString = `
            <h3 class="tHeading6">Time</h3>
            <p>`+open.timezone+` - UTC`+open.timezoneOffset+`</p>
            <p>`+time.toTimeString().substr(0, 5)+` `+open.timezoneShort+`</p>
        `
        $("#cardTime").html(htmlString);
    }

    const loadTimeRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Time</h3>
        ` + loadingHtmlR;
        $("#cardTime").html(htmlString);
    }

    const emptyTimeRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Time</h3>
        ` + emptyHtmlR;
        $("#cardTime").html(htmlString);
    }

    const setCurrencyRPanel = (data = {global: {}, country: {}}) => {
        const open = data.country.opencageforward;
        const subunitString = open.currencySubunit ? " / " + open.currencySubunit : "";
        let formatString = "1" + open.currencySeparator + "000";
        if (open.currencyDecimal && open.currencyRatio && !open.currencyFormat) {
            formatString += open.currencyDecimal + (open.currencyRatio + "").substr(1);
        }
        if (open.currencySymbolFirst) {
            formatString = open.currencySymbol + " " + formatString;
        } else {
            formatString += " " + open.currencySymbol;
        }
        let htmlString = `
            <h3 class="tHeading6">Currency</h3>
            <p>`+open.currencyUnit+` (`+open.currencyIso+`)`+subunitString+`</p>
            <p>Format: `+formatString+`</p>
        `
        $("#cardCurrency").html(htmlString);
    }

    const loadCurrencyRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Currency</h3>
        ` + loadingHtmlR;
        $("#cardCurrency").html(htmlString);
    }

    const emptyCurrencyRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Currency</h3>
        ` + emptyHtmlR;
        $("#cardCurrency").html(htmlString);
    }

    const setUnitsRPanel = (data = {global: {}, country: {}}) => {
        const open = data.country.opencageforward;
        const unit = open.isoA2 === "LR" || open.isoA2 === "MM" || open.isoA2 === "US" ? "imperial" : "metric";
        let htmlString = `
            <h3 class="tHeading6">Units</h3>
            <p>Mainly `+unit+`</p>
            <p>Roads: `+open.drivingUnits+` (`+open.drivingSide+` side)</p>
        `
        $("#cardUnits").html(htmlString);
    }

    const loadUnitsRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Units</h3>
        ` + loadingHtmlR;
        $("#cardUnits").html(htmlString);
    }

    const emptyUnitsRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Units</h3>
        ` + emptyHtmlR;
        $("#cardUnits").html(htmlString);
    }

    const setOtherRPanel = (data = {global: {}, country: {}}) => {
        const rest = data.country.restcountries;
        let htmlString = `
            <h3 class="tHeading6">Other</h3>
            <p>Calling Code: `+rest.callingCodes[0]+`</p>
            <p>Main Domain: `+rest.webDomain+`</p>
        `
        $("#cardOther").html(htmlString);
    }

    const loadOtherRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Other</h3>
        ` + loadingHtmlR;
        $("#cardOther").html(htmlString);
    }

    const emptyOtherRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Other</h3>
        ` + emptyHtmlR;
        $("#cardOther").html(htmlString);
    }

    const setPopulationRPanel = (data = {global: {}, country: {}}) => {
        const rest = data.country.restcountries;
        let htmlString = `
            <h3 class="tHeading6">Population</h3>
            <p>`+rest.population.toLocaleString()+`</p>
        `
        $("#cardPopulation").html(htmlString);
    }

    const loadPopulationRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Population</h3>
        ` + loadingHtmlR;
        $("#cardPopulation").html(htmlString);
    }

    const emptyPopulationRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Population</h3>
        ` + emptyHtmlR;
        $("#cardPopulation").html(htmlString);
    }

    const setAreaRPanel = (data = {global: {}, country: {}}) => {
        const rest = data.country.restcountries;
        let htmlString = `
            <h3 class="tHeading6">Land Area</h3>
            <p>`+rest.areaKm.toLocaleString()+` km<sup>2</sup></p>
        `
        $("#cardArea").html(htmlString);
    }

    const loadAreaRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Land Area</h3>
        ` + loadingHtmlR;
        $("#cardArea").html(htmlString);
    }

    const emptyAreaRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Land Area</h3>
        ` + emptyHtmlR;
        $("#cardArea").html(htmlString);
    }

    const setAirRPanel = (data = {global: {}, country: {}}) => {
        const ambee = data.country.ambeeair;
        let htmlString = `
            <h3 class="tHeading6">Air Quality</h3>
            <p>AQI: `+ambee.aqi+`</p>
            <p>NO<sub>2</sub>: `+ambee.no2+`</p>
            <p>SO<sub>2</sub>: `+ambee.so2+`</p>
            <p>PM10: `+ambee.pm10+`</p>
            <p>PM2.5: `+ambee.pm25+`</p>
            <p>Ozone: `+ambee.ozone+`</p>
            <p>Category: `+ambee.category+`</p>
            <a class="tNote" href="https://www.getambee.com/" target="_blank">Source: &copy; Ambee</a>
        `
        $("#cardAir").html(htmlString);
    }

    const loadAirRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Air Quality</h3>
        ` + loadingHtmlR;
        $("#cardAir").html(htmlString);
    }

    const emptyAirRPanel = () => {
        let htmlString = `
        <h3 class="tHeading6">Air Quality</h3>
        ` + emptyHtmlR;
        $("#cardAir").html(htmlString);
    }

}(window.Sections = window.Sections || {}, jQuery));