let map;
let tileLayer;
let borderLayer;
let openweatherLayer;
let trailsLayer;
let stamenLayer;
let globalData = {};
let countryData = {};
const sectionArray = {};
let disasterMarkerLayer = {};
let coronaMarkerLayer = {};
const popups = [];
let currentMarkerLayer = null;
const markerProps = {
    savedBorder: true,
    selectedBorder: true,
    savedShape: false,
    selectedShape: false,
    reliefweb: false
}
let ignoreClick = false;
const MARKER_OFFSET = 2;
const BAD_ERRORS = [
    Data.EVENT_SERVER_ERROR,
    Data.EVENT_SCRIPT_ERROR,
    Data.EVENT_ENDPOINT_RESPONSE_MISSING,
    Data.EVENT_HARVEST_FAILED,
    Data.EVENT_HARVEST_INCOMPLETE
]

$(window).on("load", async () => {

    $(".mainPanel, .subPanel, .menu").hide();

    map = L.map("map", {
        maxZoom: 14,
        preferCanvas: false,
        zoomSnap: 0.5,
        worldCopyJump: true,
        doubleClickZoom: false,
        zoomControl: false});
    map.attributionControl.addAttribution(`GeoEnrichment &copy; <a href="https://developers.arcgis.com/" target="_blank">Esri</a>`);

    globalData = await Data.getGlobalData();
    globalData.requestData([], (data, event) => {
        borderLayer = L.geoJSON(null, {
            onEachFeature: (feature, layer) => {
                layer.on("click", async e => {
                    e.originalEvent.view.L.DomEvent.stopPropagation(e);
                    if (ignoreClick) return;
                    if (countryData.id !== feature.properties.isoA2) {
                        await setCountry(feature.properties.isoA2);
                    } else {
                        flyTo(getBorderLayer(countryData.id).getBounds());
                    }
                });
            }
        }).addTo(map);

        if (data.borders) {
            Object.keys(data.borders).forEach(i => {
                borderLayer.addData(data.borders[i]);
            });
        }
    });

    updateLayers("dark", "base");

    map.on("preclick", e => {
        ignoreClick = closeOpenMenus();
    });
    map.on("click", e => {
        if (!ignoreClick) {
            locateAndSetCountry(e.latlng.lat, e.latlng.lng);
        }
    });
    map.on("dragstart", () => {
        closeOpenMenus();
    });
    map.createPane("background").style.zIndex = 201;
    map.createPane("lines").style.zIndex = 202;
    map.createPane("overlay").style.zIndex = 203;
    map.createPane("labels").style.zIndex = 204;
    map.fitWorld();

    navigator.geolocation.getCurrentPosition(
        async e => {
            await locateAndSetCountry(e.coords.latitude, e.coords.longitude);
            hideLoader();
            setLeftSection(Sections.SECTION_L_WEATHER);
        }, 
        async err => {
            globalData.requestData([], async (data, event) => {
                if (data.borders) {
                    setCountry(Object.keys(data.borders)[0]);
                } else {
                    await locateAndSetCountry();
                }
                hideLoader();
                setLeftSection(Sections.SECTION_L_WEATHER);
            });
        }
    );

    $(".iconBtn").on("click", function() {
        $(".menu").slideUp(100);
        let menu;
        switch (this.id) {
            case "zoomInButton":
                zoom(1);
                break;
            case "zoomOutButton":
                zoom(-1);
                break;
            case "globeButton":
                map.fitWorld(getFlyPadding());
                break;
            case "fitButton":
                flyTo(getBorderLayer(countryData.id).getBounds());
                break;
            case "markerButton":
                menu = "#markerMenu";
                break;
            case "layersButton":
                menu = "#layerMenu";
                break;
            case "subButton":
                menu = "#subMenu";
                break;
            case "mainButton":
                menu = "#mainMenu";
                break;
            default:
                throw new Error("Button should not exist.")
        }
        if (menu && $(menu).is(":hidden")) {
            $(menu).delay(100).slideToggle(100);
        }
    });

    $(".btn").on("click", function() {
        updateButtons($(this));
    });

    $("#mainMenu .btn").on("click", function() {
        setLeftSection($(this).data("ref"));
    });

    $("#subMenu .btn").on("click", function() {
        setRightSection($(this).data("ref"));
    });

    $("#layerMenu .btn").on("click", function() {
        setLayer($(this));
    });

    $("#markerMenu .btn").on("click", function() {
        setMarker($(this));
    });

    $("#search").on("input", () => {
        if ($("#searchMenu").is(":hidden")) {
            closeOpenMenus();
            $("#searchMenu").slideDown(100);
        }
        const value = $("#search").val().toUpperCase();
        if (value === "") return $("#searchMenu").slideUp(100);
        const suggestions = [];
        globalData.requestData([], (data, event) => {
            for (let i = 0; i < Object.keys(data.countries).length; i++) {
                if (suggestions.length > 9) break;
                const country = data.countries[Object.keys(data.countries)[i]];
                if (country.cca2.includes(value) || country.cca3.includes(value) || country.name.toUpperCase().includes(value)) {
                    suggestions.push(country.cca2 + "/" + country.cca3 + " - " + country.name);
                }
            }
        });
        let htmlString = "<ul>";
        for (let i = 0; i < suggestions.length; i++) {
            htmlString += `
            <li>
                <button class="btn tLabel" data-group="searchResults" data-type="single" data-ref="`+suggestions[i].substr(0, 2)+`" role="menuitemradio" tabindex="0">`+suggestions[i]+`</button>
            </li>
            `;
        }
        htmlString += "</ul>";
        $("#searchMenu").html(htmlString);
        $("#searchMenu .btn").on("click", function() {
            closeOpenMenus();
            setCountry($(this).data("ref"));
        });
        console.log(suggestions);
    });
});

