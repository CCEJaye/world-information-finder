<?php
	define("SCRIPTS_ROOT", __DIR__ . "/");
	define("TIMEOUT", 8000);

	require SCRIPTS_ROOT . "util.php";
	
	$startTime = microtime(true);
	error_log("REQUEST START");

	$mh = curl_multi_init();
	$chs = [];

	foreach($_REQUEST["endpoints"] as $i => $endpoint)
	{
		$opts = getOptions($endpoint);

		$ch = curl_init();

		$defOpts = [
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_SSL_VERIFYPEER => false,
			CURLOPT_HEADER => true
		];
		curl_setopt_array($ch, $defOpts);
		curl_setopt_array($ch, $opts);

		$chs[$endpoint] = $ch;
		curl_multi_add_handle($mh, $ch);
		error_log("URL $i - $endpoint: " . curl_getinfo($ch, CURLINFO_EFFECTIVE_URL));
	}

	$active = null;

	do
	{
		$mhr = curl_multi_exec($mh, $active);
	} while ($mhr == CURLM_CALL_MULTI_PERFORM);

	while ($active && ($mhr == CURLM_OK) && ((microtime(true) - $startTime) * 1000 < TIMEOUT))
	{
		if (curl_multi_select($mh) != -1)
		{
			do
			{
				$mhr = curl_multi_exec($mh, $active);
			} while ($mhr == CURLM_CALL_MULTI_PERFORM);
		}
	}

	$output = [];

	foreach($chs as $endpoint => $ch)
	{
		$response = curl_multi_getcontent($ch);
				
		$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
		$body = substr($response, $headerSize);
		$data = json_decode($body, true);
		$output["data"][$endpoint] = $data;

		curl_multi_remove_handle($mh, $ch);
	}

	$output["status"]["code"] = "200";
	$output["status"]["name"] = "OK";
	$output["status"]["description"] = "REQUEST SUCCESS";
	$output["status"]["returnedIn"] = (microtime(true) - $startTime) * 1000 . " ms";
	$output["status"]["timestamp"] = time();

	curl_multi_close($mh);
	error_log("REQUEST END");

	header("Content-type: application/json; charset=UTF-8");
	echo json_encode($output);

	function getOptions($name)
	{
		switch ($name) {
			case "ambeeair":
				$params = [
					"lat" => $_REQUEST["params"]["lat"],
					"lng" => $_REQUEST["params"]["lng"]];
				return [
					CURLOPT_URL => "https://api.ambeedata.com/latest/by-lat-lng?"
						. http_build_query($params),
					CURLOPT_ENCODING => "",
					CURLOPT_MAXREDIRS => 10,
					CURLOPT_HTTPHEADER => ["x-api-key: UJStF31vKf5xU4jyjujfp4gVCUCzFNF4ayq3dhB2"]];

			case "arcgisgeometry":
				$params = [
					"sourceCountry" => $_REQUEST["params"]["isoA2"],
					"geographyQuery" => $_REQUEST["params"]["isoA2"],
					"geographylayers" => "countries",
					"featureLimit" => "1",
					"returnGeometry" => "true",
					"returnCentroids" => "false",
					"generalizationLevel" => "6",
					"f" => "json",
					"token" => getArcgisToken()];
				return [
					CURLOPT_URL => "https://geoenrich.arcgis.com/arcgis/rest/services/World/geoenrichmentserver/StandardGeographyQuery/execute",
					CURLOPT_POSTFIELDS => http_build_query($params),
					CURLOPT_POST => true];

			case "arcgiscentroid":
				$params = [
					"sourceCountry" => $_REQUEST["params"]["isoA2"],
					"geographyQuery" => $_REQUEST["params"]["isoA2"],
					"geographylayers" => "countries",
					"featureLimit" => "1",
					"returnGeometry" => "true",
					"returnCentroids" => "true",
					"generalizationLevel" => "6",
					"f" => "json",
					"token" => getArcgisToken()];
				return [
					CURLOPT_URL => "https://geoenrich.arcgis.com/arcgis/rest/services/World/geoenrichmentserver/StandardGeographyQuery/execute",
					CURLOPT_POSTFIELDS => http_build_query($params),
					CURLOPT_POST => true];

			case "coronatracker":
				$params = ["countryCode" => $_REQUEST["params"]["isoA2"]];
				return [
					CURLOPT_URL => "https://api.coronatracker.com/v3/stats/worldometer/country?"
						. http_build_query($params),
					CURLOPT_ENCODING => "",
					CURLOPT_MAXREDIRS => 10,
					CURLOPT_TIMEOUT => 0,
					CURLOPT_FOLLOWLOCATION => true,
					CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
					CURLOPT_CUSTOMREQUEST => "GET"];

			case "coronatrackerglobal":
				return [
					CURLOPT_URL => "https://api.coronatracker.com/v3/stats/worldometer/global",
					CURLOPT_RETURNTRANSFER => true,
					CURLOPT_ENCODING => "",
					CURLOPT_MAXREDIRS => 10,
					CURLOPT_TIMEOUT => 0,
					CURLOPT_FOLLOWLOCATION => true,
					CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
					CURLOPT_CUSTOMREQUEST => "GET"];

			case "coronatrackertop":
				$params = ["limit" => "50"];
				return [
					CURLOPT_URL => "https://api.coronatracker.com/v3/stats/worldometer/topCountry?limit=50"
						. http_build_query($params),
					CURLOPT_RETURNTRANSFER => true,
					CURLOPT_ENCODING => "",
					CURLOPT_MAXREDIRS => 10,
					CURLOPT_TIMEOUT => 0,
					CURLOPT_FOLLOWLOCATION => true,
					CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
					CURLOPT_CUSTOMREQUEST => "GET"];

			case "coronatrackertrend":
				$params = [
					"countryCode" => $_REQUEST["params"]["isoA2"],
					"startDate" => $_REQUEST["params"]["dateStart"],
					"endDate" => $_REQUEST["params"]["dateEnd"]];
				return [
					CURLOPT_URL => "https://api.coronatracker.com/v5/analytics/trend/country?"
						. http_build_query($params),
					CURLOPT_ENCODING => "",
					CURLOPT_MAXREDIRS => 10,
					CURLOPT_TIMEOUT => 0,
					CURLOPT_FOLLOWLOCATION => true,
					CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
					CURLOPT_CUSTOMREQUEST => "GET"];

			case "openexchangerates":
				$params = [
					"app_id" => "f5294418ac6c451a9339edd1236da330",
					"prettyprint" => "0"];
				return [CURLOPT_URL => "https://openexchangerates.org/api/latest.json?"
					. http_build_query($params)];

			case "openexchangeratesnames":
				$params = [
					"prettyprint" => "0"];
				return [CURLOPT_URL => "https://openexchangerates.org/api/currencies.json?"
					. http_build_query($params)];

			case "opencageforward":
				$params = [
					"q" => $_REQUEST["params"]["city"] . "," . $_REQUEST["params"]["isoA2"],
					"countrycode" => $_REQUEST["params"]["isoA2"],
					"language" => "en",
					"limit" => "1",
					"key" => "dc103693bb5a4721b37e897c555868bd"];
				return [
					CURLOPT_URL => "https://api.opencagedata.com/geocode/v1/json?"
						. http_build_query($params)];

			case "opencagereverse":
				$params = [
					"q" => $_REQUEST["params"]["lat"] . "," . $_REQUEST["params"]["lng"],
					"language" => "en",
					"limit" => "1",
					"key" => "dc103693bb5a4721b37e897c555868bd"];
				return [
					CURLOPT_URL => "https://api.opencagedata.com/geocode/v1/json?"
						. http_build_query($params)];

			case "reliefwebglobal":
				$params = [
					"appname" => "charlesjaye.uk",
					"fields[include][]" => "url_alias",
					"limit" => "50",
					"query[fields][]" => "status",
					"query[value]" => "current",
					"sort[]" => "date:desc"];
				return [
					CURLOPT_URL => "https://api.reliefweb.int/v1/disasters?"
						. http_build_query($params)
						. "&fields[include][]=date.created"
						. "&fields[include][]=primary_country.iso3"
						. "&fields[include][]=primary_type.name"
						. "&fields[include][]=glide"];

			case "reliefwebdisasters":
				$params = [
					"appname" => "charlesjaye.uk",
					"fields[include][]" => "url_alias",
					"limit" => "5",
					"query[fields][]" => "country.iso3",
					"query[value]" => $_REQUEST["params"]["isoA3"],
					"sort[]" => "date:desc"];
				return [
					CURLOPT_URL => "https://api.reliefweb.int/v1/disasters?"
						. http_build_query($params)
						. "&fields[include][]=date.created"
						. "&fields[include][]=status"
						. "&fields[include][]=primary_type.name"
						. "&fields[include][]=glide"
						. "&fields[include][]=description"];

			case "reliefwebreports":
				$params = [
					"appname" => "charlesjaye.uk",
					"fields[include][]" => "url_alias",
					"limit" => "5",
					"query[fields][]" => "primary_country.iso3",
					"query[value]" => $_REQUEST["params"]["isoA3"],
					"sort[]" => "date:desc"];
				return [
					CURLOPT_URL => "https://api.reliefweb.int/v1/reports?"
						. http_build_query($params)
						. "&fields[include][]=date.created"
						. "&fields[include][]=source.shortname"
						. "&fields[include][]=format.name"
						. "&fields[include][]=theme.name"];

			case "restcountries":
				return [
					CURLOPT_URL => "https://restcountries.eu/rest/v2/alpha/" . $_REQUEST["params"]["isoA2"]];
					

			case "thenews":
				$params = [
					"api_token" => "hZMlLOzvwOC1SDEHHY93FgFfxZW0x41g96oIvBrn",
					"search" => $_REQUEST["params"]["city"] . "|" . $_REQUEST["params"]["isoA2"],
					"locale" => strtolower($_REQUEST["params"]["isoA2"]),
					"categories" => "business,health,politics",
					"exclude_categories" => "entertainment",
					"language" => "en",
					"published_after" => "2000",
					"limit" => "5"];
				return [
					CURLOPT_URL => "https://api.thenewsapi.com/v1/news/top?"
						. http_build_query($params)];

			case "wikimedia":
				$params = [
					"action" => "query",
					"format" => "json",
					"generator" => "geosearch",
					"ggscoord" => $_REQUEST["params"]["lat"] . "|" . $_REQUEST["params"]["lng"],
					"ggsradius" => "10000",
					"ggslimit" => "10",
					"prop" => "pageimages|extracts",
					"exintro" => "",
					"exlimit" => "10",
					"exchars" => "100",
					"explaintext" => ""];
				return [
					CURLOPT_URL => "https://en.wikipedia.org/w/api.php?"
						. http_build_query($params)];

			case "yahooweather":
				return getYahooOptions();

			default:
				return null;
		}
	}

    function getArcgisToken()
    {
        $ini = getIni();
    
        if (($ini["token"] === "") || ($ini["expiry"] < (time() - 30))) 
        {
            $params = [
                "client_id" => "JRVrhUf3iFzkWBrd",
                "client_secret" => "c770aaf790d84c509c123d14de5d98ae",
                "grant_type" => "client_credentials",
                "expiration" => "720",
                "f" => "json"];
            $options = [
                CURLOPT_URL => "https://www.arcgis.com/sharing/rest/oauth2/token",
                CURLOPT_POSTFIELDS => http_build_query($params),
                CURLOPT_POST => true];
    
            $curl = curl("arcgisgenerate", $options);
	
			if ($curl)
			{
				$ini["token"] = $curl["access_token"];
				$ini["expiry"] = time() + $curl["expires_in"];
				
				replaceIni($ini);
			}
        }
        
        return $ini["token"];
	}
	
	function getYahooOptions()
	{
		$url = "https://weather-ydn-yql.media.yahoo.com/forecastrss";
		$app_id = "eb41oU1e";
		$consumer_key = "dj0yJmk9V2xqTTZFaW1HR2xRJmQ9WVdrOVpXSTBNVzlWTVdVbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PTkz";
		$consumer_secret = "fe8ae6cb89516e06ff912a1e98c023f35cf9f42d";
		
		function buildBaseString($baseURI, $method, $params)
		{
			$r = [];
			ksort($params);
			foreach($params as $key => $value) {
				$r[] = "$key=" . rawurlencode($value);
			}
			return $method . "&" . rawurlencode($baseURI) . "&" . rawurlencode(implode("&", $r));
		}
		
		function buildAuthorizationHeader($oauth)
		{
			$r = "Authorization: OAuth ";
			$values = [];
			foreach($oauth as $key=>$value) {
				$values[] = "$key=\"" . rawurlencode($value) . "\"";
			}
			$r .= implode(", ", $values);
			return $r;
		}
		
		$query = [
			"format" => "json",
			"lat" => $_REQUEST["params"]["lat"],
			"lon" => $_REQUEST["params"]["lng"],
			"u" => "c"];
		$oauth = [
			"oauth_consumer_key" => $consumer_key,
			"oauth_nonce" => uniqid(mt_rand(1, 1000)),
			"oauth_signature_method" => "HMAC-SHA1",
			"oauth_timestamp" => time(),
			"oauth_version" => "1.0"];
		
		$base_info = buildBaseString($url, "GET", array_merge($query, $oauth));
		$composite_key = rawurlencode($consumer_secret) . "&";
		$oauth["oauth_signature"] = base64_encode(hash_hmac("sha1", $base_info, $composite_key, true));
		
		return [
			CURLOPT_HTTPHEADER => [buildAuthorizationHeader($oauth), "X-Yahoo-App-Id: $app_id"],
			CURLOPT_URL => $url . "?" . http_build_query($query)];
	}
?>