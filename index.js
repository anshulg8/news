const express = require("express");
const axios = require("axios");
const path = require("path");
const { parse: rssParse } = require("rss-to-json");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public"), { maxAge: 0 }));
app.use(express.static(path.join(__dirname, "node_modules/vue/dist/")));
app.use(express.static(path.join(__dirname, "node_modules/axios/dist/")));

app.get("/api", async (req, res) => {
	const requestedServices = req.query.sources
		? req.query.sources.split(",")
		: supportedSources.map((s) => s.sourceType);

	const articles = await Promise.all(
		supportedSources
			.filter((s) => requestedServices.includes(s.sourceType))
			.map((source) => {
				const { sourceLabel, sourceType } = source;
				return source.fetcher({ sourceLabel, sourceType });
			})
	);

	const flatArticles = articles.flat();

	const flatSortedArticles = flatArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

	res.json({ items: flatSortedArticles, count: flatSortedArticles.length });
});

const fetchFromRSS = async (url, sourceLabel, sourceType) => {
	try {
		var rss = await rssParse(url);
		const items = rss.items.map((item) => {
			const { title, link, created, published, author } = item;
			return { title, url: link, date: new Date(created ?? published), author, sourceLabel, sourceType };
		});
		return items;
	} catch (error) {
		console.error(error);
		return [];
	}
};

