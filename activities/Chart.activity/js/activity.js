// Rebase require directory
requirejs.config({
	baseUrl: "lib",
	paths: {
		activity: "../js",
	},
});

// CONSTANTS
const CHART_TYPES = {
	line: "stringLineChart",
	horizontalBar: "stringHorizontalBarChart",
	bar: "stringVerticalBarChart",
	pie: "stringPieChart",
};

// APP
const app = new Vue({
	el: "#app",
	components: {
		chartview: ChartView,
	},
	data: {
		currentenv: null,
		SugarL10n: null,
		SugarPresence: null,
		activityTitle: "Chart Activity",
		tabularData: [],
		pref: {
			chartType: "bar",
			chartColor: { stroke: "", fill: "" },
			labels: {x: "", y: ""},
			font: {
				propertyOrder: ["title", "labels", "tick"],
				title: {fontsize: 26, fontfamily: "Arial", color: "#005fe4"},
				labels: {fontsize: 22, fontfamily: "Arial", color: "#555555"},
				tick: {fontsize: 14, fontfamily: "Arial", color: "#282828"},
			} 
		},
		selectedField: 0,
		selectedFontIdx: 0,
		// TODO: implement collaboration
		isUpdated: false,
		l10n: {
			stringChartActivity: "",
			stringAddValue: "",
			stringRemoveValue: "",
			stringVerticalBarChart: "",
			stringHorizontalBarChart: "",
			stringLineChart: "",
			stringPieChart: "",
			stringChartColor: "",
			stringLineColor: "",
			stringHorizontalLabel: "",
			stringVerticalLabel: "",
			stringFontColor: "",
			stringSelectFont: "",
			stringTitleFont: "",
			stringLabelsFont: "",
			stringTickFont: "",
			stringFontMinusButton: "",
			stringFontPlusButton: "",
			stringFullscreen: "",
			stringNetwork: "",
			stringMoveUp: "",
			stringMoveDown: "",
			stringLabel: "",
			stringValue: "",
			stringHelp: "",
			stringConfigs: "",
			stringTextPalette: "",
			stringTutoPrev: "",
			stringTutoNext: "",
			stringTutoEnd: "",

			stringTutoExplainContent: "",
			stringTutoAddData: "",
			stringTutoAddButton: "",
			stringTutoRemoveButton: "",
			stringTutoChartTitle: "",
			stringTutoChartType: "",
			stringTutoConfig: "",
			stringTutoSaveImage: "",
			stringTutoReadActivity: "",
			stringTutoReadStopWatch: "",
			stringTutoReadMeasure: "",
			
			stringLines: "",
			stringVerticalBars: "",
			stringHorizontalBars: "",
			stringInvalidValue: "",
			stringSaveImage: "",
			stringReadStopWatch: "",
			stringReadMeasure: "",
			stringNoData: "",
			stringInvalidFile: "",
		},
		configActive: false,
		textPalActive: false,
		isFullscreen: false,
	},
	created() {
		this.palettes = {};
	},
	mounted() {
		this.SugarL10n = this.$refs.SugarL10n;
		this.SugarPresence = this.$refs.SugarPresence;
	},
	methods: {
		initialized() {
			const refs = this.$refs;
			this.chartview = refs.chartview;
			this.palettes.strokeColor = refs.strokeColorPal.paletteObject;
			this.palettes.fillColor = refs.fillColorPal.paletteObject;
			this.palettes.textColor = refs.textColorPal.paletteObject;
			this.palettes.font = refs.fontPal.paletteObject;
			this.palettes.share = refs.sharedPal.paletteObject;

			this.currentenv = refs.SugarActivity.getEnvironment();
			const { stroke, fill } = this.currentenv.user.colorvalue;

			this.pref.chartColor = { stroke, fill };
			this.activityTitle = this.currentenv.activityName;
			this.updatePalletes();

			const that = this;
			const input = document.querySelector("#activity-palette .container input");
			input.addEventListener("input", (e) => {
				that.activityTitle = e.target.value;
				this.chartview.updateTitle(e.target.value);
			});
		},
		localized() {
			const randArr = this.shuffleArray([1, 2, 3, 4, 5, 6]);
			for(let i = 0; i < 3; i++) {
				const label = "EgLabel" + randArr[i];
				this.tabularData.push({
					x: this.SugarL10n.get(label),
					y: randArr[i] + 6,
				})
			}
			this.pref.labels.x = this.SugarL10n.get("Sports") +" →";
			this.pref.labels.y = this.SugarL10n.get("Students") +" →";
			this.SugarL10n.localize(this.l10n);
		},

		addData() {
			this.tabularData.push({
				x: (this.tabularData.length + 1),
				y: Math.floor((Math.random() * 10 + 1))+"",
			});
			var lastIdx = this.tabularData.length - 1;
			this.$nextTick(function () {
				this.$refs.input[lastIdx].focus();
			});
			this.selectedField = lastIdx;
		},
		removeData() {
			if (this.selectedField < 0) return;
			this.tabularData.splice(this.selectedField, 1);
			this.selectedField--;
			if (this.selectedField < 0)
				this.selectedField += this.tabularData.length;
		},
		validateInput(e, index) {
			const value = e.target.value
				.replace(/[^0-9.-]/g, "") //Remove char that are not digits, points, or negative sign
				.replace(/(\..*?)\..*/g, "$1") // Keep only the first occurrence of a "." 	
				.replace(/(?!^)-/g, ''); //Remove "-" sign (if not at the beginning)
			this.tabularData[index].y = value;
			e.target.value = value;
		},

		swapData(a, b) {
			let tmp = this.tabularData[a];
			this.tabularData[a] = this.tabularData[b];
			this.$set(this.tabularData, b, tmp);
		},
		swapUp() {
			const i = this.selectedField;
			if (i >= 1) {
				this.swapData(i, i - 1);
				this.selectedField--;
			}
		},
		swapDown() {
			const i = this.selectedField;
			if (i <= this.tabularData.length - 2) {
				this.swapData(i, i + 1);
				this.selectedField++;
			}
		},

		popDownPal() {
			for (const key in this.palettes)
				this.palettes[key] && this.palettes[key].popDown();				
		},
		toggleConfig() {
			this.configActive = !this.configActive;
			this.textPalActive = false;
			this.popDownPal();
		},
		toggleTextPal() {
			this.textPalActive = !this.textPalActive;
			this.configActive = false;
			this.popDownPal();
		},

		onNetworkDataReceived(msg) {
			this.isUpdated = true;
			const data = msg.content.data;
			switch (msg.content.action) {
				case "init":
					this.tabularData = data;
					break;
				case "update":
					this.$set(this.tabularData, data.index, data.values);
					break;
			}
		},
		onNetworkUserChanged(msg) {
			// Handling only by the host
			if (this.SugarPresence.isHost) {
				this.SugarPresence.sendMessage({
					user: this.SugarPresence.getUserInfo(),
					content: {
						action: "init",
						data: this.tabularData,
					},
				});
			}
		},

		onJournalSharedInstance() {},

		onJournalNewInstance() {
			this.chartview.updateTitle(this.l10n.stringChartActivity);
		},
		onJournalDataLoaded(data, metadata) {
			this.tabularData = data.tabularData;
			this.updatePreference(data.pref);
		},
		insertBackground() {
			var filters = [
				// { activity: "org.sugarlabs.StopwatchActivity" },
				{ mimetype: "text/plain" },
			];

			this.$refs.SugarJournal.insertFromJournal(filters).then((data, metadata) => {
				console.log("Jounal Dialog data");
				console.log(data);
				// document.getElementById("app").style.backgroundImage = `url(${data})`;
			});
		},

		onAddImage() {
			const { imgData, metadata } = this.chartview.getImgData();
			this.$refs.SugarJournal.createEntry(imgData, metadata);
		},

		sendPresenceMessage(action, data) {
			if (this.SugarPresence.isShared()) {
				var message = {
					user: this.SugarPresence.getUserInfo(),
					content: {
						action,
						data,
					},
				};
				this.SugarPresence.sendMessage(message);
			}
		},

		// Handlers
		handleChartColor(e, type) {
			this.pref.chartColor[type] = e.detail.color;
		},
		handleTextColor(e) {
			this.selectedFontField.color = e.detail.color;	
		}, 
		handleFontFamily(e) {
			this.selectedFontField.fontfamily = e.detail.family;	
		},
		handleFontSize(value) {
			let fontsize = this.selectedFontField.fontsize;
			fontsize += value;
			this.selectedFontField.fontsize = Math.min(Math.max(10, fontsize), 55);
		},
		updatePalletes() {
			this.palettes.strokeColor.setColor(this.pref.chartColor.stroke);
			this.palettes.fillColor.setColor(this.pref.chartColor.fill);
			this.palettes.textColor.setColor(this.pref.font.title.color);
			this.palettes.font.setFont(this.pref.font.title.fontfamily);
		},
		updateFontField(index) {
			this.selectedFontIdx = index;
			this.palettes.textColor.setColor(this.selectedFontField.color);
			this.palettes.font.setFont(this.selectedFontField.fontfamily);
		},
		updatePreference(prefObj) {
			this.pref = prefObj;
			this.$nextTick(function () {
				// Maintain order so chartType pie can update colors
				this.chartview.updateChartColor();
				this.chartview.updateChartType();
				this.updatePalletes();
				["x", "y"].forEach(axis => {
					this.chartview.updateLabel(axis);
				});
				["color", "fontsize", "fontfamily"].forEach(field => {
					this.pref.font.propertyOrder.forEach(property  => {
						this.chartview.updateFontValues(property, field);
					});
				});
			});
		},

		onHelp() {
			const steps = [
				{
					title: this.l10n.stringChartActivity,
					intro: this.l10n.stringTutoExplainContent,
				},
				{
					element: "#activity-button",
					position: "bottom",
					title: this.l10n.stringChartActivity,
					intro: this.l10n.stringTutoChartTitle,
				},
				{
					element: "#add-button",
					position: "bottom",
					title: this.l10n.stringAddValue,
					intro: this.l10n.stringTutoAddData,
				},
				{
					element: "#remove-button",
					position: "bottom",
					title: this.l10n.stringRemoveValue,
					intro: this.l10n.stringTutoRemoveButton,
				},
				{
					title: this.l10n.stringChartActivity,
					intro: this.l10n.stringTutoChartType,
				},
				{
					element: "#line-chart-button",
					position: "bottom",
					title: this.l10n.stringLineChart,
					intro: this.l10n.stringLines,
				},
				{
					element: "#horizontalBar-chart-button",
					position: "bottom",
					title: this.l10n.stringHorizontalBarChart,
					intro: this.l10n.stringHorizontalBars,
				},
				{
					element: "#bar-chart-button",
					position: "bottom",
					title: this.l10n.stringVerticalBarChart,
					intro: this.l10n.stringVerticalBars,
				},
				{
					element: "#pie-chart-button",
					position: "bottom",
					title: this.l10n.stringPieChart,
					intro: this.l10n.stringPieChart,
				},
				{
					element: "#config-button",
					position: "bottom",
					title: this.l10n.stringConfigs,
					intro: this.l10n.stringTutoConfig,
				},
				{
					element: "#text-palette-button",
					position: "bottom",
					title: this.l10n.stringTextPalette,
					intro: this.l10n.stringTextPalette,
				},
				{
					element: "#title-font-button",
					position: "bottom",
					title: this.l10n.stringTitleFont,
					intro: this.l10n.stringTitleFont,
				},
				{
					element: "#labels-font-button",
					position: "bottom",
					title: this.l10n.stringLabelsFont,
					intro: this.l10n.stringLabelsFont,
				},
				{
					element: "#tick-font-button",
					position: "bottom",
					title: this.l10n.stringTickFont,
					intro: this.l10n.stringTickFont,
				},
				{
					element: "#font-button",
					position: "bottom",
					title: this.l10n.stringSelectFont,
					intro: this.l10n.stringSelectFont,
				},
				{
					element: "#text-color",
					position: "bottom",
					title: this.l10n.stringFontColor,
					intro: this.l10n.stringFontColor,
				},
				{
					element: "#export-button",
					position: "bottom",
					title: this.l10n.stringSaveImage,
					intro: this.l10n.stringTutoSaveImage,
				},
			];
			const introJs = this.$refs.SugarTutorial.introJs;
			introJs.onbeforechange((targetEle) => {
				console.log(targetEle.id);
				switch (targetEle.id) {
					case "title-font-button":
						this.textPalActive = true;
						this.configActive = false;
						break;
				}
			})
			introJs.onexit(() => this.textPalActive = false);
			this.configActive = this.textPalActive = false;
			this.$refs.SugarTutorial.show(steps);
		},
		onStop() {
			var context = {
				tabularData: this.tabularData,
				pref: this.pref,
			};
			this.$refs.SugarJournal.saveData(context);
		},
		shuffleArray(array) {
		    for (let i = array.length - 1; i > 0; i--) {
		        const j = Math.floor(Math.random() * (i + 1));
		        [array[i], array[j]] = [array[j], array[i]];
		    }
		    return array;
		}
	},
	computed: {
		selectedFontField() {
			return this.pref.font[this.selectedFontName];	
		},
		selectedFontName() {
			const index = this.selectedFontIdx;
			return this.pref.font.propertyOrder[index];
		},
	},
	watch: {
		"pref.labels.x"() {
			this.chartview.updateLabel("x");
		},
		"pref.labels.y"() {
			this.chartview.updateLabel("y");
		},
		"pref.chartType"() {
			this.chartview.updateChartType();
		},
		"pref.chartColor": {
			handler() {
				this.chartview.updateChartColor();
			},
			deep: true,
		},
		"selectedFontField.color"() {
			this.chartview.updateFontValues(this.selectedFontName, "color");
		},
		"selectedFontField.fontfamily"() {
			this.chartview.updateFontValues(this.selectedFontName, "fontfamily");
		},
		"selectedFontField.fontsize"() {
			this.chartview.updateFontValues(this.selectedFontName, "fontsize");
		},
	// 	tabularData: {
	// 		handler() {
	// 			if (this.isUpdated) {
	// 				this.isUpdated = false;
	// 				return;
	// 			}
	// 			this.sendPresenceMessage("update", {
	// 				index: this.selectedField,
	// 				values: this.tabularData[this.selectedField],
	// 			});
	// 		},
	// 		deep: true,
	// 	},
	},
});
