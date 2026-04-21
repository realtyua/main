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
		var currentYear = now.getFullYear();
		var currentMonth = now.getMonth() + 1;
		for (var m = 1; m <= 12; m++) {
			if (year === currentYear && m > currentMonth) {
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
		if (spinner) spinner.style.display = 'flex';
	}

	function hideSpinner() {
		var spinner = document.getElementById('chartSpinner');
		var canvas = document.getElementById('visitorsChart');
		if (spinner) spinner.style.display = 'none';
		if (canvas) canvas.style.display = 'block';
	}

	function renderChart(yearlyData) {
		var canvas = document.getElementById('visitorsChart');
		if (!canvas) return;

		canvas.style.display = 'block';

		var ctx = canvas.getContext('2d');
		var datasets = [];
		var years = Object.keys(yearlyData).sort();

		years.forEach(function(year, index) {
			var colorIndex = index % COLORS_PALETTE.length;
			datasets.push({
				label: year,
				data: yearlyData[year],
				backgroundColor: COLORS_PALETTE[colorIndex].bg,
				borderColor: COLORS_PALETTE[colorIndex].border,
				borderWidth: 1
			});
		});

		new Chart(ctx, {
			type: 'bar',
			data: {
				labels: MONTHS_UA,
				datasets: datasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				animation: {
					onComplete: function() {
						hideSpinner();
					}
				},
				plugins: {
					legend: {
						position: 'top'
					},
					title: {
						display: false
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: 'Кількість відвідувань'
						}
					},
					x: {
						title: {
							display: true,
							text: 'Місяць'
						}
					}
				}
			}
		});
	}

	async function init() {
		showSpinner();

		var now = new Date();
		var currentYear = now.getFullYear();
		var years = [];

		for (var y = START_YEAR; y <= currentYear; y++) {
			years.push(y);
		}

		var results = [];
		for (var i = 0; i < years.length; i++) {
			var result = await fetchData(years[i]);
			results.push(result);
			if (i < years.length - 1) {
				await new Promise(function(resolve) { setTimeout(resolve, 350); });
			}
		}

		var yearlyData = {};
		years.forEach(function(year, index) {
			var aggregated = aggregateByMonth(results[index].stats || []);
			yearlyData[year] = getYearlyData(aggregated, year);
		});

		renderChart(yearlyData);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();