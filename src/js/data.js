(function (Data, $) {

    const EXPIRY_BUFFER = 8000;
    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    const GLOBAL_ENDPOINTS = [
        "coronatrackerglobal",
        "coronatrackertop",
        "openexchangerates",
        "openexchangeratesnames",
        "opencagereverse",
        "reliefwebglobal"
    ]
    const COUNTRY_ENDPOINTS = [
        "ambeeair",
        "arcgisgeometry",
        "coronatracker",
        "coronatrackertrend",
        "opencageforward",
        "reliefwebdisasters",
        "reliefwebreports",
        "restcountries",
        "thenews",
        "wikimedia",
        "yahooweather"
    ]
    const GLOBAL_EXPIRIES = {
        coronatrackerglobal: DAY_IN_MS / 4,
        coronatrackertop: DAY_IN_MS / 4,
        opencagereverse: 0,
        openexchangerates: DAY_IN_MS / 6,
        openexchangeratesnames: -1,
        reliefwebglobal: DAY_IN_MS / 8
    }
    const COUNTRY_EXPIRIES = {
        ambeeair: DAY_IN_MS * 7,
        arcgiscentroid: -1,
        arcgisgeometry: -1,
        coronatracker: DAY_IN_MS / 4, 
        coronatrackertrend: DAY_IN_MS / 4,
        opencageforward: -1,
        reliefwebdisasters: DAY_IN_MS,
        reliefwebreports: DAY_IN_MS,
        restcountries: DAY_IN_MS,
        thenews: DAY_IN_MS / 4,
        wikimedia: -1,
        yahooweather: DAY_IN_MS / 24
    }
    const EVENT_SERVER_ERROR = "server";
    const EVENT_AJAX_ERROR = "ajax";
    const EVENT_EMPTY_REQUEST = "request";
    const EVENT_DATA_EXISTED = "existed";
    const EVENT_DATA_ADDED = "added";
    const EVENT_DATA_UPDATED = "updated";
    const EVENT_ENDPOINT_RESPONSE_MISSING = "missing";
    const EVENT_HARVEST_FAILED = "harvest";
    const EVENT_NOT_UPDATED = "notUpdated";
    const EVENT_HARVEST_INCOMPLETE = "incomplete";

    Storage.prototype.setObject = function (key, value) {
        this.setItem(key, JSON.stringify(value));
    }

    Storage.prototype.getObject = function (key) {
        let value = this.getItem(key);
        return value && JSON.parse(value);
    }

    const dataArray = {};

    Data.getCountry = async (isoA2 = "", lat = 0, lng = 0) => {
        const global = await Data.getGlobalData();
        if (isoA2) {
            return await getCountryData(isoA2);
        } else {
            return await global.requestData(
                ["opencagereverse"],
                async (data) => {
                    countryCode = data.opencagereverse.lastIsoA2 || "";
                    if (countryCode) {
                        return await getCountryData(countryCode);
                    } else {
                        throw "error";
                    }
                },
                params = {lat: lat, lng: lng}
            );
        }
    }

    Data.getGlobalData = async () => {
        if (!dataArray["GLOBAL"]) {
            global = new GlobalData();
            dataArray["GLOBAL"] = global;
            await global.init();
        }
        return dataArray["GLOBAL"];
    }

    const getCountryData = async isoA2 => {
        if (!dataArray[isoA2]) {
            country = new CountryData(isoA2);
            dataArray[isoA2] = country;
            await country.init(isoA2);
        }
        return dataArray[isoA2];
    }







    class GlobalData {

        constructor() {
            this.id = "GLOBAL";
            this.data = {};
            this.expiries = {};
            this.isUpdating = false;
        }

        async init() {
            const cachedObject = localStorage.getObject(this.id);
            if (cachedObject) {
                Object.assign(this, cachedObject);
            } 
            if (!this.data.countries || $.isEmptyObject(this.data.countries)) {
                const result = await Util.ajaxGet("data/countries.json");
                if (!result.error) {
                    this.data.countries = result.data;
                }
            }
        }

        // await not necessary
        async requestData(endpoints = [], onComplete = (data, event) => {}, params = {}) {
            if (!endpoints.length) {
                return onComplete(this.data, [EVENT_EMPTY_REQUEST]);
            }
            this.isUpdating = true;
            let events = [];

            const invalidEndpoints = [];
            endpoints.forEach(i => {
                if (this.__requiresUpdate(i)) {
                    invalidEndpoints.push(i);
                }
            });

            let fetchEvents = [];
            if (invalidEndpoints.length) {
                fetchEvents = await this.__fetchDataAndApply(invalidEndpoints, params);
            } else {
                events.push(EVENT_NOT_UPDATED);
            }

            Util.pushUnique(events, fetchEvents);
            console.log("global events", events);
            console.log("endpoints", endpoints);
            console.log("invalid endpoints", invalidEndpoints);
            this.isUpdating = false;
            return onComplete(this.data, events);
        }

        async __fetchDataAndApply(endpoints = [], params = {}) {
            let events = [];
            let ajax;
            try {
                ajax = await Util.ajaxPost("php/request.php", {
                    endpoints: endpoints, params: params});
            } catch(e) {
                console.log(e);
            }

            if (!ajax) {
                return [EVENT_AJAX_ERROR];
            }
            if (ajax.error) {
                events.push(EVENT_SERVER_ERROR);
            }
            for (let i = 0; i < endpoints.length; i++) {
                const current = endpoints[i];
                if (!ajax.data[current]) {
                    events.push(EVENT_ENDPOINT_RESPONSE_MISSING);
                    continue;
                }
                let harvest = this.__harvestData(current, ajax.data[current]);
                if (!harvest) {
                    events.push(EVENT_HARVEST_INCOMPLETE);
                    continue;
                }
                if (!this.data[current] || $.isEmptyObject(this.data[current])) {
                    this.data[current] = {};
                    events.push(EVENT_DATA_ADDED);
                } else {
                    events.push(EVENT_DATA_EXISTED);
                }
                if (harvest) {
                    Object.assign(this.data[current], harvest);
                    events.push(EVENT_DATA_UPDATED);
                    const expiry = GLOBAL_EXPIRIES[current];
                    this.expiries[current] = expiry < 0 ? -1 : Date.now() + expiry;
                } else {
                    events.push(EVENT_HARVEST_FAILED);
                }
            }
            this.__cache();
            return events;
        }

        __harvestData(endpoint, result) {
            const data = {errors: []};
            let r;
            switch (endpoint) {
                case "coronatrackerglobal":
                    r = result;
                    const globalPopMod = (r.totalConfirmed / r.totalCasesPerMillionPop);
                    apply(data, "confirmed", () => r.totalConfirmed.toLocaleString());
                    apply(data, "active", () => r.totalActiveCases.toLocaleString());
                    apply(data, "recoveries", () => r.totalRecovered.toLocaleString());
                    apply(data, "deaths", () => r.totalDeaths.toLocaleString());
                    apply(data, "confirmedRaw", () => r.totalConfirmed);
                    apply(data, "activeRaw", () => r.totalActiveCases);
                    apply(data, "recoveriesRaw", () => r.totalRecovered);
                    apply(data, "deathsRaw", () => r.totalDeaths);
                    apply(data, "confirmedMil", () => r.totalCasesPerMillionPop.toLocaleString());
                    apply(data, "activeMil", () => Math.round(r.totalActiveCases / globalPopMod).toLocaleString());
                    apply(data, "recoveriesMil", () => Math.round(r.totalRecovered / globalPopMod).toLocaleString());
                    apply(data, "deathsMil", () => Math.round(r.totalDeaths / globalPopMod).toLocaleString());
                    apply(data, "newCases", () => r.totalNewCases.toLocaleString());
                    apply(data, "newDeaths", () => r.totalNewDeaths.toLocaleString());
                    return data;

                case "coronatrackertop":
                    r = result;
                    data.countries = [];
                    if (r.length) {
                        r.forEach((item, i) => {
                            const innerData = {};
                            apply(innerData, "isoA2", () => item.countryCode);
                            apply(innerData, "country", () => item.country);
                            apply(innerData, "confirmed", () => item.totalConfirmed);
                            apply(innerData, "deaths", () => item.totalDeaths);
                            apply(innerData, "recovered", () => item.totalRecovered);
                            apply(innerData, "latlng", () => [item.lat, item.lng]);
                            data.countries[i] = innerData;
                        });
                    }
                    return data;

                case "openexchangerates":
                    r = result.rates || "-";
                    data.conversions = r;
                    return data;

                case "openexchangeratesnames":
                    r = result;
                    data.names = r;
                    return data;

                case "opencagereverse":
                    r = result.results[0].components["ISO_3166-1_alpha-2"] || "-";
                    data.lastIsoA2 = r;
                    return data;

                case "reliefwebglobal":
                    r = result.data;
                    data.disasters = [];
                    if (r.length) {
                        r.forEach((item, i) => {
                            const innerData = {};
                            apply(innerData, "name", () => item.fields.name);
                            apply(innerData, "url", () => item.fields.url_alias);
                            apply(innerData, "isoA3", () => item.fields.primary_country.iso3.toUpperCase());
                            apply(innerData, "date", () => item.fields.date.created.substr(0, 10));
                            apply(innerData, "type", () => item.fields.primary_type.name);
                            apply(innerData, "glide", () => item.fields.glide.substr(0, 2));
                            data.disasters[i] = innerData;
                        });
                    }
                    return data;

                default:
                    throw new Error("Endpoint has no harvest function.");
            }
        }

        __requiresUpdate(endpoint) {
            return GLOBAL_ENDPOINTS.some(i => i === endpoint)
                && (!this.expiries[endpoint] ||
                    (this.expiries[endpoint] !== -1
                    && this.expiries[endpoint] < Date.now() + EXPIRY_BUFFER));
        }

        __cache() {
            localStorage.setObject(this.id, this);
        }

        updateBorder(isoA2 = "", data = {}) {
            if (!this.data.borders) {
                this.data.borders = {};
            }
            if (data) {
                this.data.borders[isoA2] = Util.ringsToPolygon(isoA2, data);
            }

            this.__cache();
        }
    }






    class CountryData {

        constructor(isoA2) {
            this.id = isoA2;
            this.params = {};
            this.data = {};
            this.expiries = {};
            this.isUpdating = false;
        }

        async init() {
            const cachedObject = localStorage.getObject(this.id);
            if (cachedObject) {
                Object.assign(this, cachedObject);
            } else {
                await this.requestData(["opencageforward", "arcgisgeometry"]);
            }
        }

        // await not necessary
        async requestData(endpoints = [], onComplete = (data, event) => {}) {
            if (!endpoints.length) {
                return onComplete(this.data, [EVENT_EMPTY_REQUEST]);
            }
            this.isUpdating = true;
            let events = [];

            const invalidEndpoints = [];
            endpoints.forEach(i => {
                if (this.__requiresUpdate(i)) {
                    invalidEndpoints.push(i);
                }
            });

            let fetchEvents;
            if (invalidEndpoints.length) {
                fetchEvents = await this.__fetchDataAndApply(invalidEndpoints);
            } else {
                events.push(EVENT_NOT_UPDATED);
            }

            Util.pushUnique(events, fetchEvents);
            console.log("country events", events);
            this.isUpdating = false;
            return onComplete(this.data, events);
        }

        async __fetchDataAndApply(endpoints = []) {
            this.__reassignParams();

            let events = [];
            let ajax;
            try {
                ajax = await Util.ajaxPost("php/request.php", {
                    endpoints: endpoints, params: this.params});
            } catch(e) {
                console.log(e);
            }

            if (!ajax) {
                return [EVENT_AJAX_ERROR];
            }
            if (ajax.error) {
                events.push(EVENT_SERVER_ERROR);
            }
            for (let i = 0; i < endpoints.length; i++) {
                const current = endpoints[i];
                if (!ajax.data[current]) {
                    events.push(EVENT_ENDPOINT_RESPONSE_MISSING);
                    continue;
                }
                let harvest;
                try {
                    harvest = this.__harvestData(current, ajax.data[current]);
                } catch(e) {
                    console.log(e, harvest);
                    events.push(EVENT_HARVEST_INCOMPLETE);
                    continue;
                }
                if (!this.data[current] || $.isEmptyObject(this.data[current])) {
                    this.data[current] = {};
                    events.push(EVENT_DATA_ADDED);
                } else {
                    events.push(EVENT_DATA_EXISTED);
                }
                if (harvest) {
                    Object.assign(this.data[current], harvest);
                    events.push(EVENT_DATA_UPDATED);
                    const expiry = COUNTRY_EXPIRIES[current];
                    this.expiries[current] = expiry < 0 ? -1 : Date.now() + expiry;
                }
            }
            this.__cache();
            return events;
        }

        __harvestData(endpoint, result) {
            const data = {hadErrors: false};
            let r;
            switch (endpoint) {
                case "ambeeair":
                    r = result.stations[0];
                    apply(data, "no2", () => r.NO2);
                    apply(data, "pm10", () => r.PM10);
                    apply(data, "pm25", () => r.PM25);
                    apply(data, "so2", () => r.SO2);
                    apply(data, "ozone", () => r.OZONE);
                    apply(data, "aqi", () => r.AQI);
                    apply(data, "category", () => r.aqiInfo.category);
                    console.log(data);
                    return data;

                case "arcgisgeometry":
                    r = result.results[0].value;
                    dataArray["GLOBAL"].updateBorder(this.id, r.features[0].geometry.rings);
                    return {};

                case "coronatracker":
                    r = result[0];
                    const g = dataArray["GLOBAL"].data.coronatrackerglobal;
                    const countryPopMod = r.totalConfirmed / r.totalConfirmedPerMillionPopulation;
                    apply(data, "infectionFatality", () => Math.round(r.FR * 100) / 100 + "%");
                    apply(data, "caseFatality", () => Math.round(r.totalDeaths / (r.totalDeaths + r.totalRecovered) * 10000) / 100 + "%");
                    apply(data, "recovery", () => Math.round(r.PR * 100) / 100 + "%");
                    apply(data, "confirmed", () => r.totalConfirmed);
                    apply(data, "active", () => r.activeCases);
                    apply(data, "critical", () => r.totalCritical);
                    apply(data, "recoveries", () => r.totalRecovered);
                    apply(data, "deaths", () => r.totalDeaths);
                    apply(data, "confirmedMil", () => Math.round(r.totalConfirmed / countryPopMod));
                    apply(data, "activeMil", () => Math.round(r.activeCases / countryPopMod));
                    apply(data, "criticalMil", () => Math.round(r.totalCritical / countryPopMod));
                    apply(data, "recoveriesMil", () => Math.round(r.totalRecovered / countryPopMod));
                    apply(data, "deathsMil", () => Math.round(r.totalDeaths / countryPopMod));
                    apply(data, "confirmedPercent", () => Math.round(r.totalConfirmed / g.confirmedRaw * 10000) / 100 + "%");
                    apply(data, "activePercent", () => Math.round(r.activeCases / g.activeRaw * 10000) / 100 + "%");
                    apply(data, "recoveriesPercent", () => Math.round(r.totalRecovered / g.recoveriesRaw * 10000) / 100 + "%");
                    apply(data, "deathsPercent", () => Math.round(r.totalDeaths / g.deathsRaw * 10000) / 100 + "%");
                    apply(data, "newCases", () => r.dailyConfirmed);
                    apply(data, "newDeaths", () => r.dailyDeaths);
                    return data;

                case "coronatrackertrend":
                    r = result;
                    data.trends = [];
                    let lastConfirmed = r[0].total_confirmed;
                    let lastDeaths = r[0].total_deaths;
                    for (let i = 0; i < r.length; i++) {
                        const item = r[i];
                        const innerData = {};
                        apply(innerData, "confirmed", () => item.total_confirmed.toLocaleString() 
                                + " (+" + (item.total_confirmed - lastConfirmed).toLocaleString() + ")");
                        lastConfirmed = item.total_confirmed;
                        apply(innerData, "deaths", () => item.total_deaths.toLocaleString() 
                                + " (+" + (item.total_deaths - lastDeaths).toLocaleString() + ")");
                        lastDeaths = item.total_deaths;
                        apply(innerData, "date", () => item.last_updated.substr(0, 10));
                        data.trends[i] = innerData;
                    }
                    data.trends.sort((p, q) => p.date < q.date);
                    return data;

                case "opencageforward":
                    r = result.results[0];
                    apply(data, "callingCode", () => r.annotations.callingcode);
                    apply(data, "drivingSide", () => r.annotations.roadinfo.drive_on);
                    apply(data, "drivingUnits", () => r.annotations.roadinfo.speed_in);
                    data.sunrise = {};
                    apply(data.sunrise, "apparent", () => r.annotations.sun.rise.apparent);
                    apply(data.sunrise, "astronomical", () => r.annotations.sun.rise.astronomical);
                    apply(data.sunrise, "civil", () => r.annotations.sun.rise.civil);
                    apply(data.sunrise, "nautical", () => r.annotations.sun.rise.nautical);
                    data.sunset = {};
                    apply(data.sunset, "apparent", () => r.annotations.sun.set.apparent);
                    apply(data.sunset, "astronomical", () => r.annotations.sun.set.astronomical);
                    apply(data.sunset, "civil", () => r.annotations.sun.set.civil);
                    apply(data.sunset, "nautical", () => r.annotations.sun.set.nautical);
                    apply(data, "timezone", () => r.annotations.timezone.name);
                    apply(data, "timezoneShort", () => r.annotations.timezone.short_name);
                    apply(data, "timezoneOffset", () => r.annotations.timezone.offset_string);
                    apply(data, "wikidataKey", () => r.annotations.wikidata);
                    apply(data, "isoA2", () => r.components["ISO_3166-1_alpha-2"]);
                    apply(data, "isoA3", () => r.components["ISO_3166-1_alpha-3"]);
                    apply(data, "continent", () => r.components.continent);
                    apply(data, "country", () => r.components.country);
                    apply(data, "cityLat", () => r.geometry.lat);
                    apply(data, "cityLng", () => r.geometry.lng);
                    if (r.annotations.currency) {
                        apply(data, "currencyDecimal", () => r.annotations.currency.decimal_mark);
                        apply(data, "currencySymbol", () => r.annotations.currency.html_entity || r.annotations.currency.symbol);
                        apply(data, "currencyIso", () => r.annotations.currency.iso_code);
                        apply(data, "currencyUnit", () => r.annotations.currency.name);
                        apply(data, "currencySubunit", () => r.annotations.currency.subunit);
                        apply(data, "currencyRatio", () => r.annotations.currency.subunit_to_unit);
                        apply(data, "currencySeparator", () => r.annotations.currency.thousands_separator);
                        apply(data, "currencySymbolFirst", () => r.annotations.currency.symbol_first);
                        apply(data, "currencyFormat", () => r.annotations.currency.format);
                    }
                    return data;

                case "reliefwebdisasters":
                    r = result.data;
                    data.disasters = [];
                    if (r.length) {
                        r.forEach((item, i) => {
                            const innerData = {};
                            apply(innerData, "name", () => item.fields.name);
                            apply(innerData, "url", () => item.fields.url_alias);
                            apply(innerData, "date", () => item.fields.date.created.substr(0, 10));
                            apply(innerData, "type", () => item.fields.primary_type.name);
                            apply(innerData, "extract", () => '"' + (item.fields.description || "").substr(0, 100) + '..."');
                            apply(innerData, "status", () => item.fields.status);
                            apply(innerData, "glide", () => item.fields.glide.substr(0, 2));
                            data.disasters[i] = innerData;
                        });
                    }
                    return data;

                case "reliefwebreports":
                    r = result.data;
                    data.reports = [];
                    if (r.length) {
                        r.forEach((item, i) => {
                            const innerData = {};
                            apply(innerData, "name", () => item.fields.title);
                            apply(innerData, "url", () => item.fields.url_alias);
                            apply(innerData, "date", () => item.fields.date.created.substr(0, 10));
                            apply(innerData, "format", () => item.fields.format[0].name);
                            apply(innerData, "theme", () => item.fields.theme[0].name);
                            apply(innerData, "source", () => item.fields.source[0].shortname);
                            data.reports[i] = innerData;
                        });
                    }
                    return data;

                case "restcountries":
                    r = result;
                    apply(data, "webDomain", () => r.topLevelDomain);
                    apply(data, "countryLong", () => r.name);
                    apply(data, "isoA2", () => r.alpha2Code);
                    apply(data, "isoA3", () => r.alpha3Code);
                    data.callingCodes = [];
                    if (r.callingCodes.length) {
                        r.callingCodes.forEach((item, i) => {
                            data.callingCodes[i] = "+" + item;
                        });
                    }
                    apply(data, "capital", () => r.capital);
                    data.synonyms = [];
                    if (r.altSpellings.length) {
                        r.altSpellings.forEach((item, i) => {
                            data.synonyms[i] = item;
                        });
                    }
                    apply(data, "region", () => r.region);
                    apply(data, "subregion", () => r.subregion);
                    apply(data, "population", () => r.population);
                    apply(data, "demonym", () => r.demonym);
                    apply(data, "areaKm", () => r.area);
                    apply(data, "gini", () => r.gini);
                    data.borderedCountries = [];
                    if (r.borders.length) {
                        r.borders.forEach((item, i) => {
                            data.borderedCountries[i] = item;
                        });
                    }
                    apply(data, "nativeName", () => r.nativeName);
                    apply(data, "isoN", () => r.numericCode);
                    data.currencies = [];
                    if (r.currencies.length)
                    r.currencies.forEach((item, i) => {
                        const innerData = {};
                        apply(innerData, "name", () => item.name);
                        apply(innerData, "isoA3", () => item.code);
                        apply(innerData, "symbol", () => item.symbol);
                        data.currencies[i] = innerData;
                    });
                    data.languages = [];
                    if (r.languages.length) {
                        r.languages.forEach((item, i) => {
                            const innerData = {};
                            apply(innerData, "name", () => item.name);
                            apply(innerData, "isoA2", () => item.iso639_1);
                            apply(innerData, "isoA3", () => item.iso639_2);
                            data.languages[i] = innerData;
                        });
                    }
                    data.flagUrl = r.flag || "-";
                    data.regionalBlocs = [];
                    if (r.regionalBlocs.length) {
                        r.regionalBlocs.forEach((item, i) => {
                            const innerData = {};
                            apply(innerData, "name", () => item.name);
                            apply(innerData, "acronym", () => item.acronym);
                            apply(innerData, "isoA3", () => item.iso639_2);
                            data.regionalBlocs[i] = innerData;
                        });
                    }
                    return data;

                case "thenews":
                    r = result.data;
                    data.articles = [];
                    for (let i = 0; i < r.length; i++) {
                        const item = r[i];
                        const innerData = {};
                        apply(innerData, "title", () => item.title);
                        apply(innerData, "extract", () => item.snippet);
                        apply(innerData, "link", () => item.url);
                        apply(innerData, "image", () => item.image_url);
                        apply(innerData, "date", () => item.published_at.substr(0, 10));
                        data.articles.push(innerData);
                    }
                    return data;

                case "wikimedia":
                    r = result.query.pages;
                    data.pages = [];
                    if (!$.isEmptyObject(r)) {
                        Object.keys(r).forEach(i => {
                            const item = r[i];
                            const innerData = {};
                            apply(innerData, "title", () => item.title);
                            apply(innerData, "pageUrl", () => "https://en.wikipedia.org/?curid=" + item.pageid);
                            apply(innerData, "thumbnailUrl", () => "https://commons.wikimedia.org/wiki/Special:FilePath/" + item.pageimage + "?width=80px");
                            apply(innerData, "extract", () => item.extract);
                            data.pages.push(innerData);
                        });
                    }
                    return data;

                case "yahooweather":
                    r = result;
                    data.now = {};
                    apply(data.now, "date", () => r.current_observation.pubDate);
                    apply(data.now, "city", () => r.location.city);
                    apply(data.now, "region", () => r.location.region);
                    apply(data.now, "windChillC", () => r.current_observation.wind.chill);
                    apply(data.now, "windDirectionDeg", () => r.current_observation.wind.direction);
                    apply(data.now, "windSpeedKph", () => r.current_observation.wind.speed);
                    apply(data.now, "humidityPerc", () => r.current_observation.atmosphere.humidity);
                    apply(data.now, "visibilityKm", () => r.current_observation.atmosphere.visibility);
                    apply(data.now, "pressureMbar", () => r.current_observation.atmosphere.pressure);
                    apply(data.now, "sunrise", () => r.current_observation.astronomy.sunrise);
                    apply(data.now, "sunset", () => r.current_observation.astronomy.sunset);
                    data.now.weather = {};
                    apply(data.now.weather, "name", () => r.current_observation.condition.text);
                    apply(data.now.weather, "image", () => "https://s.yimg.com/zz/combo?a/i/us/nws/weather/gr/" + r.current_observation.condition.code + "d.png");
                    apply(data.now.weather, "temperatureC", () => r.current_observation.condition.temperature);
                    data.forecasts = [];
                    if (r.forecasts.length) {
                        r.forecasts.forEach((item, i) => {
                            const innerData = {};
                            apply(innerData, "name", () => item.text);
                            apply(innerData, "date", () => item.date);
                            apply(innerData, "day", () => item.day);
                            apply(innerData, "image", () => "https://s.yimg.com/zz/combo?a/i/us/nws/weather/gr/" + item.code + "d.png");
                            apply(innerData, "lowC", () => item.low);
                            apply(innerData, "highC", () => item.high);
                            data.forecasts[i] = innerData;
                        });
                    }
                    return data;

                default:
                    return true;
            }
        }

        __reassignParams() {
            const d = this.data;
            const global = dataArray["GLOBAL"].data.countries[this.id];
            this.params.isoA2 = this.id;
            this.params.isoA3 = d.restcountries && d.restcountries.isoA3 || global.cca3;
            this.params.city = d.restcountries && d.restcountries.capital || global.capital[0];
            const now = new Date();
            this.params.dateEnd = now.toISOString().substr(0, 10);
            now.setDate(now.getDate() - 10);
            this.params.dateStart = now.toISOString().substr(0, 10);
            this.params.lat = d.opencageforward && d.opencageforward.cityLat || global.latlng[0];
            this.params.lng = d.opencageforward && d.opencageforward.cityLng || global.latlng[1];
            for (let i = 0; i < this.params; i++) {
                this.params[i] = encodeURIComponent(this.params[i]);
            }
        }

        __requiresUpdate(endpoint) {
            return COUNTRY_ENDPOINTS.some(i => i === endpoint)
                && (!this.expiries[endpoint] ||
                    (this.expiries[endpoint] !== -1
                    && this.expiries[endpoint] < Date.now() + EXPIRY_BUFFER));
        }

        __cache() {
            localStorage.setObject(this.id, this);
        }
    }

    const apply = (obj, val, tryFunction = () => {}, def = "") => {
        try {
            obj[val] = tryFunction() || def;
            return true;
        } catch(e) {
            obj[val] = def;
            return false;
        }
    }

}(window.Data = window.Data || {}, jQuery));