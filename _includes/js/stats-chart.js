(function() {
	'use strict';

	const CONFIG = {
		apiToken: '12k55jwxqe0uj20rjisbwqlvb8mjw8gfpxleve10g65f5xcquww',
		apiEndpoint: 'https://stats.realestate.if.ua/api/v0/stats/total'
	};

	const START_YEAR = 2024;

	const MONTHS_UA = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];

	const COLORS_PALETTE = [
		{ bg: 'rgba(40, 167, 69, 0.7)', border: 'rgb(40, 167, 69)' },
		{ bg: 'rgba(108, 117, 125, 0.7)', border: 'rgb(108, 117, 125)' },
		{ bg: 'rgba(0, 123, 255, 0.7)', border: 'rgb(0, 123, 255)' },
		{ bg: 'rgba(255, 193, 7, 0.7)', border: 'rgb(255, 193, 7)' },
		{ bg: 'rgba(111, 66, 193, 0.7)', border: 'rgb(111, 66, 193)' },
		{ bg: 'rgba(220, 53, 69, 0.7)', border: 'rgb(220, 53, 69)' },
		{ bg: 'rgba(32, 201, 151, 0.7)', border: 'rgb(32, 201, 151)' },
		{ bg: 'rgba(253, 126, 20, 0.7)', border: 'rgb(253, 126, 20)' }
	];

	let chartInstance = null;
	let yearlyDataCache = {};
	let currentYear = null;
	let availableYears = [];

	function aggregateByMonth(stats) {
		var months = {};
		stats.forEach(function(day) {
			var d = new Date(day.day);
			var year = d.getFullYear();
			var month = d.getMonth();
			var key = year + '-' + (month + 1);
			if (!months[key]) months[key] = 0;
			months[key] += day.daily || 0;
		});
		return months;
	}

	function getYearlyData(aggregated, year) {
		var data = [];
		var now = new Date();
		var cy = now.getFullYear();
		var cm = now.getMonth() + 1;
		for (var m = 1; m <= 12; m++) {
			if (year === cy && m > cm) {
				data.push(0);
			} else {
				var key = year + '-' + m;
				data.push(aggregated[key] || 0);
			}
		}
		return data;
	}

	async function fetchData(year) {
		var start = year + '-01-01';
		var end = year + '-12-31';
		var url = CONFIG.apiEndpoint + '?start=' + start + '&end=' + end;
		try {
			var response = await fetch(url, {
				headers: {
					'Authorization': 'Bearer ' + CONFIG.apiToken
				}
			});
			if (!response.ok) throw new Error('API error: ' + response.status);
			return await response.json();
		} catch (err) {
			console.error('Failed to fetch stats for ' + year + ':', err);
			return { stats: [] };
		}
	}

	function showSpinner() {
		var spinner = document.getElementById('chartSpinner');
		var canvas = document.getElementById('visitorsChart');
		if (spinner) {
			spinner.className = 'd-flex justify-content-center';
			spinner.style.display = 'flex';
		}
		if (canvas) canvas.classList.add('d-none');
	}

	function hideSpinner() {
		var spinner = document.getElementById('chartSpinner');
		var canvas = document.getElementById('visitorsChart');
		if (spinner) {
			spinner.className = 'd-done';
			spinner.style.display = 'none';
		}
		if (canvas) canvas.classList.remove('d-none');
	}

	function buildTabs(years) {
		var tabs = document.getElementById('yearTabs');
		if (!tabs) return;

		var allYearsLink = document.createElement('a');
		allYearsLink.href = '#all';
		allYearsLink.className = 'list-group-item list-group-item-action text-nowrap';
		allYearsLink.setAttribute('data-year', 'all');
		allYearsLink.textContent = 'Всі роки';
		tabs.appendChild(allYearsLink);

		var sortedYears = years.slice().sort(function(a, b) { return b - a; });
		sortedYears.forEach(function(year) {
			var link = document.createElement('a');
			link.href = '#' + year;
			link.className = 'list-group-item list-group-item-action';
			link.setAttribute('data-year', year);
			link.textContent = year;
			tabs.appendChild(link);
		});

		tabs.addEventListener('click', handleTabClick);
	}

	function renderChartSingleYear(year) {
		var canvas = document.getElementById('visitorsChart');
		if (!canvas) return;

		canvas.style.display = 'block';
		var ctx = canvas.getContext('2d');

		if (chartInstance) {
			chartInstance.destroy();
		}

		var datasets = [{
			label: year.toString(),
			data: yearlyDataCache[year],
			backgroundColor: COLORS_PALETTE[0].bg,
			borderColor: COLORS_PALETTE[0].border,
			borderWidth: 1
		}];

		chartInstance = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: MONTHS_UA,
				datasets: datasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				plugins: {
					legend: { position: 'top' },
					title: { display: false }
				},
				scales: {
					y: {
						beginAtZero: true,
						title: { display: true, text: 'Кількість відвідувань' }
					},
					x: {
						title: { display: true, text: 'Місяць' }
					}
				}
			}
		});
	}

	function renderChartAllYears() {
		var canvas = document.getElementById('visitorsChart');
		if (!canvas) return;

		canvas.style.display = 'block';
		var ctx = canvas.getContext('2d');

		if (chartInstance) {
			chartInstance.destroy();
		}

		var datasets = [];
		availableYears.forEach(function(year, index) {
			datasets.push({
				label: year.toString(),
				data: yearlyDataCache[year],
				backgroundColor: COLORS_PALETTE[index % COLORS_PALETTE.length].bg,
				borderColor: COLORS_PALETTE[index % COLORS_PALETTE.length].border,
				borderWidth: 1
			});
		});

		chartInstance = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: MONTHS_UA,
				datasets: datasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				plugins: {
					legend: { position: 'top' },
					title: { display: false }
				},
				scales: {
					y: {
						beginAtZero: true,
						title: { display: true, text: 'Кількість відвідувань' }
					},
					x: {
						title: { display: true, text: 'Місяць' }
					}
				}
			}
		});
	}

	function updateTabsState(mode, year) {
		var tabs = document.getElementById('yearTabs');
		if (!tabs) return;
		var links = tabs.querySelectorAll('a');
		links.forEach(function(link) {
			var linkMode = link.getAttribute('data-year');
			if (linkMode === mode || (mode === 'single' && linkMode === year.toString())) {
				link.classList.add('active');
				link.removeAttribute('href');
			} else {
				link.classList.remove('active');
				var y = link.getAttribute('data-year');
				link.setAttribute('href', y === 'all' ? '#all' : '#' + y);
			}
		});
	}

	function handleTabClick(event) {
		event.preventDefault();
		var target = event.target;
		if (target.tagName === 'A' && target.classList.contains('list-group-item')) {
			var mode = target.getAttribute('data-year');
			if (mode === 'all') {
				renderChartAllYears();
				updateTabsState('all', null);
			} else {
				var year = parseInt(mode, 10);
				if (year && yearlyDataCache[year]) {
					renderChartSingleYear(year);
					updateTabsState('single', year);
				}
			}
		}
	}

	async function init() {
		showSpinner();

		var now = new Date();
		currentYear = now.getFullYear();

		for (var y = START_YEAR; y <= currentYear; y++) {
			availableYears.push(y);
		}

		var results = [];
		for (var i = 0; i < availableYears.length; i++) {
			var result = await fetchData(availableYears[i]);
			results.push(result);
			if (i < availableYears.length - 1) {
				await new Promise(function(resolve) { setTimeout(resolve, 350); });
			}
		}

		availableYears.forEach(function(year, index) {
			var aggregated = aggregateByMonth(results[index].stats || []);
			yearlyDataCache[year] = getYearlyData(aggregated, year);
		});

		buildTabs(availableYears);
		renderChartSingleYear(currentYear);
		updateTabsState('single', currentYear);
		hideSpinner();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();