const closeOpenMenus = () => {
    let element;
    $(".menu").each(function() {
        if ($(this).is(":visible")) {
            element = $(this);
            element.slideUp(100);
        }
    });
    if (!$.isEmptyObject(disasterMarkerLayer) || !$.isEmptyObject(coronaMarkerLayer)) {
        for (let i = 0; i < popups.length; i++) {
            if (popups[i].isOpen()) element = true;
        }
    }
    return element;
}

const hideLoader = () => {
    if ($("#preloader").length) {
        $("#preloader").delay(100).fadeOut("slow", function() {
            $(this).remove();
        });
    }
}

const locateAndSetCountry = async (lat = 52, lng = 0) => {
    Sections.loadHeaderPanel();
    countryData = await Data.getCountry("", lat, lng);
    await setCountry(countryData.id);
}

const setCountry = async isoA2 => {
    $("#search").val("");
    countryData = await Data.getCountry(isoA2);
    await globalData.requestData(["reliefwebglobal"], (data, event) => {
        let layer = getBorderLayer(isoA2);
        if (!layer && data.borders) {
            borderLayer.addData(data.borders[isoA2]);
            layers = borderLayer.getLayers();
            layer = layers[layers.length - 1];
        }
        flyTo(layer.getBounds());
    });
    updateBorderStyles();
    updateSections();
}

const flyTo = (bounds, extraPadding = false) => {
    map.flyToBounds(bounds, getFlyPadding(extraPadding));
}

const getFlyPadding = (extraPadding = false) => {
    const body = $("#body");
    const panel = $("#subPanel");
    const offset = panel.offset();
    const extra = extraPadding ? Util.rem(2) : 0;
    return {
        paddingTopLeft: L.point(
            offset.left - Util.rem(1) + extra,
            offset.top - Util.rem(4) + extra),
        paddingBottomRight: L.point(
            (body.width() - offset.left - panel.width() - Util.rem(1) + extra),
            (body.height() - offset.top - panel.height()) - Util.rem(6) + extra)
    }
}

const zoom = zoomOffset => {
    const panel = $("#subPanel");
    const offset = panel.offset();
    map.setZoomAround(L.point(
            offset.left + panel.width() / 2,
            offset.top + panel.height() / 2),
        map.getZoom() + zoomOffset
    );
}

const getBorderLayer = isoA2 => {
    let layer;
    borderLayer.eachLayer(i => {
        if (i.feature.properties.isoA2 === isoA2) {
            layer = i;
        }
    });
    return layer;
}

