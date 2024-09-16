function drawRect(target, x, y, hatches) {
	const pixel = document.createElementNS("http://www.w3.org/2000/svg", "path");
	pixel.setAttribute("d", `M${x} ${y} h10 v10 h-10 Z`);
	const dy = 10 / hatches;
	for (let n = 0; n < hatches; n++) {
		const hatchFillLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
		hatchFillLine.setAttribute("d", `M${x} ${y + (n * dy)} h10 Z`);
		hatchFillLine.setAttribute("stroke", "black");
		hatchFillLine.setAttribute("stroke-width", 0.5);
		hatchFillLine.setAttribute("fill", "none");
		target.appendChild(hatchFillLine);
	}
	pixel.setAttribute("stroke", "black");
	pixel.setAttribute('stroke-width', 0.5);
	pixel.setAttribute("fill", 'none');
	target.appendChild(pixel);
}

function generateMarkerSvg(width, height, bits, mm) {
	var svg = document.createElement('svg');
	svg.setAttribute('viewBox', '0 0 ' + (width * 10 + 20) + ' ' + (height * 10 + 20));
	svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	svg.setAttribute('shape-rendering', 'crispEdges');

	const lines = mm / 20;

	for (let i = 0; i < height + 2; i++) {
		for (let j = 0; j < width + 2; j++) {
			if (i === 0 || j === 0 || i === height + 1|| j === width + 1) {
				drawRect(svg, j * 10, i * 10, lines);
			}
		}
	}

	// Background rect
	for (let i = 0; i < height; i++) {
		for (let j = 0; j < width; j++) {
			const white = bits[i * height + j];
			if (white) continue;
			drawRect(svg, j * 10 + 10, i * 10 + 10, lines);
		}
	}

	return svg;
}

var dict;

function generateArucoMarker(width, height, dictName, id, mm) {
	console.log('Generate ArUco marker ' + dictName + ' ' + id);

	var bytes = dict[dictName][id];
	var bits = [];
	var bitsCount = width * height;

	// Parse marker's bytes
	for (var byte of bytes) {
		var start = bitsCount - bits.length;
		for (var i = Math.min(7, start - 1); i >= 0; i--) {
			bits.push((byte >> i) & 1);
		}
	}

	return generateMarkerSvg(width, height, bits, mm);
}

// Fetch markers dict
var loadDict = fetch('dict.json').then(function(res) {
	return res.json();
}).then(function(json) {
	dict = json;
});

function init() {
	var dictSelect = document.querySelector('.setup select[name=dict]');
	var markerIdInput = document.querySelector('.setup input[name=id]');
	var sizeInput = document.querySelector('.setup input[name=size]');
	var saveButton = document.querySelector('.save-button');

	function updateMarker() {
		var markerId = Number(markerIdInput.value);
		var size = Number(sizeInput.value);
		var option = dictSelect.options[dictSelect.selectedIndex];
		var dictName = option.value;
		var width = Number(option.getAttribute('data-width'));
		var height = Number(option.getAttribute('data-height'));
		var maxId = (Number(option.getAttribute('data-number')) || 1000) - 1;

		markerIdInput.setAttribute('max', maxId);

		if (markerId > maxId) {
			markerIdInput.value = maxId;
			markerId = maxId;
		}

		// Wait until dict data is loaded
		loadDict.then(function() {
			// Generate marker
			var svg = generateArucoMarker(width, height, dictName, markerId, size);
			svg.setAttribute('width', size + 'mm');
			svg.setAttribute('height', size + 'mm');
			document.querySelector('.marker').innerHTML = svg.outerHTML;
			saveButton.setAttribute('href', 'data:image/svg;base64,' + btoa(svg.outerHTML.replace('viewbox', 'viewBox')));
			saveButton.setAttribute('download', dictName + '-' + markerId + '.svg');
			document.querySelector('.marker-id').innerHTML = 'ID ' + markerId;
		})
	}

	updateMarker();

	dictSelect.addEventListener('change', updateMarker);
	dictSelect.addEventListener('input', updateMarker);
	markerIdInput.addEventListener('input', updateMarker);
	sizeInput.addEventListener('input', updateMarker);
}

init();
