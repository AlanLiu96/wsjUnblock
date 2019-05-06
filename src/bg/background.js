// mask as googlebot for user agent
// from https://support.google.com/webmasters/answer/1061943
const UA_Desktop = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
const UA_Mobile = "Chrome/41.0.2272.96 Mobile Safari/537.36 (compatible ; Googlebot/2.1 ; +http://www.google.com/bot.html)"

// new http header parameters to override
const newHeader = {
	referer: {
		name: "Referer",
		value: "https://www.facebook.com", // or "https://www.twitter.com"
	},
	cookie: {
		name: "Cookie",
		value: ""
	},
	cachecontrol: {
		name: "Cache-Control",
		value: "max-age=0"
	},
	user_agent: {
		name: "User-Agent",
		value: UA_Desktop
	},
	forwarded_for: { //needed in case ip checks for googlebot
		name: "X-Forwarded-For",
		value: "66.249.66.1" // googlebot's ip :) 
	}
};

// sites that we want to access
const sites = {
	washingtonpost: {
		js: [
			"*://*.washingtonpost.com/*pwapi/*.js*", // this one causes paywall/ad-wall lightbox for every article
			"*://*.washingtonpost.com/*drawbridge/drawbridge.js?_*", // this one causes paywall/ad-wall lightbox sometimes with Adblock Plus enabled
		]
	},
	wsj: {
		url: "*://*.wsj.com/*",
		js: [
			"*://*/*cxense-candy.js", // this one causes a pop up advertisement for every article
		]
	},
	ft: {
		url: "*://*.ft.com/*",
	},
	nyt: {
		url: "*://*.nytimes.com/*",
		js: [
			"*://*.com/*mtr.js", // this one causes a pop up asking for subscription
		]
	},
	bloomberg: {
		url: "*://*.bloomberg.com/*",
		js: [
			"*://*.bwbx.io/s3/javelin/public/javelin/js/pianola/*",
		]
	},
	economist: {
		url: "*://*.economist.com/*",
	},
	medium: {
		url: "*://*.medium.com/*",
	},
	quora: {
		url: "*://*.quora.com/*",
	},
	linkedin: {
		url: "*://*.linkedin.com/*",
	}
};

// extract all script urls we want to block
var script_urls = Object.values(sites)
                .map(site => site.js)
                .filter(Array.isArray)
                .reduce((prev, curr) => prev.concat(curr), []);

// extract all main_frame urls we want to override
var main_frame_urls = Object.values(sites)
                    .map(site => site.url)
                    .filter(url => url);

// add Firefox and Edge support with the global `browser` object
browser = typeof browser !== "undefined" ? browser : chrome;

browser.webRequest.onBeforeRequest.addListener(
	function() {
		console.log("we are going to block some low energy javascripts");

		return { cancel: true };
	}, {
		urls: script_urls,
		// target is script
		types: [ "script" ]
	},
	[ "blocking" ]
);

browser.webRequest.onBeforeSendHeaders.addListener(
	function(details) {
		console.log("we are going to override some request headers");

		// remove existing referer and cookie
		for (let i = 0; i < details.requestHeaders.length; i++) {
			if (details.requestHeaders[i].name === newHeader.referer.name || 
				details.requestHeaders[i].name === newHeader.cookie.name ||
				details.requestHeaders[i].name === newHeader.user_agent.name ||
				details.requestHeaders[i].name === newHeader.forwarded_for.name) {
				details.requestHeaders.splice(i, 1);
				i--;
			}
		}

		// add new referer
		details.requestHeaders.push(newHeader.referer);
		// remove cache
		details.requestHeaders.push(newHeader.cachecontrol);
		details.requestHeaders.push(newHeader.user_agent);
		details.requestHeaders.push(newHeader.forwarded_for);

		return { requestHeaders: details.requestHeaders };
	}, {
		urls: main_frame_urls,
		// target is the document that is loaded for a top-level frame
		types: [ "main_frame" ]
	},
	[ "blocking", "requestHeaders" ]
);
