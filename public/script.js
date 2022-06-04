/* global axios, Vue  */

const sources = [
	// { sourceType: "hacker-news", sourceLabel: "Hacker News", color: "#D01F25" },
	// { sourceType: "product-hunt", sourceLabel: "Product Hunt", color: "#D01F25" },
	// { sourceType: "designer-news", sourceLabel: "Designer News", color: "#D01F25" },
	// { sourceType: "techcrunch", sourceLabel: "TechCrunch", color: "#D01F25" },
	{ sourceType: "hindu", sourceLabel: "The Hindu", color: "#D01F25" },
	{ sourceType: "hindu-business", sourceLabel: "The Hindu - Business", color: "#D01F25" },
	{ sourceType: "india-today", sourceLabel: "India Today", color: "#D01F25" },
	{ sourceType: "toi", sourceLabel: "Times of India", color: "#D01F25" },
	{ sourceType: "toi-business", sourceLabel: "Times of India - Business", color: "#D01F25" },
	{ sourceType: "ie-world", sourceLabel: "Indian Express - World", color: "#D01F25" },
	{ sourceType: "ie-india", sourceLabel: "Indian Express - India", color: "#D01F25" },
	{ sourceType: "mc-business", sourceLabel: "MoneyControl - Business", color: "#D01F25" },
	{ sourceType: "cnbc-business", sourceLabel: "CNBC - Business", color: "#D01F25" },
	{ sourceType: "fe", sourceLabel: "Financial Express", color: "#D01F25" },
	{ sourceType: "zee-business", sourceLabel: "Zee Business", color: "#D01F25" },
	{ sourceType: "business-line", sourceLabel: "Business Line", color: "#D01F25" },
	{ sourceType: "bloomberg-quint", sourceLabel: "Bloomberg Quint", color: "#D01F25" },
	{ sourceType: "et", sourceLabel: "Economic Times", color: "#D01F25" },
	{ sourceType: "pib", sourceLabel: "Press Information Bureau", color: "#D01F25" },
	{ sourceType: "bhaskar-raj", sourceLabel: "Bhaskar Rajasthan", color: "#D01F25" },
	{ sourceType: "bhaskar-delhi", sourceLabel: "Bhaskar NewDelhi", color: "#D01F25" },
	// { sourceType: "dev-to", sourceLabel: "Dev Community", color: "#D01F25", darkModeColor: "#ffffff" },
	// { sourceType: "the-next-web", sourceLabel: "The Next Web", color: "#D01F25" },
	// { sourceType: "medium-technology", sourceLabel: "Medium (Technology)", color: "#D01F25", darkModeColor: "#ffffff" },
	// { sourceType: "smashing-magazine", sourceLabel: "Smashing Magazine", color: "#D01F25" },
	// { sourceType: "engadget", sourceLabel: "Engadget", color: "#D01F25", darkModeColor: "#ffffff" },
	// { sourceType: "the-verge", sourceLabel: "The Verge", color: "#D01F25" },
	// { sourceType: "wired", sourceLabel: "Wired", color: "#D01F25", darkModeColor: "#ffffff" },
];
const selectedSources = (window.localStorage.selectedSources ?? "hacker-news,product-hunt,techcrunch").split(",");

const App = Vue.createApp({
	data() {
		return {
			online: true,
			visible: true,
			loading: true,
			showSources: false,
			showAll: false,
			selectedSources: selectedSources,
			sources: sources.map((s) => ({ ...s, isSelected: selectedSources.includes(s.sourceType) })),
			articles: [],
		};
	},
	computed: {
		showAllButton() {
			return this.articles.length > 50 && !this.showAll;
		},
	},
	methods: {
		setNetworkStatus() {
			this.online = navigator.onLine;
		},
		setVisibility() {
			this.visible = document.visibilityState === "visible";
		},
		fetchArticles() {
			this.loading = true;
			axios.get(`/api/?sources=${this.selectedSources.join(",")}`).then((response) => {
				const { items } = response.data;
				this.articles = items;
				this.loading = false;
				this.showAll = false;
			});
		},
		getTextColor(sourceType) {
			return this.sources.find((s) => s.sourceType === sourceType).color;
		},
		toggleShowSourcesPage() {
			if (this.showSources) {
				document.body.style.backgroundColor = "#ffffff";
				this.fetchArticles();
			} else {
				document.body.style.backgroundColor = "#161616";
			}
			this.showSources = !this.showSources;
		},
		toggleSelectedSources(sourceType) {
			const newSources = this.sources.map((s) => ({
				...s,
				isSelected: s.sourceType === sourceType ? !s.isSelected : s.isSelected,
			}));
			this.sources = newSources;
			const selectedSourceTypes = newSources.filter((s) => s.isSelected).map((s) => s.sourceType);
			this.selectedSources = selectedSourceTypes;
			window.localStorage.selectedSources = selectedSourceTypes.join(",");
		},
		formatDate: function(dateString) {
			const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
			let interval = seconds / 31536000;
			if (interval > 1) return Math.floor(interval) + "Y";
			interval = seconds / 2592000;
			if (interval > 1) return Math.floor(interval) + "M";
			interval = seconds / 86400;
			if (interval > 1) return Math.floor(interval) + "d";
			interval = seconds / 3600;
			if (interval > 1) return Math.floor(interval) + "h";
			interval = seconds / 60;
			if (interval > 1) return Math.floor(interval) + "m";
			return "now";
		},
	},
}).mount("#app");

window.addEventListener("online", App.setNetworkStatus);
window.addEventListener("offline", App.setNetworkStatus);
document.addEventListener("visibilitychange", App.setVisibility);

if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("/sw.js");
}
App.fetchArticles();