const getSection = sectionId => {
    if (!sectionId || !Sections.ALL_SECTIONS.includes(sectionId)) {
        throw new Error("Section doesn't exist");
    }
    if (!sectionArray[sectionId]) {
        sectionArray[sectionId] = Sections.get(sectionId);
    }
    return sectionArray[sectionId];
}

const setLeftSection = (sectionId = "") => {
    $("#mainMenu").slideUp(100);
    $(".mainPanel").fadeOut(200);
    $(sectionId).delay(200).fadeIn(200, "swing", () => {
        updateSections(sectionId);
    });
}

const setRightSection = (sectionId = "") => {
    $(sectionId).fadeToggle(200, "swing", () => {
        updateSections(sectionId);
    });
}

const updateSections = (sectionId = "") => {
    const sectionsToUpdate = [];
    const globalEndpoints = [];
    const countryEndpoints = [];
    for (let i = 0; i < Sections.ALL_SECTIONS.length; i++) {
        const section = getSection(Sections.ALL_SECTIONS[i]);
        if ((sectionId && sectionId !== section.id) || !section.requiresUpdate(sectionId)) continue;
        sectionsToUpdate.push(section);
        Util.pushUnique(globalEndpoints, section.globalEndpoints);
        Util.pushUnique(countryEndpoints, section.countryEndpoints);
    }

    for (let i = 0; i < globalEndpoints.length; i++) {
        const endpoint = globalEndpoints[i];
        globalData.requestData([endpoint], (data, event) => {
            for (let j = 0; j < sectionsToUpdate.length; j++) {
                const section = sectionsToUpdate[j];
                if (section.globalEndpoints.includes(endpoint)) {
                    const error = event.some(j => BAD_ERRORS.includes(j));
                    section.validateAndUpdate(endpoint, data, "global", section.stamp, !error);
                }
            }
        });
    }
    for (let i = 0; i < countryEndpoints.length; i++) {
        const endpoint = countryEndpoints[i];
        countryData.requestData([endpoint], (data, event) => {
            for (let j = 0; j < sectionsToUpdate.length; j++) {
                const section = sectionsToUpdate[j];
                if (section.countryEndpoints.includes(endpoint)) {
                    const error = event.some(j => BAD_ERRORS.includes(j));
                    section.validateAndUpdate(endpoint, data, "country", section.stamp, !error);
                }
            }
        });
    }
}

const updateButtons = button => {
    const group = button.data("group");
    const type = button.data("type");
    const reselect = button.hasClass("selected");
    
    // if single: reselect does nothing, select removes all and sets
    // if oneOrNone: reselect toggles, select removes all and sets
    // if multi: reselect toggles, select toggles

    if (reselect) {
        if (type === "single") {
            return;
        }
        button.removeClass("selected");
    } else {
        if (type !== "multi") {
            $(".btn").filter(function() {
                return $(this).data("group") === group;
            }).removeClass("selected");
        }
        button.addClass("selected");
    }
}

const setMarker = button => {
    const ref = button.data("ref");
    if (ref === "reliefweb" || ref === "corona") {
        updateMarkers(ref);
    } else {
        markerProps[ref] = !markerProps[ref];
        updateBorderStyles();
    }
}


const updateMarkers = async (ref = "") => {
    closeOpenMenus();
    let layer;
    let updateFunction;
    switch (ref) {
        case "reliefweb":
            layer = disasterMarkerLayer;
            updateFunction = updateDisasterMarkers;
            break;
        case "corona":
            layer = coronaMarkerLayer;
            updateFunction = updateCovidMarkers;
            break;
        default: 
            throw new Error("Invalid reference.");
    }
    if ($.isEmptyObject(layer)) {
        layer = await updateFunction();
    }
    if (currentMarkerLayer) {
        currentMarkerLayer.removeFrom(map);
        if (currentMarkerLayer === layer) {
            currentMarkerLayer = null;
            return;
        }
        currentMarkerLayer = null;
    }
    currentMarkerLayer = layer;
    layer.addTo(map);
    flyTo(layer.getBounds(), true);
}

