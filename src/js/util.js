(function (Util, $) {

    Util.getCenter = a => {
        let lng = 0;
        let lat = 0;
        a.forEach(i => {
            lng += i[0];
            lat += i[1];
        });
        return L.latLng(lat / a.length, lng / a.length);
    }

    Util.ringsToPolygon = (name, rings = []) => {
        const type = rings.length > 1 ? "MultiPolygon" : "Polygon";
        const geometry = {"type": type, "coordinates": []}
        if (type === "Polygon") {
            geometry.coordinates = rings;
        } else {
            for (let i = 0; i < rings.length; i++) {
                geometry.coordinates[i] = [rings[i]];
            }
        }
        return {
            "type": "Feature",
            "properties": { "isoA2": name },
            "geometry": geometry
        };
    }

    Util.ajaxPost = async (url = "", data = { endpoints, params }) => {
        return await $.ajax({
            url: url,
            type: "POST",
            dataType: "json",
            data: data,
            success: (result) => {
                return {data: result.data, error: false};
            },
            error: (jqXHR, textStatus, errorThrown) => {
                return {data: textStatus, error: true};
            }
        });
    }

    Util.ajaxGet = async (url = "") => {
        let r;
        await $.ajax({
            url: url,
            dataType: "json",
            jsonp: true,
            success: (result) => {
                r = {data: result, error: false};
            },
            error: (jqXHR, textStatus, errorThrown) => {
                r = {data: textStatus, error: true};
            }
        });
        return r;
    }

    Util.getGlideEquivalent = id => {
        switch (id) {
            case "CE":
            case "OT":
                return "EP";
            case "EC":
                return "TC";
            case "WF":
                return "FR";
            case "MS":
                return "LS";
            default:
                return id;
        }
    }
    
    Util.getDayString = (day = 0) => {
        if (day === 0) return "Sunday";
        if (day === 1) return "Monday";
        if (day === 2) return "Tuesday";
        if (day === 3) return "Wednesday";
        if (day === 4) return "Thursday";
        if (day === 5) return "Friday";
        return "Saturday";
    }
    
    Util.getDateString = (date = 1) => {
        if (date >= 4 && date <= 20) return date + "th";
        const lastDigit = date.toString().substr(-1, 1);
        if (lastDigit == "1") return date + "st";
        if (lastDigit == "2") return date + "nd";
        if (lastDigit == "3") return date + "rd";
        return date + "th";
    }

    Util.roundTo = (float = 0.0, precision = 0) => {
        const mod = 10 ** precision;
        return Math.round(float * mod) / mod;
    }
    
    Util.degreesToCardinal = (degrees = 0) => {
        degrees %= 360;
        if (degrees < 11.25) return "N";
        if (degrees < 33.75) return "NNE";
        if (degrees < 56.25) return "NE";
        if (degrees < 78.75) return "ENE";
        if (degrees < 101.25) return "E";
        if (degrees < 123.75) return "ESE";
        if (degrees < 146.25) return "SE";
        if (degrees < 168.75) return "SSE";
        if (degrees < 191.25) return "S";
        if (degrees < 213.75) return "SSW";
        if (degrees < 236.25) return "SW";
        if (degrees < 258.75) return "WSW";
        if (degrees < 281.25) return "W";
        if (degrees < 303.75) return "WNW";
        if (degrees < 326.25) return "NW";
        if (degrees < 348.75) return "NNW";
        return "N";
    }

    Util.pushUnique = (arr1 = [], arr2 = []) => {
        for (let i = 0; i < arr2.length; i++) {
            const val = arr2[i];
            if (arr1.includes(val)) continue;
            arr1.push(val);
        }
    }

    Util.rem = count => {
        var unit = $('html').css('font-size');
        if (typeof count !== 'undefined' && count > 0) {
            return (parseInt(unit) * count);
        } else {
            return parseInt(unit);
        }
    }

}(window.Util = window.Util || {}, jQuery));