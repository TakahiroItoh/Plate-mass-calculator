const elements = {
  density: document.getElementById("density"),
  width: document.getElementById("width"),
  length: document.getElementById("length"),
  height: document.getElementById("height"),
  mass: document.getElementById("mass"),
  materialInfo: document.getElementById("material-info"),
  volume: document.getElementById("volume"),
  dimensions: document.getElementById("dimensions"),
  faceTop: document.getElementById("face-top"),
  faceLeft: document.getElementById("face-left"),
  faceRight: document.getElementById("face-right"),
  edgeFront: document.getElementById("edge-front"),
  edgeBack: document.getElementById("edge-back"),
  edgeBottomLeft: document.getElementById("edge-bottom-left"),
  edgeBottomRight: document.getElementById("edge-bottom-right"),
  widthLine: document.getElementById("dim-width-line"),
  lengthLine: document.getElementById("dim-length-line"),
  heightLine: document.getElementById("dim-height-line"),
  widthText: document.getElementById("dim-width-text"),
  lengthText: document.getElementById("dim-length-text"),
  heightText: document.getElementById("dim-height-text")
};

const svgOrigin = { x: 254, y: 192 };

function toPositiveNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function projectPoint(x, y, z) {
  const isoX = svgOrigin.x + (x - y) * 0.86;
  const isoY = svgOrigin.y + (x + y) * 0.42 - z;
  return { x: isoX, y: isoY };
}

function pointsToAttribute(points) {
  return points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
}

function setLine(line, start, end) {
  line.setAttribute("x1", start.x.toFixed(2));
  line.setAttribute("y1", start.y.toFixed(2));
  line.setAttribute("x2", end.x.toFixed(2));
  line.setAttribute("y2", end.y.toFixed(2));
}

function setText(textNode, point, value) {
  textNode.setAttribute("x", point.x.toFixed(2));
  textNode.setAttribute("y", point.y.toFixed(2));
  textNode.textContent = value;
}

function updateView() {
  const density = toPositiveNumber(elements.density.value);
  const materialName = elements.density.options[elements.density.selectedIndex].text;
  const widthMm = toPositiveNumber(elements.width.value);
  const lengthMm = toPositiveNumber(elements.length.value);
  const heightMm = toPositiveNumber(elements.height.value);

  const volumeCm3 = (widthMm * lengthMm * heightMm) / 1000;
  const massKg = (density * volumeCm3) / 1000;

  elements.mass.textContent = massKg.toFixed(3);
  elements.materialInfo.textContent = `${materialName} | Density: ${density.toFixed(3)} g/cm3`;
  elements.volume.textContent = `Volume: ${volumeCm3.toFixed(3)} cm3`;
  elements.dimensions.textContent = `W ${widthMm.toFixed(1)} mm / L ${lengthMm.toFixed(1)} mm / H ${heightMm.toFixed(1)} mm`;

  const maxDimension = Math.max(widthMm, lengthMm, heightMm, 1);
  const scale = 180 / maxDimension;
  const width = widthMm * scale;
  const length = lengthMm * scale;
  const height = Math.max(heightMm * scale, 6);

  const topFrontLeft = projectPoint(0, 0, height);
  const topFrontRight = projectPoint(width, 0, height);
  const topBackLeft = projectPoint(0, length, height);
  const topBackRight = projectPoint(width, length, height);
  const bottomFrontLeft = projectPoint(0, 0, 0);
  const bottomFrontRight = projectPoint(width, 0, 0);
  const bottomBackLeft = projectPoint(0, length, 0);
  const bottomBackRight = projectPoint(width, length, 0);

  elements.faceTop.setAttribute(
    "points",
    pointsToAttribute([topFrontLeft, topFrontRight, topBackRight, topBackLeft])
  );
  elements.faceLeft.setAttribute(
    "points",
    pointsToAttribute([topFrontLeft, topBackLeft, projectPoint(0, length, 0), bottomFrontLeft])
  );
  elements.faceRight.setAttribute(
    "points",
    pointsToAttribute([topFrontRight, topBackRight, bottomBackRight, bottomFrontRight])
  );

  setLine(elements.edgeFront, bottomFrontLeft, bottomFrontRight);
  setLine(elements.edgeBack, bottomBackLeft, bottomBackRight);
  setLine(elements.edgeBottomLeft, bottomFrontLeft, bottomBackLeft);
  setLine(elements.edgeBottomRight, bottomFrontRight, bottomBackRight);

  const widthStart = { x: topFrontLeft.x, y: topFrontLeft.y - 26 };
  const widthEnd = { x: topFrontRight.x, y: topFrontRight.y - 26 };
  setLine(elements.widthLine, widthStart, widthEnd);
  setText(
    elements.widthText,
    { x: (widthStart.x + widthEnd.x) / 2, y: (widthStart.y + widthEnd.y) / 2 - 14 },
    `W ${widthMm.toFixed(1)} mm`
  );

  const lengthStart = { x: topBackLeft.x - 28, y: topBackLeft.y };
  const lengthEnd = { x: topFrontLeft.x - 28, y: topFrontLeft.y };
  setLine(elements.lengthLine, lengthStart, lengthEnd);
  setText(
    elements.lengthText,
    { x: (lengthStart.x + lengthEnd.x) / 2 - 42, y: (lengthStart.y + lengthEnd.y) / 2 - 4 },
    `L ${lengthMm.toFixed(1)} mm`
  );

  const heightStart = { x: bottomFrontRight.x + 28, y: bottomFrontRight.y };
  const heightEnd = { x: topFrontRight.x + 28, y: topFrontRight.y };
  setLine(elements.heightLine, heightStart, heightEnd);
  setText(
    elements.heightText,
    { x: heightEnd.x + 48, y: (heightStart.y + heightEnd.y) / 2 + 4 },
    `H ${heightMm.toFixed(1)} mm`
  );
}

document.getElementById("plate-form").addEventListener("input", updateView);
updateView();