const updateDisasterMarkers = async () => {
    await globalData.requestData(["reliefwebglobal"], async (data, event) => {
        const countries = data.countries;
        const d = data.reliefwebglobal.disasters;
        disasterMarkerLayer = L.featureGroup();
        disasterMarkerLayer.getAttribution = () => `Markers &copy; <a href="https://reliefweb.int/" target="_blank">ReliefWeb</a>`;
        const positions = [];
        for (let i = 0; i < d.length; i++) {
            const cur = d[i];
            let latlng = countries[cur.isoA3].latlng;
            if (positions.some(i => i[0] === latlng[0] && i[1] === latlng[1])) {
                let newLatlng = [latlng[0], latlng[1]];
                let cont = true;
                while (cont) {
                    if (positions.some(i => i[0] === newLatlng[0] && i[1] === newLatlng[1])) {
                        newLatlng[1] += MARKER_OFFSET;
                    } else {
                        cont = false;
                    }
                }
                latlng = newLatlng;
            }
            positions.push(latlng);
            const icon = getIcon(Util.getGlideEquivalent(cur.glide), "mapIcon red drop");
            const popup = getPopup(`
                <a title="`+cur.name+`" href="`+cur.url+`" target="_blank" tabindex=0>
                    <section>
                        <h3 class="tHeading6">`+cur.name+`</h3>
                        <p class="tBody">`+cur.type+` - `+cur.date+`</p>
                    </section>
                </a>
            `, "popup");
            popups.push(popup);
            getMarker(icon, cur.name, latlng).bindPopup(popup).addTo(disasterMarkerLayer);
        }
    });
    return disasterMarkerLayer;
}

const updateCovidMarkers = async () => {
    await globalData.requestData(["coronatrackerglobal", "coronatrackertop"], async (data, event) => {
        const countries = data.coronatrackertop.countries;
        const global = data.coronatrackerglobal;
        let cMin = cMax = 0;
        for (let i = 0; i < countries.length; i++) {
            const cur = countries[i];
            if (cur.confirmed < cMin) cMin = cur.confirmed;
            if (cur.confirmed > cMax) cMax = cur.confirmed;
        }
        const cRange = cMax - cMin;
        const ranges = [cMin + cRange * 0.1, cMin + cRange * 0.3, cMin + cRange * 0.9];
        coronaMarkerLayer = L.featureGroup();
        coronaMarkerLayer.getAttribution = () => `Markers &copy; <a href="https://www.coronatracker.com/" target="_blank">CORONATRACKER</a>`;
        for (let i = 0; i < countries.length; i++) {
            const cur = countries[i];
            let colour;
            if (cur.confirmed < ranges[0]) colour = "yellow";
            else if (cur.confirmed < ranges[1]) colour = "amber";
            else if (cur.confirmed < ranges[2]) colour = "orange";
            else colour = "red";
            const icon = getIcon("EP", "mapIcon drop " + colour);
            const confirmedPercent = Util.roundTo(cur.confirmed / global.confirmedRaw * 100, 2);
            const deathsPercent = Util.roundTo(cur.deaths / global.deathsRaw * 100, 2);
            const recoveredPercent = Util.roundTo(cur.recovered / global.recoveriesRaw * 100, 2);
            const popup = getPopup(`
                <section>
                    <h3 class="tHeading6">`+cur.country+`</h3>
                    <p class="tBody">Confirmed: `+cur.confirmed.toLocaleString()+` (`+confirmedPercent+`%)</p>
                    <p class="tBody">Deaths: `+cur.deaths.toLocaleString()+` (`+deathsPercent+`%)</p>
                    <p class="tBody">Recoveries: `+cur.recovered.toLocaleString()+` (`+recoveredPercent+`%)</p>
                </section>
            `, "popup");
            popups.push(popup);
            getMarker(icon, cur.country, cur.latlng).bindPopup(popup).addTo(coronaMarkerLayer);
        }
    });
    return coronaMarkerLayer;
}

const getIcon = (iconId = "", className = "") => {
    return L.divIcon({
        html: `<svg><use xlink:href="img/icons.svg#`+iconId+`"></use></svg>`,
        className: className,
        //popupAnchor: L.point(Util.rem(1.6), Util.rem(1.6)),
        iconAnchor: L.point(0, 0)
    });
}

const getPopup = (content = "", className = "") => {
    return L.popup({
        offset: L.point(0, 0),
        autoPanPadding: L.point(Util.rem(2), Util.rem(2)),
        className: className
    }).setContent(content);
}