const fetchHackerNews = async ({ sourceLabel, sourceType }) => {
	try {
		const topStories = (await axios.get("https://hacker-news.firebaseio.com/v0/topstories.json")).data;

		// filter out only the top 30 items and fetch their details
		const top20Stories = await Promise.all(
			topStories.slice(0, 30).map((id) => axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`))
		);

		const stories = top20Stories.map((t) => {
			const { title, url, time, author } = t.data;
			return { title, url, date: new Date(time * 1000), author, sourceLabel, sourceType };
		});

		return stories;
	} catch (error) {
		console.error(error);
		return [];
	}
};

const fetchProductHunt = async ({ sourceLabel, sourceType }) => {
	try {
		const developerToken = process.env.PH_DEVELOPER_TOKEN;

		const getTopProducts = (
			await axios.get("https://api.producthunt.com/v1/posts", {
				headers: {
					Authorization: `Bearer ${developerToken}`,
				},
			})
		).data;

		const topProducts = getTopProducts.posts.map((post) => {
			const { name, tagline, discussion_url, created_at, user } = post;

			return {
				title: `${name} - ${tagline}`,
				url: discussion_url,
				date: new Date(created_at),
				author: user.name,
				sourceLabel,
				sourceType,
			};
		});

		return topProducts;
	} catch (error) {
		console.error(error);
		return [];
	}
};

const fetchDevTo = async ({ sourceLabel, sourceType }) => {
	try {
		const topArticles = (await axios.get("https://dev.to/api/articles")).data;

		const articles = topArticles.map((article) => {
			const { title, url, created_at, user } = article;
			return { title, url, date: new Date(created_at), author: user.name, sourceLabel, sourceType };
		});
		return articles;
	} catch (error) {
		console.error(error);
		return [];
	}
};

const fetchDesignerNews = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://www.designernews.co/?format=rss", sourceLabel, sourceType);

const fetchIEWorld = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://indianexpress.com/section/world/feed/", sourceLabel, sourceType);

const fetchIEIndia = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://indianexpress.com/section/india/feed/", sourceLabel, sourceType);

const fetchHinduNews = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://thehindu.com/business/feeder/default.rss", sourceLabel, sourceType)

const fetchHinduBusinessNews = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://www.thehindu.com/business/feeder/default.rss", sourceLabel, sourceType)

const fetchIndiaToday = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://www.indiatoday.in/rss/home", sourceLabel, sourceType)

const fetchTOITop = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://timesofindia.indiatimes.com/rssfeedstopstories.cms", sourceLabel, sourceType)

const fetchTOIBusiness = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://timesofindia.indiatimes.com/rssfeeds/1898055.cms", sourceLabel, sourceType)

const fetchHTWorld = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml", sourceLabel, sourceType)

const fetchHTIndia = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml", sourceLabel, sourceType)

const fetchMoneyControlBusiness = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://www.moneycontrol.com/rss/business.xml", sourceLabel, sourceType)

const fetchCNBCBusiness = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664", sourceLabel, sourceType)

const fetchFinancialExpress = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://www.financialexpress.com/feed/", sourceLabel, sourceType)

const fetchZeeBusiness = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://www.zeebiz.com/latest.xml/feed", sourceLabel, sourceType)

const fetchBusinessLine = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://www.thehindubusinessline.com/?service=rss", sourceLabel, sourceType)

const fetchBloombergQuint = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://prod-qt-images.s3.amazonaws.com/production/bloombergquint/feed.xml", sourceLabel, sourceType)

const fetchETHome = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://economictimes.indiatimes.com/rssfeedsdefault.cms", sourceLabel, sourceType)

const fetchBhaskarRajasthan = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://www.bhaskar.com/rss-v1--category-1740.xml", sourceLabel, sourceType)

const fetchBhaskarNewDelhi = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://www.bhaskar.com/rss-v1--category-7140.xml", sourceLabel, sourceType)

const fetchTechCrunch = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://techcrunch.com/feed/", sourceLabel, sourceType);

const fetchTheNextWeb = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://thenextweb.com/feed", sourceLabel, sourceType);

const fetchSmashingMagazine = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://www.smashingmagazine.com/feed", sourceLabel, sourceType);

const fetchEngadget = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://www.engadget.com/rss.xml", sourceLabel, sourceType);

const fetchTheVerge = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://www.theverge.com/rss/index.xml", sourceLabel, sourceType);

const fetchWired = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://www.wired.com/feed", sourceLabel, sourceType);

const fetchMediumTechnology = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://medium.com/feed/tag/technology", sourceLabel, sourceType);

const fetchPBI = async ({ sourceLabel, sourceType }) =>
	await fetchFromRSS("https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3", sourceLabel, sourceType);

const supportedSources = [
	// { sourceType: "hacker-news", sourceLabel: "Hacker News", fetcher: fetchHackerNews },
	// { sourceType: "product-hunt", sourceLabel: "Product Hunt", fetcher: fetchProductHunt },
	{ sourceType: "hindu", sourceLabel: "The Hindu", fetcher: fetchHinduNews },
	{ sourceType: "hindu-business", sourceLabel: "The Hindu - Business", fetcher: fetchHinduBusinessNews },
	{ sourceType: "india-today", sourceLabel: "India Today", fetcher: fetchIndiaToday },
	{ sourceType: "toi", sourceLabel: "Times of India", fetcher: fetchTOITop },
	{ sourceType: "toi-business", sourceLabel: "Times of India - Business", fetcher: fetchTOIBusiness },
	{ sourceType: "ie-world", sourceLabel: "Indian Express - World", fetcher: fetchIEWorld },
	{ sourceType: "ie-india", sourceLabel: "Indian Express - India", fetcher: fetchIEIndia },
	{ sourceType: "ht-world", sourceLabel: "Hindustan Times - World", fetcher: fetchHTWorld },
	{ sourceType: "ht-india", sourceLabel: "Hindustan Times - India", fetcher: fetchHTIndia },
	{ sourceType: "mc-business", sourceLabel: "MoneyControl - Business", fetcher: fetchMoneyControlBusiness },
	{ sourceType: "cnbc-business", sourceLabel: "CNBC - Business", fetcher: fetchCNBCBusiness },
	{ sourceType: "fe", sourceLabel: "Financial Express", fetcher: fetchFinancialExpress },
	{ sourceType: "zee-business", sourceLabel: "Zee Business", fetcher: fetchZeeBusiness },
	{ sourceType: "business-line", sourceLabel: "Business Line", fetcher: fetchBusinessLine },
	{ sourceType: "bloomberg-quint", sourceLabel: "Bloomberg Quint", fetcher: fetchBloombergQuint },
	{ sourceType: "et", sourceLabel: "ET", fetcher: fetchETHome },
	{ sourceType: "bhaskar-raj", sourceLabel: "Bhaskar Rajasthan", fetcher: fetchBhaskarRajasthan },
	{ sourceType: "bhaskar-delhi", sourceLabel: "Bhaskar NewDelhi", fetcher: fetchBhaskarNewDelhi },
	{ sourceType: "pib", sourceLabel: "PBI", fetcher: fetchPBI },
	// { sourceType: "designer-news", sourceLabel: "Designer News", fetcher: fetchDesignerNews },
	// { sourceType: "techcrunch", sourceLabel: "TechCrunch", fetcher: fetchTechCrunch },
	// { sourceType: "dev-to", sourceLabel: "Dev Community", fetcher: fetchDevTo },
	// { sourceType: "the-next-web", sourceLabel: "The Next Web", fetcher: fetchTheNextWeb },
	// { sourceType: "smashing-magazine", sourceLabel: "Smashing Magazine", fetcher: fetchSmashingMagazine },
	// { sourceType: "engadget", sourceLabel: "Engadget", fetcher: fetchEngadget },
	// { sourceType: "the-verge", sourceLabel: "The Verge", fetcher: fetchTheVerge },
	// { sourceType: "wired", sourceLabel: "Wired", fetcher: fetchWired },
	// { sourceType: "medium-technology", sourceLabel: "Medium", fetcher: fetchMediumTechnology },
];

// const fetchTemplate = async ({ sourceLabel, sourceType }) => {
// 	try {
// 	} catch (error) {
// 		console.error(error);
// 		return [];
// 	}
// };

app.listen(port, () => console.log(`Server running on ${port}, http://localhost:${port}`));

module.exports = app;
