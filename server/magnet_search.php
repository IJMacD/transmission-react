<?php
ini_set('display_errors', 1);
header("Access-Control-Allow-Origin: *");

$base = "https://1337x.to";

if (isset($_GET['search'])) {
	$results = search($_GET['search']);
	if ($results) {
		header("Content-Type: application/json");
		echo json_encode($results);
	}
	else {
		header("HTTP/1.1 500 Server Error");
		echo "Unable to parse upstream response";
	}
} else {
	echo '<html><body><form><input name="search" type="search" placeholder="Search" /><button>Search</button></form></body></html>';
}

function search ($term) {
	global $base;
	$str = file_get_contents($base . "/search/" . $term . '/1/');

	$doc = new DOMDocument();
	@$doc->loadHTML($str);

	$tbodyList = $doc->getElementsByTagName('tbody');

	if($tbodyList->length !== 1) {
		return null;
	}

	/** @var DOMElement $tbody */
	$tbody = $tbodyList->item(0);
	$rows = $tbody->getElementsByTagName("tr");

	$out = [];
	$links = [];

	/** @var DOMElement $row */
	foreach ($rows as $row) {
		$cells 	= $row->getElementsByTagName("td");
		$linkEl	= $cells->item(0)->childNodes->item(1);
		$link 	= $base . $linkEl->attributes->getNamedItem("href")->textContent;

		$links[] = $link;

		$out[] = [
			'name'		=> $linkEl->textContent,
			'link'		=> $link,
			'seeds' 	=> $cells->item(1)->textContent,
			'leeches' 	=> $cells->item(2)->textContent,
			'size' 		=> $cells->item(4)->firstChild->textContent,
		];
	}

	$details = fetchMultiple($links);

	for ($i = 0; $i < count($details); $i++) {
		$out[$i]['magnet'] = parseMagnet($details[$i]);
	}

	return $out;
}

function fetchMultiple ($urls) {
	$mh = curl_multi_init();
	$ch_list = [];
	$out_data = [];

	foreach ($urls as $url) {
		$ch = curl_init($url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

		curl_multi_add_handle($mh, $ch);

		$ch_list[] = $ch;
	}

	do {
		$status = curl_multi_exec($mh, $active);
		if ($active) {
			// Wait a short time for more activity
			curl_multi_select($mh);
		}
	} while ($active && $status == CURLM_OK);

	foreach ($ch_list as $ch) {
		curl_multi_remove_handle($mh, $ch);
		$data = curl_multi_getcontent($ch);

		$out_data[] = $data;
	}

	curl_multi_close($mh);

	return $out_data;
}

function parseMagnet ($html) {
	$doc = new DOMDocument();
	@$doc->loadHTML($html);

	$aList = $doc->getElementsByTagName("a");

	/** @var DOMElement $a */
	foreach($aList as $a) {
		$href = $a->attributes->getNamedItem("href")->textContent;
		if (substr($href, 0, 7) === "magnet:") {
			return $href;
		}
	}
}