const getMarker = (icon = {}, name = "", latlng = []) => {
    return L.marker(L.latLng(latlng[0], latlng[1]), {
        icon: icon,
        title: name,
        alt: name,
        riseOnHover: true,
        offset: L.point(0, 0)
    });
}

const updateBorderStyles = () => {
    borderLayer.setStyle(feature => {
        const iso = feature.properties.isoA2;
        const selected = iso === countryData.id;
        if (selected) {
            const layer = getBorderLayer(iso);
            layer.bringToFront();
        }
        const style = {
            fill: true,
            fillColor: (markerProps.selectedShape && selected) ? "#7e7" : "#77e",
            fillOpacity: (markerProps.selectedShape && selected) || markerProps.savedShape ? 0.5 : 0,
            stroke: (markerProps.selectedBorder && selected) || markerProps.savedBorder,
            color: (markerProps.selectedBorder && selected) ? "#5c5" : "#55c",
            opacity: 1,
            weight: Util.rem(0.1)
        }
        return style;
    });
}

const layersArray = {base: {}, label: {}, overlay: {}};

const setLayer = button => {
    const ref = button.data("ref");
    const group = button.data("group");
    updateLayers(ref, group);
}

const updateLayers = (layerRef, layerGroup) => {
    if (!layersArray[layerGroup][layerRef]) {
        layersArray[layerGroup][layerRef] = getLayer(layerRef);
    }
    const layer = layersArray[layerGroup][layerRef];

    if (map.hasLayer(layer)) {
        if (layerGroup !== "base") {
            layer.remove();
        }
    } else {
        if (layerGroup !== "label") {
            Object.keys(layersArray[layerGroup]).forEach(i => {
                layersArray[layerGroup][i].remove();
            });
        }
        layer.addTo(map);
    }
}

const getLayer = layerRef => {
    let url;
    let attribution;
    let pane;
    switch (layerRef) {
        case "dark":
        case "terrain-background":
            pane = "background";
            break;
        case "terrain-lines":
            pane = "lines";
            break;
        case "terrain-labels":
            pane = "labels";
            break;
        case "clouds_new":
        case "precipitation_new":
        case "pressure_new":
        case "wind_new":
        case "temp_new":
        case "hiking":
        case "cycling":
            pane = "overlay";
            break;
        default:
            throw new Error("Layer reference doesn't exist.");
    }
    switch (layerRef) {
        case "dark":
            url = "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png";
            attribution = "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors &copy; <a href='https://carto.com/attributions'>CARTO</a>";
            break;
        case "terrain-background":
        case "terrain-lines":
        case "terrain-labels":
            url = "https://stamen-tiles-{s}.a.ssl.fastly.net/"+layerRef+"/{z}/{x}/{y}.jpg";
            attribution = "Map tiles by <a href='http://stamen.com'>Stamen Design</a>, under <a href='http://creativecommons.org/licenses/by/3.0'>CC BY 3.0</a>. Data by <a href='http://openstreetmap.org'>OpenStreetMap</a>, under <a href='http://www.openstreetmap.org/copyright'>ODbL</a>.";
            break;
        case "hiking":
        case "cycling":
            url = "https://tile.waymarkedtrails.org/"+layerRef+"/{z}/{x}/{y}.png";
            attribution = "Map data: &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors | Map style: &copy; <a href='https://waymarkedtrails.org'>waymarkedtrails.org</a> (<a href='https://creativecommons.org/licenses/by-sa/3.0/'>CC-BY-SA</a>)";
            break;
        case "clouds_new":
        case "precipitation_new":
        case "pressure_new":
        case "wind_new":
        case "temp_new":
            url = "https://tile.openweathermap.org/map/"+layerRef+"/{z}/{x}/{y}.png?appid={apiKey}";
            attribution = "Map data &copy; <a href='http://openweathermap.org'>OpenWeatherMap</a>";
            break;
        default:
            throw new Error("Layer reference doesn't exist.");
    }
    return L.tileLayer(url, {
        attribution: attribution,
        pane: pane,
        apiKey: "0dba3a74957ecdfc61a2198d6152d8e5",
        crossOrigin: "anonymous",
        keepBuffer: 6,
        updateInterval: 16.666667,
        maxZoom: 18,
        tileSize: 256,
        subdomains: "abcd"
    });
